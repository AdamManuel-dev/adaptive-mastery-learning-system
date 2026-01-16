/**
 * @fileoverview Dashboard page showing mastery overview and quick actions
 * @lastmodified 2026-01-16T19:00:00Z
 *
 * Features: Mastery overview cards, due cards count, start review button, dimension skill bars, accessible loading states
 * Main APIs: useElectronAPI hook for safe API access
 * Constraints: Requires preload API to be available (useElectronAPI provides error handling)
 * Patterns: Card-based layout with clear visual hierarchy, hook-based API access, WCAG 2.1 AA compliant
 */

import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'

import styles from './DashboardPage.module.css'
import { useElectronAPI } from '../hooks/useElectronAPI'

import type { ConceptDTO, DueCountDTO, MasteryProfileDTO, Dimension } from '../../shared/types/ipc'

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
 * Dashboard page component
 * Provides overview of learning progress and quick access to review sessions
 */
function DashboardPage(): React.JSX.Element {
  const api = useElectronAPI()
  const [masteryProfile, setMasteryProfile] = useState<MasteryProfileDTO | null>(null)
  const [dueCount, setDueCount] = useState<DueCountDTO | null>(null)
  const [concepts, setConcepts] = useState<ConceptDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch dashboard data from API
   * Extracted as callback for reuse in initial load and retry
   */
  const fetchDashboardData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)

      const [profileResult, dueResult, conceptsResult] = await Promise.all([
        api.mastery.getProfile(),
        api.review.getDueCount(),
        api.concepts.getAll(),
      ])

      setMasteryProfile(profileResult)
      setDueCount(dueResult)
      setConcepts(conceptsResult)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard data'
      setError(message)
      console.error('Dashboard data fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [api])

  useEffect(() => {
    void fetchDashboardData()
  }, [fetchDashboardData])

  const totalConcepts = concepts.length
  const dueForReview = dueCount?.total ?? 0
  const overallMastery = masteryProfile?.overallScore ?? 0
  const hasData = totalConcepts > 0

  if (isLoading) {
    return (
      <div className={styles.dashboard}>
        <header className={styles.header}>
          <h1>Dashboard</h1>
          <p className={styles.subtitle}>Loading your learning progress...</p>
        </header>
        <div
          className={styles.loadingState}
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className={styles.loadingSpinner} aria-hidden="true" />
          <p>Fetching data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.dashboard}>
        <header className={styles.header}>
          <h1>Dashboard</h1>
          <p className={styles.subtitle}>Track your learning progress and mastery</p>
        </header>
        <div className={styles.errorState} role="alert">
          <p>Error: {error}</p>
          <button
            type="button"
            onClick={() => void fetchDashboardData()}
            className="btn-secondary"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1>Dashboard</h1>
        <p className={styles.subtitle}>Track your learning progress and mastery</p>
      </header>

      {/* Quick Stats */}
      <section className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statPrimary}`}>
          <span className={styles.statValue}>{dueForReview}</span>
          <span className={styles.statLabel}>Cards Due</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{totalConcepts}</span>
          <span className={styles.statLabel}>Total Concepts</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{Math.round(overallMastery)}%</span>
          <span className={styles.statLabel}>Overall Mastery</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{masteryProfile?.dimensions.length ?? 0}</span>
          <span className={styles.statLabel}>Dimensions</span>
        </div>
      </section>

      {/* Main Actions */}
      <section className={styles.actionsSection}>
        <div className={styles.actionCard}>
          <h2>Ready to Review</h2>
          {dueForReview > 0 ? (
            <>
              <p>You have {dueForReview} cards waiting for review.</p>
              <Link to="/review" className={`btn-primary ${styles.actionButton}`}>
                Start Review Session
              </Link>
            </>
          ) : (
            <>
              <p className={styles.emptyMessage}>No cards due for review right now.</p>
              <Link to="/concepts" className={`btn-secondary ${styles.actionButton}`}>
                Add New Concepts
              </Link>
            </>
          )}
        </div>

        <div className={styles.actionCard}>
          <h2>Overall Mastery</h2>
          {hasData ? (
            <>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${overallMastery}%` }}
                />
              </div>
              <div className={styles.progressStats}>
                <span>{Math.round(overallMastery)}% overall mastery across {totalConcepts} concepts</span>
              </div>
            </>
          ) : (
            <p className={styles.emptyMessage}>
              Start adding concepts to track your mastery progress.
            </p>
          )}
        </div>
      </section>

      {/* Dimension Skill Bars */}
      {masteryProfile && masteryProfile.dimensions.length > 0 && (
        <section className={styles.dimensionsSection}>
          <h2>Mastery by Dimension</h2>
          {masteryProfile.weakestDimension && (
            <div className={styles.weakestWarning}>
              <span className={styles.warningIcon}>!</span>
              <span>
                Focus area: <strong>{DIMENSION_LABELS[masteryProfile.weakestDimension]}</strong> needs
                more practice
              </span>
            </div>
          )}
          <div className={styles.dimensionsList}>
            {masteryProfile.dimensions.map((dimension) => {
              const isWeakest = dimension.dimension === masteryProfile.weakestDimension
              const isStrongest = dimension.dimension === masteryProfile.strongestDimension
              // Clamp to 0-100 range in case of invalid data
              const masteryPercent = Math.min(100, Math.max(0, Math.round(dimension.accuracyEwma * 100)))

              return (
                <div
                  key={dimension.dimension}
                  className={`${styles.dimensionItem} ${isWeakest ? styles.dimensionWeakest : ''} ${isStrongest ? styles.dimensionStrongest : ''}`}
                >
                  <div className={styles.dimensionHeader}>
                    <span className={styles.dimensionLabel}>
                      {DIMENSION_LABELS[dimension.dimension]}
                      {isWeakest && <span className={styles.weakBadge}>Needs Work</span>}
                      {isStrongest && <span className={styles.strongBadge}>Strongest</span>}
                    </span>
                    <span className={styles.dimensionPercent}>{masteryPercent}%</span>
                  </div>
                  <div className={styles.dimensionBar}>
                    <div
                      className={`${styles.dimensionFill} ${isWeakest ? styles.dimensionFillWeak : ''}`}
                      style={{ width: `${masteryPercent}%` }}
                    />
                  </div>
                  <div className={styles.dimensionMeta}>
                    <span>{dimension.count} reviews</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/*
        TODO: Implement activity tracking feature
        The Recent Activity section has been removed until activity tracking
        is implemented in the backend. This would show review history,
        concept additions, and mastery milestones.
      */}
    </div>
  )
}

export default DashboardPage
