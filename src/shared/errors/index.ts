/**
 * @fileoverview Domain error hierarchy for explicit error handling
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Typed domain errors, error codes, structured error messages
 * Main APIs: DomainError, ValidationError, NotFoundError
 * Constraints: All errors extend DomainError, codes are uppercase with underscores
 * Patterns: Error inheritance, error discrimination via code property
 */

/**
 * Base class for all domain errors.
 * Provides a structured error with a code for programmatic handling.
 */
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message)
    this.name = 'DomainError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

/**
 * Error thrown when input validation fails.
 * Used for user input, configuration, or data integrity issues.
 */
export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

/**
 * Error thrown when a requested entity cannot be found.
 */
export class NotFoundError extends DomainError {
  constructor(
    public readonly entity: string,
    public readonly id: string
  ) {
    super(`${entity} with id ${id} not found`, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

/**
 * Error thrown when a business rule is violated.
 */
export class BusinessRuleError extends DomainError {
  constructor(
    message: string,
    public readonly rule: string
  ) {
    super(message, 'BUSINESS_RULE_VIOLATION')
    this.name = 'BusinessRuleError'
  }
}

/**
 * Error thrown when an operation is attempted in an invalid state.
 */
export class InvalidStateError extends DomainError {
  constructor(
    message: string,
    public readonly currentState: string,
    public readonly expectedState?: string
  ) {
    super(message, 'INVALID_STATE')
    this.name = 'InvalidStateError'
  }
}
