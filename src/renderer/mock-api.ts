/**
 * @fileoverview Mock API for browser-based development (Chrome/Firefox)
 * @lastmodified 2025-01-16T19:30:00Z
 *
 * Features: In-memory mock implementation of all IPC APIs
 * Main APIs: Same surface as preload/index.ts but with mock data
 * Constraints: Data resets on page reload, no persistence
 * Patterns: Uses localStorage for simple persistence across reloads
 */

import type { ApiType } from '../preload/index'
import type {
  ConceptDTO,
  CreateConceptDTO,
  UpdateConceptDTO,
  VariantDTO,
  CreateVariantDTO,
  UpdateVariantDTO,
  ReviewCardDTO,
  ReviewSubmitDTO,
  ReviewResultDTO,
  DueCountDTO,
  MasteryProfileDTO,
  MasteryDTO,
  Dimension,
  ScheduleDTO,
  UpdateScheduleDTO,
  SettingsDTO,
  LLMConfigDTO,
  ConnectionTestResultDTO,
} from '../shared/types/ipc'

// -----------------------------------------------------------------------------
// Mock Data Storage (with localStorage persistence)
// -----------------------------------------------------------------------------

const STORAGE_KEY = 'mock-api-data'

interface MockData {
  concepts: ConceptDTO[]
  variants: VariantDTO[]
  schedules: ScheduleDTO[]
  settings: SettingsDTO
}

