/**
 * @fileoverview Central export for all shared types
 * @lastmodified 2025-01-16T00:00:00Z
 *
 * Re-exports all type definitions from the shared/types module.
 * Import from '@shared/types' for all domain types and interfaces.
 */

// Branded ID types
export type { ConceptId, EventId, VariantId } from './branded';
export {
  asConceptId,
  asEventId,
  asVariantId,
  isValidUuid,
} from './branded';

// Core domain types and interfaces
export {
  createEmptyMasteryProfile,
  DimensionType,
  isFragileConfidence,
  isWeakMastery,
  reviewResultToScore,
} from './core';

export type {
  Concept,
  ConceptWithVariants,
  DifficultyLevel,
  DimensionMastery,
  MasteryProfile,
  ReviewEvent,
  ReviewResultType,
  ScheduleEntry,
  Variant,
} from './core';
