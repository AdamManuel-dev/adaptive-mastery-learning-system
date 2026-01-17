/**
 * @fileoverview IPC handlers for analytics chart data aggregation
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Mastery timeline, review distribution, response time stats, weakness heatmap
 * Main APIs: registerAnalyticsHandlers()
 * Constraints: Requires EventRepository for data access
 * Patterns: Handler registration with error handling wrapper, aggregation helpers
 */

import { registerHandler } from './index'
import { EventRepository } from '../infrastructure/database/repositories/event.repository'

import type { ReviewEvent, ReviewResultType, DifficultyLevel } from '../../shared/types/core'
import type { Dimension } from '../../shared/types/ipc'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/** Daily mastery snapshot for a single dimension */
interface DimensionMasterySnapshot {
  accuracy: number
  speed: number
  combined: number
}

/** Daily mastery data across all dimensions */
interface MasteryTimelineEntry {
  date: string
  dimensions: Record<Dimension, DimensionMasterySnapshot>
}

/** Review count distribution by result type for a dimension */
interface ReviewDistributionEntry {
  dimension: Dimension
  again: number
  hard: number
  good: number
  easy: number
}

/** Response time statistics for a difficulty level */
interface ResponseTimeStatsEntry {
  difficulty: number
  min: number
  max: number
  avg: number
  median: number
  count: number
}

/** Weakness severity levels */
type WeaknessSeverity = 'none' | 'mild' | 'moderate' | 'critical'

/** Daily weakness severity per dimension */
interface WeaknessHeatmapEntry {
  date: string
  dimensions: Record<Dimension, WeaknessSeverity>
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

/** All dimension types for iteration */
const ALL_DIMENSIONS: Dimension[] = [
  'definition',
  'paraphrase',
  'example',
  'scenario',
  'discrimination',
  'cloze',
]

/** Accuracy score mapping for review results */
const RESULT_ACCURACY_SCORES: Record<ReviewResultType, number> = {
  again: 0.0,
  hard: 0.4,
  good: 0.7,
  easy: 1.0,
}

/** Target response times by difficulty level (ms) */
const TARGET_TIMES_BY_DIFFICULTY: Record<DifficultyLevel, number> = {
  1: 5000,
  2: 10000,
  3: 20000,
  4: 40000,
  5: 60000,
}

/** EWMA alpha for smoothing (matches mastery calculation) */
const EWMA_ALPHA = 0.3

// -----------------------------------------------------------------------------
// Aggregation Helpers
// -----------------------------------------------------------------------------

/**
 * Groups events by date (YYYY-MM-DD format)
 */
function groupByDate(events: ReviewEvent[]): Map<string, ReviewEvent[]> {
  const groups = new Map<string, ReviewEvent[]>()

  for (const event of events) {
    const dateParts = event.createdAt.toISOString().split('T')
    const date = dateParts[0] ?? ''
    const existing = groups.get(date) ?? []
    existing.push(event)
    groups.set(date, existing)
  }

  return groups
}

/**
 * Groups events by dimension
 */
function groupByDimension(events: ReviewEvent[]): Map<string, ReviewEvent[]> {
  const groups = new Map<string, ReviewEvent[]>()

  for (const event of events) {
    const dimension = mapDimensionTypeToIPC(event.dimension)
    const existing = groups.get(dimension) ?? []
    existing.push(event)
    groups.set(dimension, existing)
  }

  return groups
}

/**
 * Groups events by difficulty level
 */
function groupByDifficulty(events: ReviewEvent[]): Map<number, ReviewEvent[]> {
  const groups = new Map<number, ReviewEvent[]>()

  for (const event of events) {
    const existing = groups.get(event.difficulty) ?? []
    existing.push(event)
    groups.set(event.difficulty, existing)
  }

  return groups
}

/**
 * Maps internal DimensionType enum values to IPC Dimension type
 */
function mapDimensionTypeToIPC(dimension: string): Dimension {
  const mapping: Record<string, Dimension> = {
    definition_recall: 'definition',
    paraphrase_recognition: 'paraphrase',
    example_classification: 'example',
    scenario_application: 'scenario',
    discrimination: 'discrimination',
    cloze_fill: 'cloze',
    // Handle direct IPC dimension values as passthrough
    definition: 'definition',
    paraphrase: 'paraphrase',
    example: 'example',
    scenario: 'scenario',
    cloze: 'cloze',
  }

  return mapping[dimension] ?? 'definition'
}

/**
 * Calculates the median of a numeric array
 */
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0

  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    const lower = sorted[mid - 1] ?? 0
    const upper = sorted[mid] ?? 0
    return (lower + upper) / 2
  }

  return sorted[mid] ?? 0
}

