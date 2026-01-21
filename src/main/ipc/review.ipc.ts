/**
 * @fileoverview IPC handlers for review operations
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Review card retrieval, submission, due count tracking
 * Main APIs: registerReviewHandlers()
 * Constraints: Requires database connection and domain services
 * Patterns: Handler registration with error handling wrapper
 */

import {
  selectVariantWithMaintenance,
  shouldInsertConfidenceCard,
  getStrongDimensions,
} from '../../domain/services/card-selector.service'
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
import { createEvaluatorFromEnv } from '../infrastructure/llm/evaluator'

import { registerHandler } from './index'

import type { Variant, Concept, ScheduleEntry, QuestionType } from '../../shared/types/core'
import type {
  ReviewSubmitDTO,
  ReviewResultDTO,
  DueCountDTO,
  ReviewCardDTO,
  Dimension,
  VariantDTO,
  ConceptDTO,
  ScheduleDTO,
  LLMEvaluationResult,
  EvaluationRubric,
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
 * Maps core QuestionType to IPC QuestionType (they're the same strings)
 */
function mapQuestionType(qt: QuestionType): import('../../shared/types/ipc').QuestionType {
  return qt as import('../../shared/types/ipc').QuestionType
}

/**
 * Maps core EvaluationRubric to IPC EvaluationRubric
 */
function mapRubric(rubric?: import('../../shared/types/core').EvaluationRubric): EvaluationRubric | undefined {
  if (!rubric) return undefined

  const baseRubric = {
    keyPoints: [...rubric.keyPoints],
  }

  // Use conditional spreading to avoid exactOptionalPropertyTypes violations
  return {
    ...baseRubric,
    ...(rubric.acceptableVariations !== undefined && { acceptableVariations: [...rubric.acceptableVariations] }),
    ...(rubric.partialCreditCriteria !== undefined && { partialCreditCriteria: rubric.partialCreditCriteria }),
  }
}

/**
 * Converts a domain Variant to a VariantDTO for IPC transport
 */
function variantToDTO(variant: Variant): VariantDTO {
  const now = new Date().toISOString()
  const mappedRubric = mapRubric(variant.rubric)

  const baseDTO = {
    id: variant.id,
    conceptId: variant.conceptId,
    dimension: CORE_TO_DIMENSION[variant.dimension],
    difficulty: variant.difficulty,
    front: variant.front,
    back: variant.back,
    hints: [...variant.hints],
    lastShownAt: variant.lastShownAt?.toISOString() ?? null,
    createdAt: now,
    updatedAt: now,
    questionType: mapQuestionType(variant.questionType),
  }

  // Use conditional spreading to avoid exactOptionalPropertyTypes violations
  return {
    ...baseDTO,
    ...(mappedRubric !== undefined && { rubric: mappedRubric }),
    ...(variant.maxLength !== undefined && { maxLength: variant.maxLength }),
  }
}

/**
 * Converts a domain Concept to a ConceptDTO for IPC transport
 */
function conceptToDTO(concept: Concept): ConceptDTO {
  return {
    id: concept.id,
    name: concept.name,
    definition: concept.definition ?? null,
    facts: [...concept.facts],
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
// Session State
// -----------------------------------------------------------------------------

/**
 * Session state for tracking review progress and adaptive selection
 */
interface ReviewSessionState {
  /** Dimensions selected so far in this session */
  sessionDimensions: DimensionType[]
  /** Count of consecutive failures (for anti-frustration) */
  consecutiveFailures: number
  /** Timestamp when session started */
  startedAt: Date
}

/**
 * Global session state - reset when session is idle for 30+ minutes
 */
let currentSession: ReviewSessionState = {
  sessionDimensions: [],
  consecutiveFailures: 0,
  startedAt: new Date(),
}

/** Session timeout in milliseconds (30 minutes) */
const SESSION_TIMEOUT_MS = 30 * 60 * 1000

/**
 * Gets or resets the session state based on activity timeout
 */
function getSessionState(): ReviewSessionState {
  const now = new Date()
  const timeSinceStart = now.getTime() - currentSession.startedAt.getTime()

  // Reset session if idle for too long
  if (timeSinceStart > SESSION_TIMEOUT_MS) {
    currentSession = {
      sessionDimensions: [],
      consecutiveFailures: 0,
      startedAt: now,
    }
  }

  return currentSession
}

/**
 * Records a dimension selection in the session
 */
function recordDimensionSelection(dimension: DimensionType): void {
  const session = getSessionState()
  session.sessionDimensions.push(dimension)
}

/**
 * Records a review result and updates failure count
 */
function recordReviewResult(wasCorrect: boolean): void {
  const session = getSessionState()
  if (wasCorrect) {
    session.consecutiveFailures = 0
  } else {
    session.consecutiveFailures++
  }
}

// -----------------------------------------------------------------------------
// Core Logic
// -----------------------------------------------------------------------------

/**
 * Retrieves the next card due for review using adaptive selection
 *
 * Algorithm:
 * 1. Get all due schedules (concepts with past due dates)
 * 2. For the first due schedule, fetch the concept and its variants
 * 3. Check for anti-frustration intervention (confidence card)
 * 4. Use adaptive selection with maintenance rep support
 * 5. Return the combined ReviewCardDTO
 */
function getNextCardInternal(): ReviewCardDTO | null {
  const now = new Date()
  const dueSchedules = ScheduleRepository.findDue(now)

  if (dueSchedules.length === 0) {
    return null
  }

  // Get mastery profile for variant selection
  const masteryProfile = MasteryRepository.findAll()

  // Get current session state
  const session = getSessionState()

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

    let selectedVariant

    // Check if we need a confidence-building card (anti-frustration)
    if (shouldInsertConfidenceCard(session.consecutiveFailures)) {
      // Select an easy card from a strong dimension
      const strongDimensions = getStrongDimensions(masteryProfile)

      if (strongDimensions.length > 0) {
        // Filter to easy variants from strong dimensions
        const easyStrongVariants = variants.filter(
          (v) => strongDimensions.includes(v.dimension) && v.difficulty <= 2
        )

        if (easyStrongVariants.length > 0) {
          // Random selection from easy strong variants
          const randomIndex = Math.floor(Math.random() * easyStrongVariants.length)
          selectedVariant = easyStrongVariants[randomIndex]
        }
      }
    }

    // If no confidence card was selected, use adaptive selection
    if (!selectedVariant) {
      selectedVariant = selectVariantWithMaintenance(
        variants,
        masteryProfile,
        session.consecutiveFailures,
        session.sessionDimensions
      )
    }

    if (!selectedVariant) {
      continue
    }

    // Record the dimension selection for session tracking
    recordDimensionSelection(selectedVariant.dimension)

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
  registerHandler('review:submit', async (_event, data: ReviewSubmitDTO) => {
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

    // Get the concept for evaluation context
    const concept = ConceptRepository.findById(conceptId)
    if (!concept) {
      throw new Error(`Concept ${conceptId} not found`)
    }

    // Get current mastery for the dimension
    const currentMastery = MasteryRepository.findByDimension(dimension) ?? {
      accuracyEwma: 0.5,
      speedEwma: 0.5,
      recentCount: 0,
    }

    let evaluation: LLMEvaluationResult | undefined
    let effectiveRating = data.rating

    // Handle open response evaluation
    if (variant.questionType === 'open_response' && data.userResponse) {
      try {
        const evaluator = createEvaluatorFromEnv()

        const mappedRubric = mapRubric(variant.rubric)
        const evalRequest = {
          question: variant.front,
          modelAnswer: variant.back,
          userResponse: data.userResponse,
          conceptName: concept.name,
          dimension: data.dimension,
          ...(mappedRubric !== undefined && { rubric: mappedRubric }),
        }

        const evalResult = await evaluator.evaluateResponse(evalRequest)

        if (evalResult.success) {
          evaluation = evalResult.value
          effectiveRating = evaluation.suggestedRating
        } else {
          // Fallback to self-report if evaluation fails
          console.error('LLM evaluation failed:', evalResult.error)
        }
      } catch (error) {
        // Fallback to self-report if evaluator creation fails
        console.error('Failed to create evaluator:', error)
      }
    }

    // Update mastery using the calculator service
    // For open response, we use the evaluated score instead of self-reported rating
    const updatedMastery = MasteryCalculator.updateMastery(
      currentMastery,
      effectiveRating,
      data.timeMs,
      variant.difficulty
    )

    // Save updated mastery
    MasteryRepository.save(dimension, updatedMastery)

    // Calculate and save updated schedule
    const updatedSchedule = scheduleNextReview(currentSchedule, effectiveRating)
    ScheduleRepository.save(updatedSchedule)

    // Log the review event with evaluation data
    const baseEventData = {
      conceptId,
      variantId,
      dimension,
      difficulty: variant.difficulty,
      result: effectiveRating,
      timeMs: data.timeMs,
      hintsUsed: 0,
    }

    // Use conditional spreading to avoid exactOptionalPropertyTypes violations
    EventRepository.create({
      ...baseEventData,
      ...(data.userResponse !== undefined && { userResponse: data.userResponse }),
      ...(evaluation?.score !== undefined && { llmScore: evaluation.score }),
      ...(evaluation?.feedback !== undefined && { llmFeedback: evaluation.feedback }),
      ...(evaluation?.confidence !== undefined && { evaluationConfidence: evaluation.confidence }),
    })

    // Update variant's lastShownAt
    VariantRepository.updateLastShown(variantId, new Date())

    // Record the review result for session tracking (anti-frustration)
    const wasCorrect = effectiveRating !== 'again'
    recordReviewResult(wasCorrect)

    // Get the next card
    const nextCard = getNextCardInternal()

    const baseResult = {
      updatedMastery: {
        dimension: data.dimension,
        accuracyEwma: updatedMastery.accuracyEwma,
        speedEwma: updatedMastery.speedEwma,
        count: updatedMastery.recentCount,
      },
      updatedSchedule: scheduleToDTO(updatedSchedule),
      nextCard,
    }

    // Use conditional spreading to avoid exactOptionalPropertyTypes violations
    const result: ReviewResultDTO = {
      ...baseResult,
      ...(evaluation !== undefined && { evaluation }),
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
