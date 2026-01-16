/**
 * @fileoverview Mastery calculation service using EWMA (Exponentially Weighted Moving Average)
 * @lastmodified 2026-01-16T00:00:00Z
 * @anchor MasteryCalculator
 *
 * Features: EWMA updates, rating-to-score mapping, speed scoring, mastery analysis
 * Main APIs: updateEwma(), ratingToScore(), calculateSpeedScore(), updateMastery(),
 *            calculateCombinedMastery(), isFragileConfidence(), isWeakDimension()
 * Constraints: Pure functions only, no side effects, all inputs validated
 * Patterns: Domain service pattern with functional composition
 */

import type { DifficultyLevel, DimensionMastery, ReviewResultType } from '../../shared/types/core'

/**
 * Default EWMA smoothing factor (alpha).
 * Higher values give more weight to recent observations.
 * 0.15 provides a good balance between responsiveness and stability.
 */
const DEFAULT_ALPHA = 0.15

/**
 * Default threshold for weak dimension detection.
 */
const DEFAULT_WEAK_THRESHOLD = 0.7

/**
 * Weight given to accuracy in combined mastery calculation.
 */
const ACCURACY_WEIGHT = 0.7

/**
 * Weight given to speed in combined mastery calculation.
 */
const SPEED_WEIGHT = 0.3

/**
 * Target response times by difficulty level (1-5) in milliseconds.
 * Lower difficulties have shorter target times.
 */
const TARGET_TIMES_MS: Record<DifficultyLevel, number> = {
  1: 5000,
  2: 10000,
  3: 20000,
  4: 40000,
  5: 60000,
}

/**
 * Score mappings for each review result type.
 * Maps user self-assessment to a numeric score for EWMA calculations.
 */
const RATING_SCORES: Record<ReviewResultType, number> = {
  again: 0,
  hard: 0.4,
  good: 0.7,
  easy: 1.0,
}

/**
 * Clamps a value between min and max bounds.
 * @anchor clamp
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Updates an EWMA value with a new observation.
 *
 * Formula: new = (1 - alpha) * current + alpha * newValue
 *
 * The alpha parameter controls the smoothing:
 * - Higher alpha (closer to 1) = more weight on recent values, faster response
 * - Lower alpha (closer to 0) = more weight on history, smoother trend
 *
 * @anchor updateEwma
 * @param current - The current EWMA value (0-1)
 * @param newValue - The new observation to incorporate (0-1)
 * @param alpha - Smoothing factor (default: 0.15)
 * @returns The updated EWMA value, clamped between 0 and 1
 */
export function updateEwma(current: number, newValue: number, alpha: number = DEFAULT_ALPHA): number {
  const clampedCurrent = clamp(current, 0, 1)
  const clampedNewValue = clamp(newValue, 0, 1)
  const clampedAlpha = clamp(alpha, 0, 1)

  const result = (1 - clampedAlpha) * clampedCurrent + clampedAlpha * clampedNewValue

  return clamp(result, 0, 1)
}

/**
 * Converts a review result type to a numeric score.
 *
 * Mapping:
 * - again = 0.0 (complete failure, needs immediate review)
 * - hard = 0.4 (struggled but eventually recalled)
 * - good = 0.7 (correct with normal effort)
 * - easy = 1.0 (effortless recall)
 *
 * @anchor ratingToScore
 * @param result - The user's review result
 * @returns A numeric score between 0 and 1
 */
export function ratingToScore(result: ReviewResultType): number {
  return RATING_SCORES[result]
}

/**
 * Calculates a speed score based on response time and difficulty.
 *
 * Uses target times that scale with difficulty:
 * - Level 1: 5 seconds (simple recall)
 * - Level 2: 10 seconds
 * - Level 3: 20 seconds (moderate complexity)
 * - Level 4: 40 seconds
 * - Level 5: 60 seconds (complex reasoning)
 *
 * The formula normalizes response time against the target:
 * score = 1 - clamp(timeMs / targetMs, 0, 2) / 2
 *
 * This produces:
 * - Score 1.0 when instant (0ms)
 * - Score 0.5 when at target time
 * - Score 0.0 when at 2x target time or slower
 *
 * @anchor calculateSpeedScore
 * @param timeMs - Response time in milliseconds
 * @param difficulty - The difficulty level (1-5)
 * @returns A speed score between 0 and 1 (faster = higher)
 */
