/**
 * @fileoverview YAML data loader for importing flashcard data from YAML files
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Parses YAML files, maps to domain types, inserts into database
 * Main APIs: loadYAMLData()
 * Constraints: Idempotent via INSERT OR IGNORE, validates dimension mappings
 * Patterns: Uses transaction for atomic imports, maps YAML dimensions to DimensionType
 */

import * as fs from 'fs';
import * as path from 'path';

import * as yaml from 'js-yaml';

import { getDatabase } from './connection';
import { DimensionType } from '../../../shared/types/core';

import type BetterSqlite3 from 'better-sqlite3';

/**
 * Raw YAML structure for concepts
 */
interface YAMLConcept {
  id: string;
  name: string;
  definition: string;
  facts: string[];
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Raw YAML structure for variants
 */
interface YAMLVariant {
  id: string;
  concept_id: string;
  dimension: string;
  difficulty: number;
  front: string;
  back: string;
  hints: string[];
  last_shown_at: string | null;
}

/**
 * Raw YAML structure for mastery entries
 */
interface YAMLMastery {
  dimension: string;
  accuracy_ewma: number;
  speed_ewma: number;
  recent_count: number;
}

/**
 * Complete YAML data structure
 */
interface YAMLData {
  schema_version: number;
  db: {
    concepts: YAMLConcept[];
    variants: YAMLVariant[];
    mastery: YAMLMastery[];
    schedule: unknown[];
    events: unknown[];
  };
}

/**
 * Maps human-readable dimension names from YAML to DimensionType enum values
 */
const DIMENSION_MAP: Record<string, DimensionType> = {
  'Definition Recall': DimensionType.DEFINITION_RECALL,
  'Paraphrase Recognition': DimensionType.PARAPHRASE_RECOGNITION,
  'Example Classification': DimensionType.EXAMPLE_CLASSIFICATION,
  'Scenario Application': DimensionType.SCENARIO_APPLICATION,
  Discrimination: DimensionType.DISCRIMINATION,
  'Cloze Fill': DimensionType.CLOZE_FILL,
};

/**
 * Maps a YAML dimension string to the corresponding DimensionType
 *
 * @param yamlDimension - The dimension string from YAML (e.g., "Definition Recall")
 * @returns The corresponding DimensionType enum value
 * @throws Error if the dimension is not recognized
 */
function mapDimension(yamlDimension: string): DimensionType {
  const mapped = DIMENSION_MAP[yamlDimension];
  if (mapped === undefined) {
    throw new Error(`Unknown dimension: "${yamlDimension}". Valid dimensions: ${Object.keys(DIMENSION_MAP).join(', ')}`);
  }
  return mapped;
}

/**
 * Loads flashcard data from a YAML file into the database
 *
 * Parses the YAML file, validates the structure, maps dimensions to DimensionType,
 * and inserts all concepts, variants, mastery records, and schedule entries.
 *
 * Idempotent: Uses INSERT OR IGNORE so existing records are not duplicated.
 * Transactional: All inserts happen in a single transaction for atomicity.
 *
 * @param filePath - Path to the YAML file (absolute or relative to project root)
 * @param db - Optional database instance (uses singleton if not provided)
 * @returns Summary of imported records
 */
export function loadYAMLData(
  filePath: string,
  db?: BetterSqlite3.Database
): { concepts: number; variants: number; mastery: number; schedule: number } {
  const database = db ?? getDatabase();

  // Resolve file path
  const resolvedPath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  // Read and parse YAML
  const fileContent = fs.readFileSync(resolvedPath, 'utf-8');
  const data = yaml.load(fileContent) as YAMLData;

  // Validate structure
  if (data.db === null || data.db === undefined) {
    throw new Error('Invalid YAML structure: missing "db" key');
  }

  // Prepare statements
  const insertConcept = database.prepare(`
    INSERT OR IGNORE INTO concepts (id, name, definition, facts)
    VALUES (?, ?, ?, ?)
  `);

  const insertVariant = database.prepare(`
    INSERT OR IGNORE INTO variants (id, concept_id, dimension, difficulty, front, back, hints)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const upsertMastery = database.prepare(`
    INSERT INTO mastery (dimension, accuracy_ewma, speed_ewma, recent_count)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(dimension) DO UPDATE SET
      accuracy_ewma = excluded.accuracy_ewma,
      speed_ewma = excluded.speed_ewma,
      recent_count = excluded.recent_count
  `);

  const insertSchedule = database.prepare(`
    INSERT OR IGNORE INTO schedule (concept_id, due_at, interval_days, ease_factor)
    VALUES (?, datetime('now'), 1, 2.5)
  `);

  let conceptCount = 0;
  let variantCount = 0;
  let masteryCount = 0;
  let scheduleCount = 0;

  const importAll = database.transaction(() => {
    // Import concepts
    if (Array.isArray(data.db.concepts)) {
      for (const concept of data.db.concepts) {
        const result = insertConcept.run(
          concept.id,
          concept.name,
          concept.definition,
          JSON.stringify(concept.facts)
        );
        if (result.changes > 0) {
          conceptCount++;
          // Create schedule entry for each new concept
          const scheduleResult = insertSchedule.run(concept.id);
          if (scheduleResult.changes > 0) {
            scheduleCount++;
          }
        }
      }
    }

    // Import variants
    if (Array.isArray(data.db.variants)) {
      for (const variant of data.db.variants) {
        const mappedDimension = mapDimension(variant.dimension);
        const result = insertVariant.run(
          variant.id,
          variant.concept_id,
          mappedDimension,
          variant.difficulty,
          variant.front,
          variant.back,
          JSON.stringify(variant.hints)
        );
        if (result.changes > 0) {
          variantCount++;
        }
      }
    }

    // Import mastery records
    if (Array.isArray(data.db.mastery)) {
      for (const mastery of data.db.mastery) {
        const mappedDimension = mapDimension(mastery.dimension);
        const result = upsertMastery.run(
          mappedDimension,
          mastery.accuracy_ewma,
          mastery.speed_ewma,
          mastery.recent_count
        );
        if (result.changes > 0) {
          masteryCount++;
        }
      }
    }
  });

  importAll();

  return {
    concepts: conceptCount,
    variants: variantCount,
    mastery: masteryCount,
    schedule: scheduleCount,
  };
}

/**
 * Loads the default test data from data/re-test-data.yaml
 *
 * Convenience function for loading the bundled real estate test data.
 *
 * @param db - Optional database instance (uses singleton if not provided)
 * @returns Summary of imported records
 */
export function loadDefaultTestData(
  db?: BetterSqlite3.Database
): { concepts: number; variants: number; mastery: number; schedule: number } {
  const defaultPath = path.resolve(process.cwd(), 'data/re-test-data.yaml');
  return loadYAMLData(defaultPath, db);
}
