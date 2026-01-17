/**
 * @fileoverview Stacked bar chart showing review result distribution per dimension
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Stacked bars by rating type, color-coded results, legend with rating explanations
 * Main APIs: analytics:getReviewDistribution IPC endpoint
 * Constraints: Requires preload API with analytics support
 * Patterns: Functional component with hooks, loading/error/empty states
 */

import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

import type {
  ReviewDistributionEntryDTO,
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
 * Colors for each rating type
 */
const RATING_COLORS = {
  again: '#ef4444', // Red
  hard: '#f97316', // Orange
  good: '#22c55e', // Green
  easy: '#3b82f6', // Blue
}

/**
 * Human-readable labels for rating types
 */
const RATING_LABELS = {
  again: 'Again',
  hard: 'Hard',
  good: 'Good',
  easy: 'Easy',
}

/**
 * Data point for bar chart
 */
interface DistributionDataPoint {
  dimension: string
  dimensionKey: Dimension
  again: number
  hard: number
  good: number
  easy: number
  total: number
}

/**
 * Component state for data fetching
 */
interface ChartState {
  data: DistributionDataPoint[] | null
  isLoading: boolean
  error: string | null
}

/**
 * Transform distribution data to chart format
 */
function transformToChartData(
  entries: ReviewDistributionEntryDTO[]
): DistributionDataPoint[] {
  return entries.map((entry) => ({
    dimension: DIMENSION_LABELS[entry.dimension],
    dimensionKey: entry.dimension,
    again: entry.again,
    hard: entry.hard,
    good: entry.good,
    easy: entry.easy,
    total: entry.again + entry.hard + entry.good + entry.easy,
  }))
}

/**
 * Custom tooltip content component
 */
interface TooltipPayload {
  name: string
  value: number
  color: string
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

  const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0)

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
      {payload.map((entry) => (
        <p
          key={entry.name}
          style={{
            margin: '2px 0',
            color: entry.color,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 'var(--space-md)',
          }}
        >
          <span>{RATING_LABELS[entry.name as keyof typeof RATING_LABELS]}:</span>
          <span style={{ fontWeight: 500 }}>{entry.value}</span>
        </p>
      ))}
      <p
        style={{
          marginTop: 'var(--space-xs)',
          paddingTop: 'var(--space-xs)',
          borderTop: '1px solid var(--color-border)',
          color: 'var(--color-text-secondary)',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 'var(--space-md)',
        }}
      >
        <span>Total:</span>
        <span style={{ fontWeight: 600 }}>{total}</span>
      </p>
    </div>
  )
}

/**
 * ReviewDistributionChart Component
 *
 * Displays a stacked bar chart showing the distribution of review results
 * (again, hard, good, easy) for each dimension.
 */
function ReviewDistributionChart(): React.JSX.Element {
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
                getReviewDistribution: () => Promise<ReviewDistributionEntryDTO[]>
              }
            }
          }
        ).api.analytics?.getReviewDistribution()

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
          err instanceof Error ? err.message : 'Failed to load distribution data'
        setState({
          data: null,
          isLoading: false,
          error: message,
        })
        console.error('ReviewDistributionChart fetch error:', err)
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
        Review Results by Dimension
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={state.data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="dimension"
            tick={{
              fill: 'var(--color-text-secondary)',
              fontSize: 11,
            }}
            tickLine={{ stroke: 'var(--color-border)' }}
            axisLine={{ stroke: 'var(--color-border)' }}
            interval={0}
            angle={-15}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{
              fill: 'var(--color-text-secondary)',
              fontSize: 11,
            }}
            tickLine={{ stroke: 'var(--color-border)' }}
            axisLine={{ stroke: 'var(--color-border)' }}
            label={{
              value: 'Review Count',
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
            formatter={(value: string) =>
              RATING_LABELS[value as keyof typeof RATING_LABELS] || value
            }
            wrapperStyle={{
              paddingTop: 'var(--space-md)',
            }}
          />
          <Bar
            dataKey="again"
            stackId="reviews"
            fill={RATING_COLORS.again}
            name="again"
          />
          <Bar
            dataKey="hard"
            stackId="reviews"
            fill={RATING_COLORS.hard}
            name="hard"
          />
          <Bar
            dataKey="good"
            stackId="reviews"
            fill={RATING_COLORS.good}
            name="good"
          />
          <Bar
            dataKey="easy"
            stackId="reviews"
            fill={RATING_COLORS.easy}
            name="easy"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ReviewDistributionChart
