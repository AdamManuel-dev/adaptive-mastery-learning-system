/**
 * @fileoverview Editor for rubric key points in open response questions
 * @lastmodified 2026-01-20T00:00:00Z
 *
 * Features: Dynamic key points list, add/remove/edit operations, drag-to-reorder
 * Main APIs: KeyPointsEditor component
 * Constraints: Used within VariantEditor for open response question type
 * Patterns: Controlled list component, WCAG 2.1 AA compliant
 */

import { useCallback } from 'react'

import styles from './KeyPointsEditor.module.css'

/**
 * Props for the KeyPointsEditor component
 */
interface KeyPointsEditorProps {
  /** Current list of key points */
  keyPoints: string[]
  /** Callback when key points change */
  onChange: (points: string[]) => void
  /** Placeholder text for input fields */
  placeholder?: string
  /** Maximum number of key points allowed */
  maxPoints?: number
}

/**
 * Key points editor component
 *
 * Allows users to manage a list of key points for evaluation rubrics.
 * Key points are concepts that should be mentioned in a good answer.
 */
export function KeyPointsEditor({
  keyPoints,
  onChange,
  placeholder = 'Enter a key concept that should be addressed',
  maxPoints = 10,
}: KeyPointsEditorProps): React.JSX.Element {
  /**
   * Add a new empty key point
   */
  const handleAddPoint = useCallback(() => {
    if (keyPoints.length < maxPoints) {
      onChange([...keyPoints, ''])
    }
  }, [keyPoints, maxPoints, onChange])

  /**
   * Remove a key point by index
   */
  const handleRemovePoint = useCallback(
    (index: number) => {
      onChange(keyPoints.filter((_, i) => i !== index))
    },
    [keyPoints, onChange]
  )

  /**
   * Update a key point value by index
   */
  const handlePointChange = useCallback(
    (index: number, value: string) => {
      const updated = [...keyPoints]
      updated[index] = value
      onChange(updated)
    },
    [keyPoints, onChange]
  )

  /**
   * Move a key point up in the list
   */
  const handleMoveUp = useCallback(
    (index: number) => {
      if (index > 0) {
        const updated = [...keyPoints]
        const temp = updated[index - 1] ?? ''
        const current = updated[index] ?? ''
        updated[index - 1] = current
        updated[index] = temp
        onChange(updated)
      }
    },
    [keyPoints, onChange]
  )

  /**
   * Move a key point down in the list
   */
  const handleMoveDown = useCallback(
    (index: number) => {
      if (index < keyPoints.length - 1) {
        const updated = [...keyPoints]
        const temp = updated[index + 1] ?? ''
        const current = updated[index] ?? ''
        updated[index + 1] = current
        updated[index] = temp
        onChange(updated)
      }
    },
    [keyPoints, onChange]
  )

  const canAddMore = keyPoints.length < maxPoints

  return (
    <div className={styles.keyPointsEditor}>
      <div className={styles.header}>
        <span className={styles.title}>
          Key Points
          <span className={styles.count}>
            ({keyPoints.length}/{maxPoints})
          </span>
        </span>
        <button
          type="button"
          className={styles.addButton}
          onClick={handleAddPoint}
          disabled={!canAddMore}
          aria-label="Add key point"
        >
          + Add Point
        </button>
      </div>

      {keyPoints.length === 0 ? (
        <p className={styles.emptyText}>
          Add key points that should be addressed in a good answer.
          These will be used to evaluate student responses.
        </p>
      ) : (
        <ul className={styles.pointsList} aria-label="Key points list">
          {keyPoints.map((point, index) => (
            <li key={index} className={styles.pointItem}>
              <span className={styles.pointNumber}>{index + 1}</span>
              <input
                type="text"
                value={point}
                onChange={(e) => handlePointChange(index, e.target.value)}
                placeholder={placeholder}
                className={styles.pointInput}
                aria-label={`Key point ${index + 1}`}
              />
              <div className={styles.pointActions}>
                <button
                  type="button"
                  className={styles.moveButton}
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  aria-label={`Move key point ${index + 1} up`}
                  title="Move up"
                >
                  <span aria-hidden="true">&#x25B2;</span>
                </button>
                <button
                  type="button"
                  className={styles.moveButton}
                  onClick={() => handleMoveDown(index)}
                  disabled={index === keyPoints.length - 1}
                  aria-label={`Move key point ${index + 1} down`}
                  title="Move down"
                >
                  <span aria-hidden="true">&#x25BC;</span>
                </button>
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => handleRemovePoint(index)}
                  aria-label={`Remove key point ${index + 1}`}
                  title="Remove"
                >
                  <span aria-hidden="true">&#x2715;</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className={styles.helpText}>
        Key points help the LLM evaluate responses objectively.
        More specific points lead to better evaluations.
      </p>
    </div>
  )
}

export default KeyPointsEditor
