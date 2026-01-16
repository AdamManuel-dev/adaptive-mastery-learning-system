/**
 * @fileoverview SM-2 spaced repetition scheduler domain service
 * @lastmodified 2025-01-16T00:00:00Z
 *
 * Implements the SM-2 (SuperMemo 2) algorithm for scheduling concept reviews.
 * This is a pure domain service with no side effects - all functions operate
 * on immutable data and return new values.
 *
 * SM-2 Algorithm Overview:
 * - Ease factor ranges from 1.3 to 2.5 (default 2.5)
 * - Interval = previous interval * ease factor (for successful recalls)
 * - Failed recalls reset interval to 1 day
 * - Ease factor adjusts based on response quality
 *
 * Main APIs: calculateNextInterval, updateEaseFactor, scheduleNextReview
 * Constraints: Pure functions, no database calls, TypeScript strict mode
 * Patterns: Functional programming, immutable data structures
 */

import type { ConceptId } from '../../shared/types/branded';
import type { ReviewResultType, ScheduleEntry } from '../../shared/types/core';

/**
 * SM-2 algorithm constants.
 * These values are standard SM-2 parameters that have been empirically validated.
 */
const SM2_CONSTANTS = {
  /** Minimum ease factor to prevent intervals from becoming too short */
  MIN_EASE_FACTOR: 1.3,
  /** Maximum ease factor to prevent intervals from becoming too long */
  MAX_EASE_FACTOR: 2.5,
  /** Default ease factor for new concepts */
  DEFAULT_EASE_FACTOR: 2.5,
  /** Minimum interval in days (never schedule sooner than this) */
  MIN_INTERVAL_DAYS: 1,
  /** Default starting interval for new concepts */
  DEFAULT_INTERVAL_DAYS: 1,
  /** Interval multiplier for 'hard' responses */
  HARD_INTERVAL_MULTIPLIER: 1.2,
} as const;

/**
 * Ease factor adjustments for each response type.
 * Based on SM-2 algorithm recommendations.
 */
const EASE_ADJUSTMENTS: Record<ReviewResultType, number> = {
  easy: 0.15,
  good: 0,
  hard: -0.15,
  again: -0.2,
};

/**
 * Calculates the next review interval in days based on the SM-2 algorithm.
 *
 * The interval calculation follows these rules:
 * - 'easy' or 'good': interval = currentInterval * easeFactor
 * - 'hard': interval = currentInterval * 1.2 (smaller increase)
 * - 'again': reset to 1 day (failed recall)
 *
 * @param currentInterval - Current interval in days
 * @param easeFactor - Current ease factor (1.3-2.5)
 * @param result - User's response quality
 * @returns New interval in days (minimum 1)
 *
 * @example
 * // Successful review with default ease factor
 * calculateNextInterval(7, 2.5, 'good') // Returns 17.5 (7 * 2.5)
 *
 * @example
 * // Failed review resets to 1 day
 * calculateNextInterval(30, 2.5, 'again') // Returns 1
 *
 * @example
 * // Hard response uses smaller multiplier
 * calculateNextInterval(10, 2.5, 'hard') // Returns 12 (10 * 1.2)
 */
export function calculateNextInterval(
  currentInterval: number,
  easeFactor: number,
  result: ReviewResultType
): number {
  let newInterval: number;

  switch (result) {
    case 'again':
      // Failed recall - reset to minimum interval
      newInterval = SM2_CONSTANTS.MIN_INTERVAL_DAYS;
      break;
    case 'hard':
      // Difficult but successful - use smaller multiplier
      newInterval = currentInterval * SM2_CONSTANTS.HARD_INTERVAL_MULTIPLIER;
      break;
    case 'good':
    case 'easy':
      // Successful recall - use full ease factor
      newInterval = currentInterval * easeFactor;
      break;
  }

  // Ensure minimum interval is respected
  return Math.max(newInterval, SM2_CONSTANTS.MIN_INTERVAL_DAYS);
}

