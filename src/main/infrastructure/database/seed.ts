/**
 * @fileoverview Seed data functions for initializing the database
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Initial mastery dimension records, sample concept data, YAML import
 * Main APIs: seedMasteryDimensions(), seedSampleData(), seedFromYAML(), seedAll()
 * Constraints: Idempotent - safe to run multiple times
 * Patterns: Uses INSERT OR IGNORE for safe re-seeding
 */

import { getDatabase } from './connection';
import { loadDefaultTestData, loadYAMLData } from './yaml-loader';

import type Database from 'better-sqlite3';

/** The six learning dimensions tracked by the system */
export const DIMENSIONS = [
  'definition',
  'paraphrase',
  'example',
  'scenario',
  'discrimination',
  'cloze',
] as const;

export type Dimension = (typeof DIMENSIONS)[number];

/**
 * Seeds initial mastery records for all six dimensions
 *
 * Creates mastery tracking entries with neutral starting values (0.5)
 * for both accuracy and speed EWMA. This ensures the weighted selection
 * algorithm has data to work with from the start.
 *
 * Idempotent: Uses INSERT OR IGNORE so it's safe to call multiple times.
 *
 * @param db - Optional database instance (uses singleton if not provided)
 */
export function seedMasteryDimensions(db?: Database.Database): void {
  const database = db ?? getDatabase();

  const stmt = database.prepare(`
    INSERT OR IGNORE INTO mastery (dimension, accuracy_ewma, speed_ewma, recent_count)
    VALUES (?, 0.5, 0.5, 0)
  `);

  const insertAll = database.transaction(() => {
    for (const dimension of DIMENSIONS) {
      stmt.run(dimension);
    }
  });

  insertAll();
}

/**
 * Seeds sample concept data for testing and demonstration
 *
 * Creates three biology concepts with multiple variants across different
 * dimensions. Useful for development and initial user experience.
 *
 * @param db - Optional database instance (uses singleton if not provided)
 */
