/**
 * @fileoverview Toast notification component for user feedback
 * @lastmodified 2026-01-16T23:30:00Z
 *
 * Features: Success/error/info variants, auto-dismiss, slide-in animation, accessible
 * Main APIs: Toast component, useToast hook, ToastProvider context
 * Constraints: Auto-dismisses after 3 seconds by default
 * Patterns: Context-based state management, ARIA live regions for accessibility
 * Accessibility: Keyboard navigation (Escape to dismiss), 44x44 touch targets, auto-focus for errors
 */

import { Check, X, Info } from 'lucide-react'
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
  type KeyboardEvent,
} from 'react'

import styles from './Toast.module.css'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/**
 * Toast notification variant
 */
type ToastVariant = 'success' | 'error' | 'info'

/**
 * Toast notification data
 */
interface ToastData {
  id: string
  message: string
  variant: ToastVariant
}

/**
 * Toast context value
 */
interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void
  hideToast: (id: string) => void
}

// -----------------------------------------------------------------------------
// Context
// -----------------------------------------------------------------------------

const ToastContext = createContext<ToastContextValue | null>(null)

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

/**
 * Hook to access toast notifications
 * Must be used within a ToastProvider
 */
function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// -----------------------------------------------------------------------------
// Toast Item Component
// -----------------------------------------------------------------------------

interface ToastItemProps {
  toast: ToastData
  onClose: (id: string) => void
}

/**
 * Individual toast notification item
 * Supports keyboard navigation: Escape to dismiss, Enter/Space on close button
 */
function ToastItem({ toast, onClose }: ToastItemProps): React.JSX.Element {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Trigger enter animation on mount
  useEffect(() => {
    // Small delay to trigger CSS transition
    const enterTimer = setTimeout(() => {
      setIsVisible(true)
    }, 10)

    return () => clearTimeout(enterTimer)
  }, [])

  // Auto-focus close button for error toasts (critical notifications)
  useEffect(() => {
    if (toast.variant === 'error' && closeButtonRef.current) {
      closeButtonRef.current.focus()
    }
  }, [toast.variant])

  // Auto-dismiss after 3 seconds
  useEffect(() => {
    const dismissTimer = setTimeout(() => {
      setIsExiting(true)
      // Wait for exit animation before removing
      setTimeout(() => {
        onClose(toast.id)
      }, 300)
    }, 3000)

    return () => clearTimeout(dismissTimer)
  }, [toast.id, onClose])

  const handleClose = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => {
      onClose(toast.id)
    }, 300)
  }, [toast.id, onClose])

  // Handle keyboard events for accessibility
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        handleClose()
      }
    },
    [handleClose]
  )

  const variantClass = styles[toast.variant]
  const stateClass = isExiting ? styles.exiting : isVisible ? styles.visible : ''

  // Use alertdialog for error toasts to indicate interactive dismissal
  const role = toast.variant === 'error' ? 'alertdialog' : 'status'
  const ariaLive = toast.variant === 'error' ? 'assertive' : 'polite'

  return (
    <div
      className={`${styles.toast} ${variantClass} ${stateClass}`}
      role={role}
      aria-live={ariaLive}
      aria-label={toast.variant === 'error' ? `Error: ${toast.message}` : undefined}
      onKeyDown={handleKeyDown}
    >
      <span className={styles.icon}>{getIcon(toast.variant)}</span>
      <span className={styles.message}>{toast.message}</span>
      <button
        ref={closeButtonRef}
        type="button"
        className={styles.closeButton}
        onClick={handleClose}
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Toast Provider Component
// -----------------------------------------------------------------------------

interface ToastProviderProps {
  children: ReactNode
}

/**
 * Toast notification provider
 * Wrap your app with this to enable toast notifications
 */
function ToastProvider({ children }: ToastProviderProps): React.JSX.Element {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    setToasts((prev) => [...prev, { id, message, variant }])
  }, [])

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const contextValue: ToastContextValue = {
    showToast,
    hideToast,
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toasts.length > 0 && (
        <div className={styles.toastContainer} aria-label="Notifications">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onClose={hideToast} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Get icon for toast variant
 */
function getIcon(variant: ToastVariant): React.JSX.Element {
  switch (variant) {
    case 'success':
      return <Check size={20} />
    case 'error':
      return <X size={20} />
    case 'info':
    default:
      return <Info size={20} />
  }
}

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

export { ToastProvider, useToast }
export type { ToastVariant, ToastData }