/**
 * Updates the ease factor based on the review result.
 *
 * The ease factor determines how quickly intervals grow. Higher values
 * mean longer intervals between reviews. The SM-2 algorithm adjusts
 * this factor based on response quality to optimize review scheduling.
 *
 * Adjustments:
 * - 'easy': +0.15 (responses are getting easier)
 * - 'good': no change (performing as expected)
 * - 'hard': -0.15 (struggling but succeeding)
 * - 'again': -0.2 (failed recall)
 *
 * @param current - Current ease factor
 * @param result - User's response quality
 * @returns New ease factor, clamped between 1.3 and 2.5
 *
 * @example
 * // Easy response increases ease factor
 * updateEaseFactor(2.5, 'easy') // Returns 2.5 (capped at max)
 *
 * @example
 * // Failed recall decreases ease factor
 * updateEaseFactor(2.0, 'again') // Returns 1.8 (2.0 - 0.2)
 *
 * @example
 * // Ease factor cannot go below minimum
 * updateEaseFactor(1.4, 'again') // Returns 1.3 (clamped at min)
 */
export function updateEaseFactor(
  current: number,
  result: ReviewResultType
): number {
  const adjustment = EASE_ADJUSTMENTS[result];
  const newEaseFactor = current + adjustment;

  // Clamp between minimum and maximum
  return Math.max(
    SM2_CONSTANTS.MIN_EASE_FACTOR,
    Math.min(SM2_CONSTANTS.MAX_EASE_FACTOR, newEaseFactor)
  );
}

/**
 * Schedules the next review for a concept based on review results.
 *
 * This is the main scheduling function that combines interval calculation
 * and ease factor updates to produce a new schedule entry. The function
 * is pure - it creates a new ScheduleEntry without modifying the input.
 *
 * @param current - Current schedule entry for the concept
 * @param result - User's response quality from the review
 * @returns New ScheduleEntry with updated interval, ease factor, and due date
 *
 * @example
 * const current: ScheduleEntry = {
 *   conceptId: asConceptId('abc-123'),
 *   dueAt: new Date('2025-01-15'),
 *   intervalDays: 7,
 *   easeFactor: 2.5,
 * };
 *
 * const updated = scheduleNextReview(current, 'good');
 * // updated.intervalDays === 17.5 (7 * 2.5)
 * // updated.dueAt === new Date() + 17.5 days
 * // updated.easeFactor === 2.5 (unchanged for 'good')
 *
 * @example
 * // Failed review resets interval but keeps same concept
 * const failed = scheduleNextReview(current, 'again');
 * // failed.intervalDays === 1
 * // failed.dueAt === new Date() + 1 day
 * // failed.easeFactor === 2.3 (2.5 - 0.2)
 */
export function scheduleNextReview(
  current: ScheduleEntry,
  result: ReviewResultType
): ScheduleEntry {
  const newEaseFactor = updateEaseFactor(current.easeFactor, result);
  const newInterval = calculateNextInterval(
    current.intervalDays,
    newEaseFactor,
    result
  );

  // Calculate new due date from now
  const now = new Date();
  const dueAt = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);

  return {
    conceptId: current.conceptId,
    dueAt,
    intervalDays: newInterval,
    easeFactor: newEaseFactor,
  };
}

/**
 * Creates an initial schedule entry for a new concept.
 *
 * New concepts are due immediately (now) with default SM-2 parameters.
 * This ensures new material enters the review queue right away.
 *
 * @param conceptId - The concept to create a schedule for
 * @returns Initial ScheduleEntry with default values
 *
 * @example
 * const schedule = createInitialSchedule(asConceptId('new-concept-123'));
 * // schedule.dueAt === now
 * // schedule.intervalDays === 1
 * // schedule.easeFactor === 2.5
 */
export function createInitialSchedule(conceptId: ConceptId): ScheduleEntry {
  return {
    conceptId,
    dueAt: new Date(),
    intervalDays: SM2_CONSTANTS.DEFAULT_INTERVAL_DAYS,
    easeFactor: SM2_CONSTANTS.DEFAULT_EASE_FACTOR,
  };
}

