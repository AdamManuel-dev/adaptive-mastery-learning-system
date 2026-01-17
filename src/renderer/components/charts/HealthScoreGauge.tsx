/**
 * @fileoverview Semi-circle gauge displaying overall mastery score
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Radial gauge visualization, color-coded score ranges, centered percentage display
 * Main APIs: mastery:getProfile IPC endpoint (uses overallScore field)
 * Constraints: Requires preload API, score range 0-100%
 * Patterns: Functional component with hooks, RadialBarChart configured as semi-circle gauge
 */

import { useEffect, useState } from 'react'
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts'

import { useElectronAPIOrNull } from '../../hooks/useElectronAPI'

import type { MasteryProfileDTO } from '../../../shared/types/ipc'

/**
 * Get color based on score percentage
 * <40% = red, 40-70% = yellow, >70% = green
 */
function getScoreColor(score: number): string {
  if (score < 40) return '#ef4444' // Red
  if (score < 70) return '#f59e0b' // Yellow/Amber
  return '#22c55e' // Green
}

/**
 * Get background color (lighter version) for gauge track
 */
function getScoreBackgroundColor(score: number): string {
  if (score < 40) return 'rgba(239, 68, 68, 0.15)'
  if (score < 70) return 'rgba(245, 158, 11, 0.15)'
  return 'rgba(34, 197, 94, 0.15)'
}

/**
 * Get status text based on score
 */
function getStatusText(score: number): string {
  if (score < 25) return 'Needs Attention'
  if (score < 40) return 'Getting Started'
  if (score < 55) return 'Making Progress'
  if (score < 70) return 'Good Progress'
  if (score < 85) return 'Strong'
  return 'Excellent'
}

/**
 * Data point for radial chart
 */
interface GaugeDataPoint {
  name: string
  value: number
  fill: string
}

/**
 * Component state for data fetching
 */
interface ChartState {
  score: number | null
  isLoading: boolean
  error: string | null
}

/**
 * HealthScoreGauge Component
 *
 * Displays the overall mastery score as a semi-circle gauge.
 * Color changes based on score: red (<40%), yellow (40-70%), green (>70%).
 */
function HealthScoreGauge(): React.JSX.Element {
  const api = useElectronAPIOrNull()
  const [state, setState] = useState<ChartState>({
    score: null,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    async function fetchData(): Promise<void> {
      if (!api) {
        setState({
          score: null,
          isLoading: false,
          error: 'API not available',
        })
        return
      }

      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }))
        const profile: MasteryProfileDTO = await api.mastery.getProfile()
        // Convert 0-1 score to percentage
        const scorePercent = Math.round(profile.overallScore * 100)
        setState({
          score: scorePercent,
          isLoading: false,
          error: null,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load mastery score'
        setState({
          score: null,
          isLoading: false,
          error: message,
        })
        console.error('HealthScoreGauge fetch error:', err)
      }
    }

    void fetchData()
  }, [api])

  if (state.isLoading) {
    return (
      <div
        style={{
          width: '100%',
          minHeight: 250,
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
          minHeight: 250,
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

  if (state.score === null) {
    return (
      <div
        style={{
          width: '100%',
          minHeight: 250,
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

  const score = state.score
  const color = getScoreColor(score)
  const bgColor = getScoreBackgroundColor(score)
  const statusText = getStatusText(score)

  // Data for the radial bar chart
  const data: GaugeDataPoint[] = [
    {
      name: 'score',
      value: score,
      fill: color,
    },
  ]

  return (
    <div style={{ width: '100%' }}>
      <h3
        style={{
          fontSize: 'var(--font-size-lg)',
          fontWeight: 600,
          marginBottom: 'var(--space-sm)',
          color: 'var(--color-text-primary)',
          textAlign: 'center',
        }}
      >
        Overall Mastery
      </h3>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 200,
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="65%"
            outerRadius="100%"
            data={data}
            startAngle={180}
            endAngle={0}
            barSize={20}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            {/* Background track */}
            <RadialBar
              dataKey="value"
              cornerRadius={10}
              fill={bgColor}
              background={{
                fill: bgColor,
              }}
            />
            {/* Actual value bar */}
            <RadialBar
              dataKey="value"
              cornerRadius={10}
              fill={color}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        {/* Centered score display */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -20%)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 'var(--font-size-3xl)',
              fontWeight: 700,
              color: color,
              lineHeight: 1,
            }}
          >
            {score}%
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              marginTop: 'var(--space-xs)',
            }}
          >
            {statusText}
          </div>
        </div>
      </div>
      {/* Score range legend */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'var(--space-lg)',
          marginTop: 'var(--space-sm)',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)',
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#ef4444',
            }}
          />
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
            }}
          >
            {'< 40%'}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)',
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#f59e0b',
            }}
          />
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
            }}
          >
            40-70%
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)',
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#22c55e',
            }}
          />
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
            }}
          >
            {'> 70%'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default HealthScoreGauge
