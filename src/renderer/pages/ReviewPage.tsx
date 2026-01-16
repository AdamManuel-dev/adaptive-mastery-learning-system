/**
 * @fileoverview Review session page for spaced repetition card review
 * @lastmodified 2026-01-16T19:00:00Z
 *
 * Features: Card display, show answer toggle, rating buttons, keyboard shortcuts, accessible loading states, answer reveal animation
 * Main APIs: useElectronAPI hook for safe API access
 * Constraints: Displays placeholder when no cards are due
 * Patterns: State machine pattern for review flow (question -> answer -> rated), hook-based API access, WCAG 2.1 AA compliant
 */

import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'

import styles from './ReviewPage.module.css'
import { useElectronAPI } from '../hooks/useElectronAPI'

import type {
  ReviewCardDTO,
  ReviewSubmitDTO,
  Rating,
  DueCountDTO,
} from '../../shared/types/ipc'

/**
 * Rating option for spaced repetition
 */
interface RatingOption {
  value: number
  label: string
  rating: Rating
  description: string
  className: string
}

/**
 * Get rating options with CSS classes
 * Defined as a function to ensure styles are resolved at runtime
 * CSS classes are defined in ReviewPage.module.css (ratingAgain, ratingHard, ratingGood, ratingEasy)
 */
function getRatingOptions(): RatingOption[] {
  return [
    { value: 1, label: 'Again', rating: 'again', description: 'Forgot completely', className: styles.ratingAgain ?? '' },
    { value: 2, label: 'Hard', rating: 'hard', description: 'Remembered with difficulty', className: styles.ratingHard ?? '' },
    { value: 3, label: 'Good', rating: 'good', description: 'Remembered correctly', className: styles.ratingGood ?? '' },
    { value: 4, label: 'Easy', rating: 'easy', description: 'Too easy', className: styles.ratingEasy ?? '' },
  ]
}

/**
 * Map numeric rating (1-4) to Rating type
 */
function mapRatingToType(value: number): Rating {
  const options = getRatingOptions()
  const option = options.find((opt) => opt.value === value)
  return option?.rating ?? 'good'
}

/**
 * Review page component
 * Manages the card review session with show/hide answer and rating flow
 */
function ReviewPage(): React.JSX.Element {
  const api = useElectronAPI()
  const [showAnswer, setShowAnswer] = useState(false)
  const [currentCard, setCurrentCard] = useState<ReviewCardDTO | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [answerShownAt, setAnswerShownAt] = useState<number>(0)
  const [dueCount, setDueCount] = useState<DueCountDTO | null>(null)
  const [reviewedCount, setReviewedCount] = useState(0)

  // Fetch the first card on mount
  useEffect(() => {
    const fetchInitialData = async (): Promise<void> => {
      try {
        setIsLoading(true)
        const [card, count] = await Promise.all([
          api.review.getNextCard(),
          api.review.getDueCount(),
        ])
        setCurrentCard(card)
        setDueCount(count)
      } catch (error) {
        console.error('Failed to fetch initial review data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchInitialData()
  }, [api])

  const handleShowAnswer = useCallback((): void => {
    setShowAnswer(true)
    setAnswerShownAt(Date.now())
  }, [])

  const handleRating = useCallback(async (ratingValue: number): Promise<void> => {
    if (!currentCard) return

    const timeMs = answerShownAt > 0 ? Date.now() - answerShownAt : 0
    const rating = mapRatingToType(ratingValue)

    const submitData: ReviewSubmitDTO = {
      variantId: currentCard.variant.id,
      conceptId: currentCard.concept.id,
      dimension: currentCard.variant.dimension,
      rating,
      timeMs,
    }

    try {
      const result = await api.review.submit(submitData)
      setReviewedCount((prev) => prev + 1)
      setCurrentCard(result.nextCard)
      setShowAnswer(false)
      setAnswerShownAt(0)
    } catch (error) {
      console.error('Failed to submit review:', error)
    }
  }, [api, currentCard, answerShownAt])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      // Ignore if typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      if (event.code === 'Space' && !showAnswer && currentCard) {
        event.preventDefault()
        handleShowAnswer()
      } else if (showAnswer && currentCard) {
        const key = event.key
        if (key >= '1' && key <= '4') {
          event.preventDefault()
          void handleRating(parseInt(key, 10))
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showAnswer, currentCard, handleShowAnswer, handleRating])

  const hasCards = currentCard !== null
  const totalCards = dueCount?.total ?? 0

  // Show loading state while fetching initial data - announced via aria-live
  if (isLoading) {
    return (
      <div className={styles.reviewPage}>
        <div
          className={styles.emptyState}
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="spinner" aria-hidden="true" />
          <h2>Loading Review Session</h2>
          <p>Fetching your cards...</p>
        </div>
      </div>
    )
  }

  // Show empty state when no cards are due
  if (!hasCards) {
    return (
      <div className={styles.reviewPage}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>&#10003;</div>
          <h2>No Cards Due for Review</h2>
          <p>Great job! You have completed all your reviews for now.</p>
          <p className={styles.emptyHint}>
            New cards will become due based on your spaced repetition schedule.
          </p>
          <div className={styles.emptyActions}>
            <Link to="/" className="btn-primary">
              Back to Dashboard
            </Link>
            <Link to="/concepts" className="btn-secondary">
              Add New Concepts
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Calculate progress based on reviewed count
  const remainingCards = totalCards - reviewedCount
  const progressPercent = totalCards > 0 ? (reviewedCount / totalCards) * 100 : 0

  return (
    <div className={styles.reviewPage}>
      {/* Progress Header */}
      <header className={styles.header}>
        <div className={styles.progressInfo}>
          <span className={styles.progressText}>
            {reviewedCount} reviewed, {remainingCards} remaining
          </span>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <Link to="/" className={styles.exitButton}>
          Exit Review
        </Link>
      </header>

      {/* Card Display */}
      <main className={styles.cardContainer}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.conceptBadge}>
              {currentCard?.concept?.name ?? 'Unknown Concept'}
            </span>
            <span className={styles.typeBadge}>
              {currentCard?.variant?.dimension ?? 'Unknown'}
            </span>
          </div>

          <div className={styles.cardContent}>
            <div className={styles.questionSection}>
              <h3 className={styles.sectionLabel}>Question</h3>
              <p className={styles.questionText}>
                {currentCard?.variant?.front ?? 'No question available'}
              </p>
            </div>

            {showAnswer && (
              <div className={styles.answerSection}>
                <h3 className={styles.sectionLabel}>Answer</h3>
                <p className={styles.answerText}>
                  {currentCard?.variant?.back ?? 'No answer available'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          {!showAnswer ? (
            <button
              type="button"
              className={`btn-primary ${styles.showAnswerButton}`}
              onClick={handleShowAnswer}
            >
              Show Answer
              <span className={styles.keyboardHint}>
                (Press <kbd>Space</kbd>)
              </span>
            </button>
          ) : (
            <div className={styles.ratingButtons}>
              <p className={styles.ratingPrompt}>How well did you remember?</p>
              <div className={styles.ratingGrid}>
                {getRatingOptions().map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.ratingButton} ${option.className}`}
                    onClick={() => void handleRating(option.value)}
                    aria-label={`${option.label}: ${option.description}. Press ${option.value} key`}
                  >
                    <span className={styles.ratingLabel}>{option.label}</span>
                    <span className={styles.ratingDescription}>{option.description}</span>
                    <span className={styles.keyboardHint}>
                      (Press <kbd>{option.value}</kbd>)
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default ReviewPage
