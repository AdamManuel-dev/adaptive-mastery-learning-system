/**
 * @fileoverview LLM infrastructure module barrel exports
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Centralized exports for LLM gateway and related types
 * Main APIs: LLMGateway, OpenAIGenerator, error types, configuration types
 * Constraints: Re-exports only - no implementation logic
 * Patterns: Barrel pattern for clean module boundaries
 */

// Types and interfaces
export {
  DEFAULT_LLM_CONFIG,
  type ConceptInput,
  type DifficultyLevel,
  type GeneratedVariant,
  type GenerationRequest,
  type LLMConfig,
  type LLMGateway,
  type LLMGatewayFactory,
  type LLMResult,
} from './types';

// Error types
export {
  LLMAPIError,
  LLMConfigurationError,
  LLMError,
  LLMRateLimitError,
  LLMValidationError,
  type LLMErrorCode,
} from './errors';

// Generator implementations
export {
  createGeneratorFromEnv,
  createOpenAIGenerator,
  OpenAIGenerator,
} from './generator';

// Prompt utilities (for testing or custom implementations)
export {
  buildPrompt,
  DIFFICULTY_MODIFIERS,
  DIMENSION_PROMPTS,
  extractJsonArray,
  SYSTEM_PROMPT,
  VARIANT_OUTPUT_SCHEMA,
} from './prompts';

// Evaluation prompts and utilities
export {
  buildEvaluationPrompt,
  EVALUATION_SYSTEM_PROMPT,
  OPEN_RESPONSE_GENERATION_PROMPT,
} from './evaluation-prompts';

// Evaluator implementations
export {
  createEvaluatorFromEnv,
  createOpenAIEvaluator,
  OpenAIEvaluator,
  type LLMEvaluator,
} from './evaluator';
