/**
 * @fileoverview Variant editor component for creating and editing card variants
 * @lastmodified 2026-01-20T00:00:00Z
 *
 * Features: Form for variant CRUD operations, dimension selection, accessible difficulty slider, hints array,
 *           question type selection, open response rubric editor
 * Main APIs: useElectronAPI hook for safe API access
 * Constraints: Requires a concept to be selected first
 * Patterns: Controlled form with validation, reusable for create/edit, hook-based API access, WCAG 2.1 AA compliant
 */

import { useState, useCallback } from 'react'

import { KeyPointsEditor } from './KeyPointsEditor'
import styles from './VariantEditor.module.css'
import { useElectronAPI } from '../hooks/useElectronAPI'

import type {
  VariantDTO,
  CreateVariantDTO,
  UpdateVariantDTO,
  Dimension,
  QuestionType,
  EvaluationRubric,
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
 * Question type option for dropdown selection
 */
interface QuestionTypeOption {
  value: QuestionType
  label: string
  description: string
}

/**
 * Available question type options
 */
const questionTypeOptions: QuestionTypeOption[] = [
  {
    value: 'flashcard',
    label: 'Flashcard',
    description: 'Traditional flashcard with front/back and self-rating',
  },
  {
    value: 'open_response',
    label: 'Open Response (LLM-evaluated)',
    description: 'Free-text answer evaluated by AI for understanding',
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
  questionType: QuestionType
  rubric: EvaluationRubric
  maxLength: number | undefined
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
  const api = useElectronAPI()
  const isEditMode = variant !== null

  const [formData, setFormData] = useState<VariantFormData>({
    dimension: variant?.dimension ?? 'definition',
    difficulty: variant?.difficulty ?? 3,
    front: variant?.front ?? '',
    back: variant?.back ?? '',
    hints: variant?.hints ?? [],
    questionType: variant?.questionType ?? 'flashcard',
    rubric: variant?.rubric ?? { keyPoints: [] },
    maxLength: variant?.maxLength,
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
   * Handle question type change
   */
  const handleQuestionTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const questionType = e.target.value as QuestionType
    setFormData((prev) => ({
      ...prev,
      questionType,
      // Reset rubric when switching away from open_response
      rubric: questionType === 'open_response' ? prev.rubric : { keyPoints: [] },
    }))
  }, [])

  /**
   * Handle key points change in rubric
   */
  const handleKeyPointsChange = useCallback((keyPoints: string[]) => {
    setFormData((prev) => ({
      ...prev,
      rubric: { ...prev.rubric, keyPoints },
    }))
  }, [])

  /**
   * Handle partial credit criteria change
   */
  const handlePartialCreditChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setFormData((prev) => {
      const newRubric: EvaluationRubric = {
        keyPoints: prev.rubric.keyPoints,
      }
      if (value.length > 0) {
        newRubric.partialCreditCriteria = value
      }
      return { ...prev, rubric: newRubric }
    })
  }, [])

  /**
   * Handle max length change
   */
  const handleMaxLengthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseInt(e.target.value, 10) : undefined
    setFormData((prev) => ({
      ...prev,
      maxLength: value && value > 0 ? value : undefined,
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

    // Validate open response has at least one key point
    if (formData.questionType === 'open_response') {
      const validKeyPoints = formData.rubric.keyPoints.filter((p) => p.trim().length > 0)
      if (validKeyPoints.length === 0) {
        setError('Open response questions require at least one key point for evaluation')
        return
      }
    }

    // Filter out empty hints
    const hintsValue = formData.hints.map((h) => h.trim()).filter((h) => h.length > 0)

    // Prepare rubric for open response (filter empty key points)
    let rubricValue: EvaluationRubric | undefined
    if (formData.questionType === 'open_response') {
      const rubric: EvaluationRubric = {
        keyPoints: formData.rubric.keyPoints.filter((p) => p.trim().length > 0),
      }
      if (formData.rubric.partialCreditCriteria) {
        rubric.partialCreditCriteria = formData.rubric.partialCreditCriteria
      }
      rubricValue = rubric
    }

    try {
      setIsSaving(true)

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
          questionType: formData.questionType,
          ...(rubricValue && { rubric: rubricValue }),
          ...(formData.maxLength && { maxLength: formData.maxLength }),
        }
        savedVariant = await api.variants.update(updateData)
      } else {
        // Create new variant
        const createData: CreateVariantDTO = {
          conceptId,
          dimension: formData.dimension,
          difficulty: formData.difficulty,
          front: formData.front.trim(),
          back: formData.back.trim(),
          hints: hintsValue,
          questionType: formData.questionType,
          ...(rubricValue && { rubric: rubricValue }),
          ...(formData.maxLength && { maxLength: formData.maxLength }),
        }
        savedVariant = await api.variants.create(createData)
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
        {/* Question Type Selection */}
        <div className={styles.formGroup}>
          <label htmlFor="questionType">Question Type *</label>
          <select
            id="questionType"
            name="questionType"
            value={formData.questionType}
            onChange={handleQuestionTypeChange}
            className={styles.dimensionSelect}
          >
            {questionTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className={styles.dimensionDescription}>
            {questionTypeOptions.find((o) => o.value === formData.questionType)?.description}
          </p>
        </div>

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

        {/* Difficulty Slider - WCAG 2.1 compliant */}
        <div className={styles.formGroup}>
          <label htmlFor="difficulty">
            Difficulty: <span className={styles.difficultyValue}>{getDifficultyLabel(formData.difficulty)}</span>
          </label>
          <div className={styles.difficultySlider}>
            <span className={styles.difficultyLabel} id="difficulty-min">Easy</span>
            <input
              type="range"
              id="difficulty"
              name="difficulty"
              min={1}
              max={5}
              value={formData.difficulty}
              onChange={handleDifficultyChange}
              className={styles.slider}
              aria-label="Difficulty level"
              aria-valuemin={1}
              aria-valuemax={5}
              aria-valuenow={formData.difficulty}
              aria-valuetext={`${getDifficultyLabel(formData.difficulty)}, ${formData.difficulty} out of 5`}
            />
            <span className={styles.difficultyLabel} id="difficulty-max">Hard</span>
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
            aria-invalid={error?.includes('Question') ? 'true' : undefined}
            aria-describedby={error?.includes('Question') ? 'variant-form-error' : undefined}
          />
        </div>

        {/* Answer (Back) / Model Answer */}
        <div className={styles.formGroup}>
          <label htmlFor="back">
            {formData.questionType === 'open_response' ? 'Model Answer *' : 'Answer (Back) *'}
          </label>
          <textarea
            id="back"
            name="back"
            value={formData.back}
            onChange={handleInputChange}
            placeholder={
              formData.questionType === 'open_response'
                ? 'Enter the ideal/reference answer for comparison (2-4 sentences)'
                : 'Enter the correct answer or explanation'
            }
            rows={4}
            required
            aria-invalid={error?.includes('Answer') ? 'true' : undefined}
            aria-describedby={error?.includes('Answer') ? 'variant-form-error' : undefined}
          />
          {formData.questionType === 'open_response' && (
            <p className={styles.dimensionDescription}>
              This answer will be used to evaluate student responses and shown after submission.
            </p>
          )}
        </div>

        {/* Open Response: Evaluation Rubric */}
        {formData.questionType === 'open_response' && (
          <>
            <div className={styles.formGroup}>
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label>Evaluation Rubric *</label>
              <KeyPointsEditor
                keyPoints={formData.rubric.keyPoints}
                onChange={handleKeyPointsChange}
                placeholder="Key concept that should be addressed in the answer"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="partialCredit">Partial Credit Criteria</label>
              <textarea
                id="partialCredit"
                value={formData.rubric.partialCreditCriteria ?? ''}
                onChange={handlePartialCreditChange}
                placeholder="e.g., Give partial credit if student mentions X without explaining Y..."
                rows={2}
              />
              <p className={styles.dimensionDescription}>
                Instructions for how the AI should award partial credit.
              </p>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="maxLength">Maximum Response Length</label>
              <input
                type="number"
                id="maxLength"
                value={formData.maxLength ?? ''}
                onChange={handleMaxLengthChange}
                placeholder="500"
                min={50}
                max={5000}
              />
              <p className={styles.dimensionDescription}>
                Character limit for student responses (optional, default: unlimited).
              </p>
            </div>
          </>
        )}

        {/* Hints Array - only for non-open-response */}
        {formData.questionType !== 'open_response' && (
        <div className={styles.formGroup}>
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
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
        )}

        {/* Error Display */}
        {error && (
          <p
            id="variant-form-error"
            className={styles.formError}
            role="alert"
            aria-live="assertive"
          >
            {error}
          </p>
        )}

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