/**
 * Checks if a schedule entry is overdue for review.
 *
 * A concept is overdue if its due date has passed. This is used
 * to prioritize cards in the review queue.
 *
 * @param schedule - The schedule entry to check
 * @returns true if the due date has passed, false otherwise
 *
 * @example
 * const overdueSchedule: ScheduleEntry = {
 *   conceptId: asConceptId('abc'),
 *   dueAt: new Date('2025-01-01'), // In the past
 *   intervalDays: 7,
 *   easeFactor: 2.5,
 * };
 * isOverdue(overdueSchedule) // Returns true
 *
 * @example
 * const futureSchedule: ScheduleEntry = {
 *   conceptId: asConceptId('xyz'),
 *   dueAt: new Date('2099-12-31'), // In the future
 *   intervalDays: 7,
 *   easeFactor: 2.5,
 * };
 * isOverdue(futureSchedule) // Returns false
 */
export function isOverdue(schedule: ScheduleEntry): boolean {
  return schedule.dueAt.getTime() <= Date.now();
}

/**
 * Calculates how many days overdue a schedule entry is.
 *
 * Returns 0 if the schedule is not overdue (due date is in the future).
 * This metric can be used to prioritize severely overdue cards.
 *
 * @param schedule - The schedule entry to check
 * @returns Number of days overdue (0 if not overdue, always non-negative)
 *
 * @example
 * // 5 days overdue
 * const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
 * const overdueSchedule: ScheduleEntry = {
 *   conceptId: asConceptId('abc'),
 *   dueAt: fiveDaysAgo,
 *   intervalDays: 7,
 *   easeFactor: 2.5,
 * };
 * getOverdueDays(overdueSchedule) // Returns approximately 5
 *
 * @example
 * // Not overdue (due in the future)
 * const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
 * const futureSchedule: ScheduleEntry = {
 *   conceptId: asConceptId('xyz'),
 *   dueAt: tomorrow,
 *   intervalDays: 7,
 *   easeFactor: 2.5,
 * };
 * getOverdueDays(futureSchedule) // Returns 0
 */
export function getOverdueDays(schedule: ScheduleEntry): number {
  const now = Date.now();
  const dueTime = schedule.dueAt.getTime();
  const overdueMs = now - dueTime;

  if (overdueMs <= 0) {
    return 0;
  }

  // Convert milliseconds to days
  const msPerDay = 24 * 60 * 60 * 1000;
  return overdueMs / msPerDay;
}

