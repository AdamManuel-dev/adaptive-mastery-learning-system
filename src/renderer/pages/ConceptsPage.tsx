/**
 * @fileoverview Concepts management page for viewing and adding learning concepts
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Concept list display, CRUD operations via preload API, search/filter
 * Main APIs: window.api.concepts for data operations
 * Constraints: Requires preload script to expose window.api
 * Patterns: List view with modal form for create/edit
 */

import { useState, useEffect, useCallback } from 'react'

import styles from './ConceptsPage.module.css'

import type { ConceptDTO, CreateConceptDTO, UpdateConceptDTO } from '../../shared/types/ipc'

/**
 * Form data structure for create/edit operations
 */
interface ConceptFormData {
  name: string
  definition: string
}

/**
 * Concepts management page component
 * Displays list of concepts with options to add, view, and manage
 */
function ConceptsPage(): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('')
  const [concepts, setConcepts] = useState<ConceptDTO[]>([])
  const [selectedConcept, setSelectedConcept] = useState<ConceptDTO | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [formData, setFormData] = useState<ConceptFormData>({ name: '', definition: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasConcepts = concepts.length > 0

  /**
   * Fetch all concepts from the API
   */
  const fetchConcepts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      if (!window.api) {
        throw new Error('API not available')
      }
      const data = await window.api.concepts.getAll()
      setConcepts(data)
    } catch (err) {
      console.error('Failed to fetch concepts:', err)
      setError('Failed to load concepts. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Load concepts on mount
   */
  useEffect(() => {
    void fetchConcepts()
  }, [fetchConcepts])

  /**
   * Filter concepts based on search query
   */
  const filteredConcepts = concepts.filter(
    (concept) =>
      concept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (concept.definition?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  )

  /**
   * Open form for creating a new concept
   */
  const handleAddConcept = (): void => {
    setFormMode('create')
    setSelectedConcept(null)
    setFormData({ name: '', definition: '' })
    setIsFormOpen(true)
    setError(null)
  }

  /**
   * Open form for editing an existing concept
   */
  const handleEditConcept = (concept: ConceptDTO): void => {
    setFormMode('edit')
    setSelectedConcept(concept)
    setFormData({
      name: concept.name,
      definition: concept.definition ?? '',
    })
    setIsFormOpen(true)
    setError(null)
  }

  /**
   * Close the form modal
   */
  const handleCloseForm = (): void => {
    setIsFormOpen(false)
    setSelectedConcept(null)
    setFormData({ name: '', definition: '' })
    setError(null)
  }

  /**
   * Handle form input changes
   */
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  /**
   * Create a new concept via API
   */
  const handleCreate = async (data: CreateConceptDTO): Promise<void> => {
    try {
      setIsSaving(true)
      setError(null)
      if (!window.api) {
        throw new Error('API not available')
      }
      const newConcept = await window.api.concepts.create(data)
      setConcepts((prev) => [...prev, newConcept])
      handleCloseForm()
    } catch (err) {
      console.error('Failed to create concept:', err)
      setError('Failed to create concept. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Update an existing concept via API
   */
  const handleUpdate = async (data: UpdateConceptDTO): Promise<void> => {
    try {
      setIsSaving(true)
      setError(null)
      if (!window.api) {
        throw new Error('API not available')
      }
      const updatedConcept = await window.api.concepts.update(data)
      setConcepts((prev) =>
        prev.map((c) => (c.id === updatedConcept.id ? updatedConcept : c))
      )
      handleCloseForm()
    } catch (err) {
      console.error('Failed to update concept:', err)
      setError('Failed to update concept. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Delete a concept via API
   */
  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this concept?')) {
      return
    }

    try {
      setError(null)
      if (!window.api) {
        throw new Error('API not available')
      }
      await window.api.concepts.delete(id)
      setConcepts((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      console.error('Failed to delete concept:', err)
      setError('Failed to delete concept. Please try again.')
    }
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setError('Name is required')
      return
    }

    const definitionValue = formData.definition.trim()

    if (formMode === 'create') {
      const createData: CreateConceptDTO = { name: formData.name.trim() }
      if (definitionValue) {
        createData.definition = definitionValue
      }
      await handleCreate(createData)
    } else if (selectedConcept) {
      const updateData: UpdateConceptDTO = {
        id: selectedConcept.id,
        name: formData.name.trim(),
      }
      if (definitionValue) {
        updateData.definition = definitionValue
      }
      await handleUpdate(updateData)
    }
  }

  /**
   * Truncate text with ellipsis
   */
  const truncateText = (text: string | null, maxLength: number): string => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  return (
    <div className={styles.conceptsPage}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Concepts</h1>
          <p className={styles.subtitle}>Manage your learning concepts and question banks</p>
        </div>
        <button
          type="button"
          className={`btn-primary ${styles.addButton}`}
          onClick={handleAddConcept}
        >
          <span className={styles.addIcon}>+</span>
          Add Concept
        </button>
      </header>

      {/* Error Banner */}
      {error && (
        <div className={styles.errorBanner}>
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
          >
            x
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className={styles.searchSection}>
        <div className={styles.searchInputWrapper}>
          <span className={styles.searchIcon}>S</span>
          <input
            type="text"
            placeholder="Search concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              x
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className={styles.loadingState}>
          <p>Loading concepts...</p>
        </div>
      )}

      {/* Concepts List */}
      {!isLoading && hasConcepts && (
        <div className={styles.conceptsGrid}>
          {filteredConcepts.map((concept) => (
            <div key={concept.id} className={styles.conceptCard}>
              <div className={styles.conceptHeader}>
                <h3 className={styles.conceptName}>{concept.name}</h3>
                <div className={styles.conceptActions}>
                  <button
                    type="button"
                    className={styles.editButton}
                    onClick={() => handleEditConcept(concept)}
                    aria-label={`Edit ${concept.name}`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => void handleDelete(concept.id)}
                    aria-label={`Delete ${concept.name}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className={styles.conceptDescription}>
                {truncateText(concept.definition, 150) || 'No definition provided'}
              </p>
              <div className={styles.conceptMeta}>
                <span className={styles.metaItem}>
                  Created: {new Date(concept.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !hasConcepts && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>C</div>
          <h2>No Concepts Yet</h2>
          <p>
            Concepts are topics you want to learn and master. Each concept can have
            multiple question types to test your understanding.
          </p>
          <button type="button" className="btn-primary" onClick={handleAddConcept}>
            Create Your First Concept
          </button>
          <div className={styles.emptyHints}>
            <h4>Ideas for concepts:</h4>
            <ul>
              <li>Programming languages (JavaScript, Python, Rust)</li>
              <li>Frameworks (React, Vue, Django)</li>
              <li>Algorithms and data structures</li>
              <li>Foreign languages vocabulary</li>
              <li>Historical facts or scientific concepts</li>
            </ul>
          </div>
        </div>
      )}

      {/* No Results State */}
      {!isLoading && hasConcepts && filteredConcepts.length === 0 && (
        <div className={styles.noResults}>
          <p>No concepts match &ldquo;{searchQuery}&rdquo;</p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setSearchQuery('')}
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {isFormOpen && (
        <div
          className={styles.modalOverlay}
          onClick={handleCloseForm}
          onKeyDown={(e) => e.key === 'Escape' && handleCloseForm()}
          role="button"
          tabIndex={0}
          aria-label="Close modal"
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="form-title"
          >
            <header className={styles.modalHeader}>
              <h2 id="form-title">
                {formMode === 'create' ? 'Create New Concept' : 'Edit Concept'}
              </h2>
              <button
                type="button"
                className={styles.closeButton}
                onClick={handleCloseForm}
                aria-label="Close"
              >
                x
              </button>
            </header>
            <form
              onSubmit={(e) => void handleSubmit(e)}
              className={styles.form}
            >
              <div className={styles.formGroup}>
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter concept name"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="definition">Definition</label>
                <textarea
                  id="definition"
                  name="definition"
                  value={formData.definition}
                  onChange={handleInputChange}
                  placeholder="Enter concept definition (optional)"
                  rows={4}
                />
              </div>
              {error && <p className={styles.formError}>{error}</p>}
              <div className={styles.formActions}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCloseForm}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : formMode === 'create' ? 'Create' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConceptsPage
