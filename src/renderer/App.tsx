/**
 * @fileoverview Root application component with React Router configuration and theme support
 * @lastmodified 2026-01-16T22:30:00Z
 *
 * Features: Client-side routing, layout wrapper, page navigation, theme management, error boundary, toast notifications
 * Main APIs: createHashRouter, RouterProvider from react-router-dom 7.x, ThemeProvider, ToastProvider
 * Constraints: All routes are nested under Layout for consistent navigation
 * Patterns: Uses React Router 7 data router pattern with nested routes, ErrorBoundary for graceful error handling
 *
 * Note: Uses createHashRouter instead of createBrowserRouter for Electron
 * compatibility with file:// protocol. Hash-based routing works correctly
 * when the app is loaded from the local filesystem.
 */

import { createHashRouter, RouterProvider, useNavigate } from 'react-router-dom'

import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/layout/Layout'
import { ToastProvider } from './components/Toast'
import { ThemeProvider } from './contexts/ThemeContext'
import styles from './components/ErrorBoundary.module.css'
import AnalyticsPage from './pages/AnalyticsPage'
import ConceptsPage from './pages/ConceptsPage'
import DashboardPage from './pages/DashboardPage'
import ReviewPage from './pages/ReviewPage'
import SettingsPage from './pages/SettingsPage'

/**
 * Custom error fallback for ConceptsPage
 * Provides navigation back to dashboard and retry functionality
 */
