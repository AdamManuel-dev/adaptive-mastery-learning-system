/**
 * @fileoverview Weakness detection service for analyzing mastery profiles
 * @lastmodified 2025-01-16T00:00:00Z
 * @anchor WeaknessDetectorService
 *
 * Analyzes MasteryProfile data to identify areas needing more practice.
 * Detects patterns like fragile confidence, dimension dodging, and
 * generates actionable suggestions for targeted improvement.
 *
 * Features:
 * - Combined score calculation (accuracy + speed weighted)
 * - Weakness detection with severity classification
 * - Fragile confidence pattern detection
 * - Dodging pattern analysis
 * - Human-readable suggestion generation
 *
 * Main APIs:
 * - calculateCombinedScore() - Single dimension score
 * - detectWeakDimension() - Find weak dimensions with severity
 * - detectFragileConfidence() - Find dimensions needing speed practice
 * - detectDodgingPattern() - Detect avoidance of harder question types
 * - analyzeWeaknesses() - Comprehensive weakness profile
 * - getSuggestion() - Human-readable improvement suggestions
 * - shouldPrioritizeDimension() - Quick priority check for card selection
 *
 * Constraints:
 * - Requires minimum sample size for reliable detection
 * - All functions are pure with no side effects
 *
 * Patterns:
 * - Pure functional design
 * - Threshold-based classification
 */

import {
  DimensionMastery,
  DimensionType,
  MasteryProfile,
} from '../../shared/types/core';

/**
 * Represents a detected weakness in a specific dimension
 */
export interface Weakness {
  /** The dimension where weakness was detected */
  readonly dimension: DimensionType;

  /** Severity classification based on combined score thresholds */
  readonly severity: 'critical' | 'moderate' | 'mild';

  /** Weighted combination of accuracy and speed (0-1) */
  readonly combinedScore: number;

  /** Human-readable explanation of the weakness */
  readonly reason: string;
}

/**
 * Complete weakness analysis for a mastery profile
 */
export interface WeaknessProfile {
  /** All detected weaknesses, sorted by severity (worst first) */
  readonly weaknesses: Weakness[];

  /** The single most critical weakness, or null if none detected */
  readonly primaryWeakness: Weakness | null;

  /** Dimensions with high accuracy but low speed (needs automaticity practice) */
  readonly hasFragileConfidence: DimensionType[];

  /** Whether user appears to be avoiding harder question types */
  readonly isDodgingPattern: boolean;

  /** Overall health assessment based on average scores */
  readonly overallHealth: 'poor' | 'fair' | 'good' | 'excellent';
}

/** Threshold below which a dimension is considered weak */
const WEAKNESS_THRESHOLD = 0.7;

/** Threshold for critical weakness classification */
const CRITICAL_THRESHOLD = 0.4;

/** Threshold for moderate weakness classification */
const MODERATE_THRESHOLD = 0.55;

/** Default minimum reviews needed for reliable detection */
const DEFAULT_MIN_SAMPLE_SIZE = 5;

/** Threshold for strong definition recall in dodging detection */
const STRONG_DEFINITION_THRESHOLD = 0.8;

/** Threshold for weak other dimensions in dodging detection */
const WEAK_OTHERS_THRESHOLD = 0.6;

/** Weight for accuracy in combined score calculation */
const ACCURACY_WEIGHT = 0.7;

/** Weight for speed in combined score calculation */
const SPEED_WEIGHT = 0.3;

/**
 * Human-readable names for each dimension type
 */
const DIMENSION_DISPLAY_NAMES: Record<DimensionType, string> = {
  [DimensionType.DEFINITION_RECALL]: 'definition recall',
  [DimensionType.PARAPHRASE_RECOGNITION]: 'paraphrase recognition',
  [DimensionType.EXAMPLE_CLASSIFICATION]: 'example classification',
  [DimensionType.SCENARIO_APPLICATION]: 'scenario application',
  [DimensionType.DISCRIMINATION]: 'discrimination',
  [DimensionType.CLOZE_FILL]: 'cloze fill',
};

/**
 * Calculates the combined mastery score for a dimension.
 * Uses a weighted formula prioritizing accuracy over speed.
 *
 * @param mastery - The dimension mastery metrics
 * @returns Combined score between 0 and 1
 *
 * @example
 * const score = calculateCombinedScore({ accuracyEwma: 0.8, speedEwma: 0.6, recentCount: 10 });
 * // Returns: 0.7 * 0.8 + 0.3 * 0.6 = 0.74
 */
export function calculateCombinedScore(mastery: DimensionMastery): number {
  return ACCURACY_WEIGHT * mastery.accuracyEwma + SPEED_WEIGHT * mastery.speedEwma;
}

/**
 * Classifies severity based on combined score thresholds.
 */
function classifySeverity(
  combinedScore: number
): 'critical' | 'moderate' | 'mild' {
  if (combinedScore < CRITICAL_THRESHOLD) {
    return 'critical';
  }
  if (combinedScore < MODERATE_THRESHOLD) {
    return 'moderate';
  }
  return 'mild';
}

