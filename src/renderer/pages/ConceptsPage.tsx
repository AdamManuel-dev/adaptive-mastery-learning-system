/**
 * @fileoverview Concepts management page for viewing and adding learning concepts
 * @lastmodified 2026-01-16T21:27:30Z
 *
 * Features: Concept list display, CRUD operations via preload API, search/filter, accessible modal, custom delete confirmation
 * Main APIs: useElectronAPI hook for safe API access
 * Constraints: Requires preload script (useElectronAPI provides error handling)
 * Patterns: List view with modal form for create/edit, hook-based API access, Lucide React icons, WCAG 2.1 AA compliant
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, BookPlus, X } from 'lucide-react'

import styles from './ConceptsPage.module.css'
import { useElectronAPI } from '../hooks/useElectronAPI'

import type { ConceptDTO, CreateConceptDTO, UpdateConceptDTO } from '../../shared/types/ipc'

/**
 * Form data structure for create/edit operations
 */
interface ConceptFormData {
  name: string
  definition: string
  facts: string[]
}

/**
 * Delete confirmation state structure
 * Used for custom confirmation modal instead of native confirm()
 */
interface DeleteConfirmation {
  id: string
  name: string
}

/**
 * Concepts management page component
 * Displays list of concepts with options to add, view, and manage
 */
