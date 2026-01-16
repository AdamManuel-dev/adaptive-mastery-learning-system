/**
 * @fileoverview IPC handlers for variant operations
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: CRUD operations for card variants with hints support
 * Main APIs: registerVariantHandlers()
 * Constraints: Connected to VariantRepository for persistent storage
 * Patterns: Handler registration with error handling wrapper
 */

import { registerHandler, IPCError } from './index'
import { VariantRepository } from '../infrastructure/database/repositories/variant.repository'
import { asConceptId, asVariantId } from '../../shared/types/branded'
import { DimensionType } from '../../shared/types/core'

import type { Variant, DifficultyLevel } from '../../shared/types/core'
import type {
  VariantDTO,
  CreateVariantDTO,
  UpdateVariantDTO,
  Dimension,
} from '../../shared/types/ipc'

// -----------------------------------------------------------------------------
// Dimension Mapping
// -----------------------------------------------------------------------------

/**
 * Maps IPC Dimension to DimensionType enum
 */
function toDimensionType(dimension: Dimension): DimensionType {
  const mapping: Record<Dimension, DimensionType> = {
    definition: DimensionType.DEFINITION_RECALL,
    paraphrase: DimensionType.PARAPHRASE_RECOGNITION,
    example: DimensionType.EXAMPLE_CLASSIFICATION,
    scenario: DimensionType.SCENARIO_APPLICATION,
    discrimination: DimensionType.DISCRIMINATION,
    cloze: DimensionType.CLOZE_FILL,
  }
  return mapping[dimension]
}

/**
 * Maps DimensionType enum to IPC Dimension
 */
function toDimension(dimensionType: DimensionType): Dimension {
  const mapping: Record<DimensionType, Dimension> = {
    [DimensionType.DEFINITION_RECALL]: 'definition',
    [DimensionType.PARAPHRASE_RECOGNITION]: 'paraphrase',
    [DimensionType.EXAMPLE_CLASSIFICATION]: 'example',
    [DimensionType.SCENARIO_APPLICATION]: 'scenario',
    [DimensionType.DISCRIMINATION]: 'discrimination',
    [DimensionType.CLOZE_FILL]: 'cloze',
  }
  return mapping[dimensionType]
}

// -----------------------------------------------------------------------------
// Mappers
// -----------------------------------------------------------------------------

/**
 * Maps a domain Variant to a VariantDTO for IPC transfer
 */
function variantToDTO(variant: Variant): VariantDTO {
  // For now, use lastShownAt as a proxy for createdAt/updatedAt
  const now = new Date().toISOString()
  return {
    id: variant.id,
    conceptId: variant.conceptId,
    dimension: toDimension(variant.dimension),
    difficulty: variant.difficulty,
    front: variant.front,
    back: variant.back,
    hints: [...variant.hints],
    lastShownAt: variant.lastShownAt?.toISOString() ?? null,
    createdAt: now,
    updatedAt: now,
  }
}

// -----------------------------------------------------------------------------
// Handlers
// -----------------------------------------------------------------------------

/**
 * Registers all variant-related IPC handlers
 */
export function registerVariantHandlers(): void {
  // Get variants by concept ID
  registerHandler('variants:getByConceptId', (_event, conceptId) => {
    const variants = VariantRepository.findByConceptId(asConceptId(conceptId))
    return variants.map(variantToDTO)
  })

  // Create a new variant
  registerHandler('variants:create', (_event, data: CreateVariantDTO) => {
    try {
      const variant = VariantRepository.create({
        conceptId: asConceptId(data.conceptId),
        dimension: toDimensionType(data.dimension),
        difficulty: (data.difficulty ?? 3) as DifficultyLevel,
        front: data.front,
        back: data.back,
        hints: data.hints ?? [],
        lastShownAt: null,
      })
      return variantToDTO(variant)
    } catch (error) {
      const err = error as Error
      if (err.message.includes('does not exist')) {
        throw new IPCError('NOT_FOUND', `Concept with id ${data.conceptId} not found`)
      }
      throw new IPCError('INTERNAL_ERROR', 'Failed to create variant')
    }
  })

  // Update an existing variant
  registerHandler('variants:update', (_event, data: UpdateVariantDTO) => {
    try {
      // Build update data object with mutable fields
      const updateData: {
        dimension?: DimensionType
        difficulty?: DifficultyLevel
        front?: string
        back?: string
        hints?: string[]
      } = {}

      if (data.dimension !== undefined) {
        updateData.dimension = toDimensionType(data.dimension)
      }
      if (data.difficulty !== undefined) {
        updateData.difficulty = data.difficulty as DifficultyLevel
      }
      if (data.front !== undefined) {
        updateData.front = data.front
      }
      if (data.back !== undefined) {
        updateData.back = data.back
      }
      if (data.hints !== undefined) {
        updateData.hints = data.hints
      }

      const variant = VariantRepository.update(asVariantId(data.id), updateData)
      return variantToDTO(variant)
    } catch (error) {
      const err = error as Error
      if (err.message.includes('not found')) {
        throw new IPCError('NOT_FOUND', `Variant with id ${data.id} not found`)
      }
      throw new IPCError('INTERNAL_ERROR', 'Failed to update variant')
    }
  })

  // Delete a variant
  registerHandler('variants:delete', (_event, id) => {
    try {
      VariantRepository.delete(asVariantId(id))
    } catch (error) {
      const err = error as Error
      if (err.message.includes('not found')) {
        throw new IPCError('NOT_FOUND', `Variant with id ${id} not found`)
      }
      throw new IPCError('INTERNAL_ERROR', 'Failed to delete variant')
    }
  })
}
