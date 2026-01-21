/**
 * @fileoverview IPC channel type definitions for Electron main/renderer communication
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Type-safe IPC channels, request/response types, domain DTOs
 * Main APIs: IPCChannels, IPCResult, all DTO types
 * Constraints: All IPC communication must use defined channels
 * Patterns: Request/Response pattern with typed results
 */

// -----------------------------------------------------------------------------
// Domain Types (aligned with MVP.md schema)
// -----------------------------------------------------------------------------

/**
 * The six knowledge dimensions that categorize card variants
 */
export type Dimension =
  | 'definition'
  | 'paraphrase'
  | 'example'
  | 'scenario'
  | 'discrimination'
  | 'cloze'

/**
 * User rating for a review response
 */
export type Rating = 'again' | 'hard' | 'good' | 'easy'

/**
 * Question type for card variants
 */
export type QuestionType =
  | 'flashcard'
  | 'multiple_choice'
  | 'multi_select'
  | 'true_false'
  | 'open_response'

// -----------------------------------------------------------------------------
// Data Transfer Objects (DTOs)
// -----------------------------------------------------------------------------

/**
 * Concept entity - what you're learning
 */
export interface ConceptDTO {
  id: string
  name: string
  definition: string | null
  facts: string[]
  createdAt: string
  updatedAt: string
}

/**
 * Data required to create a new concept
 */
export interface CreateConceptDTO {
  name: string
  definition?: string
  facts?: string[]
}

/**
 * Data for updating an existing concept
 */
export interface UpdateConceptDTO {
  id: string
  name?: string
  definition?: string
  facts?: string[]
}

/**
 * Card variant - different ways to test a concept
 */
export interface VariantDTO {
  id: string
  conceptId: string
  dimension: Dimension
  difficulty: number
  front: string
  back: string
  hints: string[]
  lastShownAt: string | null
  createdAt: string
  updatedAt: string
  /** Question type - defaults to 'flashcard' for backward compatibility */
  questionType: QuestionType
  /** Evaluation rubric for open response questions (JSON) */
  rubric?: EvaluationRubric
  /** Maximum character length for open response answers */
  maxLength?: number
}

/**
 * Data required to create a new variant
 */
export interface CreateVariantDTO {
  conceptId: string
  dimension: Dimension
  difficulty?: number
  front: string
  back: string
  hints?: string[]
  /** Question type - defaults to 'flashcard' if not provided */
  questionType?: QuestionType
  /** Evaluation rubric for open response questions */
  rubric?: EvaluationRubric
  /** Maximum character length for open response answers */
  maxLength?: number
}

/**
 * Data for updating an existing variant
 */
export interface UpdateVariantDTO {
  id: string
  dimension?: Dimension
  difficulty?: number
  front?: string
  back?: string
  hints?: string[]
  /** Question type */
  questionType?: QuestionType
  /** Evaluation rubric for open response questions */
  rubric?: EvaluationRubric
  /** Maximum character length for open response answers */
  maxLength?: number
}

/**
 * Mastery state for a dimension
 */
export interface MasteryDTO {
  dimension: Dimension
  accuracyEwma: number
  speedEwma: number
  count: number
}

/**
 * Complete mastery profile across all dimensions
 */
export interface MasteryProfileDTO {
  dimensions: MasteryDTO[]
  overallScore: number
  weakestDimension: Dimension | null
  strongestDimension: Dimension | null
}

/**
 * Schedule state for a concept
 */
export interface ScheduleDTO {
  conceptId: string
  dueAt: string
  intervalDays: number
  ease: number
}

/**
 * Data for updating a schedule
 */
export interface UpdateScheduleDTO {
  conceptId: string
  dueAt?: string
  intervalDays?: number
  ease?: number
}

/**
 * Card ready for review with all necessary context
 */
export interface ReviewCardDTO {
  variant: VariantDTO
  concept: ConceptDTO
  schedule: ScheduleDTO
}

/**
 * Review submission from the user
 */
