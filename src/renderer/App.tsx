/**
 * @fileoverview Root application component with React Router configuration
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Client-side routing, layout wrapper, page navigation
 * Main APIs: createBrowserRouter, RouterProvider from react-router-dom 7.x
 * Constraints: All routes are nested under Layout for consistent navigation
 * Patterns: Uses React Router 7 data router pattern with nested routes
 */

import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import Layout from './components/layout/Layout'
import ConceptsPage from './pages/ConceptsPage'
import DashboardPage from './pages/DashboardPage'
import ReviewPage from './pages/ReviewPage'
import SettingsPage from './pages/SettingsPage'

/**
 * Application router configuration
 * Defines all available routes with Layout as the parent wrapper
 */
const router = createBrowserRouter([
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
 * Provides the router context to the entire application
 */
function App(): React.JSX.Element {
  return <RouterProvider router={router} />
}

export default App
