/**
 * @fileoverview Electron main process entry point
 * @lastmodified 2025-01-16T00:00:00Z
 *
 * Features: Window management, app lifecycle, security configuration
 * Main APIs: createWindow(), app event handlers
 * Constraints: contextIsolation and sandbox must be enabled
 * Patterns: Single window with ready-to-show pattern
 */

import { join } from 'path'

import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, shell } from 'electron'

import { closeDatabase, initializeDatabase } from './infrastructure/database/connection'
import { seedAll } from './infrastructure/database/seed'
import { registerIPCHandlers } from './ipc'

// -----------------------------------------------------------------------------
// Window Management
// -----------------------------------------------------------------------------

let mainWindow: BrowserWindow | null = null

/**
 * Creates the main application window with secure defaults
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    title: 'Adaptive Mastery Learning System',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  })

  // Show window when ready to prevent visual flash
  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load the renderer
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    void mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Open DevTools in development
  if (is.dev) {
    mainWindow.webContents.openDevTools()
  }

  // Clean up reference on close
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// -----------------------------------------------------------------------------
// App Lifecycle
// -----------------------------------------------------------------------------

/**
 * Initialize the application when Electron is ready
 */
void app.whenReady().then(() => {
  // Set app user model id for Windows
  electronApp.setAppUserModelId('com.adaptive-mastery.app')

  // Default open/close DevTools by F12 in development
  // Ignore CommandOrControl + R in production
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Register all IPC handlers
  registerIPCHandlers()

  // Initialize database and seed with default data
  initializeDatabase()
  seedAll()

  // Create the main window
  createWindow()

  // macOS: Re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

/**
 * Quit when all windows are closed, except on macOS
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

/**
 * Handle app quit for cleanup
 */
app.on('before-quit', () => {
  closeDatabase()
})

// -----------------------------------------------------------------------------
// Security
// -----------------------------------------------------------------------------

// Prevent navigation to untrusted URLs
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, url) => {
    const allowedOrigins = ['http://localhost', 'https://localhost', 'file://']
    const isAllowed = allowedOrigins.some((origin) => url.startsWith(origin))

    if (!isAllowed) {
      event.preventDefault()
      console.warn(`Blocked navigation to: ${url}`)
    }
  })
})
