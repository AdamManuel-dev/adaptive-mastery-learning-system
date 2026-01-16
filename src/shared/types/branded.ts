/**
 * @fileoverview Branded types for type-safe identifiers
 * @lastmodified 2025-01-16T00:00:00Z
 *
 * Provides compile-time type safety for entity identifiers using TypeScript's
 * branded types pattern. Prevents accidental mixing of different ID types
 * (e.g., passing a ConceptId where a VariantId is expected).
 *
 * Pattern: Uses unique symbol brands that exist only at compile time,
 * with no runtime overhead.
 */

/**
 * Branded type for Concept entity identifiers.
 * Ensures type safety when passing concept IDs between functions.
 */
export type ConceptId = string & { readonly __brand: unique symbol };

/**
 * Branded type for Variant entity identifiers.
 * Ensures type safety when passing variant IDs between functions.
 */
export type VariantId = string & { readonly __brand: unique symbol };

/**
 * Branded type for ReviewEvent entity identifiers.
 * Ensures type safety when passing event IDs between functions.
 */
export type EventId = string & { readonly __brand: unique symbol };

/**
 * Type guard to check if a string is a valid UUID format.
 * Does not validate that the ID actually exists in the database.
 */
export function isValidUuid(value: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Casts a string to a ConceptId.
 * Use with caution - only for trusted sources like database reads.
 */
export function asConceptId(id: string): ConceptId {
  return id as ConceptId;
}

/**
 * Casts a string to a VariantId.
 * Use with caution - only for trusted sources like database reads.
 */
export function asVariantId(id: string): VariantId {
  return id as VariantId;
}

/**
 * Casts a string to an EventId.
 * Use with caution - only for trusted sources like database reads.
 */
export function asEventId(id: string): EventId {
  return id as EventId;
}
