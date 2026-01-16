/**
 * @fileoverview Vite configuration for web-only development (Chrome/browser)
 * @lastmodified 2025-01-16T19:30:00Z
 *
 * Features: Browser-compatible dev server without Electron
 * Main APIs: Standard Vite dev server on port 5173
 * Constraints: Uses mock API instead of IPC
 * Patterns: Separate config from electron-vite for browser development
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  root: 'src/renderer',
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer'),
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
  server: {
    port: 5173,
    open: true, // Auto-open in default browser
  },
  build: {
    outDir: '../../out/renderer-web',
  },
})
