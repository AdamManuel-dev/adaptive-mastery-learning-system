/**
 * @fileoverview Bar chart showing response time statistics per difficulty level
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Min/avg/max response times, difficulty level comparison, millisecond to second conversion
 * Main APIs: analytics:getResponseTimeStats IPC endpoint
 * Constraints: Requires preload API with analytics support, displays time in seconds
 * Patterns: Functional component with hooks, loading/error/empty states, ComposedChart for range indicators
 */

import { useEffect, useState } from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ErrorBar,
} from 'recharts'

import type { ResponseTimeStatsEntryDTO } from '../../../shared/types/ipc'

/**
 * Human-readable labels for difficulty levels
 */
const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Very Easy',
  2: 'Easy',
  3: 'Medium',
  4: 'Hard',
  5: 'Very Hard',
}

/**
 * Data point for chart (times converted to seconds)
 */
interface ResponseTimeDataPoint {
  difficulty: number
  difficultyLabel: string
  min: number
  max: number
  avg: number
  median: number
  range: number
  count: number
  // For error bar: deviation from avg
  errorRange: [number, number]
}

/**
 * Component state for data fetching
 */
interface ChartState {
  data: ResponseTimeDataPoint[] | null
  isLoading: boolean
  error: string | null
}

/**
 * Convert milliseconds to seconds with 2 decimal places
 */
function msToSeconds(ms: number): number {
  return Math.round((ms / 1000) * 100) / 100
}

/**
 * Transform response time data to chart format
 */
function transformToChartData(
  entries: ResponseTimeStatsEntryDTO[]
): ResponseTimeDataPoint[] {
  return entries
    .sort((a, b) => a.difficulty - b.difficulty)
    .map((entry) => {
      const minSec = msToSeconds(entry.min)
      const maxSec = msToSeconds(entry.max)
      const avgSec = msToSeconds(entry.avg)
      const medianSec = msToSeconds(entry.median)

      return {
        difficulty: entry.difficulty,
        difficultyLabel: DIFFICULTY_LABELS[entry.difficulty] || `Level ${entry.difficulty}`,
        min: minSec,
        max: maxSec,
        avg: avgSec,
        median: medianSec,
        range: maxSec - minSec,
        count: entry.count,
        // Error range for visualization: from min to max relative to avg
        errorRange: [avgSec - minSec, maxSec - avgSec],
      }
    })
}

/**
 * Custom tooltip content component
 */
interface TooltipPayload {
  name: string
  value: number
  color: string
  dataKey: string
  payload: ResponseTimeDataPoint
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}

function CustomTooltip({
  active,
  payload,
  label,
}: CustomTooltipProps): React.JSX.Element | null {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  // Find the data point
  const dataPoint = payload[0]?.payload
  if (!dataPoint) return null

  return (
    <div
      style={{
        backgroundColor: 'var(--color-background)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-sm)',
        fontSize: 'var(--font-size-sm)',
      }}
    >
      <p
        style={{
          fontWeight: 600,
          marginBottom: 'var(--space-xs)',
          color: 'var(--color-text-primary)',
        }}
      >
        {label}
      </p>
      <div style={{ display: 'grid', gap: '2px' }}>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          <span>Avg: </span>
          <span style={{ fontWeight: 500, color: '#3b82f6' }}>
            {dataPoint.avg.toFixed(2)}s
          </span>
        </p>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          <span>Median: </span>
          <span style={{ fontWeight: 500, color: '#8b5cf6' }}>
            {dataPoint.median.toFixed(2)}s
          </span>
        </p>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          <span>Min: </span>
          <span style={{ fontWeight: 500, color: '#22c55e' }}>
            {dataPoint.min.toFixed(2)}s
          </span>
        </p>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          <span>Max: </span>
          <span style={{ fontWeight: 500, color: '#ef4444' }}>
            {dataPoint.max.toFixed(2)}s
          </span>
        </p>
        <p
          style={{
            margin: 0,
            marginTop: 'var(--space-xs)',
            paddingTop: 'var(--space-xs)',
            borderTop: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
          }}
        >
          Based on {dataPoint.count} reviews
        </p>
      </div>
    </div>
  )
}

/**
 * ResponseTimeChart Component
 *
 * Displays response time statistics for each difficulty level.
 * Shows average times as bars with error bars indicating the min/max range,
 * and median as a line overlay.
 */
function ResponseTimeChart(): React.JSX.Element {
  const [state, setState] = useState<ChartState>({
    data: null,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    async function fetchData(): Promise<void> {
      if (!window.api) {
        setState({
          data: null,
          isLoading: false,
          error: 'API not available',
        })
        return
      }

      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }))

        // Call the analytics IPC endpoint
        const response = await (
          window as Window & {
            api: {
              analytics?: {
                getResponseTimeStats: () => Promise<ResponseTimeStatsEntryDTO[]>
              }
            }
          }
        ).api.analytics?.getResponseTimeStats()

        if (!response) {
          setState({
            data: null,
            isLoading: false,
            error: 'Analytics API not available',
          })
          return
        }

        const chartData = transformToChartData(response)
        setState({
          data: chartData,
          isLoading: false,
          error: null,
        })
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load response time data'
        setState({
          data: null,
          isLoading: false,
          error: message,
        })
        console.error('ResponseTimeChart fetch error:', err)
      }
    }

    void fetchData()
  }, [])

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
        Response Time by Difficulty
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart
          data={state.data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="difficultyLabel"
            tick={{
              fill: 'var(--color-text-secondary)',
              fontSize: 11,
            }}
            tickLine={{ stroke: 'var(--color-border)' }}
            axisLine={{ stroke: 'var(--color-border)' }}
          />
          <YAxis
            tick={{
              fill: 'var(--color-text-secondary)',
              fontSize: 11,
            }}
            tickLine={{ stroke: 'var(--color-border)' }}
            axisLine={{ stroke: 'var(--color-border)' }}
            label={{
              value: 'Time (seconds)',
              angle: -90,
              position: 'insideLeft',
              style: {
                textAnchor: 'middle',
                fill: 'var(--color-text-secondary)',
                fontSize: 12,
              },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              paddingTop: 'var(--space-md)',
            }}
          />
          <Bar
            dataKey="avg"
            name="Average Time"
            fill="#3b82f6"
            fillOpacity={0.7}
            barSize={40}
          >
            <ErrorBar
              dataKey="errorRange"
              width={8}
              strokeWidth={2}
              stroke="#6b7280"
            />
          </Bar>
          <Line
            type="monotone"
            dataKey="median"
            name="Median Time"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ fill: '#8b5cf6', r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <p
        style={{
          marginTop: 'var(--space-sm)',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
        }}
      >
        Error bars show min-max range for each difficulty level
      </p>
    </div>
  )
}

export default ResponseTimeChart
