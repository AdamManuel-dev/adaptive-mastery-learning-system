/**
 * @fileoverview Adaptive card selection service for the FlashCards app
 * @lastmodified 2025-01-16T00:00:00Z
 * @anchor CardSelectorService
 *
 * Implements intelligent variant selection based on mastery profile, novelty,
 * and anti-frustration mechanics. The selection algorithm biases toward:
 * - Weak dimensions (higher boost for areas needing practice)
 * - Novel or stale cards (encourage spaced repetition)
 * - Appropriate difficulty (prevent frustration spirals)
 *
 * Main APIs:
 * - selectVariantForConcept() - Primary selection function
 * - calculateVariantWeight() - Weight calculation for a single variant
 * - weightedRandomSelect() - Generic weighted random utility
 *
 * Safety Rails:
 * - enforceSessionDimensionCap() - Prevent dimension over-representation
 * - shouldInsertConfidenceCard() - Detect frustration patterns
 */

import type {
  DimensionMastery,
  DimensionType,
  MasteryProfile,
  Variant,
} from '../../shared/types/core';

/**
 * Calculates a boost factor for weak dimensions to prioritize practice.
 *
 * Weak areas (combined mastery < 0.7) receive a multiplicative boost
 * that increases as mastery decreases. Strong areas receive a slight
 * penalty to balance selection.
 *
 * @param mastery - The dimension mastery metrics
 * @returns Boost factor (0.9 for strong, up to 2.4 for very weak)
 *
 * @example
 * // Weak dimension (40% combined mastery)
 * calculateWeaknessBoost({ accuracyEwma: 0.4, speedEwma: 0.4, recentCount: 5 })
 * // Returns: 1 + 2 * (0.7 - 0.4) = 1.6
 *
 * @example
 * // Strong dimension (90% combined mastery)
 * calculateWeaknessBoost({ accuracyEwma: 0.95, speedEwma: 0.8, recentCount: 10 })
 * // Returns: 0.9 (slight penalty)
 */
export function calculateWeaknessBoost(mastery: DimensionMastery): number {
  const combinedMastery = 0.7 * mastery.accuracyEwma + 0.3 * mastery.speedEwma;

  if (combinedMastery < 0.7) {
    return 1 + 2 * (0.7 - combinedMastery);
  }

  return 0.9;
}

/**
 * Calculates a boost factor based on when the variant was last shown.
 *
 * Encourages spaced repetition by boosting variants that haven't been
 * seen recently. Never-shown variants get the highest boost.
 *
 * @param lastShownAt - When the variant was last displayed, or null if never
 * @returns Novelty boost factor (0.8 to 2.0)
 *
 * @example
 * // Never shown before
 * calculateNoveltyBoost(null)
 * // Returns: 2.0
 *
 * @example
 * // Shown 10 days ago
 * calculateNoveltyBoost(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000))
 * // Returns: 1.5
 *
 * @example
 * // Shown yesterday
 * calculateNoveltyBoost(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000))
 * // Returns: 0.8
 */
export function calculateNoveltyBoost(lastShownAt: Date | null): number {
  if (lastShownAt === null) {
    return 2.0;
  }

  const now = Date.now();
  const daysSinceShown = (now - lastShownAt.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceShown > 7) {
    return 1.5;
  }

  if (daysSinceShown >= 3) {
    return 1.2;
  }

  return 0.8;
}

/**
 * Calculates a penalty factor to prevent frustration from repeated failures.
 *
 * When a learner struggles with multiple consecutive failures, we reduce
 * the likelihood of showing difficult cards to restore confidence.
 *
 * @param consecutiveFailures - Number of consecutive failed reviews
 * @returns Penalty factor (0.3 to 1.0, lower = more penalty)
 *
 * @example
 * // No recent failures
 * calculateAntiFrustrationPenalty(0)
 * // Returns: 1.0
 *
 * @example
 * // Three or more consecutive failures
 * calculateAntiFrustrationPenalty(3)
 * // Returns: 0.3
 */
export function calculateAntiFrustrationPenalty(
  consecutiveFailures: number
): number {
  if (consecutiveFailures >= 3) {
    return 0.3;
  }

  if (consecutiveFailures === 2) {
    return 0.6;
  }

  if (consecutiveFailures === 1) {
    return 0.8;
  }

  return 1.0;
}

/**
 * Calculates difficulty alignment factor based on mastery level.
 *
 * Variants should match the learner's current level. Too easy or too hard
 * cards are penalized. Optimal difficulty is slightly above current mastery.
 *
 * @param difficulty - Variant difficulty (1-5)
 * @param mastery - Current dimension mastery
 * @returns Alignment factor (0.5 to 1.2)
 */
function calculateDifficultyAlignment(
  difficulty: number,
  mastery: DimensionMastery
): number {
  const combinedMastery = 0.7 * mastery.accuracyEwma + 0.3 * mastery.speedEwma;

  // Map mastery (0-1) to ideal difficulty (1-5)
  // Low mastery (0.2) -> difficulty 1-2
  // High mastery (0.9) -> difficulty 4-5
  const idealDifficulty = 1 + combinedMastery * 4;

  const difficultyGap = Math.abs(difficulty - idealDifficulty);

  // Slight boost for being just above current level (challenge zone)
  if (difficulty > idealDifficulty && difficultyGap <= 1) {
    return 1.2;
  }

  // Penalize large gaps in either direction
  if (difficultyGap <= 1) {
    return 1.0;
  }

  if (difficultyGap <= 2) {
    return 0.7;
  }

  return 0.5;
}