/**
 * Generates a reason string explaining why a dimension is weak.
 */
function generateWeaknessReason(
  dimension: DimensionType,
  mastery: DimensionMastery,
  severity: 'critical' | 'moderate' | 'mild'
): string {
  const name = DIMENSION_DISPLAY_NAMES[dimension];

  if (mastery.accuracyEwma < 0.5 && mastery.speedEwma < 0.5) {
    return `${name} needs significant practice - both accuracy and speed are low`;
  }

  if (mastery.accuracyEwma < 0.5) {
    return `${name} accuracy is low - focus on understanding the concept`;
  }

  if (mastery.speedEwma < 0.5) {
    return `${name} speed is slow - practice for faster recall`;
  }

  const severityDescription =
    severity === 'critical'
      ? 'urgently needs attention'
      : severity === 'moderate'
        ? 'needs more practice'
        : 'could use some reinforcement';

  return `${name} ${severityDescription}`;
}

/**
 * Detects dimensions with weak mastery scores.
 * Filters by minimum sample size to ensure reliable detection.
 *
 * @param profile - The complete mastery profile to analyze
 * @param minSampleSize - Minimum reviews needed for reliable detection (default: 5)
 * @returns Array of weaknesses sorted by severity (worst first)
 *
 * @example
 * const weaknesses = detectWeakDimension(profile, 5);
 * // Returns dimensions with combinedScore < 0.7 and recentCount >= 5
 */
export function detectWeakDimension(
  profile: MasteryProfile,
  minSampleSize: number = DEFAULT_MIN_SAMPLE_SIZE
): Weakness[] {
  const weaknesses: Weakness[] = [];

  for (const dimension of Object.values(DimensionType)) {
    const mastery = profile[dimension];

    // Skip dimensions without enough data for reliable detection
    if (mastery.recentCount < minSampleSize) {
      continue;
    }

    const combinedScore = calculateCombinedScore(mastery);

    if (combinedScore < WEAKNESS_THRESHOLD) {
      const severity = classifySeverity(combinedScore);
      weaknesses.push({
        dimension,
        severity,
        combinedScore,
        reason: generateWeaknessReason(dimension, mastery, severity),
      });
    }
  }

  // Sort by severity: critical first, then moderate, then mild
  // Within same severity, sort by combinedScore ascending (worst first)
  return weaknesses.sort((a, b) => {
    const severityOrder = { critical: 0, moderate: 1, mild: 2 };
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) {
      return severityDiff;
    }
    return a.combinedScore - b.combinedScore;
  });
}

/**
 * Detects dimensions with fragile confidence pattern.
 * Fragile confidence means the user knows the material (high accuracy)
 * but lacks automaticity (low speed), needing speed-focused practice.
 *
 * @param profile - The complete mastery profile to analyze
 * @returns Array of dimension types with fragile confidence
 *
 * @example
 * const fragile = detectFragileConfidence(profile);
 * // Returns dimensions where accuracy > 0.7 but speed < 0.5
 */
export function detectFragileConfidence(
  profile: MasteryProfile
): DimensionType[] {
  const fragileDimensions: DimensionType[] = [];

  for (const dimension of Object.values(DimensionType)) {
    const mastery = profile[dimension];

    // High accuracy (knows the material) but slow speed (lacks automaticity)
    if (mastery.accuracyEwma > 0.7 && mastery.speedEwma < 0.5) {
      fragileDimensions.push(dimension);
    }
  }

  return fragileDimensions;
}

/**
 * Detects if user is avoiding harder question types.
 * Pattern: Strong on definition recall but weak on other dimensions,
 * indicating the user may be relying on simple memorization.
 *
 * @param profile - The complete mastery profile to analyze
 * @returns True if dodging pattern is detected
 *
 * @example
 * const isDodging = detectDodgingPattern(profile);
 * // True when definition_recall > 0.8 AND average of others < 0.6
 */
export function detectDodgingPattern(profile: MasteryProfile): boolean {
  const definitionScore = calculateCombinedScore(
    profile[DimensionType.DEFINITION_RECALL]
  );

  // Definition recall must be strong
  if (definitionScore < STRONG_DEFINITION_THRESHOLD) {
    return false;
  }

  // Calculate average of other dimensions
  const otherDimensions = Object.values(DimensionType).filter(
    (d) => d !== DimensionType.DEFINITION_RECALL
  );

  const otherScores = otherDimensions.map((d) =>
    calculateCombinedScore(profile[d])
  );

  const averageOtherScore =
    otherScores.reduce((sum, score) => sum + score, 0) / otherScores.length;

  // Dodging pattern: strong definitions but weak on everything else
  return averageOtherScore < WEAK_OTHERS_THRESHOLD;
}

/**
 * Calculates overall health based on average combined scores.
 */
