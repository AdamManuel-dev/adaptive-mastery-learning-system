/**
 * @fileoverview Mock API for browser-based development (Chrome/Firefox)
 * @lastmodified 2026-01-16T20:35:00Z
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
    if (stored !== null && stored !== '') {
      return JSON.parse(stored) as MockData
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
        definition: 'Understanding React Hooks API',
        facts: ['useState manages state', 'useEffect handles side effects', 'Custom hooks reuse logic'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'TypeScript Generics',
        definition: 'Generic types in TypeScript',
        facts: ['Allow type parameters', 'Provide type safety', 'Enable code reuse'],
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
        questionType: 'flashcard',
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
        questionType: 'flashcard',
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
        questionType: 'flashcard',
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

const mockData = loadMockData()

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
        name: data.name,
        definition: data.definition ?? null,
        facts: data.facts ?? [],
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

      const existing = mockData.concepts[index]
      if (!existing) throw new Error('Concept not found')

      mockData.concepts[index] = {
        ...existing,
        ...(data.name !== undefined && { name: data.name }),
        ...(data.definition !== undefined && { definition: data.definition }),
        ...(data.facts !== undefined && { facts: data.facts }),
        updatedAt: new Date().toISOString(),
      }
      saveMockData(mockData)
      const updatedConcept = mockData.concepts[index]
      if (!updatedConcept) throw new Error('Concept not found after update')
      return updatedConcept
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
        conceptId: data.conceptId,
        dimension: data.dimension,
        difficulty: data.difficulty ?? 3,
        front: data.front,
        back: data.back,
        hints: data.hints ?? [],
        lastShownAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        questionType: data.questionType ?? 'flashcard',
        ...(data.rubric !== undefined && { rubric: data.rubric }),
        ...(data.maxLength !== undefined && { maxLength: data.maxLength }),
      }
      mockData.variants.push(newVariant)
      saveMockData(mockData)
      return newVariant
    },

    update: async (data: UpdateVariantDTO): Promise<VariantDTO> => {
      await delay()
      const index = mockData.variants.findIndex((v) => v.id === data.id)
      if (index === -1) throw new Error('Variant not found')

      const existing = mockData.variants[index]
      if (!existing) throw new Error('Variant not found')

      // Update only the fields that are provided
      const updatedVariant: VariantDTO = {
        ...existing,
        ...(data.dimension !== undefined && { dimension: data.dimension }),
        ...(data.difficulty !== undefined && { difficulty: data.difficulty }),
        ...(data.front !== undefined && { front: data.front }),
        ...(data.back !== undefined && { back: data.back }),
        ...(data.hints !== undefined && { hints: data.hints }),
        ...(data.questionType !== undefined && { questionType: data.questionType }),
        ...(data.rubric !== undefined && { rubric: data.rubric }),
        ...(data.maxLength !== undefined && { maxLength: data.maxLength }),
        updatedAt: new Date().toISOString(),
      }
      mockData.variants[index] = updatedVariant
      saveMockData(mockData)
      return updatedVariant
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

      const randomIndex = Math.floor(Math.random() * mockData.variants.length)
      const randomVariant = mockData.variants[randomIndex]
      if (!randomVariant) return null

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

    submit: async (data) => {
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

      // Determine interval based on rating (instead of quality)
      const ratingToInterval = {
        again: 0,
        hard: 1,
        good: 2,
        easy: 4,
      }

      // Mock updated schedule
      const updatedSchedule: ScheduleDTO = {
        conceptId: variant.conceptId,
        dueAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        intervalDays: ratingToInterval[data.rating] ?? 1,
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
      const variantCount = mockData.variants.length
      const countPerDimension = Math.floor(variantCount / 6)
      return {
        total: variantCount,
        byDimension: {
          definition: countPerDimension,
          paraphrase: countPerDimension,
          example: countPerDimension,
          scenario: countPerDimension,
          discrimination: countPerDimension,
          cloze: countPerDimension,
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

  analytics: {
    getMasteryTimeline: async (_args: { days: number }) => {
      await delay()
      // Return mock timeline data
      const today = new Date()
      const entries = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        entries.push({
          date: date.toISOString().split('T')[0]!,
          dimensions: {
            definition: { accuracy: 0.8 + Math.random() * 0.1, speed: 0.7 + Math.random() * 0.1, combined: 0.75 + Math.random() * 0.1 },
            paraphrase: { accuracy: 0.7 + Math.random() * 0.1, speed: 0.8 + Math.random() * 0.1, combined: 0.75 + Math.random() * 0.1 },
            example: { accuracy: 0.5 + Math.random() * 0.2, speed: 0.6 + Math.random() * 0.1, combined: 0.55 + Math.random() * 0.15 },
            scenario: { accuracy: 0.7 + Math.random() * 0.1, speed: 0.65 + Math.random() * 0.1, combined: 0.68 + Math.random() * 0.1 },
            discrimination: { accuracy: 0.9 + Math.random() * 0.05, speed: 0.85 + Math.random() * 0.05, combined: 0.88 + Math.random() * 0.05 },
            cloze: { accuracy: 0.75 + Math.random() * 0.1, speed: 0.8 + Math.random() * 0.1, combined: 0.78 + Math.random() * 0.1 },
          },
        })
      }
      return entries
    },

    getReviewDistribution: async () => {
      await delay()
      return [
        { dimension: 'definition' as Dimension, again: 5, hard: 12, good: 35, easy: 18 },
        { dimension: 'paraphrase' as Dimension, again: 8, hard: 15, good: 28, easy: 12 },
        { dimension: 'example' as Dimension, again: 15, hard: 20, good: 18, easy: 5 },
        { dimension: 'scenario' as Dimension, again: 10, hard: 18, good: 25, easy: 10 },
        { dimension: 'discrimination' as Dimension, again: 3, hard: 8, good: 40, easy: 25 },
        { dimension: 'cloze' as Dimension, again: 7, hard: 14, good: 32, easy: 15 },
      ]
    },

    getResponseTimeStats: async () => {
      await delay()
      return [
        { difficulty: 1, min: 1000, max: 8000, avg: 3500, median: 3000, count: 50 },
        { difficulty: 2, min: 2000, max: 12000, avg: 5000, median: 4500, count: 45 },
        { difficulty: 3, min: 3000, max: 20000, avg: 8000, median: 7000, count: 40 },
        { difficulty: 4, min: 5000, max: 35000, avg: 15000, median: 12000, count: 30 },
        { difficulty: 5, min: 8000, max: 60000, avg: 25000, median: 20000, count: 20 },
      ]
    },

    getWeaknessHeatmap: async (_args: { days: number }) => {
      await delay()
      const today = new Date()
      const entries = []
      const severities: Array<'none' | 'mild' | 'moderate' | 'critical'> = ['none', 'mild', 'moderate', 'critical']
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        entries.push({
          date: date.toISOString().split('T')[0]!,
          dimensions: {
            definition: severities[Math.floor(Math.random() * 2)]!,
            paraphrase: severities[Math.floor(Math.random() * 2)]!,
            example: severities[Math.floor(Math.random() * 4)]!,
            scenario: severities[Math.floor(Math.random() * 3)]!,
            discrimination: 'none' as const,
            cloze: severities[Math.floor(Math.random() * 2)]!,
          },
        })
      }
      return entries
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
    // Adding mock API to window for browser compatibility
    const win = window as unknown as { api: typeof mockApi; electron: object }
    win.api = mockApi

    // Mock electron API (minimal implementation)
    win.electron = {
      process: {
        platform: 'darwin',
        versions: {
          node: '20.0.0',
          chrome: '120.0.0',
          electron: '28.0.0',
        },
        env: {},
      },
    }

    // eslint-disable-next-line no-console
    console.log('Mock API initialized for browser development')
    // eslint-disable-next-line no-console
    console.log('Data persists in localStorage - clear it to reset')
  }
}
