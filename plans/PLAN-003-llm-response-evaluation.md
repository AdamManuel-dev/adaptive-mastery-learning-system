# PLAN-003: LLM-Judged Open Response Evaluation

**Status:** Ready for Implementation
**Priority:** P2/Medium-High
**Complexity:** Extra Large (14-18 hours)
**Phase:** 5.4 (New - Advanced Evaluation)

---

## Executive Summary

This plan adds **open-ended response questions** where users type free-text answers that are **evaluated by an LLM** for correctness, completeness, and understanding. This provides more authentic assessment than multiple choice while maintaining objective scoring.

---

## Current State Analysis

### Existing Infrastructure

| Component | Status | Gap |
|-----------|--------|-----|
| LLM Generator | Complete | Needs evaluation mode |
| Review submission | Accepts rating only | Needs response text |
| Events table | Logs result | Needs user_response column |
| Mastery calculation | Uses self-report | Needs LLM score integration |
| UI | Flashcard only | Needs text input |

### Why LLM Evaluation?

| Approach | Pros | Cons |
|----------|------|------|
| Exact match | Simple, fast | Too strict, misses valid answers |
| Keyword matching | Somewhat flexible | Misses semantic equivalence |
| Self-report | Easy to implement | User may over/underestimate |
| **LLM evaluation** | **Semantic understanding** | API cost, latency |

---

## Proposed Architecture

### New Question Type

```typescript
type QuestionType =
  | 'flashcard'
  | 'multiple_choice'
  | 'multi_select'
  | 'true_false'
  | 'open_response'  // NEW
```

### Open Response Variant Structure

```typescript
interface OpenResponseVariant extends VariantDTO {
  questionType: 'open_response'
  front: string              // The question/prompt
  back: string               // Reference/model answer
  rubric?: EvaluationRubric  // Scoring criteria
  maxLength?: number         // Character limit
}

interface EvaluationRubric {
  keyPoints: string[]        // Must-mention concepts
  acceptableVariations: string[]  // Alternative phrasings
  partialCreditCriteria: string   // Instructions for partial credit
}
```

### Evaluation Flow

```
User submits response
        │
        ▼
┌───────────────────┐
│ LLM Evaluator     │
│ ├─ Compare to     │
│ │  model answer   │
│ ├─ Check key      │
│ │  points covered │
│ ├─ Assess         │
│ │  understanding  │
│ └─ Generate score │
│    + feedback     │
└───────┬───────────┘
        │
        ▼
┌───────────────────┐
│ Evaluation Result │
│ ├─ score: 0-1     │
│ ├─ feedback: str  │
│ ├─ keyPoints:     │
│ │  covered/missed │
│ └─ confidence:    │
│    0-1            │
└───────────────────┘
        │
        ▼
Update mastery using
weighted score
```

---

## Implementation Plan

### Phase 1: Database Schema (1 hour)

#### Task 1.1: Add Migration

**File:** `src/main/infrastructure/database/migrations/004_open_response.ts`

```typescript
/**
 * @fileoverview Migration to add open response support
 * @lastmodified [DATE]
 *
 * Changes:
 * - Add rubric column to variants (JSON)
 * - Add max_length column to variants
 * - Add user_response column to events (TEXT)
 * - Add llm_score column to events (REAL)
 * - Add llm_feedback column to events (TEXT)
 * - Add evaluation_confidence column to events (REAL)
 */

import type { Database } from 'better-sqlite3'

export function up(db: Database): void {
  // Variants table updates
  db.exec(`
    ALTER TABLE variants ADD COLUMN rubric TEXT DEFAULT NULL;
    ALTER TABLE variants ADD COLUMN max_length INTEGER DEFAULT NULL;
  `)

  // Events table updates for response tracking
  db.exec(`
    ALTER TABLE events ADD COLUMN user_response TEXT DEFAULT NULL;
    ALTER TABLE events ADD COLUMN llm_score REAL DEFAULT NULL;
    ALTER TABLE events ADD COLUMN llm_feedback TEXT DEFAULT NULL;
    ALTER TABLE events ADD COLUMN evaluation_confidence REAL DEFAULT NULL;
  `)

  // Update question_type CHECK constraint (if column exists from PLAN-002)
  // Note: SQLite doesn't support modifying CHECK constraints, so we rely on application validation
}

export function down(db: Database): void {
  throw new Error('This migration cannot be rolled back')
}
```