function calculateOverallHealth(
  profile: MasteryProfile
): 'poor' | 'fair' | 'good' | 'excellent' {
  const allDimensions = Object.values(DimensionType);
  const scores = allDimensions.map((d) => calculateCombinedScore(profile[d]));
  const averageScore =
    scores.reduce((sum, score) => sum + score, 0) / scores.length;

  if (averageScore >= 0.85) {
    return 'excellent';
  }
  if (averageScore >= 0.7) {
    return 'good';
  }
  if (averageScore >= 0.5) {
    return 'fair';
  }
  return 'poor';
}

/**
 * Performs comprehensive weakness analysis on a mastery profile.
 * Combines all detection methods into a single profile.
 *
 * @param profile - The complete mastery profile to analyze
 * @returns Complete weakness profile with all detected issues
 *
 * @example
 * const analysis = analyzeWeaknesses(profile);
 * if (analysis.primaryWeakness) {
 *   console.log(`Focus on: ${analysis.primaryWeakness.dimension}`);
 * }
 */
export function analyzeWeaknesses(profile: MasteryProfile): WeaknessProfile {
  const weaknesses = detectWeakDimension(profile);
  const hasFragileConfidence = detectFragileConfidence(profile);
  const isDodgingPattern = detectDodgingPattern(profile);
  const overallHealth = calculateOverallHealth(profile);

  // Primary weakness is the first (worst) in the sorted list
  const primaryWeakness: Weakness | null =
    weaknesses.length > 0 ? weaknesses[0]! : null;

  return {
    weaknesses,
    primaryWeakness,
    hasFragileConfidence,
    isDodgingPattern,
    overallHealth,
  };
}

/**
 * Generates a human-readable suggestion based on the weakness profile.
 *
 * @param profile - The weakness profile from analyzeWeaknesses()
 * @returns Actionable suggestion string for the user
 *
 * @example
 * const suggestion = getSuggestion(weaknessProfile);
 * // "Focus on scenario application - you're strong on definitions
 * //  but need more practice applying concepts"
 */
export function getSuggestion(profile: WeaknessProfile): string {
  // Check for dodging pattern first (specific advice)
  if (profile.isDodgingPattern) {
    const weakDimension = profile.primaryWeakness
      ? DIMENSION_DISPLAY_NAMES[profile.primaryWeakness.dimension]
      : 'applying concepts';

    return `Focus on ${weakDimension} - you're strong on definitions but need more practice with application and discrimination`;
  }

  // Check for fragile confidence
  if (profile.hasFragileConfidence.length > 0) {
    const firstFragile = profile.hasFragileConfidence[0]!;
    const fragileName = DIMENSION_DISPLAY_NAMES[firstFragile];
    return `Work on speed for ${fragileName} - you know the material but need to build automaticity`;
  }

  // Check for critical weaknesses
  if (profile.primaryWeakness?.severity === 'critical') {
    const weakName = DIMENSION_DISPLAY_NAMES[profile.primaryWeakness.dimension];
    return `Prioritize ${weakName} practice - this area needs significant improvement`;
  }

  // Check for moderate weaknesses
  if (profile.primaryWeakness?.severity === 'moderate') {
    const weakName = DIMENSION_DISPLAY_NAMES[profile.primaryWeakness.dimension];
    return `Continue practicing ${weakName} - you're making progress but need more work`;
  }

  // Check for mild weaknesses
  if (profile.primaryWeakness?.severity === 'mild') {
    const weakName = DIMENSION_DISPLAY_NAMES[profile.primaryWeakness.dimension];
    return `Polish your ${weakName} skills - nearly there, just needs some reinforcement`;
  }

  // No weaknesses detected
  switch (profile.overallHealth) {
    case 'excellent':
      return 'Excellent mastery across all dimensions! Consider increasing difficulty or reviewing less frequently';
    case 'good':
      return 'Good progress overall. Maintain your practice routine for continued improvement';
    case 'fair':
      return 'Keep practicing consistently. Focus on building stronger foundations';
    default:
      return 'Continue regular practice to build your understanding across all dimensions';
  }
}

/**
 * Quick check if a specific dimension should be prioritized for practice.
 * Used by the card selector to weight dimension selection.
 *
 * @param profile - The complete mastery profile
 * @param dimension - The dimension to check
 * @returns True if this dimension needs extra practice
 *
 * @example
 * if (shouldPrioritizeDimension(profile, DimensionType.SCENARIO_APPLICATION)) {
 *   // Weight this dimension higher in card selection
 * }
 */
export function shouldPrioritizeDimension(
  profile: MasteryProfile,
  dimension: DimensionType
): boolean {
  const mastery = profile[dimension];
  const combinedScore = calculateCombinedScore(mastery);

  // Prioritize if weak
  if (combinedScore < WEAKNESS_THRESHOLD) {
    return true;
  }

  // Prioritize if fragile confidence
  if (mastery.accuracyEwma > 0.7 && mastery.speedEwma < 0.5) {
    return true;
  }

  // Prioritize if not enough practice yet
  if (mastery.recentCount < DEFAULT_MIN_SAMPLE_SIZE) {
    return true;
  }

  return false;
}
