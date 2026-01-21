/**
 * @fileoverview Database migration runner with version tracking
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Sequential migration execution, version tracking, rollback structure
 * Main APIs: runMigrations(), getMigrationStatus()
 * Constraints: Migrations must be numbered and sequential, runs in transaction
 * Patterns: Each migration runs in isolation, failures roll back single migration
 */

import { MigrationError } from './errors';
import { migration as initialSchemaMigration } from './migrations/001_initial_schema';
import { migration as openResponseMigration } from './migrations/002_open_response';

import type Database from 'better-sqlite3';

/** Migration definition structure */
export interface Migration {
  /** Unique migration identifier (e.g., '001_initial_schema') */
  name: string;
  /** SQL or function to apply the migration */
  up: string | ((db: Database.Database) => void);
  /** SQL or function to reverse the migration (for future rollback support) */
  down?: string | ((db: Database.Database) => void);
}

/** Migration status record */
interface MigrationRecord {
  name: string;
  applied_at: string;
}

/**
 * Creates the migrations tracking table if it doesn't exist
 */
function ensureMigrationsTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

/**
 * Gets list of already applied migrations
 */
function getAppliedMigrations(db: Database.Database): Set<string> {
  const rows = db
    .prepare<[], MigrationRecord>('SELECT name FROM _migrations ORDER BY name')
    .all();
  return new Set(rows.map((r) => r.name));
}

/**
 * Marks a migration as applied
 */
function recordMigration(db: Database.Database, name: string): void {
  db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(name);
}

/**
 * Executes a single migration within a transaction
 */
function executeMigration(db: Database.Database, migration: Migration): void {
  const { name, up } = migration;

  try {
    if (typeof up === 'string') {
      db.exec(up);
    } else {
      up(db);
    }
    recordMigration(db, name);
  } catch (error) {
    throw new MigrationError(`Failed to apply migration: ${name}`, name, {
      cause: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

/**
 * Import and return all migrations in order
 *
 * Migrations are loaded statically and sorted by name.
 * This ensures consistent ordering across environments.
 *
 * Note: When adding new migrations, import them at the top and add to the array below.
 */
function loadMigrations(): Migration[] {
  const migrations: Migration[] = [
    initialSchemaMigration,
    openResponseMigration,
  ];

  // Sort by name to ensure consistent ordering
  return migrations.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Runs all pending migrations
 *
 * Migrations are executed in order by name. Each migration runs within
 * its own transaction for isolation.
 *
 * @param db - Database instance to run migrations on
 * @returns Number of migrations applied
 * @throws MigrationError if any migration fails
 */
export function runMigrations(db: Database.Database): number {
  ensureMigrationsTable(db);

  const applied = getAppliedMigrations(db);
  const migrations = loadMigrations();
  const pending = migrations.filter((m) => !applied.has(m.name));

  if (pending.length === 0) {
    return 0;
  }

  let appliedCount = 0;

  for (const migration of pending) {
    // Each migration runs in its own transaction
    const runInTransaction = db.transaction(() => {
      executeMigration(db, migration);
    });

    runInTransaction();
    appliedCount++;
  }

  return appliedCount;
}

/**
 * Gets the current migration status
 *
 * @param db - Database instance
 * @returns Object with applied and pending migration names
 */
export function getMigrationStatus(db: Database.Database): {
  applied: string[];
  pending: string[];
} {
  ensureMigrationsTable(db);

  const appliedSet = getAppliedMigrations(db);
  const migrations = loadMigrations();

  return {
    applied: Array.from(appliedSet),
    pending: migrations.filter((m) => !appliedSet.has(m.name)).map((m) => m.name),
  };
}

/**
 * Rollback support structure (for future implementation)
 *
 * Note: Rollbacks are dangerous in production. This is here for
 * development/testing scenarios only.
 *
 * @param db - Database instance
 * @param targetMigration - Migration name to roll back to (exclusive)
 */
export function rollbackTo(
  db: Database.Database,
  targetMigration: string
): number {
  ensureMigrationsTable(db);

  const appliedSet = getAppliedMigrations(db);
  const migrations = loadMigrations();

  // Find migrations to roll back (in reverse order)
  const toRollback = migrations
    .filter((m) => appliedSet.has(m.name) && m.name > targetMigration)
    .reverse();

  let rolledBack = 0;

  for (const migration of toRollback) {
    if (!migration.down) {
      throw new MigrationError(
        `Cannot rollback migration ${migration.name}: no down migration defined`,
        migration.name
      );
    }

    const downMigration = migration.down;
    const runInTransaction = db.transaction(() => {
      if (typeof downMigration === 'string') {
        db.exec(downMigration);
      } else {
        downMigration(db);
      }
      db.prepare('DELETE FROM _migrations WHERE name = ?').run(migration.name);
    });

    runInTransaction();
    rolledBack++;
  }

  return rolledBack;
}
