/**
 * @fileoverview SQLite repository implementation for Variant entities
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: CRUD operations for variants with dimension and difficulty handling
 * Main APIs: findById, findByConceptId, create, update, updateLastShown, delete
 * Constraints: Must reference valid concept, difficulty 1-5
 * Patterns: Synchronous better-sqlite3, JSON arrays for hints
 */

import { v4 as uuidv4 } from 'uuid';

import { asConceptId, asVariantId } from '../../../../shared/types/branded';
import { DimensionType } from '../../../../shared/types/core';
import { getDatabase } from '../connection';
import { DatabaseError } from '../errors';

import type { ConceptId, VariantId } from '../../../../shared/types/branded';
import type { DifficultyLevel, EvaluationRubric, QuestionType, Variant } from '../../../../shared/types/core';


/** Raw database row for variants table */
interface VariantRow {
  id: string;
  concept_id: string;
  dimension: string;
  difficulty: number;
  front: string;
  back: string;
  hints: string;
  last_shown_at: string | null;
  question_type: string;
  rubric: string | null;
  max_length: number | null;
}

/**
 * Maps a database row to a Variant domain entity
 */
function rowToVariant(row: VariantRow): Variant {
  let rubric: EvaluationRubric | undefined;
  if (row.rubric) {
    try {
      rubric = JSON.parse(row.rubric) as EvaluationRubric;
    } catch {
      rubric = undefined;
    }
  }

  const baseVariant = {
    id: asVariantId(row.id),
    conceptId: asConceptId(row.concept_id),
    dimension: row.dimension as DimensionType,
    difficulty: row.difficulty as DifficultyLevel,
    front: row.front,
    back: row.back,
    hints: JSON.parse(row.hints) as string[],
    lastShownAt: row.last_shown_at ? new Date(row.last_shown_at) : null,
    questionType: (row.question_type ?? 'flashcard') as QuestionType,
  };

  // Use conditional spreading to avoid exactOptionalPropertyTypes violations
  return {
    ...baseVariant,
    ...(rubric !== undefined && { rubric }),
    ...(row.max_length !== null && { maxLength: row.max_length }),
  };
}

/**
 * SQLite repository for Variant entities
 *
 * Variants are question cards that test a specific dimension of concept mastery.
 * Each concept can have multiple variants at different difficulty levels.
 */