function loadMockData(): MockData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.warn('Failed to load mock data from localStorage:', e)
  }

  // Default mock data
  return {
    concepts: [
      {
        id: '1',
        name: 'React Hooks',
        description: 'Understanding React Hooks API',
        tags: ['react', 'javascript'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'TypeScript Generics',
        description: 'Generic types in TypeScript',
        tags: ['typescript', 'types'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    variants: [
      {
        id: 'v1',
        conceptId: '1',
        dimension: 'definition',
        difficulty: 2,
        front: 'What is the purpose of useEffect?',
        back: 'useEffect performs side effects in function components',
        hints: ['Think about what happens outside of rendering', 'Side effects'],
        lastShownAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'v2',
        conceptId: '1',
        dimension: 'example',
        difficulty: 3,
        front: 'When does useEffect cleanup run?',
        back: 'Before the component unmounts and before re-running the effect',
        hints: ['Two scenarios', 'Unmount and re-run'],
        lastShownAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'v3',
        conceptId: '2',
        dimension: 'definition',
        difficulty: 3,
        front: 'What is a generic type in TypeScript?',
        back: 'A type that can work with multiple types while preserving type safety',
        hints: ['Type parameters', 'Reusable'],
        lastShownAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    schedules: [],
    settings: {
      ewmaAlpha: 0.15,
      targetTimes: {
        1: 5000,
        2: 10000,
        3: 20000,
        4: 40000,
        5: 60000,
      },
      antiFrustrationThreshold: 3,
      cardsPerSession: 25,
      newCardsPerDay: 10,
      llm: {
        provider: 'openai',
        apiKey: '',
        model: 'gpt-4o-mini',
      },
      theme: 'system',
    },
  }
}

function saveMockData(data: MockData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('Failed to save mock data to localStorage:', e)
  }
}

let mockData = loadMockData()

// Helper to simulate async operations
const delay = (ms: number = 10) => new Promise((resolve) => setTimeout(resolve, ms))

// -----------------------------------------------------------------------------
// Mock API Implementation
// -----------------------------------------------------------------------------

export const mockApi: ApiType = {
  concepts: {
    getAll: async () => {
      await delay()
      return mockData.concepts
    },

    getById: async (id: string) => {
      await delay()
      return mockData.concepts.find((c) => c.id === id) || null
    },

    create: async (data: CreateConceptDTO) => {
      await delay()
      const newConcept: ConceptDTO = {
        id: Math.random().toString(36).substr(2, 9),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      mockData.concepts.push(newConcept)
      saveMockData(mockData)
      return newConcept
    },

    update: async (data: UpdateConceptDTO) => {
      await delay()
      const index = mockData.concepts.findIndex((c) => c.id === data.id)
      if (index === -1) throw new Error('Concept not found')

      mockData.concepts[index] = {
        ...mockData.concepts[index],
        ...data,
        updatedAt: new Date().toISOString(),
      }
      saveMockData(mockData)
      return mockData.concepts[index]
    },

    delete: async (id: string) => {
      await delay()
      mockData.concepts = mockData.concepts.filter((c) => c.id !== id)
      mockData.variants = mockData.variants.filter((v) => v.conceptId !== id)
      saveMockData(mockData)
    },
  },

  variants: {
    getByConceptId: async (conceptId: string) => {
      await delay()
      return mockData.variants.filter((v) => v.conceptId === conceptId)
    },

    create: async (data: CreateVariantDTO) => {
      await delay()
      const newVariant: VariantDTO = {
        id: Math.random().toString(36).substr(2, 9),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      mockData.variants.push(newVariant)
      saveMockData(mockData)
      return newVariant
    },

    update: async (data: UpdateVariantDTO) => {
      await delay()
      const index = mockData.variants.findIndex((v) => v.id === data.id)
      if (index === -1) throw new Error('Variant not found')

      mockData.variants[index] = {
        ...mockData.variants[index],
        ...data,
        updatedAt: new Date().toISOString(),
      }
      saveMockData(mockData)
      return mockData.variants[index]
    },

    delete: async (id: string) => {
      await delay()
      mockData.variants = mockData.variants.filter((v) => v.id !== id)
      saveMockData(mockData)
    },
  },

  review: {
    getNextCard: async () => {
      await delay()
      if (mockData.variants.length === 0) return null

      const randomVariant = mockData.variants[Math.floor(Math.random() * mockData.variants.length)]
      const concept = mockData.concepts.find((c) => c.id === randomVariant.conceptId)

      if (!concept) return null

      // Create a mock schedule for this variant
      const schedule: ScheduleDTO = {
        conceptId: randomVariant.conceptId,
        dueAt: new Date().toISOString(),
        intervalDays: 1,
        ease: 2.5,
      }

      return {
        variant: randomVariant,
        concept: concept,
        schedule: schedule,
      }
    },

    submit: async (data: ReviewSubmitDTO) => {
      await delay()

      // Get the variant to find the dimension
      const variant = mockData.variants.find((v) => v.id === data.variantId)
      if (!variant) throw new Error('Variant not found')

      // Mock updated mastery
      const updatedMastery: MasteryDTO = {
        dimension: variant.dimension,
        accuracyEwma: 0.75,
        speedEwma: 0.70,
        count: 1,
      }

      // Mock updated schedule
      const updatedSchedule: ScheduleDTO = {
        conceptId: variant.conceptId,
        dueAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        intervalDays: data.quality >= 3 ? 2 : 1,
        ease: 2.5,
      }

      // Get next card (recursive call to our own getNextCard)
      const nextCard = await mockApi.review.getNextCard()

      return {
        updatedMastery,
        updatedSchedule,
        nextCard,
      }
    },

    getDueCount: async () => {
      await delay()
      return {
        total: mockData.variants.length,
        byDimension: {
          DEFINITION: Math.floor(mockData.variants.length / 3),
          APPLICATION: Math.floor(mockData.variants.length / 3),
          INTEGRATION: Math.floor(mockData.variants.length / 3),
        },
      }
    },
  },

  mastery: {
    getProfile: async () => {
      await delay()
      return {
        dimensions: [
          {
            dimension: 'definition' as Dimension,
            accuracyEwma: 0.85,
            speedEwma: 0.75,
            count: 42,
          },
          {
            dimension: 'paraphrase' as Dimension,
            accuracyEwma: 0.65,
            speedEwma: 0.80,
            count: 28,
          },
          {
            dimension: 'example' as Dimension,
            accuracyEwma: 0.45,
            speedEwma: 0.60,
            count: 15,
          },
          {
            dimension: 'scenario' as Dimension,
            accuracyEwma: 0.72,
            speedEwma: 0.68,
            count: 35,
          },
          {
            dimension: 'discrimination' as Dimension,
            accuracyEwma: 0.90,
            speedEwma: 0.85,
            count: 50,
          },
          {
            dimension: 'cloze' as Dimension,
            accuracyEwma: 0.78,
            speedEwma: 0.82,
            count: 40,
          },
        ],
        overallScore: 0.725,
        weakestDimension: 'example' as Dimension,
        strongestDimension: 'discrimination' as Dimension,
      }
    },

    getByDimension: async (dimension: Dimension) => {
      await delay()
      return {
        dimension,
        accuracyEwma: 0.7,
        speedEwma: 0.75,
        count: 50,
      }
    },
  },

  schedule: {
    getDue: async () => {
      await delay()
      // Return schedules for all concepts
      return mockData.concepts.map((concept) => ({
        conceptId: concept.id,
        dueAt: new Date().toISOString(),
        intervalDays: 1,
        ease: 2.5,
      }))
    },

    update: async (data: UpdateScheduleDTO) => {
      await delay()
      // Find or create schedule for concept
      let schedule = mockData.schedules.find((s) => s.conceptId === data.conceptId)
      if (!schedule) {
        schedule = {
          conceptId: data.conceptId,
          dueAt: new Date().toISOString(),
          intervalDays: 1,
          ease: 2.5,
        }
        mockData.schedules.push(schedule)
      }

      schedule = {
        ...schedule,
        ...data,
      }

      const index = mockData.schedules.findIndex((s) => s.conceptId === data.conceptId)
      mockData.schedules[index] = schedule

      saveMockData(mockData)
      return schedule
    },
  },

  settings: {
    get: async (): Promise<SettingsDTO> => {
      await delay()
      return mockData.settings
    },

    set: async (data: Partial<SettingsDTO>): Promise<SettingsDTO> => {
      await delay()
      mockData.settings = {
        ...mockData.settings,
        ...data,
        // Deep merge llm config if provided
        llm: data.llm
          ? { ...mockData.settings.llm, ...data.llm }
          : mockData.settings.llm,
        // Deep merge targetTimes if provided
        targetTimes: data.targetTimes
          ? { ...mockData.settings.targetTimes, ...data.targetTimes }
          : mockData.settings.targetTimes,
      }
      saveMockData(mockData)
      return mockData.settings
    },

    testConnection: async (config: LLMConfigDTO): Promise<ConnectionTestResultDTO> => {
      await delay(500) // Simulate network latency

      // Mock connection testing for browser mode
      if (!config.apiKey && config.provider !== 'local') {
        return {
          success: false,
          message: 'API key is required',
        }
      }

      // In browser mode, we can't actually test - just validate the config
      return {
        success: true,
        message: 'Connection testing is only available in the desktop app',
        latencyMs: 500,
      }
    },
  },
}

// -----------------------------------------------------------------------------
// Browser Compatibility Shim
// -----------------------------------------------------------------------------

/**
 * Initialize mock API for browser environment
 * Call this before rendering the React app when running in browser
 */
export function initMockApi(): void {
  if (typeof window !== 'undefined') {
    // @ts-expect-error - Adding mock API to window for browser compatibility
    window.api = mockApi

    // Mock electron API (minimal implementation)
    // @ts-expect-error - Adding mock electron API
    window.electron = {
      process: {
        platform: 'darwin',
        versions: {
          node: '20.0.0',
          chrome: '120.0.0',
          electron: '28.0.0',
        },
      },
    }

    console.log('🌐 Mock API initialized for browser development')
    console.log('💾 Data persists in localStorage - clear it to reset')
  }
}