/*
 * ============================================================================
 * TEST CASES (for reference - implement with Jest/Vitest)
 * ============================================================================
 *
 * describe('calculateNextInterval', () => {
 *   it('should multiply interval by ease factor for good response', () => {
 *     expect(calculateNextInterval(7, 2.5, 'good')).toBe(17.5);
 *   });
 *
 *   it('should multiply interval by ease factor for easy response', () => {
 *     expect(calculateNextInterval(7, 2.5, 'easy')).toBe(17.5);
 *   });
 *
 *   it('should use 1.2 multiplier for hard response', () => {
 *     expect(calculateNextInterval(10, 2.5, 'hard')).toBe(12);
 *   });
 *
 *   it('should reset to 1 day for again response', () => {
 *     expect(calculateNextInterval(30, 2.5, 'again')).toBe(1);
 *   });
 *
 *   it('should never return less than 1 day', () => {
 *     expect(calculateNextInterval(0.5, 1.3, 'hard')).toBe(1);
 *   });
 * });
 *
 * describe('updateEaseFactor', () => {
 *   it('should increase by 0.15 for easy response', () => {
 *     expect(updateEaseFactor(2.0, 'easy')).toBe(2.15);
 *   });
 *
 *   it('should not change for good response', () => {
 *     expect(updateEaseFactor(2.0, 'good')).toBe(2.0);
 *   });
 *
 *   it('should decrease by 0.15 for hard response', () => {
 *     expect(updateEaseFactor(2.0, 'hard')).toBe(1.85);
 *   });
 *
 *   it('should decrease by 0.2 for again response', () => {
 *     expect(updateEaseFactor(2.0, 'again')).toBe(1.8);
 *   });
 *
 *   it('should clamp at maximum 2.5', () => {
 *     expect(updateEaseFactor(2.5, 'easy')).toBe(2.5);
 *   });
 *
 *   it('should clamp at minimum 1.3', () => {
 *     expect(updateEaseFactor(1.3, 'again')).toBe(1.3);
 *   });
 * });
 *
 * describe('scheduleNextReview', () => {
 *   const mockCurrent: ScheduleEntry = {
 *     conceptId: 'test-concept' as ConceptId,
 *     dueAt: new Date('2025-01-15'),
 *     intervalDays: 7,
 *     easeFactor: 2.5,
 *   };
 *
 *   it('should preserve conceptId', () => {
 *     const result = scheduleNextReview(mockCurrent, 'good');
 *     expect(result.conceptId).toBe(mockCurrent.conceptId);
 *   });
 *
 *   it('should update interval based on result', () => {
 *     const result = scheduleNextReview(mockCurrent, 'good');
 *     expect(result.intervalDays).toBe(17.5);
 *   });
 *
 *   it('should update ease factor based on result', () => {
 *     const result = scheduleNextReview(mockCurrent, 'again');
 *     expect(result.easeFactor).toBe(2.3);
 *   });
 *
 *   it('should set dueAt to future date', () => {
 *     const result = scheduleNextReview(mockCurrent, 'good');
 *     expect(result.dueAt.getTime()).toBeGreaterThan(Date.now());
 *   });
 * });
 *
 * describe('createInitialSchedule', () => {
 *   it('should set due date to now', () => {
 *     const before = Date.now();
 *     const schedule = createInitialSchedule('test' as ConceptId);
 *     const after = Date.now();
 *     expect(schedule.dueAt.getTime()).toBeGreaterThanOrEqual(before);
 *     expect(schedule.dueAt.getTime()).toBeLessThanOrEqual(after);
 *   });
 *
 *   it('should set initial interval to 1 day', () => {
 *     const schedule = createInitialSchedule('test' as ConceptId);
 *     expect(schedule.intervalDays).toBe(1);
 *   });
 *
 *   it('should set default ease factor to 2.5', () => {
 *     const schedule = createInitialSchedule('test' as ConceptId);
 *     expect(schedule.easeFactor).toBe(2.5);
 *   });
 * });
 *
 * describe('isOverdue', () => {
 *   it('should return true for past due date', () => {
 *     const schedule: ScheduleEntry = {
 *       conceptId: 'test' as ConceptId,
 *       dueAt: new Date(Date.now() - 1000),
 *       intervalDays: 1,
 *       easeFactor: 2.5,
 *     };
 *     expect(isOverdue(schedule)).toBe(true);
 *   });
 *
 *   it('should return false for future due date', () => {
 *     const schedule: ScheduleEntry = {
 *       conceptId: 'test' as ConceptId,
 *       dueAt: new Date(Date.now() + 86400000),
 *       intervalDays: 1,
 *       easeFactor: 2.5,
 *     };
 *     expect(isOverdue(schedule)).toBe(false);
 *   });
 *
 *   it('should return true for due date exactly now', () => {
 *     const schedule: ScheduleEntry = {
 *       conceptId: 'test' as ConceptId,
 *       dueAt: new Date(),
 *       intervalDays: 1,
 *       easeFactor: 2.5,
 *     };
 *     expect(isOverdue(schedule)).toBe(true);
 *   });
 * });
 *
 * describe('getOverdueDays', () => {
 *   it('should return 0 for future due date', () => {
 *     const schedule: ScheduleEntry = {
 *       conceptId: 'test' as ConceptId,
 *       dueAt: new Date(Date.now() + 86400000),
 *       intervalDays: 1,
 *       easeFactor: 2.5,
 *     };
 *     expect(getOverdueDays(schedule)).toBe(0);
 *   });
 *
 *   it('should return positive number for overdue schedule', () => {
 *     const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
 *     const schedule: ScheduleEntry = {
 *       conceptId: 'test' as ConceptId,
 *       dueAt: fiveDaysAgo,
 *       intervalDays: 1,
 *       easeFactor: 2.5,
 *     };
 *     expect(getOverdueDays(schedule)).toBeCloseTo(5, 1);
 *   });
 *
 *   it('should return 0 for schedule due exactly now', () => {
 *     const schedule: ScheduleEntry = {
 *       conceptId: 'test' as ConceptId,
 *       dueAt: new Date(),
 *       intervalDays: 1,
 *       easeFactor: 2.5,
 *     };
 *     expect(getOverdueDays(schedule)).toBeCloseTo(0, 1);
 *   });
 * });
 */
