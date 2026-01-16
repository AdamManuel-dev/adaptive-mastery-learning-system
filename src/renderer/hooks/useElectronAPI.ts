/**
 * @fileoverview Safe wrapper hook for accessing Electron's preload API
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Null-safe access to window.api, error handling for missing preload
 * Main APIs: useElectronAPI hook, getElectronAPI utility
 * Constraints: Throws descriptive error if preload script failed to load
 * Patterns: Hook-based access for React components, utility function for non-React contexts
 *
 * This hook provides type-safe access to the Electron API exposed via the preload
 * script. It handles the case where the preload script may have failed to load
 * (e.g., during development with hot reload, or in web-only mode).
 */

// Import the preload types to ensure Window.api is typed
import '../../preload/index.d'

/**
 * Error thrown when the Electron API is not available
 */
export class ElectronAPINotAvailableError extends Error {
  constructor() {
    super(
      'Electron API not available - the preload script may have failed to load. ' +
        'If running in development mode, try restarting the Electron process.'
    )
    this.name = 'ElectronAPINotAvailableError'
  }
}

/**
 * Get the Electron API from window with null safety
 *
 * Use this utility function in non-React contexts (event handlers, utilities)
 * where hooks cannot be called.
 *
 * @returns The window.api object
 * @throws {ElectronAPINotAvailableError} When preload script failed to load
 *
 * @example
 * ```typescript
 * try {
 *   const api = getElectronAPI();
 *   const concepts = await api.concepts.getAll();
 * } catch (error) {
 *   if (error instanceof ElectronAPINotAvailableError) {
 *     console.error('Running outside Electron context');
 *   }
 * }
 * ```
 */
export function getElectronAPI(): NonNullable<typeof window.api> {
  if (!window.api) {
    throw new ElectronAPINotAvailableError()
  }
  return window.api
}

/**
 * Check if the Electron API is available
 *
 * Use this to conditionally render UI or enable features that require
 * the Electron API without throwing an error.
 *
 * @returns true if window.api is available, false otherwise
 *
 * @example
 * ```typescript
 * if (isElectronAPIAvailable()) {
 *   // Safe to use getElectronAPI()
 * } else {
 *   // Show web-only fallback
 * }
 * ```
 */
export function isElectronAPIAvailable(): boolean {
  return typeof window !== 'undefined' && window.api !== undefined
}

/**
 * React hook for accessing the Electron API with null safety
 *
 * This hook provides safe access to the window.api object exposed by
 * the Electron preload script. It throws a descriptive error if the
 * API is not available, making it easy to identify preload issues.
 *
 * @returns The window.api object with full type safety
 * @throws {ElectronAPINotAvailableError} When preload script failed to load
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const api = useElectronAPI();
 *
 *   useEffect(() => {
 *     async function loadData() {
 *       const concepts = await api.concepts.getAll();
 *       setConcepts(concepts);
 *     }
 *     void loadData();
 *   }, [api]);
 * }
 * ```
 */
export function useElectronAPI(): NonNullable<typeof window.api> {
  return getElectronAPI()
}

/**
 * React hook that returns the API if available, or null if not
 *
 * Use this hook when you want to handle the missing API case gracefully
 * in your component rather than throwing an error.
 *
 * @returns The window.api object or null if not available
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const api = useElectronAPIOrNull();
 *
 *   if (!api) {
 *     return <div>Running in web mode - some features unavailable</div>;
 *   }
 *
 *   // Use api safely here
 * }
 * ```
 */
export function useElectronAPIOrNull(): typeof window.api | null {
  if (!isElectronAPIAvailable()) {
    return null
  }
  return window.api
}
