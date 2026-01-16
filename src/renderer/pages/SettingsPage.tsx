/**
 * @fileoverview Settings page for application configuration
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: LLM API configuration, review settings, theme toggle
 * Main APIs: React state hooks for settings management
 * Constraints: Settings are persisted locally via Electron store
 * Patterns: Form-based configuration with section grouping
 */

import { useState } from 'react'

import styles from './SettingsPage.module.css'

/**
 * LLM Provider options
 */
type LLMProvider = 'openai' | 'anthropic' | 'local'

/**
 * Theme options
 */
type Theme = 'light' | 'dark' | 'system'

/**
 * Settings form state
 */
interface SettingsState {
  llmProvider: LLMProvider
  apiKey: string
  modelName: string
  reviewsPerSession: number
  newCardsPerDay: number
  theme: Theme
}

/**
 * Settings page component
 * Provides configuration options for LLM, review behavior, and appearance
 */
function SettingsPage(): React.JSX.Element {
  const [settings, setSettings] = useState<SettingsState>({
    llmProvider: 'openai',
    apiKey: '',
    modelName: 'gpt-4',
    reviewsPerSession: 20,
    newCardsPerDay: 10,
    theme: 'system',
  })

  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const handleChange = <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ): void => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setSaveMessage(null)
  }

  const handleSave = async (): Promise<void> => {
    setIsSaving(true)
    setSaveMessage(null)

    // Placeholder: will save to Electron store via IPC
    await new Promise((resolve) => setTimeout(resolve, 500))

    setIsSaving(false)
    setSaveMessage('Settings saved successfully')
  }

  const handleTestConnection = (): void => {
    // Placeholder: will test LLM API connection
    // TODO: Implement actual API connection test
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
              <option value="local">Local Model</option>
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
              placeholder="sk-..."
              className={styles.input}
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
              placeholder="gpt-4"
              className={styles.input}
            />
          </div>

          <button
            type="button"
            className={`btn-secondary ${styles.testButton}`}
            onClick={() => { handleTestConnection() }}
          >
            Test Connection
          </button>
        </section>

        {/* Review Settings Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Review Settings</h2>
          <p className={styles.sectionDescription}>
            Customize how your review sessions work.
          </p>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="reviewsPerSession">
              Cards per Session
            </label>
            <input
              id="reviewsPerSession"
              type="number"
              min="5"
              max="100"
              value={settings.reviewsPerSession}
              onChange={(e) => handleChange('reviewsPerSession', parseInt(e.target.value, 10))}
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
              onChange={(e) => handleChange('newCardsPerDay', parseInt(e.target.value, 10))}
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
              {(['light', 'dark', 'system'] as const).map((theme) => (
                <button
                  key={theme}
                  type="button"
                  className={`${styles.themeButton} ${settings.theme === theme ? styles.themeButtonActive : ''}`}
                  onClick={() => handleChange('theme', theme)}
                >
                  <span className={styles.themeIcon}>{getThemeIcon(theme)}</span>
                  <span className={styles.themeLabel}>{capitalizeFirst(theme)}</span>
                </button>
              ))}
            </div>
            <span className={styles.fieldHint}>
              Theme switching is coming soon. Currently using light theme.
            </span>
          </div>
        </section>

        {/* Save Button */}
        <div className={styles.saveSection}>
          {saveMessage !== null && saveMessage !== '' && (
            <span className={styles.saveMessage}>{saveMessage}</span>
          )}
          <button
            type="button"
            className="btn-primary"
            onClick={() => { void handleSave() }}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Get icon character for theme option
 */
function getThemeIcon(theme: Theme): string {
  const icons: Record<Theme, string> = {
    light: 'L',
    dark: 'D',
    system: 'S',
  }
  return icons[theme]
}

/**
 * Capitalize first letter of string
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export default SettingsPage
