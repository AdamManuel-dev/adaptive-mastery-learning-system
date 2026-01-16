/**
 * @fileoverview Domain module barrel export
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Centralized exports for domain layer
 * Main APIs: Value objects, entities (future), aggregates (future)
 * Constraints: Re-exports only, no additional logic
 * Patterns: Barrel pattern for clean imports, DDD layer organization
 */

// Value Objects
export {
  // Identifiers
  ConceptId,
  type ConceptIdValue,
  VariantId,
  type VariantIdValue,
  EventId,
  type EventIdValue,
  // Domain value objects
  Dimension,
  DimensionType,
  type DimensionTypeValue,
  Difficulty,
  type DifficultyLevel,
  ReviewResult,
  ReviewRating,
  type ReviewRatingValue,
  MasteryScore,
  type MasteryScoreProps,
  type MasteryLevel,
} from './value-objects'
