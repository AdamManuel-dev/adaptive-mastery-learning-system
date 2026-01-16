/**
 * @fileoverview Constants and metadata for learning dimensions
 * @lastmodified 2025-01-16T00:00:00Z
 *
 * Provides display names, descriptions, and configuration values
 * for the six cognitive dimensions used in the learning system.
 * These constants are used across the UI and domain logic.
 */

import { DimensionType } from '@shared/types';

import type { DifficultyLevel } from '@shared/types';

/**
 * Human-readable display names for each dimension.
 * Used in UI labels, reports, and mastery dashboards.
 */
export const DIMENSION_DISPLAY_NAMES: Record<DimensionType, string> = {
  [DimensionType.DEFINITION_RECALL]: 'Definition Recall',
  [DimensionType.PARAPHRASE_RECOGNITION]: 'Paraphrase Recognition',
  [DimensionType.EXAMPLE_CLASSIFICATION]: 'Example Classification',
  [DimensionType.SCENARIO_APPLICATION]: 'Scenario Application',
  [DimensionType.DISCRIMINATION]: 'Discrimination',
  [DimensionType.CLOZE_FILL]: 'Cloze Fill',
};

/**
 * Detailed descriptions explaining what each dimension tests.
 * Used in help tooltips and educational content.
 */
export const DIMENSION_DESCRIPTIONS: Record<DimensionType, string> = {
  [DimensionType.DEFINITION_RECALL]:
    'Tests whether you can recall the definition when shown the term. This is the most basic level of knowledge.',
  [DimensionType.PARAPHRASE_RECOGNITION]:
    'Tests whether you can recognize correct restatements of the definition in different words.',
  [DimensionType.EXAMPLE_CLASSIFICATION]:
    'Tests whether you can correctly identify examples and non-examples of the concept.',
  [DimensionType.SCENARIO_APPLICATION]:
    'Tests whether you can apply the concept to novel real-world scenarios and situations.',
  [DimensionType.DISCRIMINATION]:
    'Tests whether you can distinguish this concept from similar or related concepts.',
  [DimensionType.CLOZE_FILL]:
    'Tests whether you can complete sentences with missing key terms from the definition.',
};

/**
 * Short action verbs for each dimension (for compact UI).
 */
export const DIMENSION_ACTION_VERBS: Record<DimensionType, string> = {
  [DimensionType.DEFINITION_RECALL]: 'Recall',
  [DimensionType.PARAPHRASE_RECOGNITION]: 'Recognize',
  [DimensionType.EXAMPLE_CLASSIFICATION]: 'Classify',
  [DimensionType.SCENARIO_APPLICATION]: 'Apply',
  [DimensionType.DISCRIMINATION]: 'Distinguish',
  [DimensionType.CLOZE_FILL]: 'Complete',
};

/**
 * Target response times in milliseconds for each difficulty level.
 * Used to calculate speed scores in mastery assessment.
 *
 * Difficulty 1: 5 seconds (basic recall)
 * Difficulty 2: 10 seconds (simple recognition)
 * Difficulty 3: 20 seconds (moderate application)
 * Difficulty 4: 40 seconds (complex reasoning)
 * Difficulty 5: 60 seconds (deep analysis)
 */
export const DIFFICULTY_TARGET_TIMES_MS: Record<DifficultyLevel, number> = {
  1: 5000,
  2: 10000,
  3: 20000,
  4: 40000,
  5: 60000,
};

/**
 * Display labels for difficulty levels.
 */
export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  1: 'Very Easy',
  2: 'Easy',
  3: 'Medium',
  4: 'Hard',
  5: 'Very Hard',
};

/**
 * All dimension types as an array for iteration.
 */
export const ALL_DIMENSIONS: readonly DimensionType[] = [
  DimensionType.DEFINITION_RECALL,
  DimensionType.PARAPHRASE_RECOGNITION,
  DimensionType.EXAMPLE_CLASSIFICATION,
  DimensionType.SCENARIO_APPLICATION,
  DimensionType.DISCRIMINATION,
  DimensionType.CLOZE_FILL,
] as const;

/**
 * All difficulty levels as an array for iteration.
 */
export const ALL_DIFFICULTY_LEVELS: readonly DifficultyLevel[] = [
  1, 2, 3, 4, 5,
] as const;

/**
 * Default starting difficulty for new variants.
 */
export const DEFAULT_DIFFICULTY: DifficultyLevel = 2;

/**
 * Mastery threshold below which a dimension is considered weak.
 */
export const WEAKNESS_THRESHOLD = 0.7;

/**
 * EWMA alpha value for mastery calculations.
 * Higher values give more weight to recent performance.
 */
export const EWMA_ALPHA = 0.15;