---

### Phase 2: Type Definitions (1 hour)

#### Task 2.1: Add Evaluation Types

**File:** `src/shared/types/ipc.ts`

```typescript
/**
 * Rubric for LLM evaluation of open responses
 */
export interface EvaluationRubric {
  /** Key points that should be mentioned */
  keyPoints: string[]
  /** Alternative acceptable phrasings */
  acceptableVariations?: string[]
  /** Instructions for partial credit */
  partialCreditCriteria?: string
}

/**
 * Result from LLM evaluation of an open response
 */
export interface LLMEvaluationResult {
  /** Overall score 0.0 to 1.0 */
  score: number
  /** Human-readable feedback for the user */
  feedback: string
  /** Which key points were covered */
  keyPointsCovered: string[]
  /** Which key points were missed */
  keyPointsMissed: string[]
  /** LLM's confidence in the evaluation (0.0 to 1.0) */
  confidence: number
  /** Suggested user rating based on score */
  suggestedRating: Rating
  /** Whether the response demonstrated understanding */
  demonstratesUnderstanding: boolean
}

/**
 * Request to evaluate an open response
 */
export interface EvaluationRequest {
  /** The question that was asked */
  question: string
  /** The model/reference answer */
  modelAnswer: string
  /** The user's response to evaluate */
  userResponse: string
  /** Evaluation rubric with key points */
  rubric?: EvaluationRubric
  /** The concept being tested */
  conceptName: string
  /** The dimension being tested */
  dimension: Dimension
}

/**
 * Updated ReviewSubmitDTO with open response support
 */
export interface ReviewSubmitDTO {
  variantId: string
  conceptId: string
  dimension: Dimension
  rating: Rating
  timeMs: number
  selectedAnswerIndices?: number[]  // For MC/multi-select
  userResponse?: string             // NEW: For open response
}

/**
 * Updated ReviewResultDTO with evaluation feedback
 */
export interface ReviewResultDTO {
  updatedMastery: MasteryDTO
  updatedSchedule: ScheduleDTO
  nextCard: ReviewCardDTO | null

  // Evaluation feedback
  wasCorrect?: boolean
  correctAnswers?: number[]
  partialScore?: number
  explanation?: string

  // NEW: Open response feedback
  evaluation?: LLMEvaluationResult
}
```

---

### Phase 3: LLM Evaluator Service (4 hours)

#### Task 3.1: Create Evaluation Prompts

**File:** `src/main/infrastructure/llm/evaluation-prompts.ts` (new file)

```typescript
/**
 * @fileoverview Prompt templates for LLM-based response evaluation
 * @lastmodified [DATE]
 *
 * Features: Evaluation prompt construction, rubric integration
 * Main APIs: buildEvaluationPrompt, EVALUATION_SYSTEM_PROMPT
 */

import type { Dimension, EvaluationRubric } from '../../../shared/types/ipc'

export const EVALUATION_SYSTEM_PROMPT = `You are an expert educational evaluator assessing student responses to learning questions.

Your role is to:
1. Compare the student's response to the model answer
2. Identify which key concepts were correctly addressed
3. Provide constructive, encouraging feedback
4. Assign a fair score considering partial understanding

Guidelines:
- Be generous with semantically equivalent answers (different words, same meaning)
- Give partial credit for incomplete but correct information
- Penalize factual errors more than missing information
- Consider the cognitive dimension being tested
- Provide actionable feedback for improvement

You must respond with valid JSON only.`

export function buildEvaluationPrompt(
  question: string,
  modelAnswer: string,
  userResponse: string,
  conceptName: string,
  dimension: Dimension,
  rubric?: EvaluationRubric
): string {
  const dimensionContext = getDimensionContext(dimension)

  let rubricSection = ''
  if (rubric) {
    rubricSection = `
## Evaluation Rubric

