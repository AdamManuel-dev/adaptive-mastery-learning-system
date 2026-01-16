/**
 * @fileoverview Jest test setup for Adaptive Mastery Learning System
 * @lastmodified 2025-01-16T00:00:00Z
 *
 * Configures testing environment with React Testing Library matchers
 * and global test utilities.
 */

import '@testing-library/jest-dom'

// Mock window.api for renderer tests
const mockApi = {
  concepts: {
    getAll: jest.fn().mockResolvedValue([]),
    getById: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue(undefined),
  },
  variants: {
    getByConceptId: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue(undefined),
  },
  review: {
    getNextCard: jest.fn().mockResolvedValue(null),
    submit: jest.fn().mockResolvedValue({}),
    getDueCount: jest.fn().mockResolvedValue(0),
  },
  mastery: {
    getProfile: jest.fn().mockResolvedValue({}),
    getByDimension: jest.fn().mockResolvedValue(null),
  },
  schedule: {
    getDue: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue(undefined),
  },
  settings: {
    get: jest.fn().mockResolvedValue({}),
    set: jest.fn().mockResolvedValue(undefined),
  },
}

// Set up global window.api mock
Object.defineProperty(window, 'api', {
  value: mockApi,
  writable: true,
})

// Reset all mocks between tests
beforeEach(() => {
  jest.clearAllMocks()
})

// Global test utilities
export { mockApi }