/**
 * Calculates speed score based on response time and difficulty
 * Speed score = min(1.0, targetTime / actualTime)
 */
function calculateSpeedScore(timeMs: number, difficulty: DifficultyLevel): number {
  const targetTime = TARGET_TIMES_BY_DIFFICULTY[difficulty]
  return Math.min(1.0, targetTime / timeMs)
}

/**
 * Calculates EWMA for a series of values (most recent last)
 */
function calculateEWMA(values: number[], alpha: number = EWMA_ALPHA): number {
  if (values.length === 0) return 0.5

  const firstValue = values[0]
  if (firstValue === undefined) return 0.5

  let ewma = firstValue
  for (let i = 1; i < values.length; i++) {
    const current = values[i]
    if (current !== undefined) {
      ewma = alpha * current + (1 - alpha) * ewma
    }
  }

  return ewma
}

/**
 * Calculates combined mastery score (70% accuracy, 30% speed)
 */
function calculateCombinedScore(accuracy: number, speed: number): number {
  return 0.7 * accuracy + 0.3 * speed
}

/**
 * Classifies weakness severity based on combined mastery score
 */
function classifyWeaknessSeverity(combinedScore: number): WeaknessSeverity {
  if (combinedScore < 0.4) return 'critical'
  if (combinedScore < 0.55) return 'moderate'
  if (combinedScore < 0.7) return 'mild'
  return 'none'
}

/**
 * Creates default mastery snapshot with neutral values
 */
function createDefaultMasterySnapshot(): DimensionMasterySnapshot {
  return {
    accuracy: 0.5,
    speed: 0.5,
    combined: 0.5,
  }
}

/**
 * Creates default dimension record with provided value factory
 */
function createDefaultDimensionRecord<T>(factory: () => T): Record<Dimension, T> {
  return ALL_DIMENSIONS.reduce(
    (acc, dim) => {
      acc[dim] = factory()
      return acc
    },
    {} as Record<Dimension, T>
  )
}

/**
 * Generates array of date strings for the past N days
 */
function generateDateRange(days: number): string[] {
  const dates: string[] = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateParts = date.toISOString().split('T')
    dates.push(dateParts[0] ?? '')
  }

  return dates
}

/**
 * Filters events to those within the last N days
 */
function filterEventsByDays(events: ReviewEvent[], days: number): ReviewEvent[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  cutoff.setHours(0, 0, 0, 0)

  return events.filter((event) => event.createdAt >= cutoff)
}

// -----------------------------------------------------------------------------
// Handler Implementations
// -----------------------------------------------------------------------------

/**
 * Calculates daily mastery snapshots per dimension over a time range
 *
 * For each day, computes EWMA of accuracy and speed scores from events
 * up to and including that day.
 */
function getMasteryTimeline(days: number): MasteryTimelineEntry[] {
  // Fetch all events (we need historical context for EWMA)
  const allEvents = EventRepository.findRecent(10000)
  const recentEvents = filterEventsByDays(allEvents, days)

  const dateRange = generateDateRange(days)
  const eventsByDate = groupByDate(recentEvents)

  // Track cumulative EWMA state per dimension
  const cumulativeState = createDefaultDimensionRecord(() => ({
    accuracyValues: [] as number[],
    speedValues: [] as number[],
  }))

  const timeline: MasteryTimelineEntry[] = []

  for (const date of dateRange) {
    const dayEvents = eventsByDate.get(date) ?? []

    // Group day's events by dimension and update cumulative state
    const eventsByDim = groupByDimension(dayEvents)

    for (const dimension of ALL_DIMENSIONS) {
      const dimEvents = eventsByDim.get(dimension) ?? []

      for (const event of dimEvents) {
        const accuracyScore = RESULT_ACCURACY_SCORES[event.result]
        const speedScore = calculateSpeedScore(event.timeMs, event.difficulty)

        cumulativeState[dimension].accuracyValues.push(accuracyScore)
        cumulativeState[dimension].speedValues.push(speedScore)
      }
    }

    // Calculate current EWMA for each dimension
    const dimensions = createDefaultDimensionRecord<DimensionMasterySnapshot>(() =>
      createDefaultMasterySnapshot()
    )

    for (const dimension of ALL_DIMENSIONS) {
      const state = cumulativeState[dimension]

      if (state.accuracyValues.length > 0) {
        const accuracy = calculateEWMA(state.accuracyValues)
        const speed = calculateEWMA(state.speedValues)
        const combined = calculateCombinedScore(accuracy, speed)

        dimensions[dimension] = { accuracy, speed, combined }
      }
    }

    timeline.push({ date, dimensions })
  }

  return timeline
}

