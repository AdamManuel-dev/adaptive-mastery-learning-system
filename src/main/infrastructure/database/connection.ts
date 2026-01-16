/**
 * @fileoverview SQLite database connection singleton with initialization
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Singleton pattern, automatic initialization, foreign key enforcement
 * Main APIs: getDatabase(), initializeDatabase(), closeDatabase()
 * Constraints: Requires better-sqlite3, database path must be writable
 * Patterns: Lazy initialization on first access, migrations run automatically
 */

import { existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';

import Database from 'better-sqlite3';

import { ConnectionError, DatabaseError } from './errors';
import { runMigrations } from './migrate';

/** Database instance singleton */
let db: Database.Database | null = null;

/** Configuration for database initialization */
interface DatabaseConfig {
  /** Path to the SQLite database file */
  dbPath: string;
  /** Enable verbose logging for debugging */
  verbose?: boolean;
  /** Skip running migrations (useful for testing) */
  skipMigrations?: boolean;
}

/** Default database path in user data directory */
function getDefaultDbPath(): string {
  // In Electron, use app.getPath('userData')
  // For development/testing, use project data directory
  const dataDir = join(process.cwd(), 'data');
  return join(dataDir, 'learning.db');
}

/**
 * Ensures the directory for the database file exists
 */
function ensureDirectoryExists(dbPath: string): void {
  const dir = dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Configures database pragmas for optimal operation
 */
function configurePragmas(database: Database.Database): void {
  // Enable foreign key constraint enforcement
  database.pragma('foreign_keys = ON');

  // Use WAL mode for better concurrent read performance
  database.pragma('journal_mode = WAL');

  // Synchronous mode for durability vs performance balance
  database.pragma('synchronous = NORMAL');

  // Enable memory-mapped I/O for better read performance
  database.pragma('mmap_size = 268435456'); // 256MB

  // Cache size for better query performance
  database.pragma('cache_size = -64000'); // 64MB
}

/**
 * Initializes the database connection with configuration
 *
 * @param config - Database configuration options
 * @returns Initialized database instance
 * @throws ConnectionError if database cannot be opened
 */
export function initializeDatabase(config?: Partial<DatabaseConfig>): Database.Database {
  const dbPath = config?.dbPath ?? getDefaultDbPath();
  const verbose = config?.verbose ?? false;
  const skipMigrations = config?.skipMigrations ?? false;

  // Close existing connection if reinitializing
  if (db) {
    db.close();
    db = null;
  }

  try {
    ensureDirectoryExists(dbPath);

    db = new Database(dbPath, {
      verbose: verbose ? console.log : undefined,
    });

    configurePragmas(db);

    if (!skipMigrations) {
      runMigrations(db);
    }

    return db;
  } catch (error) {
    throw new ConnectionError(
      `Failed to initialize database at ${dbPath}`,
      dbPath,
      { cause: error instanceof Error ? error : new Error(String(error)) }
    );
  }
}

/**
 * Gets the database instance, initializing if necessary
 *
 * This is the primary API for database access. It uses lazy initialization
 * to create the database connection on first access.
 *
 * @returns Database instance
 * @throws ConnectionError if database cannot be initialized
 */
export function getDatabase(): Database.Database {
  if (!db) {
    return initializeDatabase();
  }
  return db;
}

/**
 * Closes the database connection
 *
 * Call this during application shutdown for clean resource release.
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Executes a function within a database transaction
 *
 * Automatically commits on success, rolls back on error.
 *
 * @param fn - Function to execute within transaction
 * @returns Result of the function
 * @throws DatabaseError if transaction fails
 */
export function withTransaction<T>(fn: (db: Database.Database) => T): T {
  const database = getDatabase();
  const transaction = database.transaction(fn);

  try {
    return transaction(database);
  } catch (error) {
    throw new DatabaseError(
      'Transaction failed',
      'TRANSACTION_FAILED',
      { cause: error instanceof Error ? error : new Error(String(error)) }
    );
  }
}

/**
 * Checks if the database has been initialized
 */
export function isDatabaseInitialized(): boolean {
  return db !== null;
}