export const VariantRepository = {
  /**
   * Finds a variant by its unique identifier
   *
   * @param id - The variant's unique ID
   * @returns The variant if found, null otherwise
   */
  findById(id: VariantId): Variant | null {
    const db = getDatabase();
    const row = db
      .prepare<[string], VariantRow>(
        `SELECT id, concept_id, dimension, difficulty, front, back, hints, last_shown_at,
                question_type, rubric, max_length
         FROM variants
         WHERE id = ?`
      )
      .get(id);

    return row ? rowToVariant(row) : null;
  },

  /**
   * Finds all variants for a given concept
   *
   * @param conceptId - The parent concept's ID
   * @returns Array of variants for the concept
   */
  findByConceptId(conceptId: ConceptId): Variant[] {
    const db = getDatabase();
    const rows = db
      .prepare<[string], VariantRow>(
        `SELECT id, concept_id, dimension, difficulty, front, back, hints, last_shown_at,
                question_type, rubric, max_length
         FROM variants
         WHERE concept_id = ?
         ORDER BY dimension, difficulty`
      )
      .all(conceptId);

    return rows.map(rowToVariant);
  },

  /**
   * Creates a new variant
   *
   * @param variant - Variant data without generated id
   * @returns The created variant with generated id
   * @throws DatabaseError if concept doesn't exist or constraint violation
   */
  create(variant: Omit<Variant, 'id'>): Variant {
    const db = getDatabase();
    const id = uuidv4();

    try {
      db.prepare(
        `INSERT INTO variants (id, concept_id, dimension, difficulty, front, back, hints, last_shown_at,
                               question_type, rubric, max_length)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        variant.conceptId,
        variant.dimension,
        variant.difficulty,
        variant.front,
        variant.back,
        JSON.stringify(variant.hints),
        variant.lastShownAt?.toISOString() ?? null,
        variant.questionType ?? 'flashcard',
        variant.rubric ? JSON.stringify(variant.rubric) : null,
        variant.maxLength ?? null
      );

      const baseResult = {
        id: asVariantId(id),
        conceptId: variant.conceptId,
        dimension: variant.dimension,
        difficulty: variant.difficulty,
        front: variant.front,
        back: variant.back,
        hints: [...variant.hints],
        lastShownAt: variant.lastShownAt,
        questionType: variant.questionType ?? 'flashcard',
      };

      // Use conditional spreading to avoid exactOptionalPropertyTypes violations
      return {
        ...baseResult,
        ...(variant.rubric !== undefined && { rubric: variant.rubric }),
        ...(variant.maxLength !== undefined && { maxLength: variant.maxLength }),
      };
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('FOREIGN KEY constraint failed')) {
        throw new DatabaseError(
          `Concept with id "${variant.conceptId}" does not exist`,
          'CONSTRAINT_VIOLATION',
          { cause: err, context: { conceptId: variant.conceptId } }
        );
      }
      throw new DatabaseError('Failed to create variant', 'QUERY_FAILED', {
        cause: err,
      });
    }
  },

  /**
   * Updates an existing variant
   *
   * @param id - The variant's unique ID
   * @param data - Partial variant data to update
   * @returns The updated variant
   * @throws DatabaseError if variant not found
   */
  update(id: VariantId, data: Partial<Variant>): Variant {
    const db = getDatabase();
    const existing = this.findById(id);

    if (!existing) {
      throw new DatabaseError(`Variant with id "${id}" not found`, 'NOT_FOUND', {
        context: { id },
      });
    }

    const updated = {
      dimension: data.dimension ?? existing.dimension,
      difficulty: data.difficulty ?? existing.difficulty,
      front: data.front ?? existing.front,
      back: data.back ?? existing.back,
      hints: data.hints ?? existing.hints,
      lastShownAt: data.lastShownAt !== undefined ? data.lastShownAt : existing.lastShownAt,
      questionType: data.questionType ?? existing.questionType,
      rubric: data.rubric !== undefined ? data.rubric : existing.rubric,
      maxLength: data.maxLength !== undefined ? data.maxLength : existing.maxLength,
    };

    db.prepare(
      `UPDATE variants
       SET dimension = ?, difficulty = ?, front = ?, back = ?, hints = ?, last_shown_at = ?,
           question_type = ?, rubric = ?, max_length = ?
       WHERE id = ?`
    ).run(
      updated.dimension,
      updated.difficulty,
      updated.front,
      updated.back,
      JSON.stringify(updated.hints),
      updated.lastShownAt?.toISOString() ?? null,
      updated.questionType,
      updated.rubric ? JSON.stringify(updated.rubric) : null,
      updated.maxLength ?? null,
      id
    );

    const baseResult = {
      id,
      conceptId: existing.conceptId,
      dimension: updated.dimension,
      difficulty: updated.difficulty,
      front: updated.front,
      back: updated.back,
      hints: [...updated.hints],
      lastShownAt: updated.lastShownAt,
      questionType: updated.questionType,
    };

    // Use conditional spreading to avoid exactOptionalPropertyTypes violations
    return {
      ...baseResult,
      ...(updated.rubric !== undefined && { rubric: updated.rubric }),
      ...(updated.maxLength !== undefined && { maxLength: updated.maxLength }),
    };
  },

  /**
   * Updates only the lastShownAt timestamp for a variant
   *
   * Optimized for frequent updates during review sessions.
   *
   * @param id - The variant's unique ID
   * @param timestamp - The new timestamp
   * @throws DatabaseError if variant not found
   */
  updateLastShown(id: VariantId, timestamp: Date): void {
    const db = getDatabase();
    const result = db
      .prepare('UPDATE variants SET last_shown_at = ? WHERE id = ?')
      .run(timestamp.toISOString(), id);

    if (result.changes === 0) {
      throw new DatabaseError(`Variant with id "${id}" not found`, 'NOT_FOUND', {
        context: { id },
      });
    }
  },

  /**
   * Deletes a variant
   *
   * @param id - The variant's unique ID
   * @throws DatabaseError if variant not found
   */
  delete(id: VariantId): void {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM variants WHERE id = ?').run(id);

    if (result.changes === 0) {
      throw new DatabaseError(`Variant with id "${id}" not found`, 'NOT_FOUND', {
        context: { id },
      });
    }
  },
};
