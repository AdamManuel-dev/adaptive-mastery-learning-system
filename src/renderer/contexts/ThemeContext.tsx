/**
 * @fileoverview Theme context for managing application theme with system preference support
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Theme state management, system preference detection, persistence integration
 * Main APIs: ThemeProvider, useTheme hook
 * Constraints: Must be wrapped at app root for theme to work across all components
 * Patterns: React Context with localStorage fallback, CSS custom property theming
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'

import { isElectronAPIAvailable, getElectronAPI } from '../hooks/useElectronAPI'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/**
 * Available theme options
 */
export type Theme = 'light' | 'dark' | 'system'

/**
 * Resolved theme (what's actually applied to the DOM)
 */
export type ResolvedTheme = 'light' | 'dark'

/**
 * Theme context value
 */
interface ThemeContextValue {
  /** Current theme setting (user preference) */
  theme: Theme
  /** Resolved theme (accounting for system preference when theme is 'system') */
  resolvedTheme: ResolvedTheme
  /** Update the theme setting */
  setTheme: (theme: Theme) => void
  /** Whether theme has been loaded from storage */
  isLoaded: boolean
}

// -----------------------------------------------------------------------------
// Context
// -----------------------------------------------------------------------------

const ThemeContext = createContext<ThemeContextValue | null>(null)

// -----------------------------------------------------------------------------
// System Preference Detection
// -----------------------------------------------------------------------------

/**
 * Get the system's preferred color scheme
 */
function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') {
    return 'light'
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Resolve theme to actual light/dark value
 */
function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    return getSystemTheme()
  }
  return theme
}

// -----------------------------------------------------------------------------
// DOM Application
// -----------------------------------------------------------------------------

/**
 * Apply theme to the document root element
 */
function applyThemeToDOM(resolvedTheme: ResolvedTheme): void {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement

  // Set data-theme attribute for CSS variable switching
  root.setAttribute('data-theme', resolvedTheme)

  // Also set color-scheme for native browser styling (scrollbars, etc.)
  root.style.colorScheme = resolvedTheme
}

// -----------------------------------------------------------------------------
// Provider Component
// -----------------------------------------------------------------------------

interface ThemeProviderProps {
  children: ReactNode
  /** Optional default theme for initial render before storage is loaded */
  defaultTheme?: Theme
}

/**
 * Theme provider component that manages theme state and persistence
 *
 * Wraps the application to provide theme context to all components.
 * Automatically loads theme from settings on mount and syncs changes.
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
}: ThemeProviderProps): React.JSX.Element {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(defaultTheme)
  )
  const [isLoaded, setIsLoaded] = useState(false)

  // Load theme from settings on mount
  useEffect(() => {
    async function loadTheme(): Promise<void> {
      try {
        if (isElectronAPIAvailable()) {
          const api = getElectronAPI()
          const settings = await api.settings.get()
          if (settings.theme) {
            setThemeState(settings.theme)
            const resolved = resolveTheme(settings.theme)
            setResolvedTheme(resolved)
            applyThemeToDOM(resolved)
          }
        } else {
          // Fallback to localStorage for browser mode
          const stored = localStorage.getItem('theme') as Theme | null
          if (stored && ['light', 'dark', 'system'].includes(stored)) {
            setThemeState(stored)
            const resolved = resolveTheme(stored)
            setResolvedTheme(resolved)
            applyThemeToDOM(resolved)
          }
        }
      } catch (error) {
        console.error('[ThemeContext] Failed to load theme:', error)
      } finally {
        setIsLoaded(true)
      }
    }

    void loadTheme()
  }, [])

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (theme !== 'system') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    function handleChange(event: MediaQueryListEvent): void {
      const newResolvedTheme = event.matches ? 'dark' : 'light'
      setResolvedTheme(newResolvedTheme)
      applyThemeToDOM(newResolvedTheme)
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme])

  // Apply theme to DOM when it changes
  useEffect(() => {
    const resolved = resolveTheme(theme)
    setResolvedTheme(resolved)
    applyThemeToDOM(resolved)
  }, [theme])

  // Set theme with persistence
  const setTheme = useCallback((newTheme: Theme): void => {
    setThemeState(newTheme)
    const resolved = resolveTheme(newTheme)
    setResolvedTheme(resolved)
    applyThemeToDOM(resolved)

    // Persist to settings (async, non-blocking)
    if (isElectronAPIAvailable()) {
      const api = getElectronAPI()
      void api.settings.set({ theme: newTheme }).catch((error) => {
        console.error('[ThemeContext] Failed to persist theme:', error)
      })
    } else {
      // Fallback to localStorage for browser mode
      localStorage.setItem('theme', newTheme)
    }
  }, [])

  const value: ThemeContextValue = {
    theme,
    resolvedTheme,
    setTheme,
    isLoaded,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

/**
 * Hook to access theme context
 *
 * @returns Theme context value with current theme and setter
 * @throws Error if used outside of ThemeProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, setTheme, resolvedTheme } = useTheme();
 *
 *   return (
 *     <button onClick={() => setTheme('dark')}>
 *       Current: {resolvedTheme}
 *     </button>
 *   );
 * }
 * ```
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}
