/**
 * @fileoverview Root application component with React Router configuration and theme support
 * @lastmodified 2026-01-16T19:00:00Z
 *
 * Features: Client-side routing, layout wrapper, page navigation, theme management, error boundary
 * Main APIs: createHashRouter, RouterProvider from react-router-dom 7.x, ThemeProvider
 * Constraints: All routes are nested under Layout for consistent navigation
 * Patterns: Uses React Router 7 data router pattern with nested routes, ErrorBoundary for graceful error handling
 *
 * Note: Uses createHashRouter instead of createBrowserRouter for Electron
 * compatibility with file:// protocol. Hash-based routing works correctly
 * when the app is loaded from the local filesystem.
 */

import { createHashRouter, RouterProvider } from 'react-router-dom'

import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/layout/Layout'
import { ThemeProvider } from './contexts/ThemeContext'
import ConceptsPage from './pages/ConceptsPage'
import DashboardPage from './pages/DashboardPage'
import ReviewPage from './pages/ReviewPage'
import SettingsPage from './pages/SettingsPage'

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
        element: <DashboardPage />,
      },
      {
        path: 'review',
        element: <ReviewPage />,
      },
      {
        path: 'concepts',
        element: <ConceptsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
])

/**
 * Root App component
 * Provides theme context, error boundary, and router to the entire application
 */
function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </ThemeProvider>
  )
}

export default App
