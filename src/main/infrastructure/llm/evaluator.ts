/**
 * @fileoverview LLM-based response evaluator for open-ended questions
 * @lastmodified 2026-01-20T00:00:00Z
 *
 * Features: Response evaluation, rubric-based scoring, confidence estimation
 * Main APIs: OpenAIEvaluator, createEvaluatorFromEnv
 * Constraints: Requires OpenAI API key
 * Patterns: Hexagonal architecture adapter, Result type for error handling
 */

import OpenAI from 'openai';

import {
  LLMAPIError,
  LLMConfigurationError,
  LLMRateLimitError,
  LLMValidationError,
} from './errors';
import { buildEvaluationPrompt, EVALUATION_SYSTEM_PROMPT } from './evaluation-prompts';

import type { LLMConfig, LLMResult } from './types';
import type {
  EvaluationRequest,
  LLMEvaluationResult,
  Rating,
} from '../../../shared/types/ipc';

/**
 * Interface for LLM-based response evaluation
 *
 * This is the port (driven adapter interface) for evaluation operations.
 */
export interface LLMEvaluator {
  /**
   * Evaluates a user's response against a model answer
   *
   * @param request - The evaluation request with question, answer, and response
   * @returns Result containing evaluation or error
   */
  evaluateResponse(request: EvaluationRequest): Promise<LLMResult<LLMEvaluationResult>>;
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
 * OpenAI-based response evaluator
 *
 * Implements the LLMEvaluator interface using OpenAI's API.
 * Uses lower temperature (0.3) for more consistent evaluation.
 */
export class OpenAIEvaluator implements LLMEvaluator {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;

  constructor(config: LLMConfig) {
    const apiKey = config.apiKey ?? process.env.OPENAI_API_KEY ?? '';

    if (apiKey === '') {
      throw new LLMConfigurationError(
        'OpenAI API key required for evaluation. Set OPENAI_API_KEY environment variable or provide apiKey in config.',
        ['apiKey']
      );
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: config.baseUrl,
      timeout: config.timeoutMs ?? 30000,
    });

    this.model = config.model;
    this.maxRetries = config.maxRetries ?? 2;
    this.timeoutMs = config.timeoutMs ?? 30000;
  }

