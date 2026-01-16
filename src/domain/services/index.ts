/**
 * @fileoverview Domain services barrel export
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Exports all domain services for the Adaptive Mastery Learning System.
 */

// Mastery calculation service
export {
  MasteryCalculator,
  updateEwma,
  ratingToScore,
  calculateSpeedScore,
  updateMastery,
  calculateCombinedMastery,
  isFragileConfidence,
  isWeakDimension,
  createInitialMastery,
} from './mastery-calculator.service'

// SM-2 Scheduler service
export {
  calculateNextInterval,
  updateEaseFactor,
  scheduleNextReview,
  createInitialSchedule,
  isOverdue,
  getOverdueDays,
} from './scheduler.service'

// Card selector service
export {
  calculateWeaknessBoost,
  calculateNoveltyBoost,
  calculateAntiFrustrationPenalty,
  calculateVariantWeight,
  weightedRandomSelect,
  selectVariantForConcept,
  enforceSessionDimensionCap,
  shouldInsertConfidenceCard,
} from './card-selector.service'

// Weakness detector service
export type { Weakness, WeaknessProfile } from './weakness-detector.service'
export {
  calculateCombinedScore,
  detectWeakDimension,
  detectFragileConfidence,
  detectDodgingPattern,
  analyzeWeaknesses,
  getSuggestion,
  shouldPrioritizeDimension,
} from './weakness-detector.service'
