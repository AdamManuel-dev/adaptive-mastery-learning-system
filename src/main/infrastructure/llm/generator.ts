/**
 * @fileoverview OpenAI adapter implementation for LLM-based flashcard generation
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: OpenAI API integration, retry logic, response validation, error handling
 * Main APIs: OpenAIGenerator, createOpenAIGenerator
 * Constraints: Requires OPENAI_API_KEY environment variable or explicit config
 * Patterns: Hexagonal architecture (driven adapter), Result type for error handling
 */

import OpenAI from 'openai';

import {
  LLMAPIError,
  LLMConfigurationError,
  LLMRateLimitError,
  LLMValidationError,
} from './errors';
import { buildPrompt, extractJsonArray, SYSTEM_PROMPT } from './prompts';

import type {
  DifficultyLevel,
  GeneratedVariant,
  GenerationRequest,
  LLMConfig,
  LLMGateway,
  LLMResult,
} from './types';
import type { Dimension } from '../../../shared/types/ipc';

/**
 * Validates that a parsed object has the required variant structure
 */
function isValidVariant(obj: unknown): obj is GeneratedVariant {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const record = obj as Record<string, unknown>;

  return (
    typeof record.front === 'string' &&
    record.front.length > 0 &&
    typeof record.back === 'string' &&
    record.back.length > 0 &&
    Array.isArray(record.hints) &&
    record.hints.every((h) => typeof h === 'string')
  );
}

/**
 * Normalizes a parsed variant to the expected structure
 */
function normalizeVariant(
  obj: Record<string, unknown>,
  dimension: Dimension,
  difficulty: DifficultyLevel
): GeneratedVariant {
  return {
    front: String(obj.front),
    back: String(obj.back),
    hints: Array.isArray(obj.hints)
      ? obj.hints.filter((h) => typeof h === 'string')
      : [],
    dimension,
    difficulty,
  };
}

/**
 * Delays execution for a specified duration
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculates exponential backoff delay with jitter
 */
function getBackoffDelay(attempt: number, baseDelayMs = 1000): number {
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay;
  return exponentialDelay + jitter;
}

/**
 * OpenAI adapter for the LLM Gateway
 *
 * Implements the LLMGateway interface using OpenAI's API.
 * Supports retry logic with exponential backoff for transient failures.
 */
export class OpenAIGenerator implements LLMGateway {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;

  constructor(config: LLMConfig) {
    const apiKey = config.apiKey ?? process.env.OPENAI_API_KEY ?? '';

    if (apiKey === '') {
      throw new LLMConfigurationError(
        'OpenAI API key is required. Set OPENAI_API_KEY environment variable or provide apiKey in config.',
        ['apiKey']
      );
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: config.baseUrl,
      timeout: config.timeoutMs ?? 30000,
    });

