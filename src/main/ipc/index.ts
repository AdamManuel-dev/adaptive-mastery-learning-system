/**
 * @fileoverview IPC handler registration and error handling
 * @lastmodified 2025-01-16T00:00:00Z
 *
 * Features: Central IPC registration, error handling wrapper, logging
 * Main APIs: registerIPCHandlers(), wrapHandler()
 * Constraints: All handlers must be wrapped for consistent error handling
 * Patterns: Decorator pattern for error handling, grouped handler registration
 */

import { ipcMain, type IpcMainInvokeEvent } from 'electron'

import { registerAnalyticsHandlers } from './analytics.ipc'
import { registerConceptHandlers } from './concept.ipc'
import { registerEvaluationHandlers } from './evaluation.ipc'
import { registerMasteryHandlers } from './mastery.ipc'
import { registerReviewHandlers } from './review.ipc'
import { registerScheduleHandlers } from './schedule.ipc'
import { registerSettingsHandlers } from './settings.ipc'
import { registerVariantHandlers } from './variant.ipc'

import type { IPCChannelName, IPCArgs, IPCResult } from '../../shared/types/ipc'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/**
 * Handler function type for IPC channels
 */
type IPCHandler<T extends IPCChannelName> = (
  event: IpcMainInvokeEvent,
  args: IPCArgs<T>
) => Promise<IPCResult<T>> | IPCResult<T>

/**
 * IPC error class for structured error handling
 */
export class IPCError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'IPCError'
  }
}

// -----------------------------------------------------------------------------
// Handler Utilities
// -----------------------------------------------------------------------------

/**
 * Wraps an IPC handler with error handling and logging.
 * Catches errors and formats them consistently.
 */
export function wrapHandler<T extends IPCChannelName>(
  channel: T,
  handler: IPCHandler<T>
): (event: IpcMainInvokeEvent, args: IPCArgs<T>) => Promise<IPCResult<T>> {
  return async (event, args) => {
    const startTime = Date.now()

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[IPC] ${channel} called`, args !== undefined ? args : '')
      }

      const result = await handler(event, args)

      if (process.env.NODE_ENV === 'development') {
        const duration = Date.now() - startTime
        console.log(`[IPC] ${channel} completed in ${duration}ms`)
      }

      return result
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`[IPC] ${channel} failed after ${duration}ms:`, error)

      // Re-throw IPCErrors as-is for structured error handling
      if (error instanceof IPCError) {
        throw error
      }

      // Wrap unknown errors
      throw new IPCError(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Unknown error',
        error
      )
    }
  }
}

/**
 * Registers an IPC handler with automatic error handling
 */
export function registerHandler<T extends IPCChannelName>(
  channel: T,
  handler: IPCHandler<T>
): void {
  ipcMain.handle(channel, wrapHandler(channel, handler))
}

// -----------------------------------------------------------------------------
// Handler Registration
// -----------------------------------------------------------------------------

/**
 * Registers all IPC handlers.
 * Called once during app initialization.
 */
export function registerIPCHandlers(): void {
  console.log('[IPC] Registering handlers...')

  // Register domain-specific handlers
  registerAnalyticsHandlers()
  registerConceptHandlers()
  registerVariantHandlers()
  registerReviewHandlers()
  registerMasteryHandlers()
  registerScheduleHandlers()
  registerSettingsHandlers()
  registerEvaluationHandlers()

  console.log('[IPC] All handlers registered')
}
