/**
 * @fileoverview SQLite repository implementation for Concept entities
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: CRUD operations for concepts with JSON array handling
 * Main APIs: findById, findAll, create, update, delete
 * Constraints: Unique concept names, required definition
 * Patterns: Synchronous better-sqlite3, branded types for IDs
 */

import { v4 as uuidv4 } from 'uuid';

import { asConceptId } from '../../../../shared/types/branded';
import { getDatabase } from '../connection';
import { DatabaseError } from '../errors';

import type { ConceptId } from '../../../../shared/types/branded';
import type { Concept } from '../../../../shared/types/core';

/** Raw database row for concepts table */
interface ConceptRow {
  id: string;
  name: string;
  definition: string;
  facts: string;
  created_at: string;
  updated_at: string;
}

/**
 * Maps a database row to a Concept domain entity
 */
function rowToConcept(row: ConceptRow): Concept {
  return {
    id: asConceptId(row.id),
    name: row.name,
    definition: row.definition,
    facts: JSON.parse(row.facts) as string[],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * SQLite repository for Concept entities
 *
 * Provides CRUD operations for learning concepts. Concepts are the aggregate
 * root in the domain model, containing variants as child entities.
 */
export const ConceptRepository = {
  /**
   * Finds a concept by its unique identifier
   *
   * @param id - The concept's unique ID
   * @returns The concept if found, null otherwise
   */
  findById(id: ConceptId): Concept | null {
    const db = getDatabase();
    const row = db
      .prepare<[string], ConceptRow>(
        `SELECT id, name, definition, facts, created_at, updated_at
         FROM concepts
         WHERE id = ?`
      )
      .get(id);

    return row ? rowToConcept(row) : null;
  },

  /**
   * Retrieves all concepts ordered by creation date
   *
   * @returns Array of all concepts
   */
  findAll(): Concept[] {
    const db = getDatabase();
    const rows = db
      .prepare<[], ConceptRow>(
        `SELECT id, name, definition, facts, created_at, updated_at
         FROM concepts
         ORDER BY created_at DESC`
      )
      .all();

    return rows.map(rowToConcept);
  },

  /**
   * Creates a new concept
   *
   * @param data - Concept data without id or timestamps
   * @returns The created concept with generated id and timestamps
   * @throws DatabaseError if concept with same name exists
   */
  create(
    data: Omit<Concept, 'id' | 'createdAt' | 'updatedAt'>
  ): Concept {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    try {
      db.prepare(
        `INSERT INTO concepts (id, name, definition, facts, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(id, data.name, data.definition, JSON.stringify(data.facts), now, now);

      return {
        id: asConceptId(id),
        name: data.name,
        definition: data.definition,
        facts: [...data.facts],
        createdAt: new Date(now),
        updatedAt: new Date(now),
      };
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('UNIQUE constraint failed')) {
        throw new DatabaseError(
          `Concept with name "${data.name}" already exists`,
          'ALREADY_EXISTS',
          { cause: err, context: { name: data.name } }
        );
      }
      throw new DatabaseError('Failed to create concept', 'QUERY_FAILED', {
        cause: err,
      });
    }
  },

  /**
   * Updates an existing concept
   *
   * @param id - The concept's unique ID
   * @param data - Partial concept data to update
   * @returns The updated concept
   * @throws DatabaseError if concept not found
   */
  update(
    id: ConceptId,
    data: Partial<Omit<Concept, 'id' | 'createdAt' | 'updatedAt'>>
  ): Concept {
    const db = getDatabase();
    const existing = this.findById(id);

    if (!existing) {
      throw new DatabaseError(`Concept with id "${id}" not found`, 'NOT_FOUND', {
        context: { id },
      });
    }

    const updated = {
      name: data.name ?? existing.name,
      definition: data.definition ?? existing.definition,
      facts: data.facts ?? existing.facts,
    };
    const now = new Date().toISOString();

    try {
      db.prepare(
        `UPDATE concepts
         SET name = ?, definition = ?, facts = ?, updated_at = ?
         WHERE id = ?`
      ).run(updated.name, updated.definition, JSON.stringify(updated.facts), now, id);

      return {
        id,
        name: updated.name,
        definition: updated.definition,
        facts: [...updated.facts],
        createdAt: existing.createdAt,
        updatedAt: new Date(now),
      };
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('UNIQUE constraint failed')) {
        throw new DatabaseError(
          `Concept with name "${updated.name}" already exists`,
          'ALREADY_EXISTS',
          { cause: err, context: { name: updated.name } }
        );
      }
      throw new DatabaseError('Failed to update concept', 'QUERY_FAILED', {
        cause: err,
      });
    }
  },

  /**
   * Deletes a concept and all its variants (via CASCADE)
   *
   * @param id - The concept's unique ID
   * @throws DatabaseError if concept not found
   */
  delete(id: ConceptId): void {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM concepts WHERE id = ?').run(id);

    if (result.changes === 0) {
      throw new DatabaseError(`Concept with id "${id}" not found`, 'NOT_FOUND', {
        context: { id },
      });
    }
  },
};