export interface ReviewSubmitDTO {
  variantId: string
  conceptId: string
  dimension: Dimension
  rating: Rating
  timeMs: number
  /** Selected answer indices for multiple choice / multi-select questions */
  selectedAnswerIndices?: number[]
  /** User's typed response for open response questions */
  userResponse?: string
}

/**
 * Result of a review submission
 */
export interface ReviewResultDTO {
  updatedMastery: MasteryDTO
  updatedSchedule: ScheduleDTO
  nextCard: ReviewCardDTO | null
  /** Whether the answer was correct (for objective question types) */
  wasCorrect?: boolean
  /** Correct answer indices (for multiple choice / multi-select) */
  correctAnswers?: number[]
  /** Partial score for multi-select (0.0 to 1.0) */
  partialScore?: number
  /** Explanation of the correct answer */
  explanation?: string
  /** LLM evaluation result for open response questions */
  evaluation?: LLMEvaluationResult
}

/**
 * Count of due cards
 */
export interface DueCountDTO {
  total: number
  byDimension: Record<Dimension, number>
}

/**
 * LLM provider configuration
 */
export interface LLMConfigDTO {
  provider: 'openai' | 'anthropic' | 'local'
  apiKey: string
  model: string
  baseUrl?: string
}

/**
 * Application settings
 */
export interface SettingsDTO {
  ewmaAlpha: number
  targetTimes: Record<number, number>
  antiFrustrationThreshold: number
  // Review session settings
  cardsPerSession: number
  newCardsPerDay: number
  // LLM configuration
  llm: LLMConfigDTO
  // UI theme
  theme: 'light' | 'dark' | 'system'
}

/**
 * Result of LLM API connection test
 */
export interface ConnectionTestResultDTO {
  success: boolean
  message: string
  latencyMs?: number
}

// -----------------------------------------------------------------------------
// Analytics DTOs
// -----------------------------------------------------------------------------

/**
 * Daily mastery snapshot for a single dimension
 */
export interface DimensionMasterySnapshotDTO {
  accuracy: number
  speed: number
  combined: number
}

/**
 * Daily mastery data across all dimensions for timeline charts
 */
export interface MasteryTimelineEntryDTO {
  date: string
  dimensions: Record<Dimension, DimensionMasterySnapshotDTO>
}

/**
 * Review count distribution by result type for a dimension
 */
export interface ReviewDistributionEntryDTO {
  dimension: Dimension
  again: number
  hard: number
  good: number
  easy: number
}

/**
 * Response time statistics for a difficulty level
 */
export interface ResponseTimeStatsEntryDTO {
  difficulty: number
  min: number
  max: number
  avg: number
  median: number
  count: number
}

/**
 * Weakness severity classification
 */
export type WeaknessSeverity = 'none' | 'mild' | 'moderate' | 'critical'

/**
 * Daily weakness severity per dimension for heatmap visualization
 */
export interface WeaknessHeatmapEntryDTO {
  date: string
  dimensions: Record<Dimension, WeaknessSeverity>
}

// -----------------------------------------------------------------------------
// Open Response Evaluation Types
// -----------------------------------------------------------------------------

/**
 * Rubric for LLM evaluation of open responses
 */
export interface EvaluationRubric {
  /** Key points that should be mentioned in a good answer */
  keyPoints: string[]
  /** Alternative acceptable phrasings */
  acceptableVariations?: string[]
  /** Instructions for how to award partial credit */
  partialCreditCriteria?: string
}

/**
 * Result from LLM evaluation of an open response
 */
export interface LLMEvaluationResult {
  /** Overall score from 0.0 to 1.0 */
  score: number
  /** Human-readable feedback for the user */
  feedback: string
  /** Which key points from the rubric were covered */
  keyPointsCovered: string[]
  /** Which key points from the rubric were missed */
  keyPointsMissed: string[]
  /** LLM's confidence in the evaluation (0.0 to 1.0) */
  confidence: number
  /** Suggested user rating based on the score */
  suggestedRating: Rating
  /** Whether the response demonstrated understanding of the concept */
  demonstratesUnderstanding: boolean
}

