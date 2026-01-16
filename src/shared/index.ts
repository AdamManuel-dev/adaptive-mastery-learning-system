/**
 * @fileoverview Shared module barrel export
 * @lastmodified 2025-01-16T00:00:00Z
 *
 * Features: Centralized exports for shared utilities, types, constants, and errors
 * Main APIs: Result utilities, domain errors, core types, ID generators
 * Constraints: Re-exports only, no additional logic
 * Patterns: Barrel pattern for clean imports
 */

// Types
export * from './types'

// Constants
export * from './constants'

// Utilities
export {
  generateConceptId,
  generateEventId,
  generateVariantId,
  Result,
  type ResultType,
} from './utils'

// Errors
export {
  BusinessRuleError,
  DomainError,
  InvalidStateError,
  NotFoundError,
  ValidationError,
} from './errors'
