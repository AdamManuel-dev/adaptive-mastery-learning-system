/**
 * @fileoverview ReviewResult value object for flashcard review ratings
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Four rating levels (again/hard/good/easy), score conversion, pass detection
 * Main APIs: ReviewResult.fromString(), toScore(), isPass(), static constants
 * Constraints: Immutable, only four valid rating types
 * Patterns: Value object with singleton instances for each rating
 */

import { ValidationError } from '../../shared/errors'
import { Result } from '../../shared/utils/result'

/**
 * The four possible review ratings.
 */
export const ReviewRating = {
  AGAIN: 'again',
  HARD: 'hard',
  GOOD: 'good',
  EASY: 'easy',
} as const

export type ReviewRatingValue = (typeof ReviewRating)[keyof typeof ReviewRating]

/**
 * Score values for each rating, used in mastery calculations.
 * From MVP spec: again=0, hard=0.4, good=0.7, easy=1.0
 */
const RATING_SCORES: Record<ReviewRatingValue, number> = {
  [ReviewRating.AGAIN]: 0.0,
  [ReviewRating.HARD]: 0.4,
  [ReviewRating.GOOD]: 0.7,
  [ReviewRating.EASY]: 1.0,
}

/**
 * Ratings that count as a "pass" (successful recall).
 */
const PASSING_RATINGS = new Set<ReviewRatingValue>([ReviewRating.GOOD, ReviewRating.EASY])

/**
 * Valid rating strings for validation.
 */
const VALID_RATINGS = new Set<string>(Object.values(ReviewRating))

/**
 * Represents the result of reviewing a flashcard.
 * Immutable value object that encapsulates the user's self-assessment.
 */
export class ReviewResult {
  /**
   * Complete failure to recall - restart learning.
   */
  static readonly AGAIN = new ReviewResult(ReviewRating.AGAIN)

  /**
   * Recalled with significant difficulty.
   */
  static readonly HARD = new ReviewResult(ReviewRating.HARD)

  /**
   * Recalled correctly with acceptable effort.
   */
  static readonly GOOD = new ReviewResult(ReviewRating.GOOD)

  /**
   * Recalled instantly and effortlessly.
   */
  static readonly EASY = new ReviewResult(ReviewRating.EASY)

  private constructor(private readonly rating: ReviewRatingValue) {}

  /**
   * Creates a ReviewResult from a string value.
   * Returns a ValidationError if the string is not a valid rating.
   */
  static fromString(value: string): Result<ReviewResult, ValidationError> {
    const normalized = value.toLowerCase().trim()

    if (!VALID_RATINGS.has(normalized)) {
      return Result.err(
        new ValidationError(
          `Invalid review result: "${value}". Valid results are: ${Array.from(VALID_RATINGS).join(', ')}`
        )
      )
    }

    return Result.ok(ReviewResult.of(normalized as ReviewRatingValue))
  }

  /**
   * Gets the singleton instance for a known valid rating.
   */
  static of(rating: ReviewRatingValue): ReviewResult {
    switch (rating) {
      case ReviewRating.AGAIN:
        return ReviewResult.AGAIN
      case ReviewRating.HARD:
        return ReviewResult.HARD
      case ReviewRating.GOOD:
        return ReviewResult.GOOD
      case ReviewRating.EASY:
        return ReviewResult.EASY
    }
  }

  /**
   * Returns all possible review results.
   */
  static all(): ReviewResult[] {
    return [ReviewResult.AGAIN, ReviewResult.HARD, ReviewResult.GOOD, ReviewResult.EASY]
  }

  /**
   * The raw rating value.
   */
  get value(): ReviewRatingValue {
    return this.rating
  }

  /**
   * Converts the rating to a numeric score for mastery calculations.
   * Returns: again=0.0, hard=0.4, good=0.7, easy=1.0
   */
  toScore(): number {
    return RATING_SCORES[this.rating]
  }

  /**
   * Checks if this result counts as a pass (good or easy).
   * Used for streak tracking and anti-frustration logic.
   */
  isPass(): boolean {
    return PASSING_RATINGS.has(this.rating)
  }

  /**
   * Checks if this result is a failure (again).
   * Used for anti-frustration tracking.
   */
  isFailure(): boolean {
    return this.rating === ReviewRating.AGAIN
  }

  /**
   * Checks if this result indicates struggle (again or hard).
   */
  isStruggle(): boolean {
    return this.rating === ReviewRating.AGAIN || this.rating === ReviewRating.HARD
  }

  /**
   * Checks equality with another ReviewResult.
   */
  equals(other: ReviewResult): boolean {
    return this.rating === other.rating
  }

  /**
   * Returns the string representation of the rating.
   */
  toString(): string {
    return this.rating
  }
}
