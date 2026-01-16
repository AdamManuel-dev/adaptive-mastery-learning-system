/**
 * @fileoverview IPC handlers for variant operations
 * @lastmodified 2025-01-16T00:00:00Z
 *
 * Features: CRUD operations for card variants
 * Main APIs: registerVariantHandlers()
 * Constraints: Stub implementations until repository is connected
 * Patterns: Handler registration with error handling wrapper
 */

import { registerHandler, IPCError } from './index'

import type {
  VariantDTO,
  CreateVariantDTO,
  UpdateVariantDTO,
} from '../../shared/types/ipc'

// -----------------------------------------------------------------------------
// Stub Data (to be replaced with repository calls)
// -----------------------------------------------------------------------------

const stubVariants: VariantDTO[] = []

// -----------------------------------------------------------------------------
// Handlers
// -----------------------------------------------------------------------------

/**
 * Registers all variant-related IPC handlers
 */
export function registerVariantHandlers(): void {
  // Get variants by concept ID
  registerHandler('variants:getByConceptId', (_event, conceptId) => {
    // TODO: Replace with repository call
    // return variantRepository.findByConceptId(conceptId)
    return stubVariants.filter((v) => v.conceptId === conceptId)
  })

  // Create a new variant
  registerHandler('variants:create', (_event, data: CreateVariantDTO) => {
    // TODO: Replace with repository call
    // return variantRepository.create(data)

    const now = new Date().toISOString()
    const variant: VariantDTO = {
      id: crypto.randomUUID(),
      conceptId: data.conceptId,
      dimension: data.dimension,
      difficulty: data.difficulty ?? 3,
      front: data.front,
      back: data.back,
      createdAt: now,
      updatedAt: now,
    }

    stubVariants.push(variant)
    return variant
  })

  // Update an existing variant
  registerHandler('variants:update', (_event, data: UpdateVariantDTO) => {
    // TODO: Replace with repository call
    // return variantRepository.update(data)

    const index = stubVariants.findIndex((v) => v.id === data.id)
    if (index === -1) {
      throw new IPCError('NOT_FOUND', `Variant with id ${data.id} not found`)
    }

    const existing = stubVariants[index]
    if (!existing) {
      throw new IPCError('NOT_FOUND', `Variant with id ${data.id} not found`)
    }

    const updated: VariantDTO = {
      ...existing,
      dimension: data.dimension ?? existing.dimension,
      difficulty: data.difficulty ?? existing.difficulty,
      front: data.front ?? existing.front,
      back: data.back ?? existing.back,
      updatedAt: new Date().toISOString(),
    }

    stubVariants[index] = updated
    return updated
  })

  // Delete a variant
  registerHandler('variants:delete', (_event, id) => {
    // TODO: Replace with repository call
    // return variantRepository.delete(id)

    const index = stubVariants.findIndex((v) => v.id === id)
    if (index === -1) {
      throw new IPCError('NOT_FOUND', `Variant with id ${id} not found`)
    }

    stubVariants.splice(index, 1)
  })
}
