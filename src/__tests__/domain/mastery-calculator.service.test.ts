/**
 * @fileoverview Unit tests for MasteryCalculator domain service
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Tests EWMA calculations, rating-to-score mapping, speed scoring,
 * mastery updates, and dimension analysis functions.
 */

import {
  updateEwma,
  ratingToScore,
  calculateSpeedScore,
  updateMastery,
  calculateCombinedMastery,
  isFragileConfidence,
  isWeakDimension,
  createInitialMastery,
  MasteryCalculator,
} from '../../domain/services/mastery-calculator.service'

import type { DimensionMastery } from '../../shared/types/core'

describe('MasteryCalculator Service', () => {
  describe('updateEwma', () => {
    describe('basic EWMA formula', () => {
      it('should apply EWMA formula correctly with default alpha', () => {
        // Formula: new = (1 - alpha) * current + alpha * newValue
        // With alpha = 0.15: new = 0.85 * 0.5 + 0.15 * 1.0 = 0.425 + 0.15 = 0.575
        const result = updateEwma(0.5, 1.0)
        expect(result).toBeCloseTo(0.575, 5)
      })

      it('should weight recent values more with higher alpha', () => {
        // With alpha = 0.5: new = 0.5 * 0.5 + 0.5 * 1.0 = 0.25 + 0.5 = 0.75
        const result = updateEwma(0.5, 1.0, 0.5)
        expect(result).toBeCloseTo(0.75, 5)
      })

      it('should weight history more with lower alpha', () => {
        // With alpha = 0.05: new = 0.95 * 0.5 + 0.05 * 1.0 = 0.475 + 0.05 = 0.525
        const result = updateEwma(0.5, 1.0, 0.05)
        expect(result).toBeCloseTo(0.525, 5)
      })

      it('should return current value when alpha is 0', () => {
        // With alpha = 0: new = 1.0 * 0.5 + 0 * 1.0 = 0.5
        const result = updateEwma(0.5, 1.0, 0)
        expect(result).toBeCloseTo(0.5, 5)
      })

      it('should return new value when alpha is 1', () => {
        // With alpha = 1: new = 0 * 0.5 + 1.0 * 1.0 = 1.0
        const result = updateEwma(0.5, 1.0, 1)
        expect(result).toBeCloseTo(1.0, 5)
      })
    })

    describe('clamping behavior', () => {
      it('should clamp result to maximum of 1', () => {
        // Even with extreme inputs, result should never exceed 1
        const result = updateEwma(1, 1, 1)
        expect(result).toBeLessThanOrEqual(1)
      })

      it('should clamp result to minimum of 0', () => {
        // Even with extreme inputs, result should never go below 0
        const result = updateEwma(0, 0, 1)
        expect(result).toBeGreaterThanOrEqual(0)
      })

      it('should clamp negative current values to 0', () => {
        const result = updateEwma(-0.5, 0.5, 0.5)
        expect(result).toBeGreaterThanOrEqual(0)
        expect(result).toBeLessThanOrEqual(1)
      })

      it('should clamp current values above 1 to 1', () => {
        const result = updateEwma(1.5, 0.5, 0.5)
        expect(result).toBeGreaterThanOrEqual(0)
        expect(result).toBeLessThanOrEqual(1)
      })

      it('should clamp negative new values to 0', () => {
        const result = updateEwma(0.5, -0.5, 0.5)
        expect(result).toBeGreaterThanOrEqual(0)
        expect(result).toBeLessThanOrEqual(1)
      })

      it('should clamp new values above 1 to 1', () => {
        const result = updateEwma(0.5, 1.5, 0.5)
        expect(result).toBeGreaterThanOrEqual(0)
        expect(result).toBeLessThanOrEqual(1)
      })

      it('should clamp negative alpha to 0', () => {
        const result = updateEwma(0.5, 1.0, -0.5)
        expect(result).toBeCloseTo(0.5, 5) // Same as alpha = 0
      })

      it('should clamp alpha above 1 to 1', () => {
        const result = updateEwma(0.5, 1.0, 1.5)
        expect(result).toBeCloseTo(1.0, 5) // Same as alpha = 1
      })
    })

    describe('edge cases', () => {
      it('should handle zero current and zero new value', () => {
        const result = updateEwma(0, 0, 0.15)
        expect(result).toBe(0)
      })

      it('should handle perfect scores transitioning to failure', () => {
        const result = updateEwma(1.0, 0, 0.15)
        expect(result).toBeCloseTo(0.85, 5)
      })

      it('should handle failure transitioning to perfect score', () => {
        const result = updateEwma(0, 1.0, 0.15)
        expect(result).toBeCloseTo(0.15, 5)
      })
    })
  })

  describe('ratingToScore', () => {
    it('should return 0 for "again" rating', () => {
      expect(ratingToScore('again')).toBe(0)
    })

    it('should return 0.4 for "hard" rating', () => {
      expect(ratingToScore('hard')).toBe(0.4)
    })

    it('should return 0.7 for "good" rating', () => {
      expect(ratingToScore('good')).toBe(0.7)
    })

    it('should return 1.0 for "easy" rating', () => {
      expect(ratingToScore('easy')).toBe(1.0)
    })

    it('should return scores in ascending order from again to easy', () => {
      const scores = [
        ratingToScore('again'),
        ratingToScore('hard'),
        ratingToScore('good'),
        ratingToScore('easy'),
      ]
      for (let i = 0; i < scores.length - 1; i++) {
        const current = scores[i]
        const next = scores[i + 1]
        if (current !== undefined && next !== undefined) {
          expect(current).toBeLessThan(next)
        }
      }
    })
  })

  describe('calculateSpeedScore', () => {
    describe('difficulty level 1 (target: 5000ms)', () => {
      it('should return 1.0 for instant response', () => {
        expect(calculateSpeedScore(0, 1)).toBe(1.0)
      })

      it('should return 0.5 for response at target time', () => {
        expect(calculateSpeedScore(5000, 1)).toBe(0.5)
      })

      it('should return 0 for response at 2x target time', () => {
        expect(calculateSpeedScore(10000, 1)).toBe(0)
      })

      it('should return 0 for response beyond 2x target time', () => {
        expect(calculateSpeedScore(15000, 1)).toBe(0)
      })

      it('should return score between 0.5 and 1.0 for faster than target', () => {
        const result = calculateSpeedScore(2500, 1)
        expect(result).toBeCloseTo(0.75, 5)
      })
    })

    describe('difficulty level 2 (target: 10000ms)', () => {
      it('should return 0.5 for response at target time', () => {
        expect(calculateSpeedScore(10000, 2)).toBe(0.5)
      })

      it('should return 0 for response at 2x target time', () => {
        expect(calculateSpeedScore(20000, 2)).toBe(0)
      })
    })

    describe('difficulty level 3 (target: 20000ms)', () => {
      it('should return 0.5 for response at target time', () => {
        expect(calculateSpeedScore(20000, 3)).toBe(0.5)
      })

      it('should return 0 for response at 2x target time', () => {
        expect(calculateSpeedScore(40000, 3)).toBe(0)
      })
    })

    describe('difficulty level 4 (target: 40000ms)', () => {
      it('should return 0.5 for response at target time', () => {
        expect(calculateSpeedScore(40000, 4)).toBe(0.5)
      })

      it('should return 0 for response at 2x target time', () => {
        expect(calculateSpeedScore(80000, 4)).toBe(0)
      })
    })

    describe('difficulty level 5 (target: 60000ms)', () => {
      it('should return 0.5 for response at target time', () => {
        expect(calculateSpeedScore(60000, 5)).toBe(0.5)
      })

      it('should return 0 for response at 2x target time', () => {
        expect(calculateSpeedScore(120000, 5)).toBe(0)
      })
    })

    describe('scaling with difficulty', () => {
      it('should allow more time for harder difficulties', () => {
        const time = 15000 // 15 seconds
        const scoreLevel1 = calculateSpeedScore(time, 1) // target 5s
        const scoreLevel3 = calculateSpeedScore(time, 3) // target 20s
        const scoreLevel5 = calculateSpeedScore(time, 5) // target 60s

        expect(scoreLevel1).toBe(0) // 3x target, clamped to 0
        expect(scoreLevel3).toBeCloseTo(0.625, 5) // 0.75x target
        expect(scoreLevel5).toBeCloseTo(0.875, 5) // 0.25x target
      })
    })
  })

  describe('updateMastery', () => {
    const initialMastery: DimensionMastery = {
      accuracyEwma: 0.5,
      speedEwma: 0.5,
      recentCount: 0,
    }

    it('should return a new immutable object', () => {
      const result = updateMastery(initialMastery, 'good', 5000, 1)
      expect(result).not.toBe(initialMastery)
    })

    it('should increment recentCount by 1', () => {
      const result = updateMastery(initialMastery, 'good', 5000, 1)
      expect(result.recentCount).toBe(1)
    })

    it('should update accuracy based on rating', () => {
      const goodResult = updateMastery(initialMastery, 'good', 5000, 1)
      const easyResult = updateMastery(initialMastery, 'easy', 5000, 1)
      const againResult = updateMastery(initialMastery, 'again', 5000, 1)

      // good = 0.7, so accuracy increases toward 0.7
      expect(goodResult.accuracyEwma).toBeGreaterThan(initialMastery.accuracyEwma)

      // easy = 1.0, increases even more
      expect(easyResult.accuracyEwma).toBeGreaterThan(goodResult.accuracyEwma)

      // again = 0, decreases accuracy
      expect(againResult.accuracyEwma).toBeLessThan(initialMastery.accuracyEwma)
    })

    it('should update speed based on response time and difficulty', () => {
      // Fast response (0ms) at difficulty 1 should give speed score of 1.0
      const fastResult = updateMastery(initialMastery, 'good', 0, 1)
      expect(fastResult.speedEwma).toBeGreaterThan(initialMastery.speedEwma)

      // Slow response (10s at difficulty 1, which is 2x target) should give speed score of 0
      const slowResult = updateMastery(initialMastery, 'good', 10000, 1)
      expect(slowResult.speedEwma).toBeLessThan(initialMastery.speedEwma)
    })

    it('should handle consecutive reviews correctly', () => {
      let mastery = initialMastery

      // Simulate 3 consecutive "easy" reviews with fast responses
      for (let i = 0; i < 3; i++) {
        mastery = updateMastery(mastery, 'easy', 1000, 1)
      }

      expect(mastery.recentCount).toBe(3)
      expect(mastery.accuracyEwma).toBeGreaterThan(initialMastery.accuracyEwma)
      expect(mastery.speedEwma).toBeGreaterThan(initialMastery.speedEwma)
    })

    it('should show declining mastery after failures', () => {
      let mastery: DimensionMastery = {
        accuracyEwma: 0.9,
        speedEwma: 0.8,
        recentCount: 10,
      }

      // Simulate 3 consecutive failures with slow responses
      for (let i = 0; i < 3; i++) {
        mastery = updateMastery(mastery, 'again', 15000, 1)
      }

      expect(mastery.accuracyEwma).toBeLessThan(0.9)
      expect(mastery.speedEwma).toBeLessThan(0.8)
    })
  })

  describe('calculateCombinedMastery', () => {
    it('should weight accuracy at 70% and speed at 30%', () => {
      const mastery: DimensionMastery = {
        accuracyEwma: 1.0,
        speedEwma: 0,
        recentCount: 5,
      }
      // Combined = 0.7 * 1.0 + 0.3 * 0 = 0.7
      expect(calculateCombinedMastery(mastery)).toBe(0.7)
    })

    it('should return 1.0 for perfect mastery', () => {
      const mastery: DimensionMastery = {
        accuracyEwma: 1.0,
        speedEwma: 1.0,
        recentCount: 5,
      }
      expect(calculateCombinedMastery(mastery)).toBe(1.0)
    })

    it('should return 0 for zero mastery', () => {
      const mastery: DimensionMastery = {
        accuracyEwma: 0,
        speedEwma: 0,
        recentCount: 5,
      }
      expect(calculateCombinedMastery(mastery)).toBe(0)
    })

    it('should return 0.5 for neutral mastery', () => {
      const mastery: DimensionMastery = {
        accuracyEwma: 0.5,
        speedEwma: 0.5,
        recentCount: 0,
      }
      // Combined = 0.7 * 0.5 + 0.3 * 0.5 = 0.35 + 0.15 = 0.5
      expect(calculateCombinedMastery(mastery)).toBe(0.5)
    })

    it('should handle asymmetric accuracy and speed', () => {
      const mastery: DimensionMastery = {
        accuracyEwma: 0.8,
        speedEwma: 0.4,
        recentCount: 5,
      }
      // Combined = 0.7 * 0.8 + 0.3 * 0.4 = 0.56 + 0.12 = 0.68
      expect(calculateCombinedMastery(mastery)).toBeCloseTo(0.68, 5)
    })
  })

  describe('isFragileConfidence', () => {
    it('should return true when accuracy > 0.7 and speed < 0.5', () => {
      const fragile: DimensionMastery = {
        accuracyEwma: 0.8,
        speedEwma: 0.4,
        recentCount: 5,
      }
      expect(isFragileConfidence(fragile)).toBe(true)
    })

    it('should return false when accuracy is not high enough', () => {
      const mastery: DimensionMastery = {
        accuracyEwma: 0.7, // Not > 0.7
        speedEwma: 0.4,
        recentCount: 5,
      }
      expect(isFragileConfidence(mastery)).toBe(false)
    })

    it('should return false when speed is not low enough', () => {
      const mastery: DimensionMastery = {
        accuracyEwma: 0.9,
        speedEwma: 0.5, // Not < 0.5
        recentCount: 5,
      }
      expect(isFragileConfidence(mastery)).toBe(false)
    })

    it('should return false for balanced high mastery', () => {
      const balanced: DimensionMastery = {
        accuracyEwma: 0.9,
        speedEwma: 0.9,
        recentCount: 10,
      }
      expect(isFragileConfidence(balanced)).toBe(false)
    })

    it('should return false for low accuracy regardless of speed', () => {
      const lowAccuracy: DimensionMastery = {
        accuracyEwma: 0.3,
        speedEwma: 0.2,
        recentCount: 5,
      }
      expect(isFragileConfidence(lowAccuracy)).toBe(false)
    })

    it('should detect fragile confidence at boundary (accuracy 0.71, speed 0.49)', () => {
      const boundary: DimensionMastery = {
        accuracyEwma: 0.71,
        speedEwma: 0.49,
        recentCount: 5,
      }
      expect(isFragileConfidence(boundary)).toBe(true)
    })
  })

  describe('isWeakDimension', () => {
    it('should return true when combined mastery is below default threshold (0.7)', () => {
      const weak: DimensionMastery = {
        accuracyEwma: 0.6,
        speedEwma: 0.6,
        recentCount: 5,
      }
      // Combined = 0.7 * 0.6 + 0.3 * 0.6 = 0.42 + 0.18 = 0.6 < 0.7
      expect(isWeakDimension(weak)).toBe(true)
    })

    it('should return false when combined mastery meets threshold', () => {
      const strong: DimensionMastery = {
        accuracyEwma: 0.8,
        speedEwma: 0.8,
        recentCount: 5,
      }
      // Combined = 0.7 * 0.8 + 0.3 * 0.8 = 0.56 + 0.24 = 0.8 >= 0.7
      expect(isWeakDimension(strong)).toBe(false)
    })

    it('should use custom threshold when provided', () => {
      const mastery: DimensionMastery = {
        accuracyEwma: 0.8,
        speedEwma: 0.8,
        recentCount: 5,
      }
      // Combined = 0.8, but threshold is 0.9
      expect(isWeakDimension(mastery, 0.9)).toBe(true)
    })

    it('should return false for perfect mastery', () => {
      const perfect: DimensionMastery = {
        accuracyEwma: 1.0,
        speedEwma: 1.0,
        recentCount: 10,
      }
      expect(isWeakDimension(perfect)).toBe(false)
    })

    it('should return true for zero mastery', () => {
      const zero: DimensionMastery = {
        accuracyEwma: 0,
        speedEwma: 0,
        recentCount: 0,
      }
      expect(isWeakDimension(zero)).toBe(true)
    })

    it('should handle threshold exactly at combined mastery', () => {
      const mastery: DimensionMastery = {
        accuracyEwma: 1.0,
        speedEwma: 0,
        recentCount: 5,
      }
      // Combined = 0.7 * 1.0 + 0.3 * 0 = 0.7
      // Threshold = 0.7, combined < 0.7 should return true but combined = 0.7
      expect(isWeakDimension(mastery, 0.7)).toBe(false) // 0.7 is not < 0.7
    })
  })

  describe('createInitialMastery', () => {
    it('should return default mastery with accuracyEwma of 0.5', () => {
      const initial = createInitialMastery()
      expect(initial.accuracyEwma).toBe(0.5)
    })

    it('should return default mastery with speedEwma of 0.5', () => {
      const initial = createInitialMastery()
      expect(initial.speedEwma).toBe(0.5)
    })

    it('should return default mastery with recentCount of 0', () => {
      const initial = createInitialMastery()
      expect(initial.recentCount).toBe(0)
    })

    it('should return a new object each time', () => {
      const first = createInitialMastery()
      const second = createInitialMastery()
      expect(first).not.toBe(second)
    })
  })

  describe('MasteryCalculator namespace', () => {
    it('should expose all public functions', () => {
      expect(MasteryCalculator.updateEwma).toBe(updateEwma)
      expect(MasteryCalculator.ratingToScore).toBe(ratingToScore)
      expect(MasteryCalculator.calculateSpeedScore).toBe(calculateSpeedScore)
      expect(MasteryCalculator.updateMastery).toBe(updateMastery)
      expect(MasteryCalculator.calculateCombinedMastery).toBe(calculateCombinedMastery)
      expect(MasteryCalculator.isFragileConfidence).toBe(isFragileConfidence)
      expect(MasteryCalculator.isWeakDimension).toBe(isWeakDimension)
      expect(MasteryCalculator.createInitialMastery).toBe(createInitialMastery)
    })

    it('should expose constants', () => {
      expect(MasteryCalculator.constants.DEFAULT_ALPHA).toBe(0.15)
      expect(MasteryCalculator.constants.DEFAULT_WEAK_THRESHOLD).toBe(0.7)
      expect(MasteryCalculator.constants.ACCURACY_WEIGHT).toBe(0.7)
      expect(MasteryCalculator.constants.SPEED_WEIGHT).toBe(0.3)
      expect(MasteryCalculator.constants.TARGET_TIMES_MS).toEqual({
        1: 5000,
        2: 10000,
        3: 20000,
        4: 40000,
        5: 60000,
      })
      expect(MasteryCalculator.constants.RATING_SCORES).toEqual({
        again: 0,
        hard: 0.4,
        good: 0.7,
        easy: 1.0,
      })
    })
  })
})
