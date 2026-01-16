/**
 * @fileoverview Review session page for spaced repetition card review
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Card display, show answer toggle, rating buttons, keyboard shortcuts
 * Main APIs: window.api.review for card fetching and submission
 * Constraints: Displays placeholder when no cards are due
 * Patterns: State machine pattern for review flow (question -> answer -> rated)
 */

import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'

import styles from './ReviewPage.module.css'

import type {
  ReviewCardDTO,
  ReviewSubmitDTO,
  Rating,
  DueCountDTO,
} from '../../shared/types/ipc'

/**
 * Type for the review API exposed via preload
 * Note: This matches the API in src/preload/index.ts
 */
interface ReviewApiType {
  getNextCard: () => Promise<ReviewCardDTO | null>
  submit: (data: ReviewSubmitDTO) => Promise<{
    updatedMastery: unknown
    updatedSchedule: unknown
    nextCard: ReviewCardDTO | null
  }>
  getDueCount: () => Promise<DueCountDTO>
}

/**
 * Get the review API from window, with type safety
 * The window.api is exposed by the preload script
 */
function getReviewApi(): ReviewApiType {
  // Using type assertion since the actual preload API has these methods
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  return (window as any).api.review as ReviewApiType
}

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
 * Available rating options following SM-2 style ratings
 */
const ratingOptions: RatingOption[] = [
  { value: 1, label: 'Again', rating: 'again', description: 'Forgot completely', className: styles.ratingAgain ?? '' },
  { value: 2, label: 'Hard', rating: 'hard', description: 'Remembered with difficulty', className: styles.ratingHard ?? '' },
  { value: 3, label: 'Good', rating: 'good', description: 'Remembered correctly', className: styles.ratingGood ?? '' },
  { value: 4, label: 'Easy', rating: 'easy', description: 'Too easy', className: styles.ratingEasy ?? '' },
]

/**
 * Map numeric rating (1-4) to Rating type
 */
function mapRatingToType(value: number): Rating {
  const option = ratingOptions.find((opt) => opt.value === value)
  return option?.rating ?? 'good'
}

/**
 * Review page component
 * Manages the card review session with show/hide answer and rating flow
 */
function ReviewPage(): React.JSX.Element {
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
        const reviewApi = getReviewApi()
        const [card, count] = await Promise.all([
          reviewApi.getNextCard(),
          reviewApi.getDueCount(),
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
  }, [])

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
      const reviewApi = getReviewApi()
      const result = await reviewApi.submit(submitData)
      setReviewedCount((prev) => prev + 1)
      setCurrentCard(result.nextCard)
      setShowAnswer(false)
      setAnswerShownAt(0)
    } catch (error) {
      console.error('Failed to submit review:', error)
    }
  }, [currentCard, answerShownAt])

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

  // Show loading state while fetching initial data
  if (isLoading) {
    return (
      <div className={styles.reviewPage}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>...</div>
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
            <span className={styles.conceptBadge}>{currentCard.concept.name}</span>
            <span className={styles.typeBadge}>{currentCard.variant.dimension}</span>
          </div>

          <div className={styles.cardContent}>
            <div className={styles.questionSection}>
              <h3 className={styles.sectionLabel}>Question</h3>
              <p className={styles.questionText}>{currentCard.variant.front}</p>
            </div>

            {showAnswer && (
              <div className={styles.answerSection}>
                <h3 className={styles.sectionLabel}>Answer</h3>
                <p className={styles.answerText}>{currentCard.variant.back}</p>
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
              <span className={styles.keyboardHint}>(Space)</span>
            </button>
          ) : (
            <div className={styles.ratingButtons}>
              <p className={styles.ratingPrompt}>How well did you remember?</p>
              <div className={styles.ratingGrid}>
                {ratingOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.ratingButton} ${option.className}`}
                    onClick={() => void handleRating(option.value)}
                  >
                    <span className={styles.ratingLabel}>{option.label}</span>
                    <span className={styles.ratingDescription}>{option.description}</span>
                    <span className={styles.keyboardHint}>({option.value})</span>
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
