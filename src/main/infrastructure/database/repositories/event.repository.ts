/**
 * @fileoverview SQLite repository implementation for ReviewEvent entities
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Create and query review events for analytics and mastery calculation
 * Main APIs: create, findByConceptId, findByDimension, findRecent
 * Constraints: Must reference valid concept and variant
 * Patterns: Immutable events (no update/delete), time-ordered queries
 */

import { v4 as uuidv4 } from 'uuid';

import { asConceptId, asEventId, asVariantId } from '../../../../shared/types/branded';
import { DimensionType } from '../../../../shared/types/core';
import { getDatabase } from '../connection';
import { DatabaseError } from '../errors';

import type { ConceptId } from '../../../../shared/types/branded';
import type { DifficultyLevel, ReviewEvent, ReviewResultType } from '../../../../shared/types/core';


/** Raw database row for events table */
interface EventRow {
  id: string;
  concept_id: string;
  variant_id: string;
  dimension: string;
  difficulty: number;
  result: string;
  time_ms: number;
  hints_used: number;
  created_at: string;
  user_response: string | null;
  llm_score: number | null;
  llm_feedback: string | null;
  evaluation_confidence: number | null;
}

/**
 * Maps a database row to a ReviewEvent domain entity
 */
function rowToEvent(row: EventRow): ReviewEvent {
  const baseEvent = {
    id: asEventId(row.id),
    conceptId: asConceptId(row.concept_id),
    variantId: asVariantId(row.variant_id),
    dimension: row.dimension as DimensionType,
    difficulty: row.difficulty as DifficultyLevel,
    result: row.result as ReviewResultType,
    timeMs: row.time_ms,
    hintsUsed: row.hints_used,
    createdAt: new Date(row.created_at),
  };

  // Use conditional spreading to avoid exactOptionalPropertyTypes violations
  return {
    ...baseEvent,
    ...(row.user_response !== null && { userResponse: row.user_response }),
    ...(row.llm_score !== null && { llmScore: row.llm_score }),
    ...(row.llm_feedback !== null && { llmFeedback: row.llm_feedback }),
    ...(row.evaluation_confidence !== null && { evaluationConfidence: row.evaluation_confidence }),
  };
}

/**
 * SQLite repository for ReviewEvent entities
 *
 * Review events are immutable records of user responses during review sessions.
 * They're used for mastery calculation, weakness detection, and analytics.
 */
export const EventRepository = {
  /**
   * Creates a new review event
   *
   * @param event - Event data without id or timestamp
   * @returns The created event with generated id and timestamp
   * @throws DatabaseError if concept or variant doesn't exist
   */
  create(event: Omit<ReviewEvent, 'id' | 'createdAt'>): ReviewEvent {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    try {
      db.prepare(
        `INSERT INTO events (id, concept_id, variant_id, dimension, difficulty, result, time_ms, hints_used, created_at,
                             user_response, llm_score, llm_feedback, evaluation_confidence)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        event.conceptId,
        event.variantId,
        event.dimension,
        event.difficulty,
        event.result,
        event.timeMs,
        event.hintsUsed,
        now,
        event.userResponse ?? null,
        event.llmScore ?? null,
        event.llmFeedback ?? null,
        event.evaluationConfidence ?? null
      );

      const baseEvent = {
        id: asEventId(id),
        conceptId: event.conceptId,
        variantId: event.variantId,
        dimension: event.dimension,
        difficulty: event.difficulty,
        result: event.result,
        timeMs: event.timeMs,
        hintsUsed: event.hintsUsed,
        createdAt: new Date(now),
      };

      // Use conditional spreading to avoid exactOptionalPropertyTypes violations
      return {
        ...baseEvent,
        ...(event.userResponse !== undefined && { userResponse: event.userResponse }),
        ...(event.llmScore !== undefined && { llmScore: event.llmScore }),
        ...(event.llmFeedback !== undefined && { llmFeedback: event.llmFeedback }),
        ...(event.evaluationConfidence !== undefined && { evaluationConfidence: event.evaluationConfidence }),
      };
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('FOREIGN KEY constraint failed')) {
        throw new DatabaseError(
          'Referenced concept or variant does not exist',
          'CONSTRAINT_VIOLATION',
          {
            cause: err,
            context: { conceptId: event.conceptId, variantId: event.variantId },
          }
        );
      }
      throw new DatabaseError('Failed to create event', 'QUERY_FAILED', {
        cause: err,
      });
    }
  },

  /**
   * Finds events for a specific concept
   *
   * @param conceptId - The concept's unique ID
   * @param limit - Maximum number of events to return (default: no limit)
   * @returns Array of events, most recent first
   */
  findByConceptId(conceptId: ConceptId, limit?: number): ReviewEvent[] {
    const db = getDatabase();
    const sql = limit
      ? `SELECT id, concept_id, variant_id, dimension, difficulty, result, time_ms, hints_used, created_at,
                user_response, llm_score, llm_feedback, evaluation_confidence
         FROM events
         WHERE concept_id = ?
         ORDER BY created_at DESC
         LIMIT ?`
      : `SELECT id, concept_id, variant_id, dimension, difficulty, result, time_ms, hints_used, created_at,
                user_response, llm_score, llm_feedback, evaluation_confidence
         FROM events
         WHERE concept_id = ?
         ORDER BY created_at DESC`;

    const rows = limit
      ? db.prepare<[string, number], EventRow>(sql).all(conceptId, limit)
      : db.prepare<[string], EventRow>(sql).all(conceptId);

    return rows.map(rowToEvent);
  },

  /**
   * Finds events for a specific dimension across all concepts
   *
   * Useful for calculating global mastery per dimension.
   *
   * @param dimension - The dimension type to filter by
   * @param limit - Maximum number of events to return (default: no limit)
   * @returns Array of events, most recent first
   */
  findByDimension(dimension: DimensionType, limit?: number): ReviewEvent[] {
    const db = getDatabase();
    const sql = limit
      ? `SELECT id, concept_id, variant_id, dimension, difficulty, result, time_ms, hints_used, created_at,
                user_response, llm_score, llm_feedback, evaluation_confidence
         FROM events
         WHERE dimension = ?
         ORDER BY created_at DESC
         LIMIT ?`
      : `SELECT id, concept_id, variant_id, dimension, difficulty, result, time_ms, hints_used, created_at,
                user_response, llm_score, llm_feedback, evaluation_confidence
         FROM events
         WHERE dimension = ?
         ORDER BY created_at DESC`;

    const rows = limit
      ? db.prepare<[string, number], EventRow>(sql).all(dimension, limit)
      : db.prepare<[string], EventRow>(sql).all(dimension);

    return rows.map(rowToEvent);
  },

  /**
   * Finds the most recent events across all dimensions
   *
   * @param limit - Maximum number of events to return
   * @returns Array of most recent events
   */
  findRecent(limit: number): ReviewEvent[] {
    const db = getDatabase();
    const rows = db
      .prepare<[number], EventRow>(
        `SELECT id, concept_id, variant_id, dimension, difficulty, result, time_ms, hints_used, created_at,
                user_response, llm_score, llm_feedback, evaluation_confidence
         FROM events
         ORDER BY created_at DESC
         LIMIT ?`
      )
      .all(limit);

    return rows.map(rowToEvent);
  },
};
