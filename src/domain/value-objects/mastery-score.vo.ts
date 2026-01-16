/**
 * @fileoverview MasteryScore value object for dimension mastery tracking
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: EWMA accuracy/speed tracking, combined score, mastery level classification
 * Main APIs: MasteryScore.create(), combined, level, withUpdatedAccuracy(), withUpdatedSpeed()
 * Constraints: Immutable, accuracy and speed values must be 0-1, recentCount >= 0
 * Patterns: Value object with copy-on-write updates, EWMA calculations
 */

import { ValidationError } from '../../shared/errors'
import { Result } from '../../shared/utils/result'

/**
 * Default EWMA smoothing factor (alpha).
 * Higher values give more weight to recent observations.
 */
const DEFAULT_ALPHA = 0.15

/**
 * Thresholds for mastery level classification.
 */
const MASTERY_THRESHOLDS = {
  WEAK: 0.5,
  DEVELOPING: 0.7,
  STRONG: 0.85,
} as const

/**
 * Mastery level labels.
 */
export type MasteryLevel = 'weak' | 'developing' | 'strong' | 'mastered'

/**
 * Input properties for creating a MasteryScore.
 */
export interface MasteryScoreProps {
  readonly accuracyEwma: number
  readonly speedEwma: number
  readonly recentCount: number
}

/**
 * Represents the mastery state for a dimension.
 * Tracks accuracy and speed using exponentially weighted moving averages.
 */
export class MasteryScore {
  private constructor(
    private readonly _accuracyEwma: number,
    private readonly _speedEwma: number,
    private readonly _recentCount: number
  ) {}

  /**
   * Creates a MasteryScore with validation.
   * Returns a ValidationError if values are out of range.
   */
  static create(props: MasteryScoreProps): Result<MasteryScore, ValidationError> {
    const { accuracyEwma, speedEwma, recentCount } = props

    if (accuracyEwma < 0 || accuracyEwma > 1) {
      return Result.err(
        new ValidationError(`Accuracy EWMA must be between 0 and 1, got: ${accuracyEwma}`)
      )
    }

    if (speedEwma < 0 || speedEwma > 1) {
      return Result.err(
        new ValidationError(`Speed EWMA must be between 0 and 1, got: ${speedEwma}`)
      )
    }

    if (recentCount < 0 || !Number.isInteger(recentCount)) {
      return Result.err(
        new ValidationError(`Recent count must be a non-negative integer, got: ${recentCount}`)
      )
    }

    return Result.ok(new MasteryScore(accuracyEwma, speedEwma, recentCount))
  }

  /**
   * Creates a MasteryScore from known valid values.
   * Use this when values are guaranteed to be valid (e.g., from database).
   */
  static of(props: MasteryScoreProps): MasteryScore {
    return new MasteryScore(props.accuracyEwma, props.speedEwma, props.recentCount)
  }

  /**
   * Creates a new mastery score with default initial values.
   * Starts at 0.5 (neutral) for both accuracy and speed.
   */
  static initial(): MasteryScore {
    return new MasteryScore(0.5, 0.5, 0)
  }

  /**
   * The exponentially weighted moving average of accuracy (0-1).
   */
  get accuracyEwma(): number {
    return this._accuracyEwma
  }

  /**
   * The exponentially weighted moving average of speed (0-1).
   */
  get speedEwma(): number {
    return this._speedEwma
  }

  /**
   * Number of recent reviews contributing to this score.
   */
  get recentCount(): number {
    return this._recentCount
  }

  /**
   * Combined mastery score (70% accuracy, 30% speed).
   * From MVP spec: 0.7 * accuracy + 0.3 * speed
   */
  get combined(): number {
    return 0.7 * this._accuracyEwma + 0.3 * this._speedEwma
  }

  /**
   * Checks if this dimension is weak (combined score < 0.7).
   * Weak dimensions get higher selection weight for more practice.
   */
  get isWeak(): boolean {
    return this.combined < 0.7
  }

  /**
   * Checks if this dimension is fragile (accurate but slow).
   * Indicates knowledge that may not be fully consolidated.
   */
  get isFragile(): boolean {
    return this._accuracyEwma > 0.7 && this._speedEwma < 0.5
  }

