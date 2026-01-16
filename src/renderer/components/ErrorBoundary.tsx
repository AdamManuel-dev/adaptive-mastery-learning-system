/**
 * @fileoverview Error boundary component for graceful error handling
 * @lastmodified 2026-01-16T19:00:00Z
 *
 * Features: Catches React errors, displays fallback UI, provides reset functionality
 * Main APIs: React.Component with getDerivedStateFromError and componentDidCatch
 * Constraints: Only catches errors in child component tree, not in event handlers
 * Patterns: Class component pattern (required for error boundaries in React)
 */

import React from 'react'

import styles from './ErrorBoundary.module.css'

interface ErrorBoundaryProps {
  /** Child components to render */
  children: React.ReactNode
  /** Optional custom fallback renderer */
  fallback?: (error: Error, resetError: () => void) => React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary component that catches JavaScript errors in child component tree
 * Displays a fallback UI and provides reset functionality
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error)
    console.error('Component stack:', errorInfo.componentStack)
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): React.ReactNode {
    const { hasError, error } = this.state
    const { children, fallback } = this.props

    if (hasError && error) {
      if (fallback) {
        return fallback(error, this.resetError)
      }

      return (
        <div className={styles.errorBoundary} role="alert">
          <div className={styles.errorContent}>
            <div className={styles.errorIcon} aria-hidden="true">
              !
            </div>
            <h2 className={styles.errorTitle}>Something went wrong</h2>
            <p className={styles.errorMessage}>{error.message}</p>
            <p className={styles.errorHint}>
              Try refreshing the page or click the button below to recover.
            </p>
            <button
              type="button"
              className={`btn-primary ${styles.resetButton}`}
              onClick={this.resetError}
            >
              Try again
            </button>
          </div>
        </div>
      )
    }

    return children
  }
}

export default ErrorBoundary
