/**
 * @fileoverview TypeScript declarations for window.api exposed by preload
 * @lastmodified 2026-01-17T00:42:25Z
 *
 * Features: Type declarations for renderer-accessible API
 * Main APIs: window.api, window.electron, AnalyticsAPI
 * Constraints: Must match preload/index.ts API structure exactly
 * Patterns: Interface augmentation of Window global
 */

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
  MasteryTimelineEntryDTO,
  ReviewDistributionEntryDTO,
  ResponseTimeStatsEntryDTO,
  WeaknessHeatmapEntryDTO,
} from '../shared/types/ipc'
import type { ElectronAPI } from '@electron-toolkit/preload'

/**
 * API for concept operations
 */
interface ConceptsAPI {
  /** Get all concepts */
  getAll(): Promise<ConceptDTO[]>
  /** Get a concept by ID */
  getById(id: string): Promise<ConceptDTO | null>
  /** Create a new concept */
  create(data: CreateConceptDTO): Promise<ConceptDTO>
  /** Update an existing concept */
  update(data: UpdateConceptDTO): Promise<ConceptDTO>
  /** Delete a concept by ID */
  delete(id: string): Promise<void>
}

/**
 * API for variant operations
 */
interface VariantsAPI {
  /** Get all variants for a concept */
  getByConceptId(conceptId: string): Promise<VariantDTO[]>
  /** Create a new variant */
  create(data: CreateVariantDTO): Promise<VariantDTO>
  /** Update an existing variant */
  update(data: UpdateVariantDTO): Promise<VariantDTO>
  /** Delete a variant by ID */
  delete(id: string): Promise<void>
}

/**
 * API for review operations
 */
interface ReviewAPI {
  /** Get the next card due for review */
  getNextCard(): Promise<ReviewCardDTO | null>
  /** Submit a review result */
  submit(data: ReviewSubmitDTO): Promise<ReviewResultDTO>
  /** Get count of due cards */
  getDueCount(): Promise<DueCountDTO>
}

/**
 * API for mastery operations
 */
interface MasteryAPI {
  /** Get the full mastery profile */
  getProfile(): Promise<MasteryProfileDTO>
  /** Get mastery for a specific dimension */
  getByDimension(dimension: Dimension): Promise<MasteryDTO>
}

/**
 * API for schedule operations
 */
interface ScheduleAPI {
  /** Get all due schedules */
  getDue(): Promise<ScheduleDTO[]>
  /** Update a schedule */
  update(data: UpdateScheduleDTO): Promise<ScheduleDTO>
}

/**
 * API for settings operations
 */
interface SettingsAPI {
  /** Get current settings */
  get(): Promise<SettingsDTO>
  /** Update settings */
  set(data: Partial<SettingsDTO>): Promise<SettingsDTO>
  /** Test LLM API connection */
  testConnection(config: LLMConfigDTO): Promise<ConnectionTestResultDTO>
}

/**
 * API for analytics operations
 */
interface AnalyticsAPI {
  /** Get mastery timeline data for the last N days */
  getMasteryTimeline(args: { days: number }): Promise<MasteryTimelineEntryDTO[]>
  /** Get review distribution statistics */
  getReviewDistribution(): Promise<ReviewDistributionEntryDTO[]>
  /** Get response time statistics */
  getResponseTimeStats(): Promise<ResponseTimeStatsEntryDTO[]>
  /** Get weakness heatmap data for the last N days */
  getWeaknessHeatmap(args: { days: number }): Promise<WeaknessHeatmapEntryDTO[]>
}

/**
 * The complete API object exposed to the renderer
 */
interface AppAPI {
  concepts: ConceptsAPI
  variants: VariantsAPI
  review: ReviewAPI
  mastery: MasteryAPI
  schedule: ScheduleAPI
  settings: SettingsAPI
  analytics: AnalyticsAPI
}

declare global {
  interface Window {
    /** Electron toolkit API */
    electron: ElectronAPI
    /** Application-specific API for IPC communication */
    api: AppAPI
  }
}

export {}
