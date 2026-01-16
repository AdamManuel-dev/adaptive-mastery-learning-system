/**
 * @fileoverview Variant editor component for creating and editing card variants
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Form for variant CRUD operations, dimension selection, difficulty slider, hints array
 * Main APIs: window.api.variants for data operations
 * Constraints: Requires a concept to be selected first
 * Patterns: Controlled form with validation, reusable for create/edit
 */

import { useState, useCallback } from 'react'

import styles from './VariantEditor.module.css'

import type {
  VariantDTO,
  CreateVariantDTO,
  UpdateVariantDTO,
  Dimension,
} from '../../shared/types/ipc'

/**
 * Dimension option for dropdown selection
 */
interface DimensionOption {
  value: Dimension
  label: string
  description: string
}

/**
 * Available dimension options with descriptions
 */
const dimensionOptions: DimensionOption[] = [
  {
    value: 'definition',
    label: 'Definition Recall',
    description: 'Can you recall the definition when shown the term?',
  },
  {
    value: 'paraphrase',
    label: 'Paraphrase Recognition',
    description: 'Can you recognize correct paraphrases of the definition?',
  },
  {
    value: 'example',
    label: 'Example Classification',
    description: 'Can you correctly classify examples vs non-examples?',
  },
  {
    value: 'scenario',
    label: 'Scenario Application',
    description: 'Can you apply the concept to novel scenarios?',
  },
  {
    value: 'discrimination',
    label: 'Discrimination',
    description: 'Can you distinguish this concept from similar ones?',
  },
  {
    value: 'cloze',
    label: 'Cloze Fill',
    description: 'Can you fill in missing parts of definitions or facts?',
  },
]

/**
 * Form data structure for create/edit operations
 */
interface VariantFormData {
  dimension: Dimension
  difficulty: number
  front: string
  back: string
  hints: string[]
}

/**
 * Props for the VariantEditor component
 */
interface VariantEditorProps {
  /** The concept ID this variant belongs to */
  conceptId: string
  /** The concept name for display */
  conceptName: string
  /** Existing variant for edit mode, null for create mode */
  variant: VariantDTO | null
  /** Callback when save succeeds */
  onSave: (variant: VariantDTO) => void
  /** Callback to close the editor */
  onCancel: () => void
}

/**
 * Variant editor component for creating and editing card variants
 *
 * Provides a form interface for:
 * - Selecting the cognitive dimension (6 types)
 * - Setting difficulty level (1-5 slider)
 * - Entering question (front) and answer (back) content
 * - Managing progressive hints array
 */
