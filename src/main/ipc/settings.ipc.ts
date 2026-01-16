/**
 * @fileoverview IPC handlers for settings operations
 * @lastmodified 2025-01-16T00:00:00Z
 *
 * Features: Application settings retrieval and updates
 * Main APIs: registerSettingsHandlers()
 * Constraints: Stub implementations until persistence is connected
 * Patterns: Handler registration with error handling wrapper
 */

import { registerHandler } from './index'

import type { SettingsDTO } from '../../shared/types/ipc'

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
// Stub State
// -----------------------------------------------------------------------------

let currentSettings: SettingsDTO = { ...DEFAULT_SETTINGS }

// -----------------------------------------------------------------------------
// Handlers
// -----------------------------------------------------------------------------

/**
 * Registers all settings-related IPC handlers
 */
export function registerSettingsHandlers(): void {
  // Get current settings
  registerHandler('settings:get', () => {
    // TODO: Replace with persistence layer call
    // return settingsStore.get()

    return { ...currentSettings }
  })

  // Update settings
  registerHandler('settings:set', (_event, data: Partial<SettingsDTO>) => {
    // TODO: Replace with persistence layer call
    // return settingsStore.set(data)

    // Merge with current settings
    currentSettings = {
      ...currentSettings,
      ...data,
      // Deep merge targetTimes if provided
      targetTimes: data.targetTimes
        ? { ...currentSettings.targetTimes, ...data.targetTimes }
        : currentSettings.targetTimes,
      // Deep merge LLM config if provided
      llm: data.llm
        ? { ...currentSettings.llm, ...data.llm }
        : currentSettings.llm,
    }

    return { ...currentSettings }
  })
}
