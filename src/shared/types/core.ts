/**
 * @fileoverview Core domain types and interfaces for the Adaptive Mastery Learning System
 * @lastmodified 2025-01-16T00:00:00Z
 *
 * Defines the fundamental data structures used throughout the application:
 * - Dimension types for categorizing learning question types
 * - Review result types for tracking user performance
 * - Entity interfaces (Concept, Variant, ReviewEvent, Schedule)
 * - Mastery tracking structures
 *
 * These types form the foundation of the domain model and are used across
 * all layers of the hexagonal architecture.
 */

import type { ConceptId, EventId, VariantId } from './branded';

/**
 * The six cognitive dimensions used to assess concept understanding.
 * Each dimension tests a different aspect of knowledge mastery.
 */
export enum DimensionType {
  /** Can the learner recall the definition when shown the term? */
  DEFINITION_RECALL = 'definition_recall',

  /** Can the learner recognize correct paraphrases of the definition? */
  PARAPHRASE_RECOGNITION = 'paraphrase_recognition',

  /** Can the learner correctly classify examples vs non-examples? */
  EXAMPLE_CLASSIFICATION = 'example_classification',

  /** Can the learner apply the concept to novel scenarios? */
  SCENARIO_APPLICATION = 'scenario_application',

  /** Can the learner distinguish this concept from similar ones? */
  DISCRIMINATION = 'discrimination',

  /** Can the learner fill in missing parts of definitions or facts? */
  CLOZE_FILL = 'cloze_fill',
}

/**
 * User response quality levels for review sessions.
 * Based on SM-2 algorithm categories with semantic meaning.
 */
export type ReviewResultType = 'again' | 'hard' | 'good' | 'easy';

/**
 * Difficulty level for variants (1-5 scale).
 * Higher numbers indicate more challenging questions.
 */
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

/**
 * A learning concept that the user wants to master.
 * Serves as the aggregate root containing variants.
 */
export interface Concept {
  /** Unique identifier for the concept */
  readonly id: ConceptId;

  /** Human-readable name/term for the concept */
  readonly name: string;

  /** The canonical definition of the concept */
  readonly definition: string;

  /** Supporting facts, examples, or key points about the concept */
  readonly facts: readonly string[];

  /** When the concept was first created */
  readonly createdAt: Date;

  /** When the concept was last modified */
  readonly updatedAt: Date;
}

/**
 * A specific question/card variant for testing a concept.
 * Each variant targets a specific dimension and difficulty level.
 */
export interface Variant {
  /** Unique identifier for the variant */
  readonly id: VariantId;

  /** Reference to the parent concept */
  readonly conceptId: ConceptId;

  /** The cognitive dimension this variant tests */
  readonly dimension: DimensionType;

  /** Difficulty level (1=easiest, 5=hardest) */
  readonly difficulty: DifficultyLevel;

  /** The question or prompt shown to the user */
  readonly front: string;

  /** The correct answer or explanation */
  readonly back: string;

  /** Progressive hints that can be revealed */
  readonly hints: readonly string[];

  /** When this variant was last shown in review (null if never shown) */
  readonly lastShownAt: Date | null;
}

/**
 * A record of a single review interaction.
 * Immutable event capturing the user's response to a variant.
 */
export interface ReviewEvent {
  /** Unique identifier for the event */
  readonly id: EventId;

  /** The concept being reviewed */
  readonly conceptId: ConceptId;

  /** The specific variant that was shown */
  readonly variantId: VariantId;

  /** The dimension being tested */
  readonly dimension: DimensionType;

  /** The difficulty level of the variant */
  readonly difficulty: DifficultyLevel;

  /** The user's self-reported response quality */
  readonly result: ReviewResultType;

  /** Time taken to respond in milliseconds */
  readonly timeMs: number;

  /** Number of hints the user requested */
  readonly hintsUsed: number;

  /** When the review occurred */
  readonly createdAt: Date;
}

/**
 * Scheduling data for a concept's next review.
 * Implements SM-2 algorithm state.
 */
export interface ScheduleEntry {
  /** The concept this schedule applies to */
  readonly conceptId: ConceptId;

  /** When the concept is next due for review */
  readonly dueAt: Date;

  /** Current interval between reviews in days */
  readonly intervalDays: number;

  /** SM-2 ease factor (typically 1.3-2.5) */
  readonly easeFactor: number;
}

/**
 * Mastery metrics for a single dimension.
 * Uses EWMA (Exponentially Weighted Moving Average) for smoothing.
 */
export interface DimensionMastery {
  /** Accuracy score (0-1), EWMA of correct responses */
  readonly accuracyEwma: number;

  /** Speed score (0-1), EWMA of response times relative to target */
  readonly speedEwma: number;

  /** Number of recent reviews contributing to this score */
  readonly recentCount: number;
}

/**
 * Complete mastery profile across all dimensions.
 * Maps each dimension to its mastery metrics.
 */
export type MasteryProfile = Record<DimensionType, DimensionMastery>;

/**
 * A concept with its associated variants loaded.
 * Convenience type for operations that need both.
 */
export type ConceptWithVariants = Concept & {
  readonly variants: readonly Variant[];
};

/**
 * Creates an empty mastery profile with default values.
 * Used when initializing a new user or concept.
 */
export function createEmptyMasteryProfile(): MasteryProfile {
  const defaultMastery: DimensionMastery = {
    accuracyEwma: 0.5,
    speedEwma: 0.5,
    recentCount: 0,
  };

  return {
    [DimensionType.DEFINITION_RECALL]: { ...defaultMastery },
    [DimensionType.PARAPHRASE_RECOGNITION]: { ...defaultMastery },
    [DimensionType.EXAMPLE_CLASSIFICATION]: { ...defaultMastery },
    [DimensionType.SCENARIO_APPLICATION]: { ...defaultMastery },
    [DimensionType.DISCRIMINATION]: { ...defaultMastery },
    [DimensionType.CLOZE_FILL]: { ...defaultMastery },
  };
}

/**
 * Maps ReviewResultType to numeric score for calculations.
 */
export function reviewResultToScore(result: ReviewResultType): number {
  const scores: Record<ReviewResultType, number> = {
    again: 0,
    hard: 0.4,
    good: 0.7,
    easy: 1.0,
  };
  return scores[result];
}

/**
 * Checks if a mastery score indicates weakness (below threshold).
 */
export function isWeakMastery(
  mastery: DimensionMastery,
  threshold = 0.7
): boolean {
  const combined = 0.7 * mastery.accuracyEwma + 0.3 * mastery.speedEwma;
  return combined < threshold;
}

/**
 * Checks for fragile confidence (high accuracy but slow speed).
 * Indicates the user knows the material but lacks automaticity.
 */
export function isFragileConfidence(mastery: DimensionMastery): boolean {
  return mastery.accuracyEwma > 0.7 && mastery.speedEwma < 0.5;
}
