/**
 * @fileoverview EventId branded value object for type-safe event identification
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: UUID generation, validation, type-safe string branding
 * Main APIs: EventId.create(), EventId.fromString(), equals(), toString()
 * Constraints: Immutable, non-empty string, preferably UUID format
 * Patterns: Branded type pattern for compile-time type safety
 */

import { ValidationError } from '../../shared/errors'
import { Result } from '../../shared/utils/result'

/**
 * Brand symbol for compile-time type safety.
 */
declare const EventIdBrand: unique symbol

/**
 * Branded type that distinguishes EventId from plain strings at compile time.
 */
export type EventIdValue = string & { readonly [EventIdBrand]: typeof EventIdBrand }

/**
 * UUID v4 regex pattern for validation.
 */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Generates a UUID v4 using the crypto API.
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Represents a unique identifier for domain events.
 * Uses the branded type pattern for compile-time distinction from other IDs.
 */
export class EventId {
  private constructor(private readonly id: EventIdValue) {}

  /**
   * Creates a new EventId with a generated UUID.
   * Use this when creating new events.
   *
   * @param value - Optional existing ID value. If not provided, generates a UUID.
   */
  static create(value?: string): EventId {
    const id = value ?? generateUUID()
    return new EventId(id as EventIdValue)
  }

  /**
   * Creates an EventId from an existing string with validation.
   * Returns a ValidationError if the string is empty.
   *
   * @param value - The string value to use as the ID
   */
  static fromString(value: string): Result<EventId, ValidationError> {
    const trimmed = value.trim()

    if (trimmed.length === 0) {
      return Result.err(new ValidationError('EventId cannot be empty'))
    }

    return Result.ok(new EventId(trimmed as EventIdValue))
  }

  /**
   * Creates an EventId from a string that is known to be valid.
   * Use this when loading from database or other trusted sources.
   */
  static of(value: string): EventId {
    return new EventId(value as EventIdValue)
  }

  /**
   * The underlying string value.
   */
  get value(): EventIdValue {
    return this.id
  }

  /**
   * Checks if this ID has a valid UUID format.
   */
  get isUUID(): boolean {
    return UUID_PATTERN.test(this.id)
  }

  /**
   * Checks equality with another EventId.
   */
  equals(other: EventId): boolean {
    return this.id === other.id
  }

  /**
   * Returns the string representation of the ID.
   */
  toString(): string {
    return this.id
  }

  /**
   * Returns the JSON representation (just the string value).
   */
  toJSON(): string {
    return this.id
  }
}
