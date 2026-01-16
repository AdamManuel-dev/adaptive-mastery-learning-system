/**
 * @fileoverview Difficulty value object for card difficulty levels (1-5 scale)
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: 1-5 difficulty scale, target time calculation, comparison methods
 * Main APIs: Difficulty.create(), value, targetTimeMs, isHarderThan()
 * Constraints: Immutable, only integer values 1-5 are valid
 * Patterns: Value object with private constructor, factory method validation
 */

import { ValidationError } from '../../shared/errors'
import { Result } from '../../shared/utils/result'

/**
 * Valid difficulty level values.
 */
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5

/**
 * Target response times in milliseconds for each difficulty level.
 * From MVP spec: [5000, 10000, 20000, 40000, 60000]
 */
const TARGET_TIMES_MS: Record<DifficultyLevel, number> = {
  1: 5000,
  2: 10000,
  3: 20000,
  4: 40000,
  5: 60000,
}

/**
 * Difficulty level descriptions for user display.
 */
const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  1: 'Very Easy',
  2: 'Easy',
  3: 'Medium',
  4: 'Hard',
  5: 'Very Hard',
}

/**
 * Represents the difficulty level of a flashcard variant.
 * Difficulty affects expected response time and mastery calculations.
 */
export class Difficulty {
  private constructor(private readonly level: DifficultyLevel) {}

  /**
   * Creates a Difficulty from a numeric value.
   * Returns a ValidationError if the value is not between 1 and 5.
   *
   * @param value - Numeric difficulty value (will be rounded to nearest integer)
   */
  static create(value: number): Result<Difficulty, ValidationError> {
    const rounded = Math.round(value)

    if (rounded < 1 || rounded > 5) {
      return Result.err(
        new ValidationError(`Difficulty must be between 1 and 5, got: ${value}`)
      )
    }

    return Result.ok(new Difficulty(rounded as DifficultyLevel))
  }

  /**
   * Creates a Difficulty from a known valid level.
   * Use this when the level is statically known to be valid.
   */
  static of(level: DifficultyLevel): Difficulty {
    return new Difficulty(level)
  }

  /**
   * Returns the default medium difficulty (3).
   */
  static default(): Difficulty {
    return new Difficulty(3)
  }

  /**
   * Returns the easiest difficulty level (1).
   */
  static easiest(): Difficulty {
    return new Difficulty(1)
  }

  /**
   * Returns the hardest difficulty level (5).
   */
  static hardest(): Difficulty {
    return new Difficulty(5)
  }

  /**
   * The numeric difficulty value (1-5).
   */
  get value(): DifficultyLevel {
    return this.level
  }

  /**
   * Target response time in milliseconds for this difficulty level.
   * Used to calculate speed scores in mastery tracking.
   */
  get targetTimeMs(): number {
    return TARGET_TIMES_MS[this.level]
  }

  /**
   * Human-readable label for this difficulty level.
   */
  get label(): string {
    return DIFFICULTY_LABELS[this.level]
  }

  /**
   * Checks if this difficulty is harder than another.
   */
  isHarderThan(other: Difficulty): boolean {
    return this.level > other.level
  }

  /**
   * Checks if this difficulty is easier than another.
   */
  isEasierThan(other: Difficulty): boolean {
    return this.level < other.level
  }

  /**
   * Checks equality with another Difficulty.
   */
  equals(other: Difficulty): boolean {
    return this.level === other.level
  }

  /**
   * Returns the next harder difficulty level, or this level if already at max.
   */
  harder(): Difficulty {
    if (this.level >= 5) {
      return this
    }
    return new Difficulty((this.level + 1) as DifficultyLevel)
  }

  /**
   * Returns the next easier difficulty level, or this level if already at min.
   */
  easier(): Difficulty {
    if (this.level <= 1) {
      return this
    }
    return new Difficulty((this.level - 1) as DifficultyLevel)
  }

  /**
   * Returns the numeric value as a string.
   */
  toString(): string {
    return String(this.level)
  }
}