function ConceptsPage(): React.JSX.Element {
  const api = useElectronAPI()
  const [searchQuery, setSearchQuery] = useState('')
  const [concepts, setConcepts] = useState<ConceptDTO[]>([])
  const [selectedConcept, setSelectedConcept] = useState<ConceptDTO | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [formData, setFormData] = useState<ConceptFormData>({ name: '', definition: '', facts: [] })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Refs for focus management in modal
  const modalRef = useRef<HTMLDivElement>(null)
  const deleteModalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const firstFocusableRef = useRef<HTMLInputElement>(null)

  const hasConcepts = concepts.length > 0

  /**
   * Fetch all concepts from the API
   */
  const fetchConcepts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await api.concepts.getAll()
      setConcepts(data)
    } catch (err) {
      console.error('Failed to fetch concepts:', err)
      setError('Failed to load concepts. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [api])

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
   * Saves previous focus for restoration when modal closes
   */
  const handleAddConcept = (): void => {
    previousFocusRef.current = document.activeElement as HTMLElement
    setFormMode('create')
    setSelectedConcept(null)
    setFormData({ name: '', definition: '', facts: [] })
    setIsFormOpen(true)
    setError(null)
  }

  /**
   * Open form for editing an existing concept
   * Saves previous focus for restoration when modal closes
   */
  const handleEditConcept = (concept: ConceptDTO): void => {
    previousFocusRef.current = document.activeElement as HTMLElement
    setFormMode('edit')
    setSelectedConcept(concept)
    setFormData({
      name: concept.name,
      definition: concept.definition ?? '',
      facts: concept.facts ?? [],
    })
    setIsFormOpen(true)
    setError(null)
  }

  /**
   * Close the form modal
   * Restores focus to the element that opened the modal
   */
  const handleCloseForm = (): void => {
    setIsFormOpen(false)
    setSelectedConcept(null)
    setFormData({ name: '', definition: '', facts: [] })
    setError(null)
    // Restore focus to the element that opened the modal
    previousFocusRef.current?.focus()
  }

  /**
   * Focus trap for modal - keeps focus within modal when open
   */
  useEffect(() => {
    if (!isFormOpen || !modalRef.current) return

    // Focus the first input when modal opens
    const timer = setTimeout(() => {
      firstFocusableRef.current?.focus()
    }, 0)

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        handleCloseForm()
        return
      }

      if (e.key !== 'Tab' || !modalRef.current) return

      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      // Shift+Tab from first element -> go to last element
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      }
      // Tab from last element -> go to first element
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFormOpen])

  /**
   * Focus trap for delete confirmation modal - keeps focus within modal when open
   */
  useEffect(() => {
    if (!deleteConfirmation || !deleteModalRef.current) return

    // Focus the Cancel button when modal opens (safer action first)
    const focusableElements = deleteModalRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled])'
    )
    const firstElement = focusableElements[0]
    const timer = setTimeout(() => {
      firstElement?.focus()
    }, 0)

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        handleCancelDelete()
        return
      }

      if (e.key !== 'Tab' || !deleteModalRef.current) return

      const elements = deleteModalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled])'
      )
      const first = elements[0]
      const last = elements[elements.length - 1]

      // Shift+Tab from first element -> go to last element
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      }
      // Tab from last element -> go to first element
      else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [deleteConfirmation])

  /**
   * Add a new empty fact field
   */
  const handleAddFact = (): void => {
    setFormData((prev) => ({
      ...prev,
      facts: [...prev.facts, ''],
    }))
  }

  /**
   * Remove a fact field by index
   */
  const handleRemoveFact = (index: number): void => {
    setFormData((prev) => ({
      ...prev,
      facts: prev.facts.filter((_, i) => i !== index),
    }))
  }

  /**
   * Update a fact field value by index
   */
  const handleFactChange = (index: number, value: string): void => {
    setFormData((prev) => ({
      ...prev,
      facts: prev.facts.map((fact, i) => (i === index ? value : fact)),
    }))
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
      const newConcept = await api.concepts.create(data)
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
      const updatedConcept = await api.concepts.update(data)
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
   * Show delete confirmation modal for a concept
   */
  const handleDeleteClick = (concept: ConceptDTO): void => {
    previousFocusRef.current = document.activeElement as HTMLElement
    setDeleteConfirmation({ id: concept.id, name: concept.name })
  }

  /**
   * Close the delete confirmation modal
   */
  const handleCancelDelete = (): void => {
    setDeleteConfirmation(null)
    previousFocusRef.current?.focus()
  }

  /**
   * Confirm and execute concept deletion via API
   */
  const handleConfirmDelete = async (): Promise<void> => {
    if (!deleteConfirmation) return

    try {
      setIsDeleting(true)
      setError(null)
      await api.concepts.delete(deleteConfirmation.id)
      setConcepts((prev) => prev.filter((c) => c.id !== deleteConfirmation.id))
      setDeleteConfirmation(null)
      previousFocusRef.current?.focus()
    } catch (err) {
      console.error('Failed to delete concept:', err)
      setError('Failed to delete concept. Please try again.')
    } finally {
      setIsDeleting(false)
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
    // Filter out empty facts
    const factsValue = formData.facts
      .map((f) => f.trim())
      .filter((f) => f.length > 0)

    if (formMode === 'create') {
      const createData: CreateConceptDTO = { name: formData.name.trim() }
      if (definitionValue) {
        createData.definition = definitionValue
      }
      if (factsValue.length > 0) {
        createData.facts = factsValue
      }
      await handleCreate(createData)
    } else if (selectedConcept) {
      const updateData: UpdateConceptDTO = {
        id: selectedConcept.id,
        name: formData.name.trim(),
        facts: factsValue,
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
          <span className={styles.searchIcon}>
            <Search size={18} />
          </span>
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
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Loading State - announced via aria-live */}
      {isLoading && (
        <div
          className={styles.loadingState}
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="spinner" aria-hidden="true" />
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
                    onClick={() => handleDeleteClick(concept)}
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
                {(concept.facts?.length ?? 0) > 0 && (
                  <span className={styles.metaItem}>
                    {concept.facts?.length ?? 0} fact{(concept.facts?.length ?? 0) !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !hasConcepts && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <BookPlus size={48} strokeWidth={1.5} />
          </div>
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
          role="presentation"
          aria-hidden="true"
        >
          <div
            ref={modalRef}
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
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
                  ref={firstFocusableRef}
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter concept name"
                  required
                  aria-invalid={error && error.includes('Name') ? 'true' : undefined}
                  aria-describedby={error && error.includes('Name') ? 'name-error' : undefined}
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
              <div className={styles.formGroup}>
                <label className={styles.factsLabel}>
                  Facts & Key Points
                  <button
                    type="button"
                    className={styles.addFactButton}
                    onClick={handleAddFact}
                    aria-label="Add fact"
                  >
                    + Add Fact
                  </button>
                </label>
                <div className={styles.factsContainer}>
                  {formData.facts.length === 0 ? (
                    <p className={styles.factsEmptyHint}>
                      Add supporting facts, examples, or key points about this concept.
                    </p>
                  ) : (
                    formData.facts.map((fact, index) => (
                      <div key={index} className={styles.factRow}>
                        <span className={styles.factNumber}>{index + 1}</span>
                        <input
                          type="text"
                          value={fact}
                          onChange={(e) => handleFactChange(index, e.target.value)}
                          placeholder={`Fact ${index + 1}`}
                          className={styles.factInput}
                        />
                        <button
                          type="button"
                          className={styles.removeFactButton}
                          onClick={() => handleRemoveFact(index)}
                          aria-label={`Remove fact ${index + 1}`}
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              {error && (
                <p
                  id="name-error"
                  className={styles.formError}
                  role="alert"
                  aria-live="assertive"
                >
                  {error}
                </p>
              )}
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div
          className={styles.modalOverlay}
          onClick={handleCancelDelete}
          role="presentation"
          aria-hidden="true"
        >
          <div
            ref={deleteModalRef}
            className={styles.confirmationModal}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            aria-describedby="delete-description"
          >
            <div className={styles.confirmationIcon} aria-hidden="true">
              !
            </div>
            <h3 id="delete-title" className={styles.confirmationTitle}>
              Delete Concept?
            </h3>
            <p id="delete-description" className={styles.confirmationMessage}>
              Are you sure you want to delete &ldquo;{deleteConfirmation.name}&rdquo;?
              This action cannot be undone and will remove all associated flashcards.
            </p>
            <div className={styles.confirmationActions}>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn-primary ${styles.dangerButton}`}
                onClick={() => void handleConfirmDelete()}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConceptsPage
