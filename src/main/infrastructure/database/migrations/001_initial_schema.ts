/**
 * @fileoverview Initial database schema for Adaptive Mastery Learning System
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Core tables for concepts, variants, mastery, events, and scheduling
 * Main APIs: migration.up (create tables), migration.down (drop tables)
 * Constraints: Foreign keys enabled, CHECK constraints for data integrity
 * Patterns: JSON arrays stored as TEXT, ISO 8601 timestamps as TEXT
 */

import type { Migration } from '../migrate';

/**
 * Initial schema migration
 *
 * Creates the five core tables:
 * - concepts: Learning items with definitions and facts
 * - variants: Different question types for each concept
 * - mastery: EWMA tracking per dimension
 * - events: Review history for analytics
 * - schedule: SRS scheduling per concept
 */
export const migration: Migration = {
  name: '001_initial_schema',

  up: `
    -- Concepts table: Core learning items
    CREATE TABLE concepts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      definition TEXT NOT NULL,
      facts TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Variants table: Different ways to test a concept
    CREATE TABLE variants (
      id TEXT PRIMARY KEY,
      concept_id TEXT NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
      dimension TEXT NOT NULL,
      difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      hints TEXT NOT NULL DEFAULT '[]',
      last_shown_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Indexes for variant queries
    CREATE INDEX idx_variants_concept ON variants(concept_id);
    CREATE INDEX idx_variants_dimension ON variants(dimension);

    -- Mastery table: EWMA tracking per dimension
    CREATE TABLE mastery (
      dimension TEXT PRIMARY KEY,
      accuracy_ewma REAL NOT NULL DEFAULT 0.5,
      speed_ewma REAL NOT NULL DEFAULT 0.5,
      recent_count INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Events table: Review history for analytics
    CREATE TABLE events (
      id TEXT PRIMARY KEY,
      concept_id TEXT NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
      variant_id TEXT NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
      dimension TEXT NOT NULL,
      difficulty INTEGER NOT NULL,
      result TEXT NOT NULL CHECK (result IN ('again', 'hard', 'good', 'easy')),
      time_ms INTEGER NOT NULL,
      hints_used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Indexes for event queries
    CREATE INDEX idx_events_concept ON events(concept_id);
    CREATE INDEX idx_events_dimension ON events(dimension);
    CREATE INDEX idx_events_created ON events(created_at);

    -- Schedule table: SRS scheduling per concept
    CREATE TABLE schedule (
      concept_id TEXT PRIMARY KEY REFERENCES concepts(id) ON DELETE CASCADE,
      due_at TEXT NOT NULL,
      interval_days REAL NOT NULL DEFAULT 1,
      ease_factor REAL NOT NULL DEFAULT 2.5
    );

    -- Index for due date queries
    CREATE INDEX idx_schedule_due ON schedule(due_at);
  `,

  down: `
    -- Drop in reverse order to respect foreign key constraints
    DROP INDEX IF EXISTS idx_schedule_due;
    DROP TABLE IF EXISTS schedule;

    DROP INDEX IF EXISTS idx_events_created;
    DROP INDEX IF EXISTS idx_events_dimension;
    DROP INDEX IF EXISTS idx_events_concept;
    DROP TABLE IF EXISTS events;

    DROP TABLE IF EXISTS mastery;

    DROP INDEX IF EXISTS idx_variants_dimension;
    DROP INDEX IF EXISTS idx_variants_concept;
    DROP TABLE IF EXISTS variants;

    DROP TABLE IF EXISTS concepts;
  `,
};
