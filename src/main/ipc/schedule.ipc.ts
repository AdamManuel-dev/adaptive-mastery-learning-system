/**
 * @fileoverview IPC handlers for schedule operations
 * @lastmodified 2025-01-16T00:00:00Z
 *
 * Features: SRS schedule retrieval and updates
 * Main APIs: registerScheduleHandlers()
 * Constraints: Stub implementations until repository is connected
 * Patterns: Handler registration with error handling wrapper
 */

import { registerHandler, IPCError } from './index'

import type { ScheduleDTO, UpdateScheduleDTO } from '../../shared/types/ipc'

// -----------------------------------------------------------------------------
// Stub Data (to be replaced with repository calls)
// -----------------------------------------------------------------------------

const stubSchedules: ScheduleDTO[] = []

// -----------------------------------------------------------------------------
// Handlers
// -----------------------------------------------------------------------------

/**
 * Registers all schedule-related IPC handlers
 */
export function registerScheduleHandlers(): void {
  // Get all due schedules
  registerHandler('schedule:getDue', () => {
    // TODO: Replace with repository call
    // return scheduleRepository.findDue()

    const now = new Date().toISOString()
    return stubSchedules.filter((s) => s.dueAt <= now)
  })

  // Update a schedule
  registerHandler('schedule:update', (_event, data: UpdateScheduleDTO) => {
    // TODO: Replace with repository call
    // return scheduleRepository.update(data)

    const index = stubSchedules.findIndex((s) => s.conceptId === data.conceptId)

    if (index === -1) {
      // Create new schedule if it doesn't exist
      const schedule: ScheduleDTO = {
        conceptId: data.conceptId,
        dueAt: data.dueAt ?? new Date().toISOString(),
        intervalDays: data.intervalDays ?? 1,
        ease: data.ease ?? 2.5,
      }
      stubSchedules.push(schedule)
      return schedule
    }

    const existing = stubSchedules[index]
    if (!existing) {
      throw new IPCError(
        'NOT_FOUND',
        `Schedule for concept ${data.conceptId} not found`
      )
    }

    const updated: ScheduleDTO = {
      ...existing,
      dueAt: data.dueAt ?? existing.dueAt,
      intervalDays: data.intervalDays ?? existing.intervalDays,
      ease: data.ease ?? existing.ease,
    }

    stubSchedules[index] = updated
    return updated
  })
}
