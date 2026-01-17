/**
 * @fileoverview Radar chart displaying mastery across 6 learning dimensions
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Spider/radar visualization, combined mastery score display, responsive sizing
 * Main APIs: mastery:getProfile IPC endpoint
 * Constraints: Requires preload API, combined score = 0.7 * accuracy + 0.3 * speed
 * Patterns: Functional component with hooks, loading/error/empty states
 */

import { useEffect, useState } from 'react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

import { useElectronAPIOrNull } from '../../hooks/useElectronAPI'

import type { MasteryProfileDTO, Dimension } from '../../../shared/types/ipc'

/**
 * Human-readable labels for dimension types
 */
const DIMENSION_LABELS: Record<Dimension, string> = {
  definition: 'Definition',
  paraphrase: 'Paraphrase',
  example: 'Example',
  scenario: 'Scenario',
  discrimination: 'Discrimination',
  cloze: 'Cloze',
}

/**
 * All dimensions in display order
 */
const ALL_DIMENSIONS: Dimension[] = [
  'definition',
  'paraphrase',
  'example',
  'scenario',
  'discrimination',
  'cloze',
]

/**
 * Data point for radar chart
 */
interface RadarDataPoint {
  dimension: string
  combinedScore: number
  fullMark: 1
}

/**
 * Component state for data fetching
 */
interface ChartState {
  data: RadarDataPoint[] | null
  isLoading: boolean
  error: string | null
}

/**
 * Calculate combined mastery score from accuracy and speed
 * Formula: 0.7 * accuracy + 0.3 * speed
 */
function calculateCombinedScore(accuracy: number, speed: number): number {
  return 0.7 * accuracy + 0.3 * speed
}

/**
 * Transform mastery profile data to radar chart format
 */
function transformToRadarData(profile: MasteryProfileDTO): RadarDataPoint[] {
  const masteryByDimension = new Map(
    profile.dimensions.map((d) => [d.dimension, d])
  )

  return ALL_DIMENSIONS.map((dimension) => {
    const mastery = masteryByDimension.get(dimension)
    const combinedScore = mastery
      ? calculateCombinedScore(mastery.accuracyEwma, mastery.speedEwma)
      : 0

    return {
      dimension: DIMENSION_LABELS[dimension],
      combinedScore: Math.round(combinedScore * 100) / 100,
      fullMark: 1,
    }
  })
}

/**
 * MasteryRadarChart Component
 *
 * Displays a radar/spider chart showing the current mastery level across
 * all 6 learning dimensions. The combined score is calculated as
 * 0.7 * accuracy + 0.3 * speed for each dimension.
 */
function MasteryRadarChart(): React.JSX.Element {
  const api = useElectronAPIOrNull()
  const [state, setState] = useState<ChartState>({
    data: null,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    async function fetchData(): Promise<void> {
      if (!api) {
        setState({
          data: null,
          isLoading: false,
          error: 'API not available',
        })
        return
      }

      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }))
        const profile = await api.mastery.getProfile()
        const radarData = transformToRadarData(profile)
        setState({
          data: radarData,
          isLoading: false,
          error: null,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load mastery data'
        setState({
          data: null,
          isLoading: false,
          error: message,
        })
        console.error('MasteryRadarChart fetch error:', err)
      }
    }

    void fetchData()
  }, [api])

  if (state.isLoading) {
    return (
      <div
        style={{
          width: '100%',
          minHeight: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-secondary)',
        }}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        Loading...
      </div>
    )
  }

  if (state.error) {
    return (
      <div
        style={{
          width: '100%',
          minHeight: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-error)',
        }}
        role="alert"
      >
        Error: {state.error}
      </div>
    )
  }

  if (!state.data || state.data.length === 0) {
    return (
      <div
        style={{
          width: '100%',
          minHeight: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-muted)',
        }}
      >
        No data available
      </div>
    )
  }

  return (
    <div style={{ width: '100%' }}>
      <h3
        style={{
          fontSize: 'var(--font-size-lg)',
          fontWeight: 600,
          marginBottom: 'var(--space-md)',
          color: 'var(--color-text-primary)',
        }}
      >
        Mastery by Dimension
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={state.data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid stroke="var(--color-border)" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{
              fill: 'var(--color-text-secondary)',
              fontSize: 12,
            }}
          />
          <PolarRadiusAxis
            domain={[0, 1]}
            tick={{
              fill: 'var(--color-text-muted)',
              fontSize: 10,
            }}
            tickCount={5}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
            }}
            formatter={(value) => {
              const numValue = typeof value === 'number' ? value : 0
              return [`${Math.round(numValue * 100)}%`, 'Mastery']
            }}
          />
          <Radar
            name="Mastery"
            dataKey="combinedScore"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default MasteryRadarChart
