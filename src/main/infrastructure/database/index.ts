/**
 * @fileoverview Database module exports for the Adaptive Mastery Learning System
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Unified exports for database connection, migrations, errors, and seeding
 * Main APIs: getDatabase, runMigrations, seedMasteryDimensions, DatabaseError
 * Constraints: All database operations should go through these exported functions
 * Patterns: Barrel export pattern for clean imports
 */

// Connection management
export {
  getDatabase,
  initializeDatabase,
  closeDatabase,
  withTransaction,
  isDatabaseInitialized,
} from './connection';

// Migration system
export {
  runMigrations,
  getMigrationStatus,
  rollbackTo,
  type Migration,
} from './migrate';

// Error types
export {
  DatabaseError,
  MigrationError,
  ConnectionError,
  type DatabaseErrorCode,
} from './errors';

// Seed data
export {
  seedMasteryDimensions,
  seedSampleData,
  seedAll,
  DIMENSIONS,
  type Dimension,
} from './seed';
