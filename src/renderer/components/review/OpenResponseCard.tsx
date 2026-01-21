/**
 * @fileoverview Open response card component with text input and LLM evaluation display
 * @lastmodified 2026-01-20T00:00:00Z
 *
 * Features: Text input for user responses, evaluation score display, key points feedback,
 *           model answer reveal, confidence indicator, loading states
 * Main APIs: OpenResponseCard component
 * Constraints: Requires LLM API key configured for evaluation
 * Patterns: Controlled form, WCAG 2.1 AA compliant, responsive design
 */

import { useState, useRef, useEffect, useCallback } from 'react'

import styles from './OpenResponseCard.module.css'

import type { LLMEvaluationResult } from '../../../shared/types/ipc'

/**
 * Props for the OpenResponseCard component
 */
interface OpenResponseCardProps {
  /** The question/prompt to display */
  question: string
  /** Optional character limit for the response */
  maxLength?: number | undefined
  /** Callback when user submits their response */
  onSubmit: (response: string) => Promise<void>
  /** LLM evaluation result after submission */
  evaluation?: LLMEvaluationResult | undefined
  /** Model answer to show after evaluation */
  modelAnswer?: string | undefined
  /** Whether evaluation is in progress */
  isEvaluating?: boolean | undefined
  /** Callback when user clicks continue to next card */
  onContinue?: (() => void) | undefined
}

/**
 * Get score color class based on evaluation score
 */
function getScoreColorClass(score: number): string {
  if (score >= 0.7) return styles.scoreGood ?? ''
  if (score >= 0.4) return styles.scorePartial ?? ''
  return styles.scorePoor ?? ''
}

/**
 * Get feedback severity class based on score
 */
function getFeedbackClass(demonstratesUnderstanding: boolean): string {
  return demonstratesUnderstanding ? (styles.feedbackSuccess ?? '') : (styles.feedbackInfo ?? '')
}

/**
 * Open response card component for LLM-evaluated questions
 *
 * Displays a text input for user responses and shows detailed
 * evaluation feedback including score, key points, and model answer.
 */
export function OpenResponseCard({
  question,
  maxLength,
  onSubmit,
  evaluation,
  modelAnswer,
  isEvaluating = false,
  onContinue,
}: OpenResponseCardProps): React.JSX.Element {
  const [response, setResponse] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus textarea on mount
  useEffect(() => {
    if (!evaluation && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [evaluation])

  /**
   * Handle response text change with optional character limit
   */
  const handleResponseChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = maxLength ? e.target.value.slice(0, maxLength) : e.target.value
      setResponse(value)
    },
    [maxLength]
  )

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (response.trim() && !isEvaluating) {
        await onSubmit(response.trim())
      }
    },
    [response, isEvaluating, onSubmit]
  )

  /**
   * Handle keyboard shortcut for submission (Ctrl/Cmd + Enter)
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && response.trim() && !isEvaluating) {
        e.preventDefault()
        void onSubmit(response.trim())
      }
    },
    [response, isEvaluating, onSubmit]
  )

  const characterCount = response.length
  const isOverLimit = maxLength !== undefined && characterCount > maxLength
  const canSubmit = response.trim().length > 0 && !isEvaluating && !isOverLimit

  return (
    <div className={styles.openResponseCard}>
      {/* Question */}
      <div className={styles.questionSection}>
        <h3 className={styles.sectionLabel}>Question</h3>
        <p className={styles.questionText}>{question}</p>
      </div>

      {/* Input Section - only show if not yet evaluated */}
      {!evaluation && (
        <form onSubmit={(e) => void handleSubmit(e)} className={styles.inputSection}>
          <label htmlFor="user-response" className={styles.inputLabel}>
            Your Answer
          </label>
          <textarea
            ref={textareaRef}
            id="user-response"
            value={response}
            onChange={handleResponseChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer here..."
            disabled={isEvaluating}
            className={`${styles.responseInput} ${isOverLimit ? styles.inputError : ''}`}
            rows={4}
            aria-describedby={maxLength ? 'character-count' : undefined}
            aria-invalid={isOverLimit ? 'true' : undefined}
          />

          {/* Character count */}
          {maxLength !== undefined && (
            <div
              id="character-count"
              className={`${styles.characterCount} ${isOverLimit ? styles.countError : ''}`}
              aria-live="polite"
            >
              {characterCount} / {maxLength} characters
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            className={`btn-primary ${styles.submitButton}`}
            disabled={!canSubmit}
            aria-busy={isEvaluating}
          >
            {isEvaluating ? (
              <>
                <span className={styles.loadingSpinner} aria-hidden="true" />
                Evaluating...
              </>
            ) : (
              <>
                Submit Answer
                <span className={styles.keyboardHint}>
                  (Press <kbd>Ctrl</kbd>+<kbd>Enter</kbd>)
                </span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Evaluation Results */}
      {evaluation && (
        <div className={styles.evaluationSection} role="region" aria-label="Evaluation Results">
          {/* Score Display */}
          <div className={styles.scoreSection}>
            <div className={`${styles.scoreCircle} ${getScoreColorClass(evaluation.score)}`}>
              <span className={styles.scoreValue}>{Math.round(evaluation.score * 100)}%</span>
            </div>
            <div className={styles.scoreBar}>
              <div
                className={`${styles.scoreBarFill} ${getScoreColorClass(evaluation.score)}`}
                style={{ width: `${evaluation.score * 100}%` }}
                role="progressbar"
                aria-valuenow={Math.round(evaluation.score * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Score: ${Math.round(evaluation.score * 100)} percent`}
              />
            </div>
          </div>

          {/* Feedback */}
          <div
            className={`${styles.feedbackBox} ${getFeedbackClass(evaluation.demonstratesUnderstanding)}`}
            role="status"
          >
            <p className={styles.feedbackText}>{evaluation.feedback}</p>
          </div>

          {/* Key Points */}
          {(evaluation.keyPointsCovered.length > 0 || evaluation.keyPointsMissed.length > 0) && (
            <div className={styles.keyPointsSection}>
              <h4 className={styles.keyPointsTitle}>Key Points</h4>
              <div className={styles.keyPointsList}>
                {evaluation.keyPointsCovered.map((point, index) => (
                  <div key={`covered-${index}`} className={styles.keyPointCovered}>
                    <span className={styles.keyPointIcon} aria-hidden="true">
                      ✓
                    </span>
                    <span>{point}</span>
                  </div>
                ))}
                {evaluation.keyPointsMissed.map((point, index) => (
                  <div key={`missed-${index}`} className={styles.keyPointMissed}>
                    <span className={styles.keyPointIcon} aria-hidden="true">
                      ✗
                    </span>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Model Answer */}
          {modelAnswer && (
            <div className={styles.modelAnswerSection}>
              <h4 className={styles.modelAnswerTitle}>Model Answer</h4>
              <p className={styles.modelAnswerText}>{modelAnswer}</p>
            </div>
          )}

          {/* Confidence Indicator */}
          <div className={styles.confidenceSection}>
            <span className={styles.confidenceLabel}>Evaluation Confidence:</span>
            <span className={styles.confidenceValue}>
              {Math.round(evaluation.confidence * 100)}%
            </span>
          </div>

          {/* Continue Button */}
          {onContinue && (
            <button
              type="button"
              className={`btn-primary ${styles.continueButton}`}
              onClick={onContinue}
            >
              Continue
              <span className={styles.keyboardHint}>
                (Press <kbd>Space</kbd>)
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default OpenResponseCard
