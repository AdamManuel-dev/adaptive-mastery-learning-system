/**
 * @fileoverview Dimension value object representing cognitive testing dimensions
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Six cognitive dimensions with metadata, target times, validation
 * Main APIs: Dimension.fromString(), displayName, description, targetTimeMs()
 * Constraints: Immutable, only six valid dimension types
 * Patterns: Value object with static factory, enum-like behavior
 *
 * Note: This value object uses simple string values (e.g., 'definition') for MVP
 * compatibility. For conversion to/from the shared DimensionType enum, use
 * toSharedType() and fromSharedType() methods.
 */

import { ValidationError } from '../../shared/errors'
import { DimensionType as SharedDimensionType } from '../../shared/types/core'
import { Result } from '../../shared/utils/result'

/**
 * The six cognitive testing dimensions used in the adaptive learning system.
 * Uses simple string values for MVP compatibility.
 */
export const DimensionType = {
  DEFINITION: 'definition',
  PARAPHRASE: 'paraphrase',
  EXAMPLE: 'example',
  SCENARIO: 'scenario',
  DISCRIMINATION: 'discrimination',
  CLOZE: 'cloze',
} as const

export type DimensionTypeValue = (typeof DimensionType)[keyof typeof DimensionType]

/**
 * Mapping from simple dimension strings to shared DimensionType enum.
 */
const TO_SHARED_TYPE: Record<DimensionTypeValue, SharedDimensionType> = {
  [DimensionType.DEFINITION]: SharedDimensionType.DEFINITION_RECALL,
  [DimensionType.PARAPHRASE]: SharedDimensionType.PARAPHRASE_RECOGNITION,
  [DimensionType.EXAMPLE]: SharedDimensionType.EXAMPLE_CLASSIFICATION,
  [DimensionType.SCENARIO]: SharedDimensionType.SCENARIO_APPLICATION,
  [DimensionType.DISCRIMINATION]: SharedDimensionType.DISCRIMINATION,
  [DimensionType.CLOZE]: SharedDimensionType.CLOZE_FILL,
}

/**
 * Mapping from shared DimensionType enum to simple dimension strings.
 */
const FROM_SHARED_TYPE: Record<SharedDimensionType, DimensionTypeValue> = {
  [SharedDimensionType.DEFINITION_RECALL]: DimensionType.DEFINITION,
  [SharedDimensionType.PARAPHRASE_RECOGNITION]: DimensionType.PARAPHRASE,
  [SharedDimensionType.EXAMPLE_CLASSIFICATION]: DimensionType.EXAMPLE,
  [SharedDimensionType.SCENARIO_APPLICATION]: DimensionType.SCENARIO,
  [SharedDimensionType.DISCRIMINATION]: DimensionType.DISCRIMINATION,
  [SharedDimensionType.CLOZE_FILL]: DimensionType.CLOZE,
}

/**
 * Metadata for each dimension type.
 */
interface DimensionMetadata {
  readonly displayName: string
  readonly description: string
  readonly baseTargetTimeMs: number
}

const DIMENSION_METADATA: Record<DimensionTypeValue, DimensionMetadata> = {
  [DimensionType.DEFINITION]: {
    displayName: 'Definition Recall',
    description: 'Recall the exact definition when shown the term',
    baseTargetTimeMs: 5000,
  },
  [DimensionType.PARAPHRASE]: {
    displayName: 'Paraphrase Recognition',
    description: 'Recognize correct restatements of the definition',
    baseTargetTimeMs: 8000,
  },
  [DimensionType.EXAMPLE]: {
    displayName: 'Example Classification',
    description: 'Correctly identify examples and non-examples of the concept',
    baseTargetTimeMs: 10000,
  },
  [DimensionType.SCENARIO]: {
    displayName: 'Scenario Application',
    description: 'Apply the concept to novel real-world scenarios',
    baseTargetTimeMs: 15000,
  },
  [DimensionType.DISCRIMINATION]: {
    displayName: 'Discrimination',
    description: 'Distinguish this concept from similar or related concepts',
    baseTargetTimeMs: 12000,
  },
  [DimensionType.CLOZE]: {
    displayName: 'Cloze Fill',
    description: 'Complete sentences with missing key terms',
    baseTargetTimeMs: 6000,
  },
}

/**
 * Difficulty multipliers for target time calculation.
 * Index corresponds to difficulty level (1-5).
 */
const DIFFICULTY_MULTIPLIERS = [0.5, 0.75, 1.0, 1.5, 2.0] as const

/**
 * Valid dimension type strings for validation.
 */
const VALID_DIMENSIONS = new Set<string>(Object.values(DimensionType))

/**
 * Represents a cognitive testing dimension in the learning system.
 * Immutable value object that encapsulates dimension type with associated metadata.
 */
export class Dimension {
  private constructor(private readonly type: DimensionTypeValue) {}

  /**
   * Creates a Dimension from a string value.
   * Returns a ValidationError if the string is not a valid dimension.
   */
  static fromString(value: string): Result<Dimension, ValidationError> {
    const normalized = value.toLowerCase().trim()

    if (!VALID_DIMENSIONS.has(normalized)) {
      return Result.err(
        new ValidationError(
          `Invalid dimension: "${value}". Valid dimensions are: ${Array.from(VALID_DIMENSIONS).join(', ')}`
        )
      )
    }

    return Result.ok(new Dimension(normalized as DimensionTypeValue))
  }

  /**
   * Creates a Dimension from a known valid type.
   * Use this when the dimension type is statically known to be valid.
   */
  static of(type: DimensionTypeValue): Dimension {
    return new Dimension(type)
  }

  /**
   * Creates a Dimension from the shared DimensionType enum.
   * Use this when converting from the shared types module.
   */
  static fromSharedType(sharedType: SharedDimensionType): Dimension {
    return new Dimension(FROM_SHARED_TYPE[sharedType])
  }

  /**
   * Returns all available dimensions.
   */
  static all(): Dimension[] {
    return Object.values(DimensionType).map((type) => new Dimension(type))
  }

  /**
   * The raw dimension type value.
   */
  get value(): DimensionTypeValue {
    return this.type
  }

  /**
   * Human-readable display name for the dimension.
   */
  get displayName(): string {
    return DIMENSION_METADATA[this.type].displayName
  }

  /**
   * Detailed description of what this dimension tests.
   */
  get description(): string {
    return DIMENSION_METADATA[this.type].description
  }

  /**
   * Calculates the target response time in milliseconds for a given difficulty.
   * Higher difficulty means more time is allowed.
   *
   * @param difficulty - Difficulty level from 1 (easiest) to 5 (hardest)
   */
  targetTimeMs(difficulty: number): number {
    const clampedDifficulty = Math.max(1, Math.min(5, Math.round(difficulty)))
    const multiplier = DIFFICULTY_MULTIPLIERS[clampedDifficulty - 1] ?? 1
    return Math.round(DIMENSION_METADATA[this.type].baseTargetTimeMs * multiplier)
  }

  /**
   * Converts to the shared DimensionType enum.
   * Use this when passing to functions that expect the shared types.
   */
  toSharedType(): SharedDimensionType {
    return TO_SHARED_TYPE[this.type]
  }

  /**
   * Checks equality with another Dimension.
   */
  equals(other: Dimension): boolean {
    return this.type === other.type
  }

  /**
   * Returns the string representation of the dimension.
   */
  toString(): string {
    return this.type
  }
}