export function calculateSpeedScore(timeMs: number, difficulty: DifficultyLevel): number {
  const targetMs = TARGET_TIMES_MS[difficulty]
  const normalizedTime = clamp(timeMs / targetMs, 0, 2)
  return 1 - normalizedTime / 2
}

/**
 * Updates dimension mastery based on a review result.
 *
 * This is the main mastery update function that:
 * 1. Converts the review result to an accuracy score
 * 2. Calculates a speed score from response time
 * 3. Updates both EWMA values
 * 4. Increments the review count
 *
 * Returns a new immutable DimensionMastery object.
 *
 * @anchor updateMastery
 * @param current - The current dimension mastery state
 * @param result - The user's review result (again/hard/good/easy)
 * @param timeMs - Response time in milliseconds
 * @param difficulty - The difficulty level of the reviewed variant
 * @returns A new DimensionMastery object with updated values
 */
export function updateMastery(
  current: DimensionMastery,
  result: ReviewResultType,
  timeMs: number,
  difficulty: DifficultyLevel
): DimensionMastery {
  const accuracyScore = ratingToScore(result)
  const speedScore = calculateSpeedScore(timeMs, difficulty)

  return {
    accuracyEwma: updateEwma(current.accuracyEwma, accuracyScore),
    speedEwma: updateEwma(current.speedEwma, speedScore),
    recentCount: current.recentCount + 1,
  }
}

/**
 * Calculates the combined mastery score for a dimension.
 *
 * Combines accuracy and speed with weighted average:
 * combined = 0.7 * accuracy + 0.3 * speed
 *
 * This weighting reflects that accuracy is more important than speed,
 * but speed indicates automaticity and fluency.
 *
 * @anchor calculateCombinedMastery
 * @param mastery - The dimension mastery to evaluate
 * @returns A combined score between 0 and 1
 */
export function calculateCombinedMastery(mastery: DimensionMastery): number {
  return ACCURACY_WEIGHT * mastery.accuracyEwma + SPEED_WEIGHT * mastery.speedEwma
}

/**
 * Detects fragile confidence in a dimension.
 *
 * Fragile confidence occurs when a learner:
 * - Has high accuracy (> 0.7) - they know the material
 * - Has slow speed (< 0.5) - but lack automaticity
 *
 * This indicates knowledge that is not yet consolidated and may
 * degrade under pressure or time constraints.
 *
 * @anchor isFragileConfidence
 * @param mastery - The dimension mastery to evaluate
 * @returns True if the dimension shows fragile confidence
 */
export function isFragileConfidence(mastery: DimensionMastery): boolean {
  return mastery.accuracyEwma > 0.7 && mastery.speedEwma < 0.5
}

/**
 * Checks if a dimension is considered weak.
 *
 * A dimension is weak when its combined mastery score falls below
 * the threshold. Weak dimensions should receive more practice.
 *
 * @anchor isWeakDimension
 * @param mastery - The dimension mastery to evaluate
 * @param threshold - The weakness threshold (default: 0.7)
 * @returns True if the combined mastery is below the threshold
 */
export function isWeakDimension(mastery: DimensionMastery, threshold: number = DEFAULT_WEAK_THRESHOLD): boolean {
  return calculateCombinedMastery(mastery) < threshold
}

/**
 * Creates a fresh dimension mastery with initial values.
 * Starts at neutral (0.5) for both metrics with zero reviews.
 *
 * @anchor createInitialMastery
 * @returns A new DimensionMastery with default values
 */
export function createInitialMastery(): DimensionMastery {
  return {
    accuracyEwma: 0.5,
    speedEwma: 0.5,
    recentCount: 0,
  }
}

/**
 * MasteryCalculator provides domain service methods for mastery calculations.
 *
 * This object groups all mastery-related pure functions for convenient
 * import and use. All methods are stateless and have no side effects.
 *
 * @anchor MasteryCalculatorService
 */
export const MasteryCalculator = {
  updateEwma,
  ratingToScore,
  calculateSpeedScore,
  updateMastery,
  calculateCombinedMastery,
  isFragileConfidence,
  isWeakDimension,
  createInitialMastery,

  /**
   * Constants exposed for external use if needed.
   */
  constants: {
    DEFAULT_ALPHA,
    DEFAULT_WEAK_THRESHOLD,
    ACCURACY_WEIGHT,
    SPEED_WEIGHT,
    TARGET_TIMES_MS,
    RATING_SCORES,
  },
} as const
