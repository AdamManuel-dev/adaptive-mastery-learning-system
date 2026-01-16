/**
 * @fileoverview Custom database error classes for SQLite operations
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Typed database errors with context, migration errors, connection errors
 * Main APIs: DatabaseError, MigrationError, ConnectionError
 * Constraints: All errors extend base DatabaseError for consistent handling
 * Patterns: Error codes for programmatic error handling
 */

/** Error codes for database operations */
export type DatabaseErrorCode =
  | 'CONNECTION_FAILED'
  | 'MIGRATION_FAILED'
  | 'QUERY_FAILED'
  | 'CONSTRAINT_VIOLATION'
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
  | 'INVALID_DATA'
  | 'TRANSACTION_FAILED';

/**
 * Base database error with structured context
 */
export class DatabaseError extends Error {
  readonly code: DatabaseErrorCode;
  readonly cause: Error | undefined;
  readonly context: Record<string, unknown> | undefined;

  constructor(
    message: string,
    code: DatabaseErrorCode,
    options?: { cause?: Error | undefined; context?: Record<string, unknown> | undefined }
  ) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.cause = options?.cause;
    this.context = options?.context;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace?.(this, DatabaseError);
  }
}

/**
 * Error thrown during migration operations
 */
export class MigrationError extends DatabaseError {
  readonly migrationName: string;

  constructor(
    message: string,
    migrationName: string,
    options?: { cause?: Error | undefined; context?: Record<string, unknown> | undefined }
  ) {
    super(message, 'MIGRATION_FAILED', options);
    this.name = 'MigrationError';
    this.migrationName = migrationName;
  }
}

/**
 * Error thrown when database connection fails
 */
export class ConnectionError extends DatabaseError {
  readonly dbPath: string;

  constructor(
    message: string,
    dbPath: string,
    options?: { cause?: Error | undefined }
  ) {
    super(message, 'CONNECTION_FAILED', {
      cause: options?.cause,
      context: { dbPath },
    });
    this.name = 'ConnectionError';
    this.dbPath = dbPath;
  }
}