/**
 * Calculates the selection weight for a variant based on mastery context.
 *
 * Combines weakness boost, novelty, anti-frustration, and difficulty
 * alignment into a single weight value for selection probability.
 *
 * @param variant - The variant to evaluate
 * @param mastery - The learner's full mastery profile
 * @param consecutiveFailures - Number of recent consecutive failures
 * @returns Combined weight (higher = more likely to be selected)
 *
 * @example
 * const variant = {
 *   id: 'v1',
 *   dimension: DimensionType.DEFINITION_RECALL,
 *   difficulty: 2,
 *   lastShownAt: null,
 *   // ... other fields
 * };
 * const weight = calculateVariantWeight(variant, masteryProfile, 0);
 * // High weight due to novelty boost (never shown)
 */
export function calculateVariantWeight(
  variant: Variant,
  mastery: MasteryProfile,
  consecutiveFailures: number
): number {
  const dimensionMastery = mastery[variant.dimension];

  const weaknessBoost = calculateWeaknessBoost(dimensionMastery);
  const noveltyBoost = calculateNoveltyBoost(variant.lastShownAt);
  const frustrationPenalty = calculateAntiFrustrationPenalty(consecutiveFailures);
  const difficultyAlignment = calculateDifficultyAlignment(
    variant.difficulty,
    dimensionMastery
  );

  return weaknessBoost * noveltyBoost * frustrationPenalty * difficultyAlignment;
}

/**
 * Generic weighted random selection utility.
 *
 * Selects an item from an array based on provided weights. Higher weights
 * mean higher probability of selection.
 *
 * @param items - Array of items to select from
 * @param weights - Corresponding weights for each item
 * @returns Selected item, or null if inputs are invalid
 *
 * @example
 * const items = ['A', 'B', 'C'];
 * const weights = [1, 2, 1]; // B is twice as likely as A or C
 * const selected = weightedRandomSelect(items, weights);
 */
export function weightedRandomSelect<T>(
  items: T[],
  weights: number[]
): T | null {
  if (items.length === 0 || items.length !== weights.length) {
    return null;
  }

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  if (totalWeight <= 0) {
    return null;
  }

  const randomPoint = Math.random() * totalWeight;

  let cumulativeWeight = 0;
  for (let i = 0; i < items.length; i++) {
    const weight = weights[i];
    const item = items[i];
    if (weight === undefined || item === undefined) {
      continue;
    }
    cumulativeWeight += weight;
    if (randomPoint < cumulativeWeight) {
      return item;
    }
  }

  // Fallback (shouldn't reach here due to floating point, but just in case)
  return items[items.length - 1] ?? null;
}

/**
 * Selects the next variant to show for a concept based on mastery context.
 *
 * Uses weighted random selection to balance exploration (trying different
 * dimensions) with exploitation (focusing on weak areas).
 *
 * @param variants - Available variants for the concept
 * @param mastery - The learner's mastery profile
 * @param recentFailures - Count of consecutive recent failures
 * @returns Selected variant, or null if no variants available
 *
 * @example
 * const selected = selectVariantForConcept(
 *   concept.variants,
 *   userMasteryProfile,
 *   sessionFailureCount
 * );
 * if (selected) {
 *   showCard(selected);
 * }
 */
export function selectVariantForConcept(
  variants: Variant[],
  mastery: MasteryProfile,
  recentFailures: number
): Variant | null {
  if (variants.length === 0) {
    return null;
  }

  const weights = variants.map((variant) =>
    calculateVariantWeight(variant, mastery, recentFailures)
  );

  return weightedRandomSelect(variants, weights);
}

/**
 * Checks if a dimension has been over-represented in the current session.
 *
 * Prevents the algorithm from repeatedly selecting the same dimension,
 * ensuring balanced practice across all cognitive areas.
 *
 * @param selectedDimensions - Dimensions already selected in this session
 * @param maxPercentage - Maximum allowed percentage for any dimension (default 70%)
 * @returns true if within limits, false if cap exceeded
 *
 * @example
 * const sessionDimensions = [
 *   DimensionType.DEFINITION_RECALL,
 *   DimensionType.DEFINITION_RECALL,
 *   DimensionType.PARAPHRASE_RECOGNITION,
 * ];
 * enforceSessionDimensionCap(sessionDimensions, 0.7)
 * // Returns: true (DEFINITION_RECALL is 66%, under 70%)
 */
export function enforceSessionDimensionCap(
  selectedDimensions: DimensionType[],
  maxPercentage = 0.7
): boolean {
  if (selectedDimensions.length === 0) {
    return true;
  }

  const counts = new Map<DimensionType, number>();

  for (const dimension of selectedDimensions) {
    counts.set(dimension, (counts.get(dimension) ?? 0) + 1);
  }

  const total = selectedDimensions.length;
  const countValues = Array.from(counts.values());

  for (const count of countValues) {
    if (count / total > maxPercentage) {
      return false;
    }
  }

  return true;
}

/**
 * Determines if a confidence-building card should be inserted.
 *
 * After multiple consecutive failures, showing an easier "confidence card"
 * can prevent frustration spirals and maintain learner motivation.
 *
 * @param consecutiveFailures - Number of consecutive failed reviews
 * @returns true if a confidence card should be shown
 *
 * @example
 * if (shouldInsertConfidenceCard(sessionFailures)) {
 *   showEasyCard(); // Break the failure pattern
 * }
 */
export function shouldInsertConfidenceCard(consecutiveFailures: number): boolean {
  return consecutiveFailures >= 3;
}
