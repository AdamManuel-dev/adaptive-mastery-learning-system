/**
 * @fileoverview Preload script exposing secure IPC bridge to renderer
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Type-safe IPC bridge, contextBridge API exposure
 * Main APIs: window.api with typed methods for all IPC channels
 * Constraints: Must use contextBridge for security
 * Patterns: Grouped API methods by domain (concepts, variants, review, etc.)
 */

import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

import type {
  ConceptDTO,
  CreateConceptDTO,
  UpdateConceptDTO,
  VariantDTO,
  CreateVariantDTO,
  UpdateVariantDTO,
  ReviewCardDTO,
  ReviewSubmitDTO,
  ReviewResultDTO,
  DueCountDTO,
  MasteryProfileDTO,
  MasteryDTO,
  Dimension,
  ScheduleDTO,
  UpdateScheduleDTO,
  SettingsDTO,
  LLMConfigDTO,
  ConnectionTestResultDTO,
} from '../shared/types/ipc'

// -----------------------------------------------------------------------------
// API Definition
// -----------------------------------------------------------------------------

/**
 * The API object exposed to the renderer process via contextBridge.
 * Groups methods by domain for clear organization.
 */
const api = {
  /**
   * Concept operations - managing learning topics
   */
  concepts: {
    getAll: (): Promise<ConceptDTO[]> => ipcRenderer.invoke('concepts:getAll'),

    getById: (id: string): Promise<ConceptDTO | null> =>
      ipcRenderer.invoke('concepts:getById', id),

    create: (data: CreateConceptDTO): Promise<ConceptDTO> =>
      ipcRenderer.invoke('concepts:create', data),

    update: (data: UpdateConceptDTO): Promise<ConceptDTO> =>
      ipcRenderer.invoke('concepts:update', data),

    delete: (id: string): Promise<void> =>
      ipcRenderer.invoke('concepts:delete', id),
  },

  /**
   * Variant operations - card variants for testing concepts
   */
  variants: {
    getByConceptId: (conceptId: string): Promise<VariantDTO[]> =>
      ipcRenderer.invoke('variants:getByConceptId', conceptId),

    create: (data: CreateVariantDTO): Promise<VariantDTO> =>
      ipcRenderer.invoke('variants:create', data),

    update: (data: UpdateVariantDTO): Promise<VariantDTO> =>
      ipcRenderer.invoke('variants:update', data),

    delete: (id: string): Promise<void> =>
      ipcRenderer.invoke('variants:delete', id),
  },

  /**
   * Review operations - the core study loop
   */
  review: {
    getNextCard: (): Promise<ReviewCardDTO | null> =>
      ipcRenderer.invoke('review:getNextCard'),

    submit: (data: ReviewSubmitDTO): Promise<ReviewResultDTO> =>
      ipcRenderer.invoke('review:submit', data),

    getDueCount: (): Promise<DueCountDTO> =>
      ipcRenderer.invoke('review:getDueCount'),
  },

  /**
   * Mastery operations - tracking learning progress
   */
  mastery: {
    getProfile: (): Promise<MasteryProfileDTO> =>
      ipcRenderer.invoke('mastery:getProfile'),

    getByDimension: (dimension: Dimension): Promise<MasteryDTO> =>
      ipcRenderer.invoke('mastery:getByDimension', dimension),
  },

  /**
   * Schedule operations - SRS scheduling
   */
  schedule: {
    getDue: (): Promise<ScheduleDTO[]> => ipcRenderer.invoke('schedule:getDue'),

    update: (data: UpdateScheduleDTO): Promise<ScheduleDTO> =>
      ipcRenderer.invoke('schedule:update', data),
  },

  /**
   * Settings operations - app configuration
   */
  settings: {
    get: (): Promise<SettingsDTO> => ipcRenderer.invoke('settings:get'),

    set: (data: Partial<SettingsDTO>): Promise<SettingsDTO> =>
      ipcRenderer.invoke('settings:set', data),

    testConnection: (config: LLMConfigDTO): Promise<ConnectionTestResultDTO> =>
      ipcRenderer.invoke('settings:testConnection', config),
  },
}

// -----------------------------------------------------------------------------
// Context Bridge Exposure
// -----------------------------------------------------------------------------

// Use `contextBridge` APIs to expose Electron APIs to renderer only if
// context isolation is enabled, otherwise add them to the DOM globals.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('Failed to expose APIs via contextBridge:', error)
  }
} else {
  // Fallback for non-isolated context (not recommended for production)
  // Types are declared in index.d.ts
  window.electron = electronAPI
  window.api = api
}

// -----------------------------------------------------------------------------
// Type Export (for external consumption)
// -----------------------------------------------------------------------------

export type ApiType = typeof api