function VariantEditor({
  conceptId,
  conceptName,
  variant,
  onSave,
  onCancel,
}: VariantEditorProps): React.JSX.Element {
  const isEditMode = variant !== null

  const [formData, setFormData] = useState<VariantFormData>({
    dimension: variant?.dimension ?? 'definition',
    difficulty: variant?.difficulty ?? 3,
    front: variant?.front ?? '',
    back: variant?.back ?? '',
    hints: variant?.hints ?? [],
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Handle text input changes
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target
      setFormData((prev) => ({ ...prev, [name]: value }))
    },
    []
  )

  /**
   * Handle difficulty slider change
   */
  const handleDifficultyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, difficulty: parseInt(e.target.value, 10) }))
  }, [])

  /**
   * Add a new empty hint field
   */
  const handleAddHint = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      hints: [...prev.hints, ''],
    }))
  }, [])

  /**
   * Remove a hint field by index
   */
  const handleRemoveHint = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      hints: prev.hints.filter((_, i) => i !== index),
    }))
  }, [])

  /**
   * Update a hint field value by index
   */
  const handleHintChange = useCallback((index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      hints: prev.hints.map((hint, i) => (i === index ? value : hint)),
    }))
  }, [])

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.front.trim()) {
      setError('Question (front) is required')
      return
    }
    if (!formData.back.trim()) {
      setError('Answer (back) is required')
      return
    }

    // Filter out empty hints
    const hintsValue = formData.hints.map((h) => h.trim()).filter((h) => h.length > 0)

    try {
      setIsSaving(true)

      if (!window.api) {
        throw new Error('API not available')
      }

      let savedVariant: VariantDTO

      if (isEditMode && variant) {
        // Update existing variant
        const updateData: UpdateVariantDTO = {
          id: variant.id,
          dimension: formData.dimension,
          difficulty: formData.difficulty,
          front: formData.front.trim(),
          back: formData.back.trim(),
          hints: hintsValue,
        }
        savedVariant = await window.api.variants.update(updateData)
      } else {
        // Create new variant
        const createData: CreateVariantDTO = {
          conceptId,
          dimension: formData.dimension,
          difficulty: formData.difficulty,
          front: formData.front.trim(),
          back: formData.back.trim(),
          hints: hintsValue,
        }
        savedVariant = await window.api.variants.create(createData)
      }

      onSave(savedVariant)
    } catch (err) {
      console.error('Failed to save variant:', err)
      setError(isEditMode ? 'Failed to update variant. Please try again.' : 'Failed to create variant. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Get difficulty label based on level
   */
  const getDifficultyLabel = (level: number): string => {
    const labels = ['', 'Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard']
    return labels[level] ?? 'Unknown'
  }

  return (
    <div className={styles.variantEditor}>
      <header className={styles.header}>
        <h2>{isEditMode ? 'Edit Variant' : 'Create New Variant'}</h2>
        <p className={styles.conceptInfo}>
          For concept: <strong>{conceptName}</strong>
        </p>
      </header>

      <form onSubmit={(e) => void handleSubmit(e)} className={styles.form}>
        {/* Dimension Selection */}
        <div className={styles.formGroup}>
          <label htmlFor="dimension">Dimension *</label>
          <select
            id="dimension"
            name="dimension"
            value={formData.dimension}
            onChange={handleInputChange}
            className={styles.dimensionSelect}
          >
            {dimensionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className={styles.dimensionDescription}>
            {dimensionOptions.find((o) => o.value === formData.dimension)?.description}
          </p>
        </div>

        {/* Difficulty Slider */}
        <div className={styles.formGroup}>
          <label htmlFor="difficulty">
            Difficulty: <span className={styles.difficultyValue}>{getDifficultyLabel(formData.difficulty)}</span>
          </label>
          <div className={styles.difficultySlider}>
            <span className={styles.difficultyLabel}>Easy</span>
            <input
              type="range"
              id="difficulty"
              name="difficulty"
              min="1"
              max="5"
              value={formData.difficulty}
              onChange={handleDifficultyChange}
              className={styles.slider}
            />
            <span className={styles.difficultyLabel}>Hard</span>
          </div>
          <div className={styles.difficultyMarkers}>
            {[1, 2, 3, 4, 5].map((level) => (
              <span
                key={level}
                className={`${styles.marker} ${formData.difficulty === level ? styles.markerActive : ''}`}
              >
                {level}
              </span>
            ))}
          </div>
        </div>

        {/* Question (Front) */}
        <div className={styles.formGroup}>
          <label htmlFor="front">Question (Front) *</label>
          <textarea
            id="front"
            name="front"
            value={formData.front}
            onChange={handleInputChange}
            placeholder="Enter the question or prompt shown to the user"
            rows={4}
            required
          />
        </div>

        {/* Answer (Back) */}
        <div className={styles.formGroup}>
          <label htmlFor="back">Answer (Back) *</label>
          <textarea
            id="back"
            name="back"
            value={formData.back}
            onChange={handleInputChange}
            placeholder="Enter the correct answer or explanation"
            rows={4}
            required
          />
        </div>

        {/* Hints Array */}
        <div className={styles.formGroup}>
          <label className={styles.hintsLabel}>
            Progressive Hints
            <button
              type="button"
              className={styles.addHintButton}
              onClick={handleAddHint}
              aria-label="Add hint"
            >
              + Add Hint
            </button>
          </label>
          <div className={styles.hintsContainer}>
            {formData.hints.length === 0 ? (
              <p className={styles.hintsEmptyHint}>
                Add hints that can be revealed progressively to help the learner.
              </p>
            ) : (
              formData.hints.map((hint, index) => (
                <div key={index} className={styles.hintRow}>
                  <span className={styles.hintNumber}>{index + 1}</span>
                  <input
                    type="text"
                    value={hint}
                    onChange={(e) => handleHintChange(index, e.target.value)}
                    placeholder={`Hint ${index + 1} (revealed progressively)`}
                    className={styles.hintInput}
                  />
                  <button
                    type="button"
                    className={styles.removeHintButton}
                    onClick={() => handleRemoveHint(index)}
                    aria-label={`Remove hint ${index + 1}`}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && <p className={styles.formError}>{error}</p>}

        {/* Form Actions */}
        <div className={styles.formActions}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Variant'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default VariantEditor
