/**
 * @fileoverview SQLite repository implementation for ScheduleEntry entities
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: SM-2 scheduling data persistence with due date queries
 * Main APIs: findByConceptId, findDue, save, delete
 * Constraints: One schedule per concept, references valid concept
 * Patterns: Upsert for save operations, date-based queries
 */

import { asConceptId } from '../../../../shared/types/branded';
import { getDatabase } from '../connection';
import { DatabaseError } from '../errors';

import type { ConceptId } from '../../../../shared/types/branded';
import type { ScheduleEntry } from '../../../../shared/types/core';

/** Raw database row for schedule table */
interface ScheduleRow {
  concept_id: string;
  due_at: string;
  interval_days: number;
  ease_factor: number;
}

/**
 * Maps a database row to a ScheduleEntry domain entity
 */
function rowToSchedule(row: ScheduleRow): ScheduleEntry {
  return {
    conceptId: asConceptId(row.concept_id),
    dueAt: new Date(row.due_at),
    intervalDays: row.interval_days,
    easeFactor: row.ease_factor,
  };
}

/**
 * SQLite repository for ScheduleEntry entities
 *
 * Manages spaced repetition scheduling data for concepts.
 * Implements SM-2 algorithm state with ease factor and interval tracking.
 */
export const ScheduleRepository = {
  /**
   * Finds the schedule for a specific concept
   *
   * @param conceptId - The concept's unique ID
   * @returns The schedule if found, null otherwise
   */
  findByConceptId(conceptId: ConceptId): ScheduleEntry | null {
    const db = getDatabase();
    const row = db
      .prepare<[string], ScheduleRow>(
        `SELECT concept_id, due_at, interval_days, ease_factor
         FROM schedule
         WHERE concept_id = ?`
      )
      .get(conceptId);

    return row ? rowToSchedule(row) : null;
  },

  /**
   * Finds all schedules with due dates before the specified time
   *
   * @param before - The cutoff date (exclusive)
   * @returns Array of due schedules, ordered by due date
   */
  findDue(before: Date): ScheduleEntry[] {
    const db = getDatabase();
    const rows = db
      .prepare<[string], ScheduleRow>(
        `SELECT concept_id, due_at, interval_days, ease_factor
         FROM schedule
         WHERE due_at < ?
         ORDER BY due_at ASC`
      )
      .all(before.toISOString());

    return rows.map(rowToSchedule);
  },

  /**
   * Saves a schedule using upsert semantics
   *
   * Creates the schedule if it doesn't exist, updates if it does.
   *
   * @param schedule - The schedule entry to save
   * @throws DatabaseError if concept doesn't exist
   */
  save(schedule: ScheduleEntry): void {
    const db = getDatabase();

    try {
      db.prepare(
        `INSERT INTO schedule (concept_id, due_at, interval_days, ease_factor)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(concept_id) DO UPDATE SET
           due_at = excluded.due_at,
           interval_days = excluded.interval_days,
           ease_factor = excluded.ease_factor`
      ).run(
        schedule.conceptId,
        schedule.dueAt.toISOString(),
        schedule.intervalDays,
        schedule.easeFactor
      );
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('FOREIGN KEY constraint failed')) {
        throw new DatabaseError(
          `Concept with id "${schedule.conceptId}" does not exist`,
          'CONSTRAINT_VIOLATION',
          { cause: err, context: { conceptId: schedule.conceptId } }
        );
      }
      throw new DatabaseError('Failed to save schedule', 'QUERY_FAILED', {
        cause: err,
      });
    }
  },

  /**
   * Deletes the schedule for a concept
   *
   * @param conceptId - The concept's unique ID
   * @throws DatabaseError if schedule not found
   */
  delete(conceptId: ConceptId): void {
    const db = getDatabase();
    const result = db
      .prepare('DELETE FROM schedule WHERE concept_id = ?')
      .run(conceptId);

    if (result.changes === 0) {
      throw new DatabaseError(
        `Schedule for concept "${conceptId}" not found`,
        'NOT_FOUND',
        { context: { conceptId } }
      );
    }
  },
};
