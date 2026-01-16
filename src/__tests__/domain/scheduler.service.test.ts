/**
 * @fileoverview Unit tests for Scheduler domain service (SM-2 algorithm)
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Tests interval calculation, ease factor updates, schedule creation,
 * and overdue detection based on the SM-2 spaced repetition algorithm.
 */

import {
  calculateNextInterval,
  updateEaseFactor,
  scheduleNextReview,
  createInitialSchedule,
  isOverdue,
  getOverdueDays,
} from '../../domain/services/scheduler.service'
import { asConceptId } from '../../shared/types/branded'

import type { ScheduleEntry } from '../../shared/types/core'

describe('Scheduler Service', () => {
  const testConceptId = asConceptId('test-concept-123')

  describe('calculateNextInterval', () => {
    describe('good and easy responses', () => {
      it('should multiply interval by ease factor for good response', () => {
        const result = calculateNextInterval(7, 2.5, 'good')
        expect(result).toBe(17.5)
      })

      it('should multiply interval by ease factor for easy response', () => {
        const result = calculateNextInterval(7, 2.5, 'easy')
        expect(result).toBe(17.5)
      })

      it('should handle fractional intervals correctly', () => {
        const result = calculateNextInterval(3.5, 2.0, 'good')
        expect(result).toBe(7)
      })

      it('should handle minimum ease factor', () => {
        const result = calculateNextInterval(10, 1.3, 'good')
        expect(result).toBe(13)
      })

      it('should handle large intervals', () => {
        const result = calculateNextInterval(100, 2.5, 'easy')
        expect(result).toBe(250)
      })
    })

    describe('hard response', () => {
      it('should use 1.2 multiplier for hard response', () => {
        const result = calculateNextInterval(10, 2.5, 'hard')
        expect(result).toBe(12)
      })

      it('should ignore ease factor for hard response', () => {
        const resultWithHighEase = calculateNextInterval(10, 2.5, 'hard')
        const resultWithLowEase = calculateNextInterval(10, 1.3, 'hard')
        expect(resultWithHighEase).toBe(resultWithLowEase)
        expect(resultWithHighEase).toBe(12)
      })
    })

    describe('again response', () => {
      it('should reset to 1 day for again response', () => {
        const result = calculateNextInterval(30, 2.5, 'again')
        expect(result).toBe(1)
      })

      it('should reset long intervals to 1 day', () => {
        const result = calculateNextInterval(365, 2.5, 'again')
        expect(result).toBe(1)
      })
    })

    describe('minimum interval enforcement', () => {
      it('should never return less than 1 day', () => {
        const result = calculateNextInterval(0.5, 1.3, 'hard')
        expect(result).toBe(1)
      })

      it('should enforce minimum for very small intervals', () => {
        const result = calculateNextInterval(0.1, 1.3, 'good')
        expect(result).toBe(1)
      })

      it('should return exactly 1 for edge case calculations', () => {
        // 0.5 * 1.3 = 0.65, should be clamped to 1
        const result = calculateNextInterval(0.5, 1.3, 'good')
        expect(result).toBe(1)
      })
    })
  })

  describe('updateEaseFactor', () => {
    describe('adjustment values', () => {
      it('should increase by 0.15 for easy response', () => {
        const result = updateEaseFactor(2.0, 'easy')
        expect(result).toBe(2.15)
      })

      it('should not change for good response', () => {
        const result = updateEaseFactor(2.0, 'good')
        expect(result).toBe(2.0)
      })

      it('should decrease by 0.15 for hard response', () => {
        const result = updateEaseFactor(2.0, 'hard')
        expect(result).toBe(1.85)
      })

      it('should decrease by 0.2 for again response', () => {
        const result = updateEaseFactor(2.0, 'again')
        expect(result).toBe(1.8)
      })
    })

    describe('clamping at maximum (2.5)', () => {
      it('should clamp at maximum 2.5 for easy response', () => {
        const result = updateEaseFactor(2.5, 'easy')
        expect(result).toBe(2.5)
      })

      it('should not exceed 2.5 even from high starting point', () => {
        const result = updateEaseFactor(2.4, 'easy')
        expect(result).toBe(2.5)
      })
    })

    describe('clamping at minimum (1.3)', () => {
      it('should clamp at minimum 1.3 for again response', () => {
        const result = updateEaseFactor(1.3, 'again')
        expect(result).toBe(1.3)
      })

      it('should not go below 1.3 even from low starting point', () => {
        const result = updateEaseFactor(1.4, 'again')
        expect(result).toBe(1.3)
      })

      it('should clamp at minimum 1.3 for hard response when close to min', () => {
        const result = updateEaseFactor(1.35, 'hard')
        expect(result).toBe(1.3)
      })
    })

    describe('edge cases', () => {
      it('should handle ease factor at exact minimum', () => {
        const againResult = updateEaseFactor(1.3, 'again')
        const hardResult = updateEaseFactor(1.3, 'hard')
        expect(againResult).toBe(1.3)
        expect(hardResult).toBe(1.3)
      })

      it('should handle ease factor at exact maximum', () => {
        const easyResult = updateEaseFactor(2.5, 'easy')
        const goodResult = updateEaseFactor(2.5, 'good')
        expect(easyResult).toBe(2.5)
        expect(goodResult).toBe(2.5)
      })

      it('should handle consecutive failures gracefully', () => {
        let ease = 2.5
        for (let i = 0; i < 10; i++) {
          ease = updateEaseFactor(ease, 'again')
        }
        expect(ease).toBe(1.3)
      })

      it('should handle consecutive successes gracefully', () => {
        let ease = 1.3
        for (let i = 0; i < 10; i++) {
          ease = updateEaseFactor(ease, 'easy')
        }
        expect(ease).toBe(2.5)
      })
    })
  })

  describe('scheduleNextReview', () => {
    const mockCurrent: ScheduleEntry = {
      conceptId: testConceptId,
      dueAt: new Date('2025-01-15'),
      intervalDays: 7,
      easeFactor: 2.5,
    }

    it('should preserve conceptId', () => {
      const result = scheduleNextReview(mockCurrent, 'good')
      expect(result.conceptId).toBe(mockCurrent.conceptId)
    })

    describe('interval updates', () => {
      it('should update interval based on good result', () => {
        const result = scheduleNextReview(mockCurrent, 'good')
        expect(result.intervalDays).toBe(17.5) // 7 * 2.5
      })

      it('should reset interval for again result', () => {
        const result = scheduleNextReview(mockCurrent, 'again')
        expect(result.intervalDays).toBe(1)
      })

      it('should use hard multiplier for hard result', () => {
        const result = scheduleNextReview(mockCurrent, 'hard')
        expect(result.intervalDays).toBe(8.4) // 7 * 1.2
      })
    })

    describe('ease factor updates', () => {
      it('should not change ease factor for good result', () => {
        const result = scheduleNextReview(mockCurrent, 'good')
        expect(result.easeFactor).toBe(2.5)
      })

      it('should decrease ease factor for again result', () => {
        const result = scheduleNextReview(mockCurrent, 'again')
        expect(result.easeFactor).toBe(2.3) // 2.5 - 0.2
      })

      it('should increase ease factor for easy result', () => {
        const result = scheduleNextReview(mockCurrent, 'easy')
        expect(result.easeFactor).toBe(2.5) // Clamped at max
      })

      it('should decrease ease factor for hard result', () => {
        const result = scheduleNextReview(mockCurrent, 'hard')
        expect(result.easeFactor).toBe(2.35) // 2.5 - 0.15
      })
    })

    describe('due date calculation', () => {
      it('should set dueAt to future date', () => {
        const before = Date.now()
        const result = scheduleNextReview(mockCurrent, 'good')
        expect(result.dueAt.getTime()).toBeGreaterThan(before)
      })

      it('should calculate dueAt based on new interval', () => {
        const before = Date.now()
        const result = scheduleNextReview(mockCurrent, 'good')

        // New interval should be 17.5 days
        const expectedDueTime = before + 17.5 * 24 * 60 * 60 * 1000
        // Allow 1 second tolerance for test execution time
        expect(result.dueAt.getTime()).toBeGreaterThanOrEqual(expectedDueTime - 1000)
        expect(result.dueAt.getTime()).toBeLessThanOrEqual(expectedDueTime + 1000)
      })

      it('should set due date 1 day in future for again result', () => {
        const before = Date.now()
        const result = scheduleNextReview(mockCurrent, 'again')

        const expectedDueTime = before + 1 * 24 * 60 * 60 * 1000
        expect(result.dueAt.getTime()).toBeGreaterThanOrEqual(expectedDueTime - 1000)
        expect(result.dueAt.getTime()).toBeLessThanOrEqual(expectedDueTime + 1000)
      })
    })

    describe('immutability', () => {
      it('should return a new object', () => {
        const result = scheduleNextReview(mockCurrent, 'good')
        expect(result).not.toBe(mockCurrent)
      })

      it('should not modify the input object', () => {
        const originalDueAt = mockCurrent.dueAt
        const originalInterval = mockCurrent.intervalDays
        const originalEase = mockCurrent.easeFactor

        scheduleNextReview(mockCurrent, 'again')

        expect(mockCurrent.dueAt).toBe(originalDueAt)
        expect(mockCurrent.intervalDays).toBe(originalInterval)
        expect(mockCurrent.easeFactor).toBe(originalEase)
      })
    })

    describe('interval and ease factor interaction', () => {
      it('should use new ease factor for interval calculation with good response', () => {
        // For 'good', ease factor doesn't change (adjustment = 0)
        // So interval = 7 * 2.5 = 17.5
        const result = scheduleNextReview(mockCurrent, 'good')
        expect(result.intervalDays).toBe(17.5)
        expect(result.easeFactor).toBe(2.5)
      })

      it('should use updated ease factor for interval calculation after again', () => {
        // For 'again', interval resets to 1 regardless of ease factor
        const result = scheduleNextReview(mockCurrent, 'again')
        expect(result.intervalDays).toBe(1)
        expect(result.easeFactor).toBe(2.3)
      })
    })
  })

  describe('createInitialSchedule', () => {
    it('should set due date to now', () => {
      const before = Date.now()
      const schedule = createInitialSchedule(testConceptId)
      const after = Date.now()

      expect(schedule.dueAt.getTime()).toBeGreaterThanOrEqual(before)
      expect(schedule.dueAt.getTime()).toBeLessThanOrEqual(after)
    })

    it('should set initial interval to 1 day', () => {
      const schedule = createInitialSchedule(testConceptId)
      expect(schedule.intervalDays).toBe(1)
    })

    it('should set default ease factor to 2.5', () => {
      const schedule = createInitialSchedule(testConceptId)
      expect(schedule.easeFactor).toBe(2.5)
    })

    it('should use the provided conceptId', () => {
      const customId = asConceptId('custom-concept-456')
      const schedule = createInitialSchedule(customId)
      expect(schedule.conceptId).toBe(customId)
    })

    it('should return different objects for each call', () => {
      const first = createInitialSchedule(testConceptId)
      const second = createInitialSchedule(testConceptId)
      expect(first).not.toBe(second)
    })

    it('should create schedule that is immediately due', () => {
      const schedule = createInitialSchedule(testConceptId)
      expect(isOverdue(schedule)).toBe(true)
    })
  })

  describe('isOverdue', () => {
    it('should return true for past due date', () => {
      const schedule: ScheduleEntry = {
        conceptId: testConceptId,
        dueAt: new Date(Date.now() - 1000), // 1 second ago
        intervalDays: 1,
        easeFactor: 2.5,
      }
      expect(isOverdue(schedule)).toBe(true)
    })

    it('should return false for future due date', () => {
      const schedule: ScheduleEntry = {
        conceptId: testConceptId,
        dueAt: new Date(Date.now() + 86400000), // 1 day in future
        intervalDays: 1,
        easeFactor: 2.5,
      }
      expect(isOverdue(schedule)).toBe(false)
    })

    it('should return true for due date exactly now', () => {
      const now = new Date()
      const schedule: ScheduleEntry = {
        conceptId: testConceptId,
        dueAt: now,
        intervalDays: 1,
        easeFactor: 2.5,
      }
      // Due at exactly now should be considered overdue (<=)
      expect(isOverdue(schedule)).toBe(true)
    })

    it('should return true for very old due date', () => {
      const schedule: ScheduleEntry = {
        conceptId: testConceptId,
        dueAt: new Date('2020-01-01'),
        intervalDays: 1,
        easeFactor: 2.5,
      }
      expect(isOverdue(schedule)).toBe(true)
    })

    it('should return false for far future due date', () => {
      const schedule: ScheduleEntry = {
        conceptId: testConceptId,
        dueAt: new Date('2099-12-31'),
        intervalDays: 1,
        easeFactor: 2.5,
      }
      expect(isOverdue(schedule)).toBe(false)
    })
  })

  describe('getOverdueDays', () => {
    it('should return 0 for future due date', () => {
      const schedule: ScheduleEntry = {
        conceptId: testConceptId,
        dueAt: new Date(Date.now() + 86400000), // 1 day in future
        intervalDays: 1,
        easeFactor: 2.5,
      }
      expect(getOverdueDays(schedule)).toBe(0)
    })

    it('should return positive number for overdue schedule', () => {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      const schedule: ScheduleEntry = {
        conceptId: testConceptId,
        dueAt: fiveDaysAgo,
        intervalDays: 1,
        easeFactor: 2.5,
      }
      expect(getOverdueDays(schedule)).toBeCloseTo(5, 1)
    })

    it('should return approximately 0 for schedule due exactly now', () => {
      const schedule: ScheduleEntry = {
        conceptId: testConceptId,
        dueAt: new Date(),
        intervalDays: 1,
        easeFactor: 2.5,
      }
      expect(getOverdueDays(schedule)).toBeCloseTo(0, 1)
    })

    it('should handle fractional days correctly', () => {
      const twelvHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000)
      const schedule: ScheduleEntry = {
        conceptId: testConceptId,
        dueAt: twelvHoursAgo,
        intervalDays: 1,
        easeFactor: 2.5,
      }
      expect(getOverdueDays(schedule)).toBeCloseTo(0.5, 1)
    })

    it('should return 0 for far future due date', () => {
      const schedule: ScheduleEntry = {
        conceptId: testConceptId,
        dueAt: new Date('2099-12-31'),
        intervalDays: 1,
        easeFactor: 2.5,
      }
      expect(getOverdueDays(schedule)).toBe(0)
    })

    it('should handle very old due dates', () => {
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      const schedule: ScheduleEntry = {
        conceptId: testConceptId,
        dueAt: oneYearAgo,
        intervalDays: 1,
        easeFactor: 2.5,
      }
      expect(getOverdueDays(schedule)).toBeCloseTo(365, 1)
    })
  })

  describe('integration scenarios', () => {
    describe('learning progression', () => {
      it('should show increasing intervals for consistent good performance', () => {
        let schedule = createInitialSchedule(testConceptId)

        // Simulate 5 consecutive good reviews
        const intervals: number[] = [schedule.intervalDays]
        for (let i = 0; i < 5; i++) {
          schedule = scheduleNextReview(schedule, 'good')
          intervals.push(schedule.intervalDays)
        }

        // Each interval should be larger than the previous
        for (let i = 1; i < intervals.length; i++) {
          const current = intervals[i]
          const previous = intervals[i - 1]
          if (current !== undefined && previous !== undefined) {
            expect(current).toBeGreaterThan(previous)
          }
        }
      })

      it('should show recovery after failure', () => {
        // Start with established schedule
        let schedule: ScheduleEntry = {
          conceptId: testConceptId,
          dueAt: new Date(),
          intervalDays: 30,
          easeFactor: 2.5,
        }

        // Fail once
        schedule = scheduleNextReview(schedule, 'again')
        expect(schedule.intervalDays).toBe(1)
        expect(schedule.easeFactor).toBe(2.3)

        // Recover with good reviews
        schedule = scheduleNextReview(schedule, 'good')
        expect(schedule.intervalDays).toBe(2.3) // 1 * 2.3

        schedule = scheduleNextReview(schedule, 'good')
        expect(schedule.intervalDays).toBeCloseTo(5.29, 1) // 2.3 * 2.3
      })
    })

    describe('ease factor degradation', () => {
      it('should show declining ease factor with struggles', () => {
        let schedule = createInitialSchedule(testConceptId)
        const easeFactors: number[] = [schedule.easeFactor]

        // Simulate struggles (hard responses)
        for (let i = 0; i < 5; i++) {
          schedule = scheduleNextReview(schedule, 'hard')
          easeFactors.push(schedule.easeFactor)
        }

        // Ease factor should decrease with each hard response
        const ef0 = easeFactors[0]
        const ef1 = easeFactors[1]
        const ef2 = easeFactors[2]
        if (ef0 !== undefined && ef1 !== undefined && ef2 !== undefined) {
          expect(ef1).toBeLessThan(ef0)
          expect(ef2).toBeLessThan(ef1)
        }

        // But should never go below 1.3
        const lastEf = easeFactors[easeFactors.length - 1]
        expect(lastEf).toBeGreaterThanOrEqual(1.3)
      })
    })
  })
})
