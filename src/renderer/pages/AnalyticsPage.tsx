/**
 * @fileoverview Analytics dashboard page displaying comprehensive learning visualizations
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: 6 analytics charts in responsive grid, error boundaries per chart, loading states
 * Main APIs: Chart components from '../components/charts'
 * Constraints: Charts fetch their own data via preload API
 * Patterns: Card-based layout, CSS modules, WCAG 2.1 AA compliant
 */

import { Component, Suspense } from 'react'

import styles from './AnalyticsPage.module.css'
import {
  HealthScoreGauge,
  MasteryRadarChart,
  ProgressTimelineChart,
  ReviewDistributionChart,
  ResponseTimeChart,
  WeaknessHeatmap,
} from '../components/charts'

import type { ReactNode, ErrorInfo } from 'react'

/**
 * Props for error boundary component
 */
interface ErrorBoundaryProps {
  children: ReactNode
  chartName: string
}

/**
 * State for error boundary component
 */
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary component for graceful chart error handling
 * Catches rendering errors and displays a friendly fallback
 */
class ChartErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`Error in ${this.props.chartName}:`, error, errorInfo)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className={styles.chartError} role="alert">
          <p className={styles.chartErrorTitle}>Unable to load {this.props.chartName}</p>
          <p className={styles.chartErrorMessage}>
            {this.state.error?.message ?? 'An unexpected error occurred'}
          </p>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Loading fallback component for chart suspense
 */
function ChartLoadingFallback(): React.JSX.Element {
  return (
    <div
      className={styles.chartLoading}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={styles.loadingSpinner} aria-hidden="true" />
      <span>Loading chart...</span>
    </div>
  )
}

/**
 * Card wrapper component for consistent chart styling
 */
interface ChartCardProps {
  title: string
  description?: string
  children: ReactNode
  className?: string | undefined
}

function ChartCard({
  title,
  description,
  children,
  className,
}: ChartCardProps): React.JSX.Element {
  const cardClasses = className !== undefined && className !== ''
    ? `${styles.chartCard} ${className}`
    : styles.chartCard

  return (
    <article className={cardClasses}>
      <header className={styles.chartCardHeader}>
        <h2 className={styles.chartCardTitle}>{title}</h2>
        {description !== undefined && description !== '' && (
          <p className={styles.chartCardDescription}>{description}</p>
        )}
      </header>
      <div className={styles.chartCardContent}>
        {children}
      </div>
    </article>
  )
}

/**
 * AnalyticsPage Component
 *
 * Displays a comprehensive analytics dashboard with 6 chart visualizations:
 * - HealthScoreGauge: Overall mastery score as a semi-circle gauge
 * - MasteryRadarChart: Mastery across 6 learning dimensions
 * - ProgressTimelineChart: Mastery progress over time
 * - ReviewDistributionChart: Review results by dimension
 * - ResponseTimeChart: Response time statistics
 * - WeaknessHeatmap: Weakness patterns over time
 */
function AnalyticsPage(): React.JSX.Element {
  return (
    <div className={styles.analytics}>
      <header className={styles.header}>
        <h1>Analytics Dashboard</h1>
        <p className={styles.subtitle}>
          Visualize your learning patterns and progress
        </p>
      </header>

      <main className={styles.chartsGrid} role="main" aria-label="Analytics charts">
        {/* Row 1: Health Score (1/3) + Mastery Radar (2/3) */}
        <section className={styles.row}>
          <ChartCard
            title="Health Score"
            description="Your overall learning health at a glance"
            className={styles.healthScoreCard}
          >
            <ChartErrorBoundary chartName="Health Score Gauge">
              <Suspense fallback={<ChartLoadingFallback />}>
                <HealthScoreGauge />
              </Suspense>
            </ChartErrorBoundary>
          </ChartCard>

          <ChartCard
            title="Dimension Mastery"
            description="Mastery level across all 6 learning dimensions"
            className={styles.masteryRadarCard}
          >
            <ChartErrorBoundary chartName="Mastery Radar Chart">
              <Suspense fallback={<ChartLoadingFallback />}>
                <MasteryRadarChart />
              </Suspense>
            </ChartErrorBoundary>
          </ChartCard>
        </section>

        {/* Row 2: Progress Timeline (full width) */}
        <section className={styles.row}>
          <ChartCard
            title="Progress Timeline"
            description="Track your mastery growth over the past 30 days"
            className={styles.fullWidthCard}
          >
            <ChartErrorBoundary chartName="Progress Timeline Chart">
              <Suspense fallback={<ChartLoadingFallback />}>
                <ProgressTimelineChart />
              </Suspense>
            </ChartErrorBoundary>
          </ChartCard>
        </section>

        {/* Row 3: Review Distribution (1/2) + Response Time (1/2) */}
        <section className={styles.row}>
          <ChartCard
            title="Review Distribution"
            description="How your review results are distributed by dimension"
            className={styles.halfWidthCard}
          >
            <ChartErrorBoundary chartName="Review Distribution Chart">
              <Suspense fallback={<ChartLoadingFallback />}>
                <ReviewDistributionChart />
              </Suspense>
            </ChartErrorBoundary>
          </ChartCard>

          <ChartCard
            title="Response Time Analysis"
            description="Your response speed across difficulty levels"
            className={styles.halfWidthCard}
          >
            <ChartErrorBoundary chartName="Response Time Chart">
              <Suspense fallback={<ChartLoadingFallback />}>
                <ResponseTimeChart />
              </Suspense>
            </ChartErrorBoundary>
          </ChartCard>
        </section>

        {/* Row 4: Weakness Heatmap (full width) */}
        <section className={styles.row}>
          <ChartCard
            title="Weakness Patterns"
            description="Identify areas that need more attention over time"
            className={styles.fullWidthCard}
          >
            <ChartErrorBoundary chartName="Weakness Heatmap">
              <Suspense fallback={<ChartLoadingFallback />}>
                <WeaknessHeatmap />
              </Suspense>
            </ChartErrorBoundary>
          </ChartCard>
        </section>
      </main>
    </div>
  )
}

export default AnalyticsPage
