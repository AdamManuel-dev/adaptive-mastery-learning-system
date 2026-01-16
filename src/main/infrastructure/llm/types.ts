/**
 * @fileoverview LLM gateway interface and types for card variant generation
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: LLMGateway port interface, configuration types, result types
 * Main APIs: LLMGateway, LLMConfig, GeneratedVariant, GenerationRequest
 * Constraints: Follows hexagonal architecture (driven adapter port)
 * Patterns: Result type for error handling, configuration via environment or explicit config
 */

import type { Dimension } from '../../../shared/types/ipc';

/**
 * Difficulty level for variant generation (1-5 scale)
 */
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Concept data required for generating variants
 */
export interface ConceptInput {
  /** The term or name of the concept */
  readonly name: string;

  /** The canonical definition of the concept */
  readonly definition: string;

  /** Supporting facts, examples, or key points */
  readonly facts: readonly string[];
}

/**
 * Request parameters for generating card variants
 */
export interface GenerationRequest {
  /** The concept to generate variants for */
  readonly concept: ConceptInput;

  /** The cognitive dimension to target */
  readonly dimension: Dimension;

  /** Target difficulty level (1=easiest, 5=hardest) */
  readonly difficulty: DifficultyLevel;

  /** Number of variants to generate */
  readonly count: number;
}

/**
 * A generated flashcard variant from the LLM
 */
export interface GeneratedVariant {
  /** The question or prompt (card front) */
  readonly front: string;

  /** The answer or explanation (card back) */
  readonly back: string;

  /** Optional progressive hints */
  readonly hints: readonly string[];

  /** The dimension this variant tests */
  readonly dimension: Dimension;

  /** The difficulty level */
  readonly difficulty: DifficultyLevel;
}

/**
 * Result type for LLM operations
 */
export type LLMResult<T> =
  | { success: true; value: T }
  | { success: false; error: Error };

/**
 * Configuration for LLM providers
 */
export interface LLMConfig {
  /** LLM provider (openai, anthropic, ollama) */
  readonly provider: 'openai' | 'anthropic' | 'ollama';

  /** API key for the provider (not required for ollama) */
  readonly apiKey?: string;

  /** Model identifier (e.g., 'gpt-4o-mini', 'claude-3-haiku') */
  readonly model: string;

  /** Base URL for API (required for ollama, optional for others) */
  readonly baseUrl?: string;

  /** Request timeout in milliseconds */
  readonly timeoutMs?: number;

  /** Maximum retry attempts for transient failures */
  readonly maxRetries?: number;
}

/**
 * Default configuration values
 */
export const DEFAULT_LLM_CONFIG: Partial<LLMConfig> = {
  model: 'gpt-4o-mini',
  timeoutMs: 30000,
  maxRetries: 3,
};

/**
 * LLM Gateway interface (driven port)
 *
 * This is the output port for LLM operations in hexagonal architecture.
 * Implementations (adapters) connect to specific LLM providers.
 */
export interface LLMGateway {
  /**
   * Generates card variants for a concept
   *
   * @param request - Generation parameters
   * @returns Result containing generated variants or error
   */
  generateVariants(request: GenerationRequest): Promise<LLMResult<GeneratedVariant[]>>;

  /**
   * Tests the connection to the LLM provider
   *
   * @returns Result indicating if connection is healthy
   */
  healthCheck(): Promise<LLMResult<boolean>>;
}

/**
 * Factory function type for creating LLM gateways
 */
export type LLMGatewayFactory = (config: LLMConfig) => LLMGateway;