  /**
   * Evaluates a user's response using OpenAI's API
   */
  async evaluateResponse(
    request: EvaluationRequest
  ): Promise<LLMResult<LLMEvaluationResult>> {
    const prompt = buildEvaluationPrompt(
      request.question,
      request.modelAnswer,
      request.userResponse,
      request.conceptName,
      request.dimension,
      request.rubric
    );

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const content = await this.callOpenAI(prompt);
        const evaluation = this.parseEvaluationResponse(content);
        return { success: true, value: evaluation };
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
      error: lastError ?? new Error('Evaluation failed after retries'),
    };
  }

  /**
   * Makes the actual API call to OpenAI
   */
  private async callOpenAI(userPrompt: string): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: EVALUATION_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3, // Lower temperature for more consistent evaluation
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content ?? '';

      if (content === '') {
        throw new LLMAPIError('Empty evaluation response from OpenAI', 'openai', {
          context: { completionId: completion.id },
        });
      }

      return content;
    } catch (error) {
      this.handleOpenAIError(error);
      throw error; // Re-throw if not handled
    }
  }

  /**
   * Parses and validates the LLM evaluation response
   */
  private parseEvaluationResponse(content: string): LLMEvaluationResult {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new LLMValidationError('Failed to parse evaluation JSON', {
        rawResponse: content,
      });
    }

    const obj = parsed as Record<string, unknown>;

    // Validate required score field
    if (typeof obj.score !== 'number' || obj.score < 0 || obj.score > 1) {
      throw new LLMValidationError('Invalid or missing score in evaluation response', {
        rawResponse: content,
      });
    }

    const score = obj.score;
    const feedback =
      typeof obj.feedback === 'string' ? obj.feedback : 'No feedback provided';
    const keyPointsCovered = Array.isArray(obj.keyPointsCovered)
      ? obj.keyPointsCovered.filter((p): p is string => typeof p === 'string')
      : [];
    const keyPointsMissed = Array.isArray(obj.keyPointsMissed)
      ? obj.keyPointsMissed.filter((p): p is string => typeof p === 'string')
      : [];
    const confidence =
      typeof obj.confidence === 'number' && obj.confidence >= 0 && obj.confidence <= 1
        ? obj.confidence
        : 0.7;
    const demonstratesUnderstanding =
      typeof obj.demonstratesUnderstanding === 'boolean'
        ? obj.demonstratesUnderstanding
        : score >= 0.5;

    // Map score to suggested rating
    const suggestedRating = this.scoreToRating(score);

    return {
      score,
      feedback,
      keyPointsCovered,
      keyPointsMissed,
      confidence,
      suggestedRating,
      demonstratesUnderstanding,
    };
  }

  /**
   * Maps a numeric score to a Rating value
   */
  private scoreToRating(score: number): Rating {
    if (score >= 0.9) return 'easy';
    if (score >= 0.7) return 'good';
    if (score >= 0.4) return 'hard';
    return 'again';
  }

  /**
   * Converts OpenAI SDK errors to our custom error types
   */
  private handleOpenAIError(error: unknown): never {
    if (error instanceof OpenAI.APIError) {
      // Rate limiting
      if (error.status === 429) {
        const headers = error.headers as Record<string, string> | undefined;
        const retryAfterHeader = headers?.['retry-after'];
        const retryAfterMs =
          typeof retryAfterHeader === 'string'
            ? parseInt(retryAfterHeader, 10) * 1000
            : undefined;

        throw new LLMRateLimitError(`Rate limited by OpenAI: ${error.message}`, {
          cause: error,
          retryAfterMs,
        });
      }

      // Authentication errors
      if (error.status === 401 || error.status === 403) {
        throw new LLMConfigurationError(`Authentication failed: ${error.message}`, [
          'apiKey',
        ], { cause: error });
      }

      // Other API errors
      const statusCode = typeof error.status === 'number' ? error.status : undefined;
      throw new LLMAPIError(error.message, 'openai', {
        cause: error,
        statusCode,
      });
    }

    // Network errors
    if (error instanceof Error && error.message.includes('timeout')) {
      throw new LLMAPIError(`Request timed out after ${this.timeoutMs}ms`, 'openai', {
        cause: error,
      });
    }

    // Re-throw unknown errors
    throw error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * Creates an OpenAI evaluator with optional configuration
 *
 * @param config - Optional partial configuration (defaults will be applied)
 * @returns Configured OpenAIEvaluator instance
 */
export function createOpenAIEvaluator(config?: Partial<LLMConfig>): OpenAIEvaluator {
  const baseConfig = {
    provider: 'openai' as const,
    model: config?.model ?? 'gpt-4o-mini',
    timeoutMs: config?.timeoutMs ?? 30000,
    maxRetries: config?.maxRetries ?? 2,
  };

  // Use conditional spreading to avoid exactOptionalPropertyTypes violations
  return new OpenAIEvaluator({
    ...baseConfig,
    ...(config?.apiKey !== undefined && { apiKey: config.apiKey }),
    ...(config?.baseUrl !== undefined && { baseUrl: config.baseUrl }),
  });
}

/**
 * Creates an LLM evaluator from environment configuration
 *
 * Reads configuration from environment variables:
 * - OPENAI_API_KEY: API key for OpenAI
 * - OPENAI_MODEL: Model to use (default: gpt-4o-mini)
 * - OPENAI_BASE_URL: Optional base URL override
 *
 * @returns Configured OpenAIEvaluator instance
 * @throws LLMConfigurationError if required configuration is missing
 */
export function createEvaluatorFromEnv(): OpenAIEvaluator {
  const envApiKey = process.env.OPENAI_API_KEY;
  const envModel = process.env.OPENAI_MODEL;
  const envBaseUrl = process.env.OPENAI_BASE_URL;

  // Use conditional spreading to avoid exactOptionalPropertyTypes violations
  return createOpenAIEvaluator({
    ...(envApiKey !== undefined && { apiKey: envApiKey }),
    ...(envModel !== undefined && { model: envModel }),
    ...(envBaseUrl !== undefined && { baseUrl: envBaseUrl }),
  });
}
