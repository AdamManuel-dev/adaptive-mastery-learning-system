/**
 * @fileoverview SQLite repository implementation for DimensionMastery tracking
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: EWMA mastery tracking per dimension with upsert semantics
 * Main APIs: findByDimension, findAll, save, initializeDefaults
 * Constraints: One record per dimension, EWMA values 0-1
 * Patterns: Upsert for save operations, automatic initialization
 */

import { createEmptyMasteryProfile, DimensionType } from '../../../../shared/types/core';
import { getDatabase } from '../connection';

import type { DimensionMastery, MasteryProfile } from '../../../../shared/types/core';

/** Raw database row for mastery table */
interface MasteryRow {
  dimension: string;
  accuracy_ewma: number;
  speed_ewma: number;
  recent_count: number;
}

/**
 * Maps a database row to a DimensionMastery value object
 */
function rowToMastery(row: MasteryRow): DimensionMastery {
  return {
    accuracyEwma: row.accuracy_ewma,
    speedEwma: row.speed_ewma,
    recentCount: row.recent_count,
  };
}

/**
 * SQLite repository for DimensionMastery tracking
 *
 * Mastery is tracked per dimension using EWMA (Exponentially Weighted Moving Average).
 * Each dimension has separate accuracy and speed scores that smooth performance over time.
 */
export const MasteryRepository = {
  /**
   * Finds mastery data for a specific dimension
   *
   * @param dimension - The dimension type to look up
   * @returns The mastery data if found, null otherwise
   */
  findByDimension(dimension: DimensionType): DimensionMastery | null {
    const db = getDatabase();
    const row = db
      .prepare<[string], MasteryRow>(
        `SELECT dimension, accuracy_ewma, speed_ewma, recent_count
         FROM mastery
         WHERE dimension = ?`
      )
      .get(dimension);

    return row ? rowToMastery(row) : null;
  },

  /**
   * Retrieves the complete mastery profile across all dimensions
   *
   * Returns default values for any dimensions not yet recorded.
   *
   * @returns Complete mastery profile mapping dimension to mastery data
   */
  findAll(): MasteryProfile {
    const db = getDatabase();
    const rows = db
      .prepare<[], MasteryRow>(
        `SELECT dimension, accuracy_ewma, speed_ewma, recent_count
         FROM mastery`
      )
      .all();

    // Start with default profile
    const profile = createEmptyMasteryProfile();

    // Overlay database values
    for (const row of rows) {
      const dimension = row.dimension as DimensionType;
      if (Object.values(DimensionType).includes(dimension)) {
        profile[dimension] = rowToMastery(row);
      }
    }

    return profile;
  },

  /**
   * Saves mastery data for a dimension using upsert semantics
   *
   * Creates the record if it doesn't exist, updates if it does.
   *
   * @param dimension - The dimension type
   * @param mastery - The mastery data to save
   */
  save(dimension: DimensionType, mastery: DimensionMastery): void {
    const db = getDatabase();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO mastery (dimension, accuracy_ewma, speed_ewma, recent_count, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(dimension) DO UPDATE SET
         accuracy_ewma = excluded.accuracy_ewma,
         speed_ewma = excluded.speed_ewma,
         recent_count = excluded.recent_count,
         updated_at = excluded.updated_at`
    ).run(dimension, mastery.accuracyEwma, mastery.speedEwma, mastery.recentCount, now);
  },

  /**
   * Initializes default mastery values for all dimensions
   *
   * Should be called during app initialization for new users.
   * Uses INSERT OR IGNORE to avoid overwriting existing data.
   */
  initializeDefaults(): void {
    const db = getDatabase();
    const defaultProfile = createEmptyMasteryProfile();
    const now = new Date().toISOString();

    const insertStmt = db.prepare(
      `INSERT OR IGNORE INTO mastery (dimension, accuracy_ewma, speed_ewma, recent_count, updated_at)
       VALUES (?, ?, ?, ?, ?)`
    );

    const initAll = db.transaction(() => {
      for (const dimension of Object.values(DimensionType)) {
        const mastery = defaultProfile[dimension];
        insertStmt.run(
          dimension,
          mastery.accuracyEwma,
          mastery.speedEwma,
          mastery.recentCount,
          now
        );
      }
    });

    initAll();
  },
};
