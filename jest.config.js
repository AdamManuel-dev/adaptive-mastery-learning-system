/**
 * @fileoverview Jest configuration for Adaptive Mastery Learning System
 * @lastmodified 2025-01-16T00:00:00Z
 *
 * Configures Jest for TypeScript testing with React Testing Library support.
 * Handles path aliases and separates main/renderer process tests.
 */

/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        useESM: true,
      },
    ],
  },
  moduleNameMapper: {
    // Path aliases matching tsconfig
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@main/(.*)$': '<rootDir>/src/main/$1',
    '^@renderer/(.*)$': '<rootDir>/src/renderer/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    // Handle CSS imports
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/main/index.ts',
    '!src/renderer/main.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testPathIgnorePatterns: ['/node_modules/', '/out/', '/dist/'],
  watchPathIgnorePatterns: ['/node_modules/', '/out/', '/dist/'],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // Projects for different test environments
  projects: [
    {
      displayName: 'renderer',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/renderer/**/*.test.{ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
    },
    {
      displayName: 'main',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/src/main/**/*.test.ts',
        '<rootDir>/src/domain/**/*.test.ts',
        '<rootDir>/src/application/**/*.test.ts',
        '<rootDir>/src/shared/**/*.test.ts',
        '<rootDir>/src/__tests__/domain/**/*.test.ts',
        '<rootDir>/src/__tests__/application/**/*.test.ts',
        '<rootDir>/src/__tests__/shared/**/*.test.ts',
      ],
      transform: {
        '^.+\\.ts$': [
          'ts-jest',
          {
            tsconfig: 'tsconfig.json',
          },
        ],
      },
    },
  ],
}

module.exports = config
