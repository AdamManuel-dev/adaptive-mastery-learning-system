/**
 * @fileoverview UUID-based ID generation for domain entities
 * @lastmodified 2025-01-16T00:00:00Z
 *
 * Provides type-safe ID generation functions for all entity types.
 * Uses UUID v4 for globally unique, random identifiers.
 *
 * Each generator returns a branded type to ensure compile-time
 * safety when passing IDs between functions.
 */

import { v4 as uuidv4 } from 'uuid';

import type { ConceptId, EventId, VariantId } from '@shared/types';

/**
 * Generates a new unique ConceptId.
 * Use when creating a new Concept entity.
 */
export function generateConceptId(): ConceptId {
  return uuidv4() as ConceptId;
}

/**
 * Generates a new unique VariantId.
 * Use when creating a new Variant entity.
 */
export function generateVariantId(): VariantId {
  return uuidv4() as VariantId;
}

/**
 * Generates a new unique EventId.
 * Use when recording a new ReviewEvent.
 */
export function generateEventId(): EventId {
  return uuidv4() as EventId;
}
