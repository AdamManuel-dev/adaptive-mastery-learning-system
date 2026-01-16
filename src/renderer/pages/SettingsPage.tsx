/**
 * @fileoverview Settings page for application configuration with persistence
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: LLM API configuration, review settings, theme toggle with persistence
 * Main APIs: React hooks, useTheme context, IPC settings API
 * Constraints: Settings are persisted via Electron IPC or localStorage in browser mode
 * Patterns: Form-based configuration with section grouping, Lucide React icons
 */

import { useState, useEffect, useCallback } from 'react'
import { Sun, Moon, Monitor, Check, X, Loader2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { useTheme, type Theme } from '../contexts/ThemeContext'
import {
  isElectronAPIAvailable,
  getElectronAPI,
} from '../hooks/useElectronAPI'

import styles from './SettingsPage.module.css'

import type { SettingsDTO, LLMConfigDTO } from '../../shared/types/ipc'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/**
 * LLM Provider options
 */
type LLMProvider = 'openai' | 'anthropic' | 'local'

/**
 * Settings form state (subset of SettingsDTO for UI)
 */
interface SettingsFormState {
  llmProvider: LLMProvider
  apiKey: string
  modelName: string
  apiBaseUrl: string
  cardsPerSession: number
  newCardsPerDay: number
}

/**
 * Connection test status
 */
type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error'

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

/**
 * Settings page component
 * Provides configuration options for LLM, review behavior, and appearance
 */
function SettingsPage(): React.JSX.Element {
  const { theme, setTheme } = useTheme()

  // Form state
  const [settings, setSettings] = useState<SettingsFormState>({
    llmProvider: 'openai',
    apiKey: '',
    modelName: 'gpt-4o-mini',
    apiBaseUrl: '',
    cardsPerSession: 25,
    newCardsPerDay: 10,
  })

  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle')
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null)

  // Load settings on mount
  useEffect(() => {
    async function loadSettings(): Promise<void> {
      try {
        if (isElectronAPIAvailable()) {
          const api = getElectronAPI()
          const savedSettings = await api.settings.get()
          setSettings({
            llmProvider: savedSettings.llm.provider,
            apiKey: savedSettings.llm.apiKey,
            modelName: savedSettings.llm.model,
            apiBaseUrl: savedSettings.llm.baseUrl ?? '',
            cardsPerSession: savedSettings.cardsPerSession,
            newCardsPerDay: savedSettings.newCardsPerDay,
          })
        } else {
          // Browser fallback - load from localStorage
          const stored = localStorage.getItem('app-settings')
          if (stored) {
            const parsed = JSON.parse(stored) as Partial<SettingsDTO>
            setSettings((prev) => ({
              ...prev,
              llmProvider: parsed.llm?.provider ?? prev.llmProvider,
              apiKey: parsed.llm?.apiKey ?? prev.apiKey,
              modelName: parsed.llm?.model ?? prev.modelName,
              apiBaseUrl: parsed.llm?.baseUrl ?? prev.apiBaseUrl,
              cardsPerSession: parsed.cardsPerSession ?? prev.cardsPerSession,
              newCardsPerDay: parsed.newCardsPerDay ?? prev.newCardsPerDay,
            }))
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    void loadSettings()
  }, [])

  // Handle form field changes
  const handleChange = useCallback(
    <K extends keyof SettingsFormState>(key: K, value: SettingsFormState[K]): void => {
      setSettings((prev) => ({ ...prev, [key]: value }))
      setSaveMessage(null)
      // Reset connection status when LLM config changes
      if (['llmProvider', 'apiKey', 'modelName', 'apiBaseUrl'].includes(key)) {
        setConnectionStatus('idle')
        setConnectionMessage(null)
      }
    },
    []
  )

  // Handle theme change
  const handleThemeChange = useCallback(
    (newTheme: Theme): void => {
      setTheme(newTheme)
    },
    [setTheme]
  )

  // Save settings
  const handleSave = useCallback(async (): Promise<void> => {
    setIsSaving(true)
    setSaveMessage(null)

    try {
      const llmConfig: LLMConfigDTO = {
        provider: settings.llmProvider,
        apiKey: settings.apiKey,
        model: settings.modelName,
      }
      // Only add baseUrl if it has a value
      if (settings.apiBaseUrl) {
        llmConfig.baseUrl = settings.apiBaseUrl
      }

      const settingsToSave: Partial<SettingsDTO> = {
        llm: llmConfig,
        cardsPerSession: settings.cardsPerSession,
        newCardsPerDay: settings.newCardsPerDay,
        theme,
      }

      if (isElectronAPIAvailable()) {
        const api = getElectronAPI()
        await api.settings.set(settingsToSave)
      } else {
        // Browser fallback - save to localStorage
        localStorage.setItem('app-settings', JSON.stringify(settingsToSave))
      }

      setSaveMessage({ type: 'success', text: 'Settings saved successfully' })
    } catch (error) {
      console.error('Failed to save settings:', error)
      setSaveMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save settings',
      })
    } finally {
      setIsSaving(false)
    }
  }, [settings, theme])

  // Test LLM connection
  const handleTestConnection = useCallback(async (): Promise<void> => {
    setConnectionStatus('testing')
    setConnectionMessage(null)

    try {
      const config: LLMConfigDTO = {
        provider: settings.llmProvider,
        apiKey: settings.apiKey,
        model: settings.modelName,
      }
      // Only add baseUrl if it has a value
      if (settings.apiBaseUrl) {
        config.baseUrl = settings.apiBaseUrl
      }

      if (isElectronAPIAvailable()) {
        const api = getElectronAPI()
        const result = await api.settings.testConnection(config)
        setConnectionStatus(result.success ? 'success' : 'error')
        setConnectionMessage(result.message)
      } else {
        // Browser mode - just validate that API key is provided
        if (!settings.apiKey) {
          setConnectionStatus('error')
          setConnectionMessage('API key is required')
        } else {
          // In browser mode, we can't actually test - just show a placeholder
          setConnectionStatus('success')
          setConnectionMessage('Connection testing is only available in the desktop app')
        }
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      setConnectionStatus('error')
      setConnectionMessage(
        error instanceof Error ? error.message : 'Connection test failed'
      )
    }
  }, [settings])

  // Show loading state
  if (isLoading) {
    return (
      <div className={styles.settingsPage}>
        <div className={styles.loadingState}>
          <Loader2 className={styles.spinner} size={32} />
          <span>Loading settings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.settingsPage}>
      <header className={styles.header}>
        <h1>Settings</h1>
        <p className={styles.subtitle}>Configure your learning experience</p>
      </header>

      <div className={styles.settingsContainer}>
        {/* LLM Configuration Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>LLM Configuration</h2>
          <p className={styles.sectionDescription}>
            Configure your AI provider for generating and adapting questions.
          </p>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="llmProvider">
              Provider
            </label>
            <select
              id="llmProvider"
              value={settings.llmProvider}
              onChange={(e) => handleChange('llmProvider', e.target.value as LLMProvider)}
              className={styles.select}
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="local">Local Model (Ollama)</option>
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="apiKey">
              API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={settings.apiKey}
              onChange={(e) => handleChange('apiKey', e.target.value)}
              placeholder={settings.llmProvider === 'local' ? 'Not required for local models' : 'sk-...'}
              className={styles.input}
              disabled={settings.llmProvider === 'local'}
            />
            <span className={styles.fieldHint}>
              Your API key is stored locally and never sent to our servers.
            </span>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="modelName">
              Model
            </label>
            <input
              id="modelName"
              type="text"
              value={settings.modelName}
              onChange={(e) => handleChange('modelName', e.target.value)}
              placeholder={getModelPlaceholder(settings.llmProvider)}
              className={styles.input}
            />
            <span className={styles.fieldHint}>
              {getModelHint(settings.llmProvider)}
            </span>
          </div>

          {settings.llmProvider === 'local' && (
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="apiBaseUrl">
                Base URL
              </label>
              <input
                id="apiBaseUrl"
                type="url"
                value={settings.apiBaseUrl}
                onChange={(e) => handleChange('apiBaseUrl', e.target.value)}
                placeholder="http://localhost:11434"
                className={styles.input}
              />
              <span className={styles.fieldHint}>
                The base URL for your local Ollama server.
              </span>
            </div>
          )}

          <div className={styles.connectionSection}>
            <button
              type="button"
              className={`btn-secondary ${styles.testButton}`}
              onClick={() => {
                void handleTestConnection()
              }}
              disabled={connectionStatus === 'testing'}
            >
              {connectionStatus === 'testing' ? (
                <>
                  <Loader2 className={styles.buttonSpinner} size={16} />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </button>

            {connectionMessage && (
              <div
                className={`${styles.connectionResult} ${
                  connectionStatus === 'success'
                    ? styles.connectionSuccess
                    : styles.connectionError
                }`}
              >
                {connectionStatus === 'success' ? (
                  <Check size={16} />
                ) : (
                  <X size={16} />
                )}
                <span>{connectionMessage}</span>
              </div>
            )}
          </div>
        </section>

        {/* Review Settings Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Review Settings</h2>
          <p className={styles.sectionDescription}>
            Customize how your review sessions work.
          </p>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="cardsPerSession">
              Cards per Session
            </label>
            <input
              id="cardsPerSession"
              type="number"
              min="5"
              max="100"
              value={settings.cardsPerSession}
              onChange={(e) =>
                handleChange('cardsPerSession', parseInt(e.target.value, 10) || 25)
              }
              className={styles.input}
            />
            <span className={styles.fieldHint}>
              Maximum number of cards to review in one session (5-100)
            </span>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="newCardsPerDay">
              New Cards per Day
            </label>
            <input
              id="newCardsPerDay"
              type="number"
              min="1"
              max="50"
              value={settings.newCardsPerDay}
              onChange={(e) =>
                handleChange('newCardsPerDay', parseInt(e.target.value, 10) || 10)
              }
              className={styles.input}
            />
            <span className={styles.fieldHint}>
              Maximum new cards introduced each day (1-50)
            </span>
          </div>
        </section>

        {/* Appearance Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Appearance</h2>
          <p className={styles.sectionDescription}>
            Customize the look and feel of the application.
          </p>

          <div className={styles.fieldGroup}>
            <span className={styles.label}>Theme</span>
            <div className={styles.themeOptions}>
              {(['light', 'dark', 'system'] as const).map((themeOption) => (
                <button
                  key={themeOption}
                  type="button"
                  className={`${styles.themeButton} ${
                    theme === themeOption ? styles.themeButtonActive : ''
                  }`}
                  onClick={() => handleThemeChange(themeOption)}
                >
                  <span className={styles.themeIcon}>{getThemeIcon(themeOption)}</span>
                  <span className={styles.themeLabel}>{capitalizeFirst(themeOption)}</span>
                </button>
              ))}
            </div>
            <span className={styles.fieldHint}>
              {theme === 'system'
                ? 'Theme follows your system preference.'
                : `Currently using ${theme} theme.`}
            </span>
          </div>
        </section>

        {/* Save Button */}
        <div className={styles.saveSection}>
          {saveMessage && (
            <span
              className={`${styles.saveMessage} ${
                saveMessage.type === 'error' ? styles.saveMessageError : ''
              }`}
            >
              {saveMessage.type === 'success' && <Check size={16} />}
              {saveMessage.type === 'error' && <X size={16} />}
              {saveMessage.text}
            </span>
          )}
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              void handleSave()
            }}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className={styles.buttonSpinner} size={16} />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Theme icon mapping
 */
const themeIcons: Record<Theme, LucideIcon> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

/**
 * Get icon component for theme option
 */
function getThemeIcon(themeOption: Theme): React.JSX.Element {
  const IconComponent = themeIcons[themeOption]
  return <IconComponent size={20} />
}

/**
 * Capitalize first letter of string
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Get placeholder text for model input based on provider
 */
function getModelPlaceholder(provider: LLMProvider): string {
  switch (provider) {
    case 'openai':
      return 'gpt-4o-mini'
    case 'anthropic':
      return 'claude-3-haiku-20240307'
    case 'local':
      return 'llama2'
    default:
      return ''
  }
}

/**
 * Get hint text for model input based on provider
 */
function getModelHint(provider: LLMProvider): string {
  switch (provider) {
    case 'openai':
      return 'Recommended: gpt-4o-mini for balance of speed and quality.'
    case 'anthropic':
      return 'Recommended: claude-3-haiku for fast responses.'
    case 'local':
      return 'Enter the name of your locally installed model.'
    default:
      return ''
  }
}

export default SettingsPage
