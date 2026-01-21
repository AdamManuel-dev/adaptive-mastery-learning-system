/**
 * @fileoverview IPC handlers for LLM-based response evaluation
 * @lastmodified 2026-01-20T00:00:00Z
 *
 * Features: Standalone evaluation endpoint for open response questions
 * Main APIs: registerEvaluationHandlers()
 * Constraints: Requires OpenAI API key configured
 * Patterns: Handler registration with error handling wrapper
 */

import { createEvaluatorFromEnv } from '../infrastructure/llm/evaluator'

import { registerHandler } from './index'

import type { EvaluationRequest, LLMEvaluationResult } from '../../shared/types/ipc'

/**
 * Registers all evaluation-related IPC handlers
 */
export function registerEvaluationHandlers(): void {
  // Evaluate an open response using LLM
  registerHandler(
    'evaluation:evaluate',
    async (_event, request: EvaluationRequest): Promise<LLMEvaluationResult> => {
      const evaluator = createEvaluatorFromEnv()
      const result = await evaluator.evaluateResponse(request)

      if (!result.success) {
        throw result.error
      }

      return result.value
    }
  )
}
