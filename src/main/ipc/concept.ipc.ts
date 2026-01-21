/**
 * @fileoverview IPC handlers for concept operations
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: CRUD operations for concepts with facts array support
 * Main APIs: registerConceptHandlers()
 * Constraints: Connected to ConceptRepository for persistent storage
 * Patterns: Handler registration with error handling wrapper
 */

import { asConceptId } from '../../shared/types/branded'
import { ConceptRepository } from '../infrastructure/database/repositories/concept.repository'

import { registerHandler, IPCError } from './index'

import type { Concept } from '../../shared/types/core'
import type {
  ConceptDTO,
  CreateConceptDTO,
  UpdateConceptDTO,
} from '../../shared/types/ipc'

// -----------------------------------------------------------------------------
// Mappers
// -----------------------------------------------------------------------------

/**
 * Maps a domain Concept to a ConceptDTO for IPC transfer
 */
function conceptToDTO(concept: Concept): ConceptDTO {
  return {
    id: concept.id,
    name: concept.name,
    definition: concept.definition ?? null,
    facts: [...concept.facts],
    createdAt: concept.createdAt.toISOString(),
    updatedAt: concept.updatedAt.toISOString(),
  }
}

// -----------------------------------------------------------------------------
// Handlers
// -----------------------------------------------------------------------------

/**
 * Registers all concept-related IPC handlers
 */
export function registerConceptHandlers(): void {
  // Get all concepts
  registerHandler('concepts:getAll', () => {
    const concepts = ConceptRepository.findAll()
    return concepts.map(conceptToDTO)
  })

  // Get concept by ID
  registerHandler('concepts:getById', (_event, id) => {
    const concept = ConceptRepository.findById(asConceptId(id))
    return concept ? conceptToDTO(concept) : null
  })

  // Create a new concept
  registerHandler('concepts:create', (_event, data: CreateConceptDTO) => {
    try {
      const concept = ConceptRepository.create({
        name: data.name,
        definition: data.definition ?? '',
        facts: data.facts ?? [],
      })
      return conceptToDTO(concept)
    } catch (error) {
      const err = error as Error
      if (err.message.includes('already exists')) {
        throw new IPCError('ALREADY_EXISTS', err.message)
      }
      throw new IPCError('INTERNAL_ERROR', 'Failed to create concept')
    }
  })

  // Update an existing concept
  registerHandler('concepts:update', (_event, data: UpdateConceptDTO) => {
    try {
      // Build update data object with mutable fields
      const updateData: {
        name?: string
        definition?: string
        facts?: string[]
      } = {}

      if (data.name !== undefined) {
        updateData.name = data.name
      }
      if (data.definition !== undefined) {
        updateData.definition = data.definition
      }
      if (data.facts !== undefined) {
        updateData.facts = data.facts
      }

      const concept = ConceptRepository.update(asConceptId(data.id), updateData)
      return conceptToDTO(concept)
    } catch (error) {
      const err = error as Error
      if (err.message.includes('not found')) {
        throw new IPCError('NOT_FOUND', `Concept with id ${data.id} not found`)
      }
      if (err.message.includes('already exists')) {
        throw new IPCError('ALREADY_EXISTS', err.message)
      }
      throw new IPCError('INTERNAL_ERROR', 'Failed to update concept')
    }
  })

  // Delete a concept
  registerHandler('concepts:delete', (_event, id) => {
    try {
      ConceptRepository.delete(asConceptId(id))
    } catch (error) {
      const err = error as Error
      if (err.message.includes('not found')) {
        throw new IPCError('NOT_FOUND', `Concept with id ${id} not found`)
      }
      throw new IPCError('INTERNAL_ERROR', 'Failed to delete concept')
    }
  })
}
