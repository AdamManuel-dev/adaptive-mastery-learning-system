/**
 * @fileoverview Calendar-style heatmap showing weakness severity over time
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Grid heatmap visualization, color-coded severity levels, date/dimension matrix
 * Main APIs: analytics:getWeaknessHeatmap IPC endpoint
 * Constraints: Requires preload API with analytics support, shows last 30 days
 * Patterns: Functional component with hooks, custom CSS grid implementation (no Recharts heatmap)
 */

import { useEffect, useState, useMemo } from 'react'

import type {
  WeaknessHeatmapEntryDTO,
  WeaknessSeverity,
  Dimension,
} from '../../../shared/types/ipc'

/**
 * Human-readable labels for dimension types
 */
const DIMENSION_LABELS: Record<Dimension, string> = {
  definition: 'Def',
  paraphrase: 'Para',
  example: 'Ex',
  scenario: 'Scen',
  discrimination: 'Disc',
  cloze: 'Cloze',
}

/**
 * Full labels for tooltip
 */
const DIMENSION_FULL_LABELS: Record<Dimension, string> = {
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
 * Color mapping for severity levels
 */
const SEVERITY_COLORS: Record<WeaknessSeverity, string> = {
  none: '#22c55e', // Green
  mild: '#fcd34d', // Yellow
  moderate: '#f97316', // Orange
  critical: '#ef4444', // Red
}

/**
 * Background colors with opacity for cells
 */
const SEVERITY_BG_COLORS: Record<WeaknessSeverity, string> = {
  none: 'rgba(34, 197, 94, 0.3)',
  mild: 'rgba(252, 211, 77, 0.5)',
  moderate: 'rgba(249, 115, 22, 0.6)',
  critical: 'rgba(239, 68, 68, 0.7)',
}

/**
 * Human-readable labels for severity levels
 */
const SEVERITY_LABELS: Record<WeaknessSeverity, string> = {
  none: 'None',
  mild: 'Mild',
  moderate: 'Moderate',
  critical: 'Critical',
}

/**
 * Component state for data fetching
 */
interface ChartState {
  data: WeaknessHeatmapEntryDTO[] | null
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
 * Format date for tooltip (longer format)
 */
function formatDateLong(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Heatmap cell component
 */
interface HeatmapCellProps {
  severity: WeaknessSeverity
  date: string
  dimension: Dimension
}

function HeatmapCell({ severity, date, dimension }: HeatmapCellProps): React.JSX.Element {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '1',
        backgroundColor: SEVERITY_BG_COLORS[severity],
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        position: 'relative',
        border: `1px solid ${SEVERITY_COLORS[severity]}`,
        transition: 'transform 0.15s ease',
        transform: showTooltip ? 'scale(1.1)' : 'scale(1)',
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      role="gridcell"
      aria-label={`${DIMENSION_FULL_LABELS[dimension]} on ${formatDateLong(date)}: ${SEVERITY_LABELS[severity]} weakness`}
    >
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '4px',
            backgroundColor: 'var(--color-background)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-xs) var(--space-sm)',
            fontSize: 'var(--font-size-xs)',
            whiteSpace: 'nowrap',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>{DIMENSION_FULL_LABELS[dimension]}</p>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            {formatDateLong(date)}
          </p>
          <p
            style={{
              margin: 0,
              color: SEVERITY_COLORS[severity],
              fontWeight: 500,
            }}
          >
            {SEVERITY_LABELS[severity]}
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Legend component showing severity color mapping
 */
function SeverityLegend(): React.JSX.Element {
  const severities: WeaknessSeverity[] = ['none', 'mild', 'moderate', 'critical']

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
        marginTop: 'var(--space-md)',
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}
    >
      {severities.map((severity) => (
        <div
          key={severity}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)',
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              backgroundColor: SEVERITY_BG_COLORS[severity],
              border: `1px solid ${SEVERITY_COLORS[severity]}`,
              borderRadius: 'var(--radius-sm)',
            }}
          />
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {SEVERITY_LABELS[severity]}
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * WeaknessHeatmap Component
 *
 * Displays a calendar-style heatmap showing weakness severity for each dimension
 * over the last 30 days. Colors indicate severity: green (none) through red (critical).
 */
function WeaknessHeatmap(): React.JSX.Element {
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
                getWeaknessHeatmap: (args: { days: number }) => Promise<WeaknessHeatmapEntryDTO[]>
              }
            }
          }
        ).api.analytics?.getWeaknessHeatmap({ days: 30 })

        if (!response) {
          setState({
            data: null,
            isLoading: false,
            error: 'Analytics API not available',
          })
          return
        }

        setState({
          data: response,
          isLoading: false,
          error: null,
        })
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load heatmap data'
        setState({
          data: null,
          isLoading: false,
          error: message,
        })
        console.error('WeaknessHeatmap fetch error:', err)
      }
    }

    void fetchData()
  }, [])

  // Memoize the sorted data to prevent unnecessary re-renders
  const sortedData = useMemo(() => {
    if (!state.data) return null
    return [...state.data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }, [state.data])

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

  if (!sortedData || sortedData.length === 0) {
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
        Weakness Severity (Last 30 Days)
      </h3>
      <div
        style={{
          overflowX: 'auto',
          paddingBottom: 'var(--space-sm)',
        }}
      >
        <div
          role="grid"
          aria-label="Weakness heatmap showing severity by dimension and date"
          style={{
            display: 'grid',
            gridTemplateColumns: `60px repeat(${sortedData.length}, minmax(24px, 1fr))`,
            gap: '2px',
            minWidth: `${60 + sortedData.length * 26}px`,
          }}
        >
          {/* Header row with dates */}
          <div
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
              padding: '4px 0',
            }}
          />
          {sortedData.map((entry) => (
            <div
              key={entry.date}
              style={{
                fontSize: '10px',
                color: 'var(--color-text-muted)',
                textAlign: 'center',
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              {formatDate(entry.date)}
            </div>
          ))}

          {/* Data rows for each dimension */}
          {ALL_DIMENSIONS.map((dimension) => (
            <div
              key={dimension}
              role="row"
              style={{
                display: 'contents',
              }}
            >
              {/* Dimension label */}
              <div
                role="rowheader"
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  paddingRight: 'var(--space-sm)',
                }}
              >
                {DIMENSION_LABELS[dimension]}
              </div>
              {/* Cells for each date */}
              {sortedData.map((entry) => (
                <HeatmapCell
                  key={`${entry.date}-${dimension}`}
                  severity={entry.dimensions[dimension]}
                  date={entry.date}
                  dimension={dimension}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <SeverityLegend />
    </div>
  )
}

export default WeaknessHeatmap
