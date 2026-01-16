/**
 * @fileoverview Result type utility for explicit error handling
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Type-safe success/error discrimination, utility functions
 * Main APIs: Result.ok(), Result.err(), Result.unwrap(), Result.map()
 * Constraints: Immutable result objects, no exception throwing in utilities
 * Patterns: Railway-oriented programming, functional error handling
 */

/**
 * Represents the outcome of an operation that may fail.
 * Success contains a value, failure contains an error.
 */
export type Result<T, E = Error> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly error: E }

/**
 * Utility functions for working with Result types.
 */
export const Result = {
  /**
   * Creates a successful result containing the given value.
   */
  ok<T>(value: T): Result<T, never> {
    return { success: true, value }
  },

  /**
   * Creates a failed result containing the given error.
   */
  err<E>(error: E): Result<never, E> {
    return { success: false, error }
  },

  /**
   * Type guard to check if a result is successful.
   */
  isOk<T, E>(result: Result<T, E>): result is { success: true; value: T } {
    return result.success
  },

  /**
   * Type guard to check if a result is an error.
   */
  isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
    return !result.success
  },

  /**
   * Extracts the value from a successful result.
   * Throws the error if the result is a failure.
   */
  unwrap<T, E extends Error>(result: Result<T, E>): T {
    if (result.success) {
      return result.value
    }
    throw result.error as Error
  },

  /**
   * Extracts the value from a result, returning a default value if it failed.
   */
  unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
    return result.success ? result.value : defaultValue
  },

  /**
   * Transforms the value inside a successful result.
   * Passes through errors unchanged.
   */
  map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
    if (result.success) {
      return Result.ok(fn(result.value))
    }
    return result
  },

  /**
   * Chains result-producing operations.
   * Returns early if the result is an error.
   */
  flatMap<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> {
    if (result.success) {
      return fn(result.value)
    }
    return result
  },

  /**
   * Transforms the error inside a failed result.
   * Passes through successful values unchanged.
   */
  mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
    if (result.success) {
      return result
    }
    return Result.err(fn(result.error))
  },

  /**
   * Collects an array of results into a result of an array.
   * Returns the first error encountered, or all values if all succeeded.
   */
  all<T, E>(results: Result<T, E>[]): Result<T[], E> {
    const values: T[] = []
    for (const result of results) {
      if (!result.success) {
        return result
      }
      values.push(result.value)
    }
    return Result.ok(values)
  },
} as const