/**
 * Request to evaluate an open response answer
 */
export interface EvaluationRequest {
  /** The question that was asked */
  question: string
  /** The model/reference answer for comparison */
  modelAnswer: string
  /** The user's response to evaluate */
  userResponse: string
  /** Evaluation rubric with key points (optional) */
  rubric?: EvaluationRubric
  /** The concept name being tested */
  conceptName: string
  /** The cognitive dimension being tested */
  dimension: Dimension
}

// -----------------------------------------------------------------------------
// IPC Channel Definitions
// -----------------------------------------------------------------------------

/**
 * Type-safe IPC channel definitions mapping channel names to their
 * request arguments and response types.
 *
 * Usage:
 * - Keys are the channel names (e.g., 'concepts:getAll')
 * - `args` is the type of the argument passed to the handler
 * - `result` is the type returned by the handler
 */
export interface IPCChannels {
  // Concept operations
  'concepts:getAll': { args: void; result: ConceptDTO[] }
  'concepts:getById': { args: string; result: ConceptDTO | null }
  'concepts:create': { args: CreateConceptDTO; result: ConceptDTO }
  'concepts:update': { args: UpdateConceptDTO; result: ConceptDTO }
  'concepts:delete': { args: string; result: void }

  // Variant operations
  'variants:getByConceptId': { args: string; result: VariantDTO[] }
  'variants:create': { args: CreateVariantDTO; result: VariantDTO }
  'variants:update': { args: UpdateVariantDTO; result: VariantDTO }
  'variants:delete': { args: string; result: void }

  // Review operations
  'review:getNextCard': { args: void; result: ReviewCardDTO | null }
  'review:submit': { args: ReviewSubmitDTO; result: ReviewResultDTO }
  'review:getDueCount': { args: void; result: DueCountDTO }

  // Mastery operations
  'mastery:getProfile': { args: void; result: MasteryProfileDTO }
  'mastery:getByDimension': { args: Dimension; result: MasteryDTO }

  // Schedule operations
  'schedule:getDue': { args: void; result: ScheduleDTO[] }
  'schedule:update': { args: UpdateScheduleDTO; result: ScheduleDTO }

  // Settings operations
  'settings:get': { args: void; result: SettingsDTO }
  'settings:set': { args: Partial<SettingsDTO>; result: SettingsDTO }
  'settings:testConnection': { args: LLMConfigDTO; result: ConnectionTestResultDTO }

  // Analytics operations
  'analytics:getMasteryTimeline': {
    args: { days: number }
    result: MasteryTimelineEntryDTO[]
  }
  'analytics:getReviewDistribution': {
    args: void
    result: ReviewDistributionEntryDTO[]
  }
  'analytics:getResponseTimeStats': {
    args: void
    result: ResponseTimeStatsEntryDTO[]
  }
  'analytics:getWeaknessHeatmap': {
    args: { days: number }
    result: WeaknessHeatmapEntryDTO[]
  }

  // Evaluation operations (for open response LLM evaluation)
  'evaluation:evaluate': { args: EvaluationRequest; result: LLMEvaluationResult }
}

/**
 * Extract channel names as a union type
 */
export type IPCChannelName = keyof IPCChannels

/**
 * Extract arguments type for a specific channel
 */
export type IPCArgs<T extends IPCChannelName> = IPCChannels[T]['args']

/**
 * Extract result type for a specific channel
 */
export type IPCResult<T extends IPCChannelName> = IPCChannels[T]['result']

// -----------------------------------------------------------------------------
// Error Types
// -----------------------------------------------------------------------------

/**
 * IPC error response
 */
export interface IPCError {
  code: string
  message: string
  details?: unknown
}

/**
 * Standard IPC response wrapper (optional, for explicit error handling)
 */
export type IPCResponse<T> =
  | { success: true; data: T }
  | { success: false; error: IPCError }
