/**
 * @fileoverview IPC handlers for mastery operations
 * @lastmodified 2025-01-16T00:00:00Z
 *
 * Features: Mastery profile retrieval, dimension-specific mastery
 * Main APIs: registerMasteryHandlers()
 * Constraints: Stub implementations until repository is connected
 * Patterns: Handler registration with error handling wrapper
 */

import { registerHandler } from './index'

import type {
  MasteryProfileDTO,
  MasteryDTO,
  Dimension,
} from '../../shared/types/ipc'

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const ALL_DIMENSIONS: Dimension[] = [
  'definition',
  'paraphrase',
  'example',
  'scenario',
  'discrimination',
  'cloze',
]

const DEFAULT_MASTERY: MasteryDTO = {
  dimension: 'definition',
  accuracyEwma: 0.5,
  speedEwma: 0.5,
  count: 0,
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Calculates combined mastery score (70% accuracy, 30% speed)
 */
function getMasteryScore(mastery: MasteryDTO): number {
  return 0.7 * mastery.accuracyEwma + 0.3 * mastery.speedEwma
}

/**
 * Creates default mastery data for all dimensions
 */
function createDefaultMasterySet(): MasteryDTO[] {
  return ALL_DIMENSIONS.map((dimension) => ({
    ...DEFAULT_MASTERY,
    dimension,
  }))
}

// -----------------------------------------------------------------------------
// Handlers
// -----------------------------------------------------------------------------

/**
 * Registers all mastery-related IPC handlers
 */
export function registerMasteryHandlers(): void {
  // Get full mastery profile
  registerHandler('mastery:getProfile', () => {
    // TODO: Replace with repository call
    // const dimensions = await masteryRepository.findAll()

    // Stub: Return default mastery for all dimensions
    const dimensions = createDefaultMasterySet()

    // Calculate overall score
    const totalScore = dimensions.reduce(
      (sum, m) => sum + getMasteryScore(m),
      0
    )
    const overallScore = totalScore / dimensions.length

    // Find weakest and strongest dimensions
    let weakest: MasteryDTO | null = null
    let strongest: MasteryDTO | null = null
    let minScore = Infinity
    let maxScore = -Infinity

    for (const mastery of dimensions) {
      const score = getMasteryScore(mastery)
      if (score < minScore) {
        minScore = score
        weakest = mastery
      }
      if (score > maxScore) {
        maxScore = score
        strongest = mastery
      }
    }

    const profile: MasteryProfileDTO = {
      dimensions,
      overallScore,
      weakestDimension: weakest?.dimension ?? null,
      strongestDimension: strongest?.dimension ?? null,
    }

    return profile
  })

  // Get mastery for a specific dimension
  registerHandler('mastery:getByDimension', (_event, dimension) => {
    // TODO: Replace with repository call
    // return masteryRepository.findByDimension(dimension)

    // Stub: Return default mastery for requested dimension
    const mastery: MasteryDTO = {
      dimension,
      accuracyEwma: 0.5,
      speedEwma: 0.5,
      count: 0,
    }

    return mastery
  })
}