export function seedSampleData(db?: Database.Database): void {
  const database = db ?? getDatabase();

  const insertConcept = database.prepare(`
    INSERT OR IGNORE INTO concepts (id, name, definition, facts)
    VALUES (?, ?, ?, ?)
  `);

  const insertVariant = database.prepare(`
    INSERT OR IGNORE INTO variants (id, concept_id, dimension, difficulty, front, back, hints)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSchedule = database.prepare(`
    INSERT OR IGNORE INTO schedule (concept_id, due_at, interval_days, ease_factor)
    VALUES (?, datetime('now'), 1, 2.5)
  `);

  const seedAll = database.transaction(() => {
    // Concept 1: Photosynthesis
    insertConcept.run(
      'concept-1',
      'Photosynthesis',
      'Process by which plants convert light energy into chemical energy',
      JSON.stringify([
        'Occurs in chloroplasts',
        'Produces glucose and oxygen',
        'Requires sunlight, water, and CO2',
      ])
    );

    insertVariant.run(
      'variant-1-def',
      'concept-1',
      'definition',
      1,
      'What is photosynthesis?',
      'The process by which plants convert light energy into chemical energy (glucose)',
      JSON.stringify(['Think about what plants do with sunlight'])
    );

    insertVariant.run(
      'variant-1-scenario',
      'concept-1',
      'scenario',
      3,
      'A plant is placed in a dark room for a week. What process is impaired and why?',
      'Photosynthesis is impaired because it requires light energy to convert CO2 and water into glucose',
      JSON.stringify(['What do plants need light for?', 'Think about energy conversion'])
    );

    insertVariant.run(
      'variant-1-discrim',
      'concept-1',
      'discrimination',
      4,
      'How does photosynthesis differ from cellular respiration?',
      'Photosynthesis converts light to chemical energy and produces glucose/O2; respiration converts chemical energy to ATP and produces CO2/H2O',
      JSON.stringify(['One builds, one breaks down', 'Consider inputs vs outputs'])
    );

    insertSchedule.run('concept-1');

    // Concept 2: Mitosis
    insertConcept.run(
      'concept-2',
      'Mitosis',
      'Cell division process that produces two identical daughter cells',
      JSON.stringify([
        'Maintains chromosome number',
        'Used for growth and repair',
        'Has four main phases: prophase, metaphase, anaphase, telophase',
      ])
    );

    insertVariant.run(
      'variant-2-def',
      'concept-2',
      'definition',
      1,
      'What is mitosis?',
      'Cell division that produces two genetically identical daughter cells',
      JSON.stringify(['Think about cell reproduction'])
    );

    insertVariant.run(
      'variant-2-example',
      'concept-2',
      'example',
      2,
      'Is skin cell replacement an example of mitosis? Explain.',
      'Yes - skin cells divide via mitosis to replace damaged or dead cells, maintaining the same genetic information',
      JSON.stringify(['Think about everyday cell replacement'])
    );

    insertVariant.run(
      'variant-2-discrim',
      'concept-2',
      'discrimination',
      4,
      'How does mitosis differ from meiosis?',
      'Mitosis produces 2 identical diploid cells; meiosis produces 4 genetically different haploid cells',
      JSON.stringify(['Count the products', 'Consider genetic variation'])
    );

    insertSchedule.run('concept-2');

    // Concept 3: Osmosis
    insertConcept.run(
      'concept-3',
      'Osmosis',
      'Movement of water across a semipermeable membrane from low to high solute concentration',
      JSON.stringify([
        'Passive process (no energy required)',
        'Water moves toward higher solute concentration',
        'Critical for cell function',
      ])
    );

    insertVariant.run(
      'variant-3-def',
      'concept-3',
      'definition',
      1,
      'What is osmosis?',
      'The movement of water across a semipermeable membrane from an area of low solute concentration to high solute concentration',
      JSON.stringify(['Think about water movement', 'Consider concentration gradients'])
    );

    insertVariant.run(
      'variant-3-scenario',
      'concept-3',
      'scenario',
      3,
      'A red blood cell is placed in distilled water. What happens and why?',
      'The cell swells and may burst (lyse) because water moves into the cell via osmosis - the cell has higher solute concentration than distilled water',
      JSON.stringify(['Which way does water flow?', 'What happens when a cell takes in too much water?'])
    );

    insertVariant.run(
      'variant-3-cloze',
      'concept-3',
      'cloze',
      2,
      'Osmosis moves water from _____ solute concentration to _____ solute concentration',
      'low, high',
      JSON.stringify(['Think about where water wants to go'])
    );

    insertSchedule.run('concept-3');
  });

  seedAll();
}

/**
 * Seeds data from a YAML file
 *
 * Loads concepts, variants, mastery records, and schedule entries from a YAML file.
 * Useful for importing structured flashcard data.
 *
 * @param filePath - Path to the YAML file
 * @param db - Optional database instance (uses singleton if not provided)
 * @returns Summary of imported records
 */
export function seedFromYAML(
  filePath: string,
  db?: Database.Database
): { concepts: number; variants: number; mastery: number; schedule: number } {
  const database = db ?? getDatabase();
  return loadYAMLData(filePath, database);
}

/**
 * Seeds from the default test data YAML (data/re-test-data.yaml)
 *
 * Loads the bundled real estate exam study data as initial content.
 *
 * @param db - Optional database instance (uses singleton if not provided)
 * @returns Summary of imported records
 */
export function seedDefaultData(
  db?: Database.Database
): { concepts: number; variants: number; mastery: number; schedule: number } {
  const database = db ?? getDatabase();
  return loadDefaultTestData(database);
}

/**
 * Runs all seed functions to initialize a fresh database
 *
 * Initializes mastery dimensions and loads the default test data YAML.
 *
 * @param db - Optional database instance (uses singleton if not provided)
 */
export function seedAll(db?: Database.Database): void {
  const database = db ?? getDatabase();
  seedMasteryDimensions(database);
  // Load default YAML data instead of sample data
  seedDefaultData(database);
}
