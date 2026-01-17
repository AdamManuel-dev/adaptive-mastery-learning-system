/**
 * @fileoverview Multi-line chart showing mastery progress over time
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Timeline visualization, multiple dimension lines, color-coded legend
 * Main APIs: analytics:getMasteryTimeline IPC endpoint
 * Constraints: Requires preload API with analytics support, shows last 30 days
 * Patterns: Functional component with hooks, loading/error/empty states
 */

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

import type {
  MasteryTimelineEntryDTO,
  Dimension,
} from '../../../shared/types/ipc'

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
 * Color palette for dimension lines
 */
const DIMENSION_COLORS: Record<Dimension, string> = {
  definition: '#3b82f6', // Blue
  paraphrase: '#10b981', // Green
  example: '#f59e0b', // Amber
  scenario: '#8b5cf6', // Purple
  discrimination: '#ef4444', // Red
  cloze: '#06b6d4', // Cyan
}

/**
 * All dimensions for chart lines
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
 * Data point for timeline chart
 */
interface TimelineDataPoint {
  date: string
  formattedDate: string
  definition: number
  paraphrase: number
  example: number
  scenario: number
  discrimination: number
  cloze: number
}

/**
 * Component state for data fetching
 */
interface ChartState {
  data: TimelineDataPoint[] | null
  isLoading: boolean
  error: string | null
}

/**
 * Format date for display (MM/DD)
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

/**
 * Transform timeline data to chart format
 */
function transformToChartData(
  entries: MasteryTimelineEntryDTO[]
): TimelineDataPoint[] {
  return entries.map((entry) => {
    const point: TimelineDataPoint = {
      date: entry.date,
      formattedDate: formatDate(entry.date),
      definition: 0,
      paraphrase: 0,
      example: 0,
      scenario: 0,
      discrimination: 0,
      cloze: 0,
    }

    for (const dimension of ALL_DIMENSIONS) {
      const dimensionData = entry.dimensions[dimension]
      if (dimensionData) {
        point[dimension] = Math.round(dimensionData.combined * 100) / 100
      }
    }

    return point
  })
}

/**
 * ProgressTimelineChart Component
 *
 * Displays a multi-line chart showing mastery progress over the last 30 days.
 * Each dimension is represented by a different colored line.
 */
function ProgressTimelineChart(): React.JSX.Element {
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
        // Note: This requires the analytics API to be exposed in preload
        const response = await (
          window as Window & {
            api: {
              analytics?: {
                getMasteryTimeline: (args: { days: number }) => Promise<MasteryTimelineEntryDTO[]>
              }
            }
          }
        ).api.analytics?.getMasteryTimeline({ days: 30 })

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
          err instanceof Error ? err.message : 'Failed to load timeline data'
        setState({
          data: null,
          isLoading: false,
          error: message,
        })
        console.error('ProgressTimelineChart fetch error:', err)
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
        Mastery Progress (Last 30 Days)
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart
          data={state.data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="formattedDate"
            tick={{
              fill: 'var(--color-text-secondary)',
              fontSize: 11,
            }}
            tickLine={{ stroke: 'var(--color-border)' }}
            axisLine={{ stroke: 'var(--color-border)' }}
          />
          <YAxis
            domain={[0, 1]}
            tick={{
              fill: 'var(--color-text-secondary)',
              fontSize: 11,
            }}
            tickLine={{ stroke: 'var(--color-border)' }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickFormatter={(value: number) => `${Math.round(value * 100)}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
            }}
            formatter={(value, name) => {
              const numValue = typeof value === 'number' ? value : 0
              const strName = typeof name === 'string' ? name : ''
              return [
                `${Math.round(numValue * 100)}%`,
                DIMENSION_LABELS[strName as Dimension] || strName,
              ]
            }}
            labelFormatter={(label: string) => `Date: ${label}`}
          />
          <Legend
            formatter={(value: string) =>
              DIMENSION_LABELS[value as Dimension] || value
            }
            wrapperStyle={{
              paddingTop: 'var(--space-md)',
            }}
          />
          {ALL_DIMENSIONS.map((dimension) => (
            <Line
              key={dimension}
              type="monotone"
              dataKey={dimension}
              name={dimension}
              stroke={DIMENSION_COLORS[dimension]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ProgressTimelineChart
