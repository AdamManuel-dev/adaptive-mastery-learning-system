/**
 * @fileoverview IPC handlers for settings operations with file-based persistence
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Application settings retrieval, updates, and LLM API connection testing
 * Main APIs: registerSettingsHandlers()
 * Constraints: Settings persisted to JSON file in user data directory
 * Patterns: Handler registration with error handling wrapper, file-based persistence
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'

import { app } from 'electron'

import { registerHandler } from './index'

import type { SettingsDTO, LLMConfigDTO } from '../../shared/types/ipc'

// -----------------------------------------------------------------------------
// Settings File Path
// -----------------------------------------------------------------------------

/**
 * Get the path to the settings file in user data directory
 */
function getSettingsFilePath(): string {
  const userDataPath = app.getPath('userData')
  return join(userDataPath, 'settings.json')
}

// -----------------------------------------------------------------------------
// Default Settings
// -----------------------------------------------------------------------------

/**
 * Default settings based on MVP.md algorithms
 */
const DEFAULT_SETTINGS: SettingsDTO = {
  // EWMA smoothing factor (0.15 as per MVP spec)
  ewmaAlpha: 0.15,
  // Target response times by difficulty level (ms)
  targetTimes: {
    1: 5000, // Easy
    2: 10000, // Medium-Easy
    3: 20000, // Medium
    4: 40000, // Medium-Hard
    5: 60000, // Hard
  },
  // Number of consecutive failures before anti-frustration kicks in
  antiFrustrationThreshold: 3,
  // Review session settings
  cardsPerSession: 25,
  newCardsPerDay: 10,
  // LLM configuration (empty by default - user must configure)
  llm: {
    provider: 'openai',
    apiKey: '',
    model: 'gpt-4o-mini',
  },
  // UI theme
  theme: 'system',
}

// -----------------------------------------------------------------------------
// Persistence Layer
// -----------------------------------------------------------------------------

/**
 * Load settings from file, returning defaults if file doesn't exist
 */
function loadSettings(): SettingsDTO {
  const filePath = getSettingsFilePath()

  try {
    if (existsSync(filePath)) {
      const data = readFileSync(filePath, 'utf-8')
      const parsed = JSON.parse(data) as Partial<SettingsDTO>

      // Deep merge with defaults to handle missing fields from older versions
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        targetTimes: {
          ...DEFAULT_SETTINGS.targetTimes,
          ...(parsed.targetTimes ?? {}),
        },
        llm: {
          ...DEFAULT_SETTINGS.llm,
          ...(parsed.llm ?? {}),
        },
      }
    }
  } catch (error) {
    console.error('[Settings] Failed to load settings:', error)
  }

  return { ...DEFAULT_SETTINGS }
}

/**
 * Save settings to file
 */
function saveSettings(settings: SettingsDTO): void {
  const filePath = getSettingsFilePath()

  try {
    // Ensure directory exists
    const dirPath = dirname(filePath)
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true })
    }

    writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf-8')
  } catch (error) {
    console.error('[Settings] Failed to save settings:', error)
    throw error
  }
}

// -----------------------------------------------------------------------------
// In-Memory Cache
// -----------------------------------------------------------------------------

let currentSettings: SettingsDTO | null = null

/**
 * Get settings, loading from file if not cached
 */
function getSettings(): SettingsDTO {
  if (!currentSettings) {
    currentSettings = loadSettings()
  }
  return currentSettings
}

// -----------------------------------------------------------------------------
// API Connection Testing
// -----------------------------------------------------------------------------

/**
 * Test connection to LLM API
 */
async function testLLMConnection(config: LLMConfigDTO): Promise<{
  success: boolean
  message: string
  latencyMs?: number
}> {
  const startTime = Date.now()

  // Validate required fields
  if (!config.apiKey) {
    return { success: false, message: 'API key is required' }
  }

  try {
    let testUrl: string
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    switch (config.provider) {
      case 'openai':
        testUrl = config.baseUrl ?? 'https://api.openai.com/v1/models'
        headers['Authorization'] = `Bearer ${config.apiKey}`
        break

      case 'anthropic':
        testUrl = config.baseUrl ?? 'https://api.anthropic.com/v1/messages'
        headers['x-api-key'] = config.apiKey
        headers['anthropic-version'] = '2023-06-01'
        // For Anthropic, we need to make a minimal request
        break

      case 'local':
        testUrl = config.baseUrl ?? 'http://localhost:11434/api/tags'
        break

      default:
        return { success: false, message: `Unknown provider: ${config.provider}` }
    }

    // Make the test request
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      const fetchOptions: RequestInit = {
        method: config.provider === 'anthropic' ? 'POST' : 'GET',
        headers,
        signal: controller.signal,
      }

      // Only add body for Anthropic POST requests
      if (config.provider === 'anthropic') {
        fetchOptions.body = JSON.stringify({
          model: config.model || 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }],
        })
      }

      const response = await fetch(testUrl, fetchOptions)

      clearTimeout(timeout)
      const latencyMs = Date.now() - startTime

      if (response.ok) {
        return {
          success: true,
          message: `Connected successfully (${latencyMs}ms)`,
          latencyMs,
        }
      }

      // Handle specific error codes
      if (response.status === 401) {
        return { success: false, message: 'Invalid API key', latencyMs }
      }
      if (response.status === 403) {
        return { success: false, message: 'API key does not have access', latencyMs }
      }
      if (response.status === 429) {
        return { success: false, message: 'Rate limited - try again later', latencyMs }
      }

      return {
        success: false,
        message: `API returned status ${response.status}`,
        latencyMs,
      }
    } catch (fetchError) {
      clearTimeout(timeout)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return { success: false, message: 'Connection timed out (10s)' }
      }
      throw fetchError
    }
  } catch (error) {
    const latencyMs = Date.now() - startTime
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, message: `Connection failed: ${message}`, latencyMs }
  }
}

// -----------------------------------------------------------------------------
// Handlers
// -----------------------------------------------------------------------------

/**
 * Registers all settings-related IPC handlers
 */
export function registerSettingsHandlers(): void {
  // Get current settings
  registerHandler('settings:get', () => {
    return getSettings()
  })

  // Update settings
  registerHandler('settings:set', (_event, data: Partial<SettingsDTO>) => {
    const current = getSettings()

    // Deep merge with current settings
    currentSettings = {
      ...current,
      ...data,
      // Deep merge targetTimes if provided
      targetTimes: data.targetTimes
        ? { ...current.targetTimes, ...data.targetTimes }
        : current.targetTimes,
      // Deep merge LLM config if provided
      llm: data.llm ? { ...current.llm, ...data.llm } : current.llm,
    }

    // Persist to file
    saveSettings(currentSettings)

    return { ...currentSettings }
  })

  // Test LLM API connection
  registerHandler('settings:testConnection', async (_event, config: LLMConfigDTO) => {
    return testLLMConnection(config)
  })
}
