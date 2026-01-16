/**
 * @fileoverview Type-safe IPC API wrapper for renderer process
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Type-safe API calls via window.api, concept CRUD, mastery queries, review operations
 * Main APIs: Wraps IPC exposed API from preload script
 * Constraints: Requires preload script to expose window.api object
 * Patterns: Service pattern with typed methods matching IPC channels
 */

/**
 * Concept entity from domain layer
 */
export interface Concept {
  id: string
  name: string
  description: string
  parentId: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Mastery profile for a concept
 */
export interface MasteryProfile {
  conceptId: string
  overallMastery: number
  questionTypeMastery: Record<string, number>
  reviewCount: number
  lastReviewedAt: string | null
  nextReviewAt: string | null
}

/**
 * Review card for study sessions
 */
export interface ReviewCard {
  id: string
  conceptId: string
  conceptName: string
  questionType: string
  question: string
  answer: string
  dueAt: string
}

/**
 * Review rating from user
 */
export interface ReviewRating {
  cardId: string
  rating: 1 | 2 | 3 | 4
  reviewedAt: string
}

/**
 * Settings configuration
 */
export interface Settings {
  llmProvider: 'openai' | 'anthropic' | 'local'
  apiKey: string
  modelName: string
  reviewsPerSession: number
  newCardsPerDay: number
  theme: 'light' | 'dark' | 'system'
}

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  totalConcepts: number
  masteredConcepts: number
  learningConcepts: number
  dueForReview: number
  averageMastery: number
}

/**
 * Type definition for the window.api object exposed by preload
 * This will be implemented by the preload script
 */
interface ElectronAPI {
  concepts: {
    getAll: () => Promise<Concept[]>
    getById: (id: string) => Promise<Concept | null>
    create: (data: Omit<Concept, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Concept>
    update: (id: string, data: Partial<Omit<Concept, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Concept>
    delete: (id: string) => Promise<void>
  }
  mastery: {
    getProfile: (conceptId: string) => Promise<MasteryProfile | null>
    getAllProfiles: () => Promise<MasteryProfile[]>
    getDashboardStats: () => Promise<DashboardStats>
  }
  review: {
    getDueCards: (limit?: number) => Promise<ReviewCard[]>
    submitRating: (rating: ReviewRating) => Promise<void>
    getSessionHistory: (limit?: number) => Promise<ReviewRating[]>
  }
  settings: {
    get: () => Promise<Settings>
    update: (settings: Partial<Settings>) => Promise<Settings>
    testLLMConnection: () => Promise<{ success: boolean; message: string }>
  }
}

// Note: Window.api type is declared in src/preload/index.d.ts
// The ElectronAPI type here is for the legacy api service wrapper

/**
 * Check if running in Electron environment with API available
 */
function isElectronAPIAvailable(): boolean {
  return typeof window !== 'undefined' && window.api !== undefined
}

/**
 * Get the API object, throwing if not available
 * Note: This casts window.api to the legacy ElectronAPI type for backwards compatibility.
 * New code should use window.api directly with types from src/preload/index.d.ts
 */
function getAPI(): ElectronAPI {
  if (!isElectronAPIAvailable()) {
    throw new Error(
      'Electron API not available. Ensure this is running in Electron with preload script.'
    )
  }
  // Cast to unknown first to handle the type mismatch between
  // the legacy ElectronAPI and the actual preload AppAPI types
  return window.api as unknown as ElectronAPI
}

/**
 * Concepts API service
 */
export const conceptsApi = {
  /**
   * Get all concepts
   */
  getAll: async (): Promise<Concept[]> => {
    if (!isElectronAPIAvailable()) {
      console.warn('API not available, returning empty array')
      return []
    }
    return getAPI().concepts.getAll()
  },

  /**
   * Get a concept by ID
   */
  getById: async (id: string): Promise<Concept | null> => {
    if (!isElectronAPIAvailable()) {
      return null
    }
    return getAPI().concepts.getById(id)
  },

  /**
   * Create a new concept
   */
  create: async (data: Omit<Concept, 'id' | 'createdAt' | 'updatedAt'>): Promise<Concept> => {
    return getAPI().concepts.create(data)
  },

  /**
   * Update an existing concept
   */
  update: async (
    id: string,
    data: Partial<Omit<Concept, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Concept> => {
    return getAPI().concepts.update(id, data)
  },

  /**
   * Delete a concept
   */
  delete: async (id: string): Promise<void> => {
    return getAPI().concepts.delete(id)
  },
}

/**
 * Mastery API service
 */
export const masteryApi = {
  /**
   * Get mastery profile for a concept
   */
  getProfile: async (conceptId: string): Promise<MasteryProfile | null> => {
    if (!isElectronAPIAvailable()) {
      return null
    }
    return getAPI().mastery.getProfile(conceptId)
  },

  /**
   * Get all mastery profiles
   */
  getAllProfiles: async (): Promise<MasteryProfile[]> => {
    if (!isElectronAPIAvailable()) {
      return []
    }
    return getAPI().mastery.getAllProfiles()
  },

  /**
   * Get dashboard statistics
   */
  getDashboardStats: async (): Promise<DashboardStats> => {
    if (!isElectronAPIAvailable()) {
      return {
        totalConcepts: 0,
        masteredConcepts: 0,
        learningConcepts: 0,
        dueForReview: 0,
        averageMastery: 0,
      }
    }
    return getAPI().mastery.getDashboardStats()
  },
}

/**
 * Review API service
 */
export const reviewApi = {
  /**
   * Get cards due for review
   */
  getDueCards: async (limit?: number): Promise<ReviewCard[]> => {
    if (!isElectronAPIAvailable()) {
      return []
    }
    return getAPI().review.getDueCards(limit)
  },

  /**
   * Submit a review rating
   */
  submitRating: async (rating: ReviewRating): Promise<void> => {
    return getAPI().review.submitRating(rating)
  },

  /**
   * Get review session history
   */
  getSessionHistory: async (limit?: number): Promise<ReviewRating[]> => {
    if (!isElectronAPIAvailable()) {
      return []
    }
    return getAPI().review.getSessionHistory(limit)
  },
}

/**
 * Settings API service
 */
export const settingsApi = {
  /**
   * Get current settings
   */
  get: async (): Promise<Settings> => {
    if (!isElectronAPIAvailable()) {
      return {
        llmProvider: 'openai',
        apiKey: '',
        modelName: 'gpt-4',
        reviewsPerSession: 20,
        newCardsPerDay: 10,
        theme: 'system',
      }
    }
    return getAPI().settings.get()
  },

  /**
   * Update settings
   */
  update: async (settings: Partial<Settings>): Promise<Settings> => {
    return getAPI().settings.update(settings)
  },

  /**
   * Test LLM API connection
   */
  testLLMConnection: async (): Promise<{ success: boolean; message: string }> => {
    if (!isElectronAPIAvailable()) {
      return { success: false, message: 'API not available' }
    }
    return getAPI().settings.testLLMConnection()
  },
}

/**
 * Combined API object for convenience
 */
export const api = {
  concepts: conceptsApi,
  mastery: masteryApi,
  review: reviewApi,
  settings: settingsApi,
  isAvailable: isElectronAPIAvailable,
}

export default api
