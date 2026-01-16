/**
 * @fileoverview React 19 application entry point for the Adaptive Mastery Learning System
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Application bootstrap, StrictMode wrapper, RouterProvider setup
 * Main APIs: ReactDOM.createRoot() for React 19 concurrent rendering
 * Constraints: Requires DOM element with id "root"
 * Patterns: Uses React 19 concurrent features with StrictMode for development checks
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
import './styles/index.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Failed to find root element. Ensure index.html has a div with id="root".')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)