/**
 * Counts reviews by result type for each dimension
 */
function getReviewDistribution(): ReviewDistributionEntry[] {
  const allEvents = EventRepository.findRecent(10000)
  const eventsByDim = groupByDimension(allEvents)

  return ALL_DIMENSIONS.map((dimension) => {
    const dimEvents = eventsByDim.get(dimension) ?? []

    const counts = {
      again: 0,
      hard: 0,
      good: 0,
      easy: 0,
    }

    for (const event of dimEvents) {
      counts[event.result]++
    }

    return {
      dimension,
      ...counts,
    }
  })
}

/**
 * Calculates response time statistics per difficulty level
 */
function getResponseTimeStats(): ResponseTimeStatsEntry[] {
  const allEvents = EventRepository.findRecent(10000)
  const eventsByDifficulty = groupByDifficulty(allEvents)

  const stats: ResponseTimeStatsEntry[] = []

  for (let difficulty = 1; difficulty <= 5; difficulty++) {
    const difficultyEvents = eventsByDifficulty.get(difficulty) ?? []
    const times = difficultyEvents.map((e) => e.timeMs)

    if (times.length === 0) {
      stats.push({
        difficulty,
        min: 0,
        max: 0,
        avg: 0,
        median: 0,
        count: 0,
      })
      continue
    }

    const min = Math.min(...times)
    const max = Math.max(...times)
    const avg = times.reduce((sum, t) => sum + t, 0) / times.length
    const median = calculateMedian(times)

    stats.push({
      difficulty,
      min,
      max,
      avg: Math.round(avg),
      median,
      count: times.length,
    })
  }

  return stats
}

/**
 * Calculates daily weakness severity per dimension
 *
 * Uses cumulative mastery scores to classify each dimension's
 * weakness level for each day in the range.
 */
function getWeaknessHeatmap(days: number): WeaknessHeatmapEntry[] {
  // Reuse mastery timeline calculation
  const timeline = getMasteryTimeline(days)

  return timeline.map((entry) => {
    const dimensions = createDefaultDimensionRecord<WeaknessSeverity>(() => 'none')

    for (const dimension of ALL_DIMENSIONS) {
      const mastery = entry.dimensions[dimension]
      dimensions[dimension] = classifyWeaknessSeverity(mastery.combined)
    }

    return {
      date: entry.date,
      dimensions,
    }
  })
}

// -----------------------------------------------------------------------------
// Handler Registration
// -----------------------------------------------------------------------------

/**
 * Registers all analytics-related IPC handlers
 *
 * These handlers provide aggregated chart data for the analytics dashboard,
 * computing mastery timelines, review distributions, response time statistics,
 * and weakness heatmaps from historical review events.
 */
export function registerAnalyticsHandlers(): void {
  // Get mastery timeline for chart visualization
  registerHandler('analytics:getMasteryTimeline', (_event, args) => {
    const { days } = args
    return getMasteryTimeline(days)
  })

  // Get review distribution by result type per dimension
  registerHandler('analytics:getReviewDistribution', () => {
    return getReviewDistribution()
  })

  // Get response time statistics per difficulty level
  registerHandler('analytics:getResponseTimeStats', () => {
    return getResponseTimeStats()
  })

  // Get weakness heatmap for visualization
  registerHandler('analytics:getWeaknessHeatmap', (_event, args) => {
    const { days } = args
    return getWeaknessHeatmap(days)
  })
}