Key points that should be addressed:
${rubric.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

${rubric.acceptableVariations?.length ? `
Acceptable alternative phrasings:
${rubric.acceptableVariations.map(v => `- ${v}`).join('\n')}
` : ''}

${rubric.partialCreditCriteria ? `
Partial credit guidance:
${rubric.partialCreditCriteria}
` : ''}
`
  }

  return `## Evaluation Task

**Concept:** ${conceptName}
**Dimension:** ${dimension} (${dimensionContext})

**Question:**
${question}

**Model Answer:**
${modelAnswer}

**Student Response:**
${userResponse}

${rubricSection}

## Instructions

Evaluate the student's response and return JSON:

{
  "score": <number 0.0-1.0>,
  "feedback": "<constructive feedback string>",
  "keyPointsCovered": ["list", "of", "covered", "points"],
  "keyPointsMissed": ["list", "of", "missed", "points"],
  "confidence": <number 0.0-1.0 how confident you are>,
  "demonstratesUnderstanding": <boolean>
}

Scoring guide:
- 0.0-0.2: Completely incorrect or irrelevant
- 0.2-0.4: Major misconceptions with some relevant content
- 0.4-0.6: Partially correct, missing key elements
- 0.6-0.8: Mostly correct, minor gaps or imprecision
- 0.8-1.0: Excellent, demonstrates strong understanding`
}

function getDimensionContext(dimension: Dimension): string {
  const contexts: Record<Dimension, string> = {
    definition: 'Testing recall of the concept definition',
    paraphrase: 'Testing ability to recognize rephrased versions',
    example: 'Testing ability to classify examples correctly',
    scenario: 'Testing application to real-world situations',
    discrimination: 'Testing ability to distinguish from similar concepts',
    cloze: 'Testing gap-filling ability',
  }
  return contexts[dimension]
}
```

#### Task 3.2: Create LLM Evaluator Adapter

**File:** `src/main/infrastructure/llm/evaluator.ts` (new file)

```typescript
/**
 * @fileoverview LLM-based response evaluator for open-ended questions
 * @lastmodified [DATE]
 *
 * Features: Response evaluation, rubric-based scoring, confidence estimation
 * Main APIs: OpenAIEvaluator, createEvaluator
 * Constraints: Requires OpenAI API key
 * Patterns: Hexagonal architecture adapter
 */

import OpenAI from 'openai'
import { LLMAPIError, LLMConfigurationError, LLMValidationError } from './errors'
import { EVALUATION_SYSTEM_PROMPT, buildEvaluationPrompt } from './evaluation-prompts'
import type { EvaluationRequest, LLMEvaluationResult, Rating } from '../../../shared/types/ipc'
import type { LLMConfig, LLMResult } from './types'

export interface LLMEvaluator {
  evaluateResponse(request: EvaluationRequest): Promise<LLMResult<LLMEvaluationResult>>
}

/**
 * OpenAI-based response evaluator
 */
export class OpenAIEvaluator implements LLMEvaluator {
  private readonly client: OpenAI
  private readonly model: string

  constructor(config: LLMConfig) {
    const apiKey = config.apiKey ?? process.env.OPENAI_API_KEY ?? ''

    if (apiKey === '') {
      throw new LLMConfigurationError(
        'OpenAI API key required for evaluation',
        ['apiKey']
      )
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: config.baseUrl,
      timeout: config.timeoutMs ?? 30000,
    })

    this.model = config.model
  }

  async evaluateResponse(
    request: EvaluationRequest
  ): Promise<LLMResult<LLMEvaluationResult>> {
    const prompt = buildEvaluationPrompt(
      request.question,
      request.modelAnswer,
      request.userResponse,
      request.conceptName,
      request.dimension,
      request.rubric
    )

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: EVALUATION_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3, // Lower temperature for more consistent evaluation
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      })

      const content = completion.choices[0]?.message?.content ?? ''

      if (content === '') {
        return {
          success: false,
          error: new LLMAPIError('Empty evaluation response', 'openai', {}),
        }
      }

      const parsed = this.parseEvaluationResponse(content)
      return { success: true, value: parsed }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    }
  }

  private parseEvaluationResponse(content: string): LLMEvaluationResult {
    let parsed: unknown
    try {
      parsed = JSON.parse(content)
    } catch {
      throw new LLMValidationError('Failed to parse evaluation JSON', { rawResponse: content })
    }

    const obj = parsed as Record<string, unknown>

    // Validate required fields
    if (typeof obj.score !== 'number' || obj.score < 0 || obj.score > 1) {
      throw new LLMValidationError('Invalid score in evaluation', { rawResponse: content })
    }

    const score = obj.score
    const feedback = typeof obj.feedback === 'string' ? obj.feedback : 'No feedback provided'
    const keyPointsCovered = Array.isArray(obj.keyPointsCovered) ? obj.keyPointsCovered : []
    const keyPointsMissed = Array.isArray(obj.keyPointsMissed) ? obj.keyPointsMissed : []
    const confidence = typeof obj.confidence === 'number' ? obj.confidence : 0.7
    const demonstratesUnderstanding = typeof obj.demonstratesUnderstanding === 'boolean'
      ? obj.demonstratesUnderstanding
      : score >= 0.5

    // Map score to suggested rating
    const suggestedRating = this.scoreToRating(score)

    return {
      score,
      feedback,
      keyPointsCovered,
      keyPointsMissed,
      confidence,
      suggestedRating,
      demonstratesUnderstanding,
    }
  }

  private scoreToRating(score: number): Rating {
    if (score >= 0.9) return 'easy'
    if (score >= 0.7) return 'good'
    if (score >= 0.4) return 'hard'
    return 'again'
  }
}

export function createEvaluatorFromEnv(): OpenAIEvaluator {
  return new OpenAIEvaluator({
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    baseUrl: process.env.OPENAI_BASE_URL,
    timeoutMs: 30000,
    maxRetries: 2,
  })
}
```

---

### Phase 4: Review Flow Integration (3 hours)

#### Task 4.1: Create Evaluation IPC Handler

**File:** `src/main/ipc/evaluation.ipc.ts` (new file)

```typescript
/**
 * @fileoverview IPC handlers for LLM-based response evaluation
 * @lastmodified [DATE]
 */

import { ipcMain } from 'electron'
import { createEvaluatorFromEnv } from '../infrastructure/llm/evaluator'
import type { EvaluationRequest, LLMEvaluationResult } from '../../shared/types/ipc'

// Add to IPCChannels
// 'evaluation:evaluate': { args: EvaluationRequest; result: LLMEvaluationResult }

export function registerEvaluationHandlers(): void {
  ipcMain.handle(
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
```

#### Task 4.2: Update Review Submit Handler

**File:** `src/main/ipc/review.ipc.ts`

```typescript
import { createEvaluatorFromEnv } from '../infrastructure/llm/evaluator'

ipcMain.handle('review:submit', async (_event, dto: ReviewSubmitDTO) => {
  const variant = await variantRepository.getById(dto.variantId)
  const concept = await conceptRepository.getById(dto.conceptId)

  let evaluation: LLMEvaluationResult | undefined
  let accuracyScore: number

  if (variant.questionType === 'open_response' && dto.userResponse) {
    // Evaluate open response with LLM
    const evaluator = createEvaluatorFromEnv()

    const evalRequest: EvaluationRequest = {
      question: variant.front,
      modelAnswer: variant.back,
      userResponse: dto.userResponse,
      conceptName: concept.name,
      dimension: dto.dimension,
      rubric: variant.rubric,
    }

    const result = await evaluator.evaluateResponse(evalRequest)

    if (result.success) {
      evaluation = result.value
      accuracyScore = evaluation.score

      // Weight by confidence for mastery calculation
      // Lower confidence = move score toward 0.5 (neutral)
      const confidenceWeighted = 0.5 + (evaluation.score - 0.5) * evaluation.confidence
      accuracyScore = confidenceWeighted
    } else {
      // Fallback to self-report if evaluation fails
      console.error('LLM evaluation failed:', result.error)
      accuracyScore = ratingToScore(dto.rating)
    }

    // Log event with evaluation data
    await eventRepository.insert({
      conceptId: dto.conceptId,
      variantId: dto.variantId,
      dimension: dto.dimension,
      difficulty: variant.difficulty,
      result: evaluation?.suggestedRating ?? dto.rating,
      timeMs: dto.timeMs,
      hintsUsed: 0,
      userResponse: dto.userResponse,
      llmScore: evaluation?.score ?? null,
      llmFeedback: evaluation?.feedback ?? null,
      evaluationConfidence: evaluation?.confidence ?? null,
    })
  } else if (variant.questionType !== 'flashcard' && dto.selectedAnswerIndices) {
    // Handle MC/multi-select (from PLAN-002)
    // ... existing objective evaluation
  } else {
    // Flashcards use self-reported rating
    accuracyScore = ratingToScore(dto.rating)

    await eventRepository.insert({
      conceptId: dto.conceptId,
      variantId: dto.variantId,
      dimension: dto.dimension,
      difficulty: variant.difficulty,
      result: dto.rating,
      timeMs: dto.timeMs,
      hintsUsed: 0,
      userResponse: null,
      llmScore: null,
      llmFeedback: null,
      evaluationConfidence: null,
    })
  }

  // Update mastery with objective/evaluated score
  const updatedMastery = await masteryService.updateMastery(
    dto.dimension,
    accuracyScore,
    dto.timeMs,
    variant.difficulty
  )

  // Update schedule
  const updatedSchedule = await schedulerService.updateSchedule(
    dto.conceptId,
    evaluation?.suggestedRating ?? dto.rating
  )

  // Get next card
  const nextCard = await cardSelector.selectNext()

  return {
    updatedMastery,
    updatedSchedule,
    nextCard,
    evaluation,  // Include full evaluation feedback
  }
})
```

---

### Phase 5: Review UI for Open Response (3 hours)

#### Task 5.1: Create OpenResponseCard Component

**File:** `src/renderer/components/review/OpenResponseCard.tsx` (new file)

```tsx
/**
 * @fileoverview Open response card component with text input and LLM evaluation
 * @lastmodified [DATE]
 */

import React, { useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  LinearProgress,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import type { LLMEvaluationResult } from '../../../shared/types/ipc'

interface OpenResponseCardProps {
  question: string
  maxLength?: number
  onSubmit: (response: string) => Promise<void>
  evaluation?: LLMEvaluationResult
  modelAnswer?: string
  isEvaluating?: boolean
}

export function OpenResponseCard({
  question,
  maxLength,
  onSubmit,
  evaluation,
  modelAnswer,
  isEvaluating,
}: OpenResponseCardProps) {
  const [response, setResponse] = useState('')

  const handleSubmit = async () => {
    if (response.trim()) {
      await onSubmit(response)
    }
  }

  const scoreColor = evaluation
    ? evaluation.score >= 0.7 ? 'success'
      : evaluation.score >= 0.4 ? 'warning'
        : 'error'
    : 'primary'

  return (
    <Card sx={{ maxWidth: 700, mx: 'auto', mt: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {question}
        </Typography>

        {!evaluation && (
          <>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={response}
              onChange={(e) => setResponse(e.target.value.slice(0, maxLength))}
              placeholder="Type your answer here..."
              disabled={isEvaluating}
              sx={{ mt: 2 }}
            />

            {maxLength && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {response.length} / {maxLength} characters
              </Typography>
            )}

            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!response.trim() || isEvaluating}
              sx={{ mt: 2 }}
              fullWidth
            >
              {isEvaluating ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Evaluating...
                </>
              ) : (
                'Submit Answer'
              )}
            </Button>
          </>
        )}

        {evaluation && (
          <Box sx={{ mt: 2 }}>
            {/* Score display */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" color={`${scoreColor}.main`} sx={{ mr: 2 }}>
                {Math.round(evaluation.score * 100)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={evaluation.score * 100}
                color={scoreColor}
                sx={{ flexGrow: 1, height: 10, borderRadius: 1 }}
              />
            </Box>

            {/* Feedback */}
            <Alert
              severity={evaluation.demonstratesUnderstanding ? 'success' : 'info'}
              sx={{ mb: 2 }}
            >
              {evaluation.feedback}
            </Alert>

            {/* Key points */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Key Points:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {evaluation.keyPointsCovered.map((point, i) => (
                  <Chip
                    key={`covered-${i}`}
                    icon={<CheckCircleIcon />}
                    label={point}
                    color="success"
                    size="small"
                  />
                ))}
                {evaluation.keyPointsMissed.map((point, i) => (
                  <Chip
                    key={`missed-${i}`}
                    icon={<CancelIcon />}
                    label={point}
                    color="error"
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>

            {/* Show model answer */}
            {modelAnswer && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>Model Answer:</Typography>
                <Typography variant="body2" color="text.secondary">
                  {modelAnswer}
                </Typography>
              </>
            )}

            {/* Confidence indicator */}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Evaluation confidence: {Math.round(evaluation.confidence * 100)}%
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
```

#### Task 5.2: Update ReviewPage for Open Response

**File:** `src/renderer/pages/ReviewPage.tsx`

```tsx
import { OpenResponseCard } from '../components/review/OpenResponseCard'

// Add state
const [isEvaluating, setIsEvaluating] = useState(false)
const [evaluationResult, setEvaluationResult] = useState<LLMEvaluationResult | null>(null)

// Update render logic
function renderCard(card: ReviewCardDTO) {
  const { variant } = card

  switch (variant.questionType) {
    case 'open_response':
      return (
        <OpenResponseCard
          question={variant.front}
          maxLength={variant.maxLength}
          modelAnswer={evaluationResult ? variant.back : undefined}
          onSubmit={handleOpenResponseSubmit}
          evaluation={evaluationResult ?? undefined}
          isEvaluating={isEvaluating}
        />
      )

    // ... other cases
  }
}

// New handler
const handleOpenResponseSubmit = async (userResponse: string) => {
  setIsEvaluating(true)

  try {
    const result = await api.invoke('review:submit', {
      variantId: currentCard.variant.id,
      conceptId: currentCard.concept.id,
      dimension: currentCard.variant.dimension,
      rating: 'good', // Placeholder, will be set by evaluation
      timeMs: responseTime,
      userResponse,
    })

    setEvaluationResult(result.evaluation ?? null)

    // Auto-advance after viewing feedback
    setTimeout(() => {
      setEvaluationResult(null)
      setIsEvaluating(false)
      setCurrentCard(result.nextCard)
    }, 5000) // Longer delay to read feedback
  } catch (error) {
    console.error('Evaluation failed:', error)
    setIsEvaluating(false)
    // Show error and allow retry
  }
}
```

---

### Phase 6: Variant Editor for Open Response (2 hours)

#### Task 6.1: Add Open Response Fields to Editor

**File:** `src/renderer/components/VariantEditor.tsx`

```tsx
// Add to question type options
<MenuItem value="open_response">Open Response (LLM-evaluated)</MenuItem>

// Add rubric editor when open_response selected
{questionType === 'open_response' && (
  <Box sx={{ mt: 2 }}>
    <Typography variant="subtitle2" gutterBottom>
      Evaluation Rubric
    </Typography>

    <TextField
      fullWidth
      margin="normal"
      label="Model Answer"
      multiline
      rows={3}
      value={back}
      onChange={(e) => setBack(e.target.value)}
      helperText="The ideal/reference answer for comparison"
    />

    <KeyPointsEditor
      keyPoints={rubric?.keyPoints ?? []}
      onChange={(points) => setRubric({ ...rubric, keyPoints: points })}
    />

    <TextField
      fullWidth
      margin="normal"
      label="Partial Credit Criteria"
      multiline
      rows={2}
      value={rubric?.partialCreditCriteria ?? ''}
      onChange={(e) => setRubric({ ...rubric, partialCreditCriteria: e.target.value })}
      helperText="Instructions for how to award partial credit"
    />

    <TextField
      fullWidth
      margin="normal"
      label="Maximum Response Length"
      type="number"
      value={maxLength ?? ''}
      onChange={(e) => setMaxLength(e.target.value ? parseInt(e.target.value) : undefined)}
      helperText="Character limit for student response (optional)"
    />
  </Box>
)}
```

#### Task 6.2: Create KeyPointsEditor Component

**File:** `src/renderer/components/KeyPointsEditor.tsx` (new file)

```tsx
/**
 * @fileoverview Editor for rubric key points
 */

import React from 'react'
import { Box, TextField, IconButton, Button, Typography } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'

interface KeyPointsEditorProps {
  keyPoints: string[]
  onChange: (points: string[]) => void
}

export function KeyPointsEditor({ keyPoints, onChange }: KeyPointsEditorProps) {
  const addPoint = () => {
    onChange([...keyPoints, ''])
  }

  const removePoint = (index: number) => {
    onChange(keyPoints.filter((_, i) => i !== index))
  }

  const updatePoint = (index: number, value: string) => {
    const updated = [...keyPoints]
    updated[index] = value
    onChange(updated)
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Key Points (concepts that must be mentioned)
      </Typography>

      {keyPoints.map((point, index) => (
        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <TextField
            value={point}
            onChange={(e) => updatePoint(index, e.target.value)}
            placeholder={`Key point ${index + 1}`}
            size="small"
            sx={{ flexGrow: 1, mr: 1 }}
          />
          <IconButton onClick={() => removePoint(index)} size="small">
            <DeleteIcon />
          </IconButton>
        </Box>
      ))}

      <Button startIcon={<AddIcon />} onClick={addPoint} size="small">
        Add Key Point
      </Button>
    </Box>
  )
}
```

---

### Phase 7: LLM Generation for Open Response (2 hours)

#### Task 7.1: Add Open Response Generation Prompt

**File:** `src/main/infrastructure/llm/prompts.ts`

```typescript
export const OPEN_RESPONSE_GENERATION_PROMPT = `
Generate an open-ended question to test deep understanding of the concept.

Requirements:
- Question should require explanation, not just recall
- Student must demonstrate understanding, not memorization
- Question should have a clear model answer
- Identify 3-5 key points that should be covered in a good answer

Return JSON:
{
  "front": "open-ended question requiring explanation",
  "back": "comprehensive model answer (2-4 sentences)",
  "rubric": {
    "keyPoints": [
      "first key concept that must be addressed",
      "second key concept",
      "third key concept"
    ],
    "partialCreditCriteria": "Give partial credit if student mentions X without Y..."
  },
  "maxLength": 500
}

The question should:
- Start with "Explain...", "Describe...", "Why...", or "How..."
- Require synthesis of knowledge, not just facts
- Have measurable criteria for evaluation
`

// Add to QUESTION_TYPE_PROMPTS
open_response: OPEN_RESPONSE_GENERATION_PROMPT,
```

---

## Testing Plan

### Unit Tests

| Test Case | Expected |
|-----------|----------|
| Evaluate perfect response | score >= 0.9, all key points covered |
| Evaluate partial response | 0.4 <= score < 0.9, some key points |
| Evaluate wrong response | score < 0.4, demonstrates not understanding |
| Handle empty response | score = 0, appropriate feedback |
| Confidence weighting | Lower confidence moves score toward 0.5 |

### Integration Tests

| Scenario | Expected |
|----------|----------|
| Submit open response | LLM evaluates and returns score |
| Evaluation failure fallback | Uses self-report rating |
| Mastery updates | Uses confidence-weighted score |
| Event logging | Stores response, score, feedback |

### Manual Testing

| Scenario | Check |
|----------|-------|
| Various answer qualities | Scores make sense |
| Feedback helpfulness | Constructive and accurate |
| Key points accuracy | Correctly identified coverage |
| UI responsiveness | Loading states work |

---

## Success Criteria

- [ ] Can create open response variants with rubric
- [ ] Review UI shows text input for open response
- [ ] LLM evaluates responses and returns score
- [ ] Feedback shows key points covered/missed
- [ ] Model answer revealed after evaluation
- [ ] Mastery calculation uses LLM score
- [ ] Confidence weighting applied to scoring
- [ ] Event logs include response and evaluation
- [ ] Error handling when LLM fails
- [ ] LLM can generate open response questions

---

## Cost Analysis

| Operation | Tokens (est.) | Cost (GPT-4o-mini) |
|-----------|---------------|---------------------|
| Evaluation | ~500-800 | ~$0.0003 per |
| 25 reviews/session | 12,500-20,000 | ~$0.0075/session |
| 100 reviews/day | 50,000-80,000 | ~$0.03/day |
| Monthly (heavy user) | 1.5M-2.4M | ~$0.90/month |

**Recommendation:** Use caching and confidence thresholds to reduce API calls.

---

## Estimated Timeline

| Task | Duration |
|------|----------|
| Database migration | 1 hour |
| Type definitions | 1 hour |
| Evaluation prompts | 1 hour |
| Evaluator adapter | 3 hours |
| Review flow integration | 2 hours |
| Review UI component | 3 hours |
| Variant editor | 2 hours |
| LLM generation prompt | 1 hour |
| Testing | 2 hours |
| **Total** | **16 hours** |

---

## Future Enhancements

1. **Caching:** Cache similar responses to reduce API calls
2. **Confidence threshold:** Only call LLM if self-report differs significantly
3. **Batch evaluation:** Evaluate multiple responses in one call
4. **Human review queue:** Flag low-confidence evaluations for review
5. **Evaluation analytics:** Track LLM accuracy over time
6. **Custom rubric templates:** Pre-built rubrics for common question types

---

## Rollback Plan

1. Migration adds columns only (non-destructive)
2. Open response variants become flashcards if feature disabled
3. Events with evaluation data still valid
4. Can disable LLM evaluation via feature flag