    this.model = config.model;
    this.maxRetries = config.maxRetries ?? 3;
    this.timeoutMs = config.timeoutMs ?? 30000;
  }

  /**
   * Generates card variants using OpenAI's API
   */
  async generateVariants(
    request: GenerationRequest
  ): Promise<LLMResult<GeneratedVariant[]>> {
    const { concept, dimension, difficulty, count } = request;
    const userPrompt = buildPrompt(concept, dimension, difficulty, count);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.callOpenAI(userPrompt);
        const variants = this.parseResponse(response, dimension, difficulty);

        if (variants.length === 0) {
          return {
            success: false,
            error: new LLMValidationError(
              'No valid variants generated',
              { rawResponse: response }
            ),
          };
        }

        return { success: true, value: variants };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on validation errors
        if (error instanceof LLMValidationError) {
          return { success: false, error };
        }

        // Don't retry on configuration errors
        if (error instanceof LLMConfigurationError) {
          return { success: false, error };
        }

        // Check for rate limiting
        if (error instanceof LLMRateLimitError) {
          const waitTime = error.retryAfterMs ?? getBackoffDelay(attempt, 5000);

          if (attempt < this.maxRetries) {
            await delay(waitTime);
            continue;
          }
          return { success: false, error };
        }

        // Retry transient API errors
        if (error instanceof LLMAPIError && attempt < this.maxRetries) {
          await delay(getBackoffDelay(attempt));
          continue;
        }

        return { success: false, error: lastError };
      }
    }

    return {
      success: false,
      error: lastError || new Error('Generation failed after retries'),
    };
  }

  /**
   * Tests the connection to OpenAI's API
   */
  async healthCheck(): Promise<LLMResult<boolean>> {
    try {
      await this.client.models.retrieve(this.model);
      return { success: true, value: true };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      return {
        success: false,
        error: new LLMAPIError(
          `Health check failed: ${err.message}`,
          'openai',
          { cause: err }
        ),
      };
    }
  }

  /**
   * Makes the actual API call to OpenAI
   */
  private async callOpenAI(userPrompt: string): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2048,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content ?? '';

      if (content === '') {
        throw new LLMAPIError(
          'Empty response from OpenAI',
          'openai',
          { context: { completionId: completion.id } }
        );
      }

      return content;
    } catch (error) {
      this.handleOpenAIError(error);
      throw error; // Re-throw if not handled
    }
  }

  /**
   * Parses and validates the LLM response
   */
  private parseResponse(
    response: string,
    dimension: Dimension,
    difficulty: DifficultyLevel
  ): GeneratedVariant[] {
    // Handle JSON object wrapper (OpenAI json_object mode may wrap arrays)
    let parsed: unknown;
    try {
      parsed = JSON.parse(response);
    } catch {
      throw new LLMValidationError(
        'Failed to parse JSON response',
        { rawResponse: response }
      );
    }

    // Extract array from response (may be nested in "variants" or similar key)
    let items: unknown[];
    if (Array.isArray(parsed)) {
      items = parsed;
    } else if (typeof parsed === 'object' && parsed !== null) {
      const obj = parsed as Record<string, unknown>;
      // Check common wrapper keys - use explicit Array.isArray checks
      const possibleArrays = [obj.variants, obj.cards, obj.items, obj.data, obj.results];
      const foundArray = possibleArrays.find((val): val is unknown[] => Array.isArray(val));

      if (foundArray !== undefined) {
        items = foundArray;
      } else {
        // Try extracting from raw response
        const extracted = extractJsonArray(response);
        if (extracted === null) {
          throw new LLMValidationError(
            'Response is not an array and has no recognizable array property',
            { rawResponse: response }
          );
        }
        items = extracted;
      }
    } else {
      throw new LLMValidationError(
        'Response is not a valid JSON object or array',
        { rawResponse: response }
      );
    }

    // Validate and normalize each item
    const variants: GeneratedVariant[] = [];
    for (const item of items) {
      if (isValidVariant(item)) {
        variants.push(
          normalizeVariant(
            item as unknown as Record<string, unknown>,
            dimension,
            difficulty
          )
        );
      }
    }

    return variants;
  }

  /**
   * Converts OpenAI SDK errors to our custom error types
   */
  private handleOpenAIError(error: unknown): never {
    if (error instanceof OpenAI.APIError) {
      // Rate limiting
      if (error.status === 429) {
        const retryAfterHeader = error.headers?.['retry-after'];
        const retryAfterMs =
          typeof retryAfterHeader === 'string'
            ? parseInt(retryAfterHeader, 10) * 1000
            : undefined;

        throw new LLMRateLimitError(
          `Rate limited by OpenAI: ${error.message}`,
          { cause: error, retryAfterMs }
        );
      }

      // Authentication errors
      if (error.status === 401 || error.status === 403) {
        throw new LLMConfigurationError(
          `Authentication failed: ${error.message}`,
          ['apiKey'],
          { cause: error }
        );
      }

      // Other API errors
      throw new LLMAPIError(
        error.message,
        'openai',
        { cause: error, statusCode: error.status }
      );
    }

    // Network errors
    if (error instanceof Error && error.message.includes('timeout')) {
      throw new LLMAPIError(
        `Request timed out after ${this.timeoutMs}ms`,
        'openai',
        { cause: error }
      );
    }

    // Re-throw unknown errors
    throw error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * Factory function to create an OpenAI generator with defaults
 *
 * @param config - Optional partial configuration (defaults will be applied)
 * @returns Configured OpenAIGenerator instance
 */
export function createOpenAIGenerator(
  config?: Partial<LLMConfig>
): OpenAIGenerator {
  return new OpenAIGenerator({
    provider: 'openai',
    model: config?.model || 'gpt-4o-mini',
    apiKey: config?.apiKey,
    baseUrl: config?.baseUrl,
    timeoutMs: config?.timeoutMs || 30000,
    maxRetries: config?.maxRetries ?? 3,
  } as LLMConfig);
}

/**
 * Creates an LLM generator from environment configuration
 *
 * Reads configuration from environment variables:
 * - OPENAI_API_KEY: API key for OpenAI
 * - OPENAI_MODEL: Model to use (default: gpt-4o-mini)
 * - OPENAI_BASE_URL: Optional base URL override
 *
 * @returns Configured OpenAIGenerator instance
 * @throws LLMConfigurationError if required configuration is missing
 */
export function createGeneratorFromEnv(): OpenAIGenerator {
  return createOpenAIGenerator({
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL,
    baseUrl: process.env.OPENAI_BASE_URL,
  } as Partial<LLMConfig>);
}