function ConceptsPageErrorFallback({
  error,
  resetError,
}: {
  error: Error
  resetError: () => void
}): React.JSX.Element {
  const navigate = useNavigate()

  function handleGoToDashboard(): void {
    resetError()
    navigate('/')
  }

  return (
    <div className={styles.errorBoundary} role="alert" aria-labelledby="concepts-error-title">
      <div className={styles.errorContent}>
        <div className={styles.errorIcon} aria-hidden="true">
          !
        </div>
        <h2 id="concepts-error-title" className={styles.errorTitle}>
          Unable to load Concepts
        </h2>
        <p className={styles.errorMessage}>{error.message}</p>
        <p className={styles.errorHint}>
          There was a problem loading the Concepts page. You can try again or return to the
          dashboard.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
          <button type="button" className="btn-secondary" onClick={handleGoToDashboard}>
            Go to Dashboard
          </button>
          <button type="button" className="btn-primary" onClick={resetError}>
            Try again
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Wrapper component for ConceptsPage with page-specific error boundary
 */
function ConceptsPageWithErrorBoundary(): React.JSX.Element {
  return (
    <ErrorBoundary
      fallback={(error, resetError) => (
        <ConceptsPageErrorFallback error={error} resetError={resetError} />
      )}
    >
      <ConceptsPage />
    </ErrorBoundary>
  )
}

/**
 * Custom error fallback for ReviewPage
 * Provides navigation back to dashboard and retry functionality
 */
function ReviewPageErrorFallback({
  error,
  resetError,
}: {
  error: Error
  resetError: () => void
}): React.JSX.Element {
  const navigate = useNavigate()

  function handleGoToDashboard(): void {
    resetError()
    navigate('/')
  }

  return (
    <div className={styles.errorBoundary} role="alert" aria-labelledby="review-error-title">
      <div className={styles.errorContent}>
        <div className={styles.errorIcon} aria-hidden="true">
          !
        </div>
        <h2 id="review-error-title" className={styles.errorTitle}>
          Unable to load Review session
        </h2>
        <p className={styles.errorMessage}>{error.message}</p>
        <p className={styles.errorHint}>
          There was a problem loading the Review page. You can try again or return to the dashboard.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
          <button type="button" className="btn-secondary" onClick={handleGoToDashboard}>
            Go to Dashboard
          </button>
          <button type="button" className="btn-primary" onClick={resetError}>
            Try again
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Wrapper component for ReviewPage with page-specific error boundary
 */
function ReviewPageWithErrorBoundary(): React.JSX.Element {
  return (
    <ErrorBoundary
      fallback={(error, resetError) => (
        <ReviewPageErrorFallback error={error} resetError={resetError} />
      )}
    >
      <ReviewPage />
    </ErrorBoundary>
  )
}

/**
 * Custom error fallback for DashboardPage
 * Only provides retry functionality since we're already on the dashboard
 */
function DashboardPageErrorFallback({
  error,
  resetError,
}: {
  error: Error
  resetError: () => void
}): React.JSX.Element {
  return (
    <div className={styles.errorBoundary} role="alert" aria-labelledby="dashboard-error-title">
      <div className={styles.errorContent}>
        <div className={styles.errorIcon} aria-hidden="true">
          !
        </div>
        <h2 id="dashboard-error-title" className={styles.errorTitle}>
          Unable to load Dashboard
        </h2>
        <p className={styles.errorMessage}>{error.message}</p>
        <p className={styles.errorHint}>
          There was a problem loading the Dashboard. Please try again.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
          <button type="button" className="btn-primary" onClick={resetError}>
            Try again
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Wrapper component for DashboardPage with page-specific error boundary
 */
function DashboardPageWithErrorBoundary(): React.JSX.Element {
  return (
    <ErrorBoundary
      fallback={(error, resetError) => (
        <DashboardPageErrorFallback error={error} resetError={resetError} />
      )}
    >
      <DashboardPage />
    </ErrorBoundary>
  )
}

/**
 * Custom error fallback for SettingsPage
 * Provides navigation back to dashboard and retry functionality
 */
function SettingsPageErrorFallback({
  error,
  resetError,
}: {
  error: Error
  resetError: () => void
}): React.JSX.Element {
  const navigate = useNavigate()

  function handleGoToDashboard(): void {
    resetError()
    navigate('/')
  }

  return (
    <div className={styles.errorBoundary} role="alert" aria-labelledby="settings-error-title">
      <div className={styles.errorContent}>
        <div className={styles.errorIcon} aria-hidden="true">
          !
        </div>
        <h2 id="settings-error-title" className={styles.errorTitle}>
          Unable to load Settings
        </h2>
        <p className={styles.errorMessage}>{error.message}</p>
        <p className={styles.errorHint}>
          There was a problem loading the Settings page. You can try again or return to the
          dashboard.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
          <button type="button" className="btn-secondary" onClick={handleGoToDashboard}>
            Go to Dashboard
          </button>
          <button type="button" className="btn-primary" onClick={resetError}>
            Try again
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Wrapper component for SettingsPage with page-specific error boundary
 */
function SettingsPageWithErrorBoundary(): React.JSX.Element {
  return (
    <ErrorBoundary
      fallback={(error, resetError) => (
        <SettingsPageErrorFallback error={error} resetError={resetError} />
      )}
    >
      <SettingsPage />
    </ErrorBoundary>
  )
}

/**
 * Custom error fallback for AnalyticsPage
 * Provides navigation back to dashboard and retry functionality
 */
function AnalyticsPageErrorFallback({
  error,
  resetError,
}: {
  error: Error
  resetError: () => void
}): React.JSX.Element {
  const navigate = useNavigate()

  function handleGoToDashboard(): void {
    resetError()
    navigate('/')
  }

  return (
    <div className={styles.errorBoundary} role="alert" aria-labelledby="analytics-error-title">
      <div className={styles.errorContent}>
        <div className={styles.errorIcon} aria-hidden="true">
          !
        </div>
        <h2 id="analytics-error-title" className={styles.errorTitle}>
          Unable to load Analytics
        </h2>
        <p className={styles.errorMessage}>{error.message}</p>
        <p className={styles.errorHint}>
          There was a problem loading the Analytics page. You can try again or return to the
          dashboard.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
          <button type="button" className="btn-secondary" onClick={handleGoToDashboard}>
            Go to Dashboard
          </button>
          <button type="button" className="btn-primary" onClick={resetError}>
            Try again
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Wrapper component for AnalyticsPage with page-specific error boundary
 */
function AnalyticsPageWithErrorBoundary(): React.JSX.Element {
  return (
    <ErrorBoundary
      fallback={(error, resetError) => (
        <AnalyticsPageErrorFallback error={error} resetError={resetError} />
      )}
    >
      <AnalyticsPage />
    </ErrorBoundary>
  )
}

/**
 * Application router configuration
 * Defines all available routes with Layout as the parent wrapper
 * Uses hash router for Electron file:// protocol compatibility
 */
const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <DashboardPageWithErrorBoundary />,
      },
      {
        path: 'review',
        element: <ReviewPageWithErrorBoundary />,
      },
      {
        path: 'analytics',
        element: <AnalyticsPageWithErrorBoundary />,
      },
      {
        path: 'concepts',
        element: <ConceptsPageWithErrorBoundary />,
      },
      {
        path: 'settings',
        element: <SettingsPageWithErrorBoundary />,
      },
    ],
  },
])

/**
 * Root App component
 * Provides theme context, toast notifications, error boundary, and router to the entire application
 */
function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ErrorBoundary>
          <RouterProvider router={router} />
        </ErrorBoundary>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
