/**
 * @fileoverview IPC channel type definitions for Electron main/renderer communication
 * @lastmodified 2025-01-16T00:00:00Z
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
  createdAt: string
  updatedAt: string
}

/**
 * Data required to create a new concept
 */
export interface CreateConceptDTO {
  name: string
  definition?: string
}

/**
 * Data for updating an existing concept
 */
export interface UpdateConceptDTO {
  id: string
  name?: string
  definition?: string
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
  createdAt: string
  updatedAt: string
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
}

/**
 * Result of a review submission
 */
export interface ReviewResultDTO {
  updatedMastery: MasteryDTO
  updatedSchedule: ScheduleDTO
  nextCard: ReviewCardDTO | null
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
