/**
 * @fileoverview IPC handlers for review operations
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Review card retrieval, submission, due count tracking
 * Main APIs: registerReviewHandlers()
 * Constraints: Requires database connection and domain services
 * Patterns: Handler registration with error handling wrapper
 */

import { selectVariantForConcept } from '../../domain/services/card-selector.service'
import { MasteryCalculator } from '../../domain/services/mastery-calculator.service'
import { scheduleNextReview } from '../../domain/services/scheduler.service'
import { asConceptId, asVariantId } from '../../shared/types/branded'
import { DimensionType } from '../../shared/types/core'
import {
  ConceptRepository,
  VariantRepository,
  EventRepository,
  MasteryRepository,
  ScheduleRepository,
} from '../infrastructure/database/repositories'

import { registerHandler } from './index'

import type { Variant, Concept, ScheduleEntry } from '../../shared/types/core'
import type {
  ReviewSubmitDTO,
  ReviewResultDTO,
  DueCountDTO,
  ReviewCardDTO,
  Dimension,
  VariantDTO,
  ConceptDTO,
  ScheduleDTO,
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

/**
 * Maps IPC Dimension strings to core DimensionType enum values
 */
const DIMENSION_TO_CORE: Record<Dimension, DimensionType> = {
  definition: DimensionType.DEFINITION_RECALL,
  paraphrase: DimensionType.PARAPHRASE_RECOGNITION,
  example: DimensionType.EXAMPLE_CLASSIFICATION,
  scenario: DimensionType.SCENARIO_APPLICATION,
  discrimination: DimensionType.DISCRIMINATION,
  cloze: DimensionType.CLOZE_FILL,
}

/**
 * Maps core DimensionType enum values to IPC Dimension strings
 */
const CORE_TO_DIMENSION: Record<DimensionType, Dimension> = {
  [DimensionType.DEFINITION_RECALL]: 'definition',
  [DimensionType.PARAPHRASE_RECOGNITION]: 'paraphrase',
  [DimensionType.EXAMPLE_CLASSIFICATION]: 'example',
  [DimensionType.SCENARIO_APPLICATION]: 'scenario',
  [DimensionType.DISCRIMINATION]: 'discrimination',
  [DimensionType.CLOZE_FILL]: 'cloze',
}

// -----------------------------------------------------------------------------
// DTO Mappers
// -----------------------------------------------------------------------------

/**
 * Converts a domain Variant to a VariantDTO for IPC transport
 */
function variantToDTO(variant: Variant): VariantDTO {
  return {
    id: variant.id,
    conceptId: variant.conceptId,
    dimension: CORE_TO_DIMENSION[variant.dimension],
    difficulty: variant.difficulty,
    front: variant.front,
    back: variant.back,
    createdAt: variant.lastShownAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: variant.lastShownAt?.toISOString() ?? new Date().toISOString(),
  }
}

/**
 * Converts a domain Concept to a ConceptDTO for IPC transport
 */
function conceptToDTO(concept: Concept): ConceptDTO {
  return {
    id: concept.id,
    name: concept.name,
    definition: concept.definition,
    createdAt: concept.createdAt.toISOString(),
    updatedAt: concept.updatedAt.toISOString(),
  }
}

/**
 * Converts a domain ScheduleEntry to a ScheduleDTO for IPC transport
 */
function scheduleToDTO(schedule: ScheduleEntry): ScheduleDTO {
  return {
    conceptId: schedule.conceptId,
    dueAt: schedule.dueAt.toISOString(),
    intervalDays: schedule.intervalDays,
    ease: schedule.easeFactor,
  }
}

// -----------------------------------------------------------------------------
// Core Logic
// -----------------------------------------------------------------------------

/**
 * Retrieves the next card due for review
 *
 * Algorithm:
 * 1. Get all due schedules (concepts with past due dates)
 * 2. For the first due schedule, fetch the concept and its variants
 * 3. Use weighted selection algorithm to pick the best variant
 * 4. Return the combined ReviewCardDTO
 */
function getNextCardInternal(): ReviewCardDTO | null {
  const now = new Date()
  const dueSchedules = ScheduleRepository.findDue(now)

  if (dueSchedules.length === 0) {
    return null
  }

  // Get mastery profile for variant selection
  const masteryProfile = MasteryRepository.findAll()

  // Try each due schedule until we find one with valid variants
  for (const schedule of dueSchedules) {
    const concept = ConceptRepository.findById(schedule.conceptId)
    if (!concept) {
      continue
    }

    const variants = VariantRepository.findByConceptId(schedule.conceptId)
    if (variants.length === 0) {
      continue
    }

    // Use card selector to pick the best variant based on mastery
    // Note: recentFailures would ideally be tracked in session, using 0 for now
    const selectedVariant = selectVariantForConcept(variants, masteryProfile, 0)

    if (!selectedVariant) {
      continue
    }

    return {
      variant: variantToDTO(selectedVariant),
      concept: conceptToDTO(concept),
      schedule: scheduleToDTO(schedule),
    }
  }

  return null
}

// -----------------------------------------------------------------------------
// Handlers
// -----------------------------------------------------------------------------

/**
 * Registers all review-related IPC handlers
 */
export function registerReviewHandlers(): void {
  // Get next card for review
  registerHandler('review:getNextCard', () => {
    return getNextCardInternal()
  })

  // Submit a review result
  registerHandler('review:submit', (_event, data: ReviewSubmitDTO) => {
    const conceptId = asConceptId(data.conceptId)
    const variantId = asVariantId(data.variantId)
    const dimension = DIMENSION_TO_CORE[data.dimension]

    // Get current schedule for the concept
    const currentSchedule = ScheduleRepository.findByConceptId(conceptId)
    if (!currentSchedule) {
      throw new Error(`No schedule found for concept ${conceptId}`)
    }

    // Get the variant to determine difficulty
    const variant = VariantRepository.findById(variantId)
    if (!variant) {
      throw new Error(`Variant ${variantId} not found`)
    }

    // Get current mastery for the dimension
    const currentMastery = MasteryRepository.findByDimension(dimension) ?? {
      accuracyEwma: 0.5,
      speedEwma: 0.5,
      recentCount: 0,
    }

    // Update mastery using the calculator service
    const updatedMastery = MasteryCalculator.updateMastery(
      currentMastery,
      data.rating,
      data.timeMs,
      variant.difficulty
    )

    // Save updated mastery
    MasteryRepository.save(dimension, updatedMastery)

    // Calculate and save updated schedule
    const updatedSchedule = scheduleNextReview(currentSchedule, data.rating)
    ScheduleRepository.save(updatedSchedule)

    // Log the review event
    EventRepository.create({
      conceptId,
      variantId,
      dimension,
      difficulty: variant.difficulty,
      result: data.rating,
      timeMs: data.timeMs,
      hintsUsed: 0, // Not tracked in ReviewSubmitDTO currently
    })

    // Update variant's lastShownAt
    VariantRepository.updateLastShown(variantId, new Date())

    // Get the next card
    const nextCard = getNextCardInternal()

    const result: ReviewResultDTO = {
      updatedMastery: {
        dimension: data.dimension,
        accuracyEwma: updatedMastery.accuracyEwma,
        speedEwma: updatedMastery.speedEwma,
        count: updatedMastery.recentCount,
      },
      updatedSchedule: scheduleToDTO(updatedSchedule),
      nextCard,
    }

    return result
  })

  // Get count of due cards
  registerHandler('review:getDueCount', () => {
    const now = new Date()
    const dueSchedules = ScheduleRepository.findDue(now)

    // Initialize counts for all dimensions
    const byDimension = ALL_DIMENSIONS.reduce(
      (acc, dim) => {
        acc[dim] = 0
        return acc
      },
      {} as Record<Dimension, number>
    )

    // Count due cards by dimension
    for (const schedule of dueSchedules) {
      const variants = VariantRepository.findByConceptId(schedule.conceptId)

      for (const variant of variants) {
        const dimension = CORE_TO_DIMENSION[variant.dimension]
        if (dimension) {
          byDimension[dimension]++
        }
      }
    }

    const total = Object.values(byDimension).reduce((sum, count) => sum + count, 0)

    const dueCount: DueCountDTO = {
      total,
      byDimension,
    }

    return dueCount
  })
}
