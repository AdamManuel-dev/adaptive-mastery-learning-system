/**
 * @fileoverview IPC handlers for concept operations
 * @lastmodified 2025-01-16T00:00:00Z
 *
 * Features: CRUD operations for concepts
 * Main APIs: registerConceptHandlers()
 * Constraints: Stub implementations until repository is connected
 * Patterns: Handler registration with error handling wrapper
 */

import { registerHandler, IPCError } from './index'

import type {
  ConceptDTO,
  CreateConceptDTO,
  UpdateConceptDTO,
} from '../../shared/types/ipc'

// -----------------------------------------------------------------------------
// Stub Data (to be replaced with repository calls)
// -----------------------------------------------------------------------------

const stubConcepts: ConceptDTO[] = []

// -----------------------------------------------------------------------------
// Handlers
// -----------------------------------------------------------------------------

/**
 * Registers all concept-related IPC handlers
 */
export function registerConceptHandlers(): void {
  // Get all concepts
  registerHandler('concepts:getAll', () => {
    // TODO: Replace with repository call
    // return conceptRepository.findAll()
    return stubConcepts
  })

  // Get concept by ID
  registerHandler('concepts:getById', (_event, id) => {
    // TODO: Replace with repository call
    // return conceptRepository.findById(id)
    return stubConcepts.find((c) => c.id === id) ?? null
  })

  // Create a new concept
  registerHandler('concepts:create', (_event, data: CreateConceptDTO) => {
    // TODO: Replace with repository call
    // return conceptRepository.create(data)

    const now = new Date().toISOString()
    const concept: ConceptDTO = {
      id: crypto.randomUUID(),
      name: data.name,
      definition: data.definition ?? null,
      createdAt: now,
      updatedAt: now,
    }

    stubConcepts.push(concept)
    return concept
  })

  // Update an existing concept
  registerHandler('concepts:update', (_event, data: UpdateConceptDTO) => {
    // TODO: Replace with repository call
    // return conceptRepository.update(data)

    const index = stubConcepts.findIndex((c) => c.id === data.id)
    if (index === -1) {
      throw new IPCError('NOT_FOUND', `Concept with id ${data.id} not found`)
    }

    const existing = stubConcepts[index]
    if (!existing) {
      throw new IPCError('NOT_FOUND', `Concept with id ${data.id} not found`)
    }

    const updated: ConceptDTO = {
      ...existing,
      name: data.name ?? existing.name,
      definition: data.definition ?? existing.definition,
      updatedAt: new Date().toISOString(),
    }

    stubConcepts[index] = updated
    return updated
  })

  // Delete a concept
  registerHandler('concepts:delete', (_event, id) => {
    // TODO: Replace with repository call
    // return conceptRepository.delete(id)

    const index = stubConcepts.findIndex((c) => c.id === id)
    if (index === -1) {
      throw new IPCError('NOT_FOUND', `Concept with id ${id} not found`)
    }

    stubConcepts.splice(index, 1)
  })
}
