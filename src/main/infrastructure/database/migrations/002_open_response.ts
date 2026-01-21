/**
 * @fileoverview Migration to add open response support for LLM-evaluated answers
 * @lastmodified 2026-01-20T00:00:00Z
 *
 * Features: Open response question type, rubric storage, LLM evaluation tracking
 * Main APIs: migration.up (add columns), migration.down (remove columns)
 * Constraints: Non-destructive - adds columns only, backward compatible
 * Patterns: JSON for complex data (rubric), nullable columns for optional data
 *
 * Changes:
 * - Add question_type column to variants (TEXT with CHECK constraint)
 * - Add rubric column to variants (JSON TEXT)
 * - Add max_length column to variants (INTEGER)
 * - Add user_response column to events (TEXT)
 * - Add llm_score column to events (REAL)
 * - Add llm_feedback column to events (TEXT)
 * - Add evaluation_confidence column to events (REAL)
 */

import type { Migration } from '../migrate';

export const migration: Migration = {
  name: '002_open_response',

  up: `
    -- Add question type to variants for multi-type support
    -- Defaults to 'flashcard' for backward compatibility
    ALTER TABLE variants ADD COLUMN question_type TEXT NOT NULL DEFAULT 'flashcard'
      CHECK (question_type IN ('flashcard', 'multiple_choice', 'multi_select', 'true_false', 'open_response'));

    -- Add rubric for open response evaluation criteria (JSON)
    ALTER TABLE variants ADD COLUMN rubric TEXT DEFAULT NULL;

    -- Add max character length for open responses
    ALTER TABLE variants ADD COLUMN max_length INTEGER DEFAULT NULL;

    -- Add user response tracking to events
    ALTER TABLE events ADD COLUMN user_response TEXT DEFAULT NULL;

    -- Add LLM evaluation score (0.0 to 1.0)
    ALTER TABLE events ADD COLUMN llm_score REAL DEFAULT NULL
      CHECK (llm_score IS NULL OR (llm_score >= 0.0 AND llm_score <= 1.0));

    -- Add LLM evaluation feedback
    ALTER TABLE events ADD COLUMN llm_feedback TEXT DEFAULT NULL;

    -- Add LLM evaluation confidence (0.0 to 1.0)
    ALTER TABLE events ADD COLUMN evaluation_confidence REAL DEFAULT NULL
      CHECK (evaluation_confidence IS NULL OR (evaluation_confidence >= 0.0 AND evaluation_confidence <= 1.0));

    -- Index for filtering by question type
    CREATE INDEX idx_variants_question_type ON variants(question_type);
  `,

  down: `
    -- Note: SQLite doesn't support DROP COLUMN directly
    -- This would require recreating tables, which is dangerous in production
    -- For safety, we only drop the index

    DROP INDEX IF EXISTS idx_variants_question_type;

    -- To fully reverse this migration, tables would need to be recreated
    -- without the new columns. This is left as a manual operation for safety.
  `,
};
