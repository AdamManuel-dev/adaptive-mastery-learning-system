/**
 * @fileoverview Custom React hooks for API calls with loading and error states
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Data fetching hooks with loading/error states, auto-refetch, mutation support
 * Main APIs: React hooks wrapping api service calls
 * Constraints: Requires api service to be properly configured
 * Patterns: SWR-like pattern with useEffect for data fetching, useState for state management
 */

import { useState, useEffect, useCallback } from 'react'

import {
  api,
  type Concept,
  type MasteryProfile,
  type DashboardStats,
  type ReviewCard,
  type Settings,
} from '../services/api'

/**
 * Generic async state for API calls
 */
interface AsyncState<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Generic hook for async data fetching
 */
function useAsyncData<T>(
  fetchFn: () => Promise<T>,
  initialData: T | null = null
): AsyncState<T> {
  const [data, setData] = useState<T | null>(initialData)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await fetchFn()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'))
    } finally {
      setIsLoading(false)
    }
  }, [fetchFn])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { data, isLoading, error, refetch }
}

/**
 * Hook for fetching all concepts
 */
export function useConceptList(): AsyncState<Concept[]> {
  const fetchConcepts = useCallback(() => api.concepts.getAll(), [])
  return useAsyncData(fetchConcepts, [])
}

/**
 * Hook for fetching a single concept by ID
 */
export function useConcept(id: string): AsyncState<Concept | null> {
  const fetchConcept = useCallback(() => api.concepts.getById(id), [id])
  return useAsyncData(fetchConcept)
}

/**
 * Hook for fetching all mastery profiles
 */
export function useMasteryProfiles(): AsyncState<MasteryProfile[]> {
  const fetchProfiles = useCallback(() => api.mastery.getAllProfiles(), [])
  return useAsyncData(fetchProfiles, [])
}

/**
 * Hook for fetching mastery profile for a specific concept
 */
export function useMasteryProfile(conceptId: string): AsyncState<MasteryProfile | null> {
  const fetchProfile = useCallback(
    () => api.mastery.getProfile(conceptId),
    [conceptId]
  )
  return useAsyncData(fetchProfile)
}

/**
 * Hook for fetching dashboard statistics
 */
export function useDashboardStats(): AsyncState<DashboardStats> {
  const fetchStats = useCallback(() => api.mastery.getDashboardStats(), [])
  const defaultStats: DashboardStats = {
    totalConcepts: 0,
    masteredConcepts: 0,
    learningConcepts: 0,
    dueForReview: 0,
    averageMastery: 0,
  }
  return useAsyncData(fetchStats, defaultStats)
}

/**
 * Hook for fetching cards due for review
 */
export function useReviewCards(limit?: number): AsyncState<ReviewCard[]> {
  const fetchCards = useCallback(() => api.review.getDueCards(limit), [limit])
  return useAsyncData(fetchCards, [])
}

/**
 * Hook for managing settings
 */
export function useSettings(): AsyncState<Settings> & {
  updateSettings: (settings: Partial<Settings>) => Promise<void>
  testConnection: () => Promise<{ success: boolean; message: string }>
} {
  const fetchSettings = useCallback(() => api.settings.get(), [])
  const defaultSettings: Settings = {
    llmProvider: 'openai',
    apiKey: '',
    modelName: 'gpt-4',
    reviewsPerSession: 20,
    newCardsPerDay: 10,
    theme: 'system',
  }
  const asyncState = useAsyncData(fetchSettings, defaultSettings)

  const updateSettings = useCallback(
    async (settings: Partial<Settings>) => {
      await api.settings.update(settings)
      await asyncState.refetch()
    },
    [asyncState]
  )

  const testConnection = useCallback(() => api.settings.testLLMConnection(), [])

  return {
    ...asyncState,
    updateSettings,
    testConnection,
  }
}

/**
 * Mutation hook state
 */
interface MutationState<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>
  isLoading: boolean
  error: Error | null
  data: TData | null
  reset: () => void
}

/**
 * Generic hook for mutations (create, update, delete operations)
 */
function useMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>
): MutationState<TData, TVariables> {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<TData | null>(null)

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await mutationFn(variables)
        setData(result)
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Mutation failed')
        setError(error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [mutationFn]
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setIsLoading(false)
  }, [])

  return { mutate, isLoading, error, data, reset }
}

/**
 * Hook for creating a new concept
 */
export function useCreateConcept(): MutationState<
  Concept,
  Omit<Concept, 'id' | 'createdAt' | 'updatedAt'>
> {
  return useMutation((data) => api.concepts.create(data))
}

/**
 * Hook for updating a concept
 */
export function useUpdateConcept(): MutationState<
  Concept,
  { id: string; data: Partial<Omit<Concept, 'id' | 'createdAt' | 'updatedAt'>> }
> {
  return useMutation(({ id, data }) => api.concepts.update(id, data))
}

/**
 * Hook for deleting a concept
 */
export function useDeleteConcept(): MutationState<void, string> {
  return useMutation((id) => api.concepts.delete(id))
}

/**
 * Hook for submitting a review rating
 */
export function useSubmitReviewRating(): MutationState<
  void,
  { cardId: string; rating: 1 | 2 | 3 | 4 }
> {
  return useMutation(({ cardId, rating }) =>
    api.review.submitRating({
      cardId,
      rating,
      reviewedAt: new Date().toISOString(),
    })
  )
}