  /**
   * Classifies the mastery level based on combined score.
   */
  get level(): MasteryLevel {
    const score = this.combined

    if (score < MASTERY_THRESHOLDS.WEAK) {
      return 'weak'
    }
    if (score < MASTERY_THRESHOLDS.DEVELOPING) {
      return 'developing'
    }
    if (score < MASTERY_THRESHOLDS.STRONG) {
      return 'strong'
    }
    return 'mastered'
  }

  /**
   * Returns the combined score as a percentage (0-100).
   */
  get percentage(): number {
    return Math.round(this.combined * 100)
  }

  /**
   * Creates a new MasteryScore with updated accuracy.
   * Uses EWMA formula: new = (1 - alpha) * old + alpha * observation
   *
   * @param newValue - The new accuracy observation (0-1)
   * @param alpha - Smoothing factor (default: 0.15)
   */
  withUpdatedAccuracy(newValue: number, alpha: number = DEFAULT_ALPHA): MasteryScore {
    const clampedValue = Math.max(0, Math.min(1, newValue))
    const clampedAlpha = Math.max(0, Math.min(1, alpha))

    const updatedAccuracy = (1 - clampedAlpha) * this._accuracyEwma + clampedAlpha * clampedValue

    return new MasteryScore(updatedAccuracy, this._speedEwma, this._recentCount + 1)
  }

  /**
   * Creates a new MasteryScore with updated speed.
   * Uses EWMA formula: new = (1 - alpha) * old + alpha * observation
   *
   * @param newValue - The new speed observation (0-1)
   * @param alpha - Smoothing factor (default: 0.15)
   */
  withUpdatedSpeed(newValue: number, alpha: number = DEFAULT_ALPHA): MasteryScore {
    const clampedValue = Math.max(0, Math.min(1, newValue))
    const clampedAlpha = Math.max(0, Math.min(1, alpha))

    const updatedSpeed = (1 - clampedAlpha) * this._speedEwma + clampedAlpha * clampedValue

    return new MasteryScore(this._accuracyEwma, updatedSpeed, this._recentCount + 1)
  }

  /**
   * Creates a new MasteryScore with both accuracy and speed updated.
   * This is the common case after a review where both metrics are observed.
   *
   * @param accuracyValue - The new accuracy observation (0-1)
   * @param speedValue - The new speed observation (0-1)
   * @param alpha - Smoothing factor (default: 0.15)
   */
  withUpdatedBoth(
    accuracyValue: number,
    speedValue: number,
    alpha: number = DEFAULT_ALPHA
  ): MasteryScore {
    const clampedAccuracy = Math.max(0, Math.min(1, accuracyValue))
    const clampedSpeed = Math.max(0, Math.min(1, speedValue))
    const clampedAlpha = Math.max(0, Math.min(1, alpha))

    const updatedAccuracy =
      (1 - clampedAlpha) * this._accuracyEwma + clampedAlpha * clampedAccuracy
    const updatedSpeed = (1 - clampedAlpha) * this._speedEwma + clampedAlpha * clampedSpeed

    return new MasteryScore(updatedAccuracy, updatedSpeed, this._recentCount + 1)
  }

  /**
   * Checks equality with another MasteryScore.
   * Uses approximate equality for floating point comparison.
   */
  equals(other: MasteryScore): boolean {
    const epsilon = 0.0001
    return (
      Math.abs(this._accuracyEwma - other._accuracyEwma) < epsilon &&
      Math.abs(this._speedEwma - other._speedEwma) < epsilon &&
      this._recentCount === other._recentCount
    )
  }

  /**
   * Returns the mastery score as a plain object for serialization.
   */
  toProps(): MasteryScoreProps {
    return {
      accuracyEwma: this._accuracyEwma,
      speedEwma: this._speedEwma,
      recentCount: this._recentCount,
    }
  }

  /**
   * Returns a human-readable string representation.
   */
  toString(): string {
    return `MasteryScore(accuracy=${this._accuracyEwma.toFixed(2)}, speed=${this._speedEwma.toFixed(2)}, combined=${this.combined.toFixed(2)}, level=${this.level})`
  }
}
