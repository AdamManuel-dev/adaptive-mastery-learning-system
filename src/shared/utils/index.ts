/**
 * @fileoverview Shared utilities barrel export
 * @lastmodified 2025-01-16T00:00:00Z
 *
 * Features: Centralized exports for shared utility functions
 * Main APIs: Result type and utilities, ID generators
 * Constraints: Re-exports only, no additional logic
 * Patterns: Barrel pattern for clean imports
 */

export { Result, type Result as ResultType } from './result'
export {
  generateConceptId,
  generateEventId,
  generateVariantId,
} from './id-generator'
