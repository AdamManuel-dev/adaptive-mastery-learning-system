# PLAN-002: Multi-Select Question Type Support

**Status:** Ready for Implementation
**Priority:** P2/Medium
**Complexity:** Large (10-14 hours)
**Phase:** 5.3 (New - Advanced Question Types)

---

## Executive Summary

Currently, the FlashCards application only supports simple front/back flashcards with user self-reporting (again/hard/good/easy). This plan adds support for **multiple choice** and **multi-select** question types where the system can objectively evaluate user answers.

---

## Current State Analysis

### Existing Architecture

```
┌─────────────────────────────────────────┐
│ Current Variant Structure               │
├─────────────────────────────────────────┤
│ id: string                              │
│ conceptId: string                       │
│ dimension: Dimension                    │
│ difficulty: number (1-5)                │
│ front: string (question)                │
│ back: string (single answer)            │
│ hints: string[]                         │
└─────────────────────────────────────────┘
```

### Current Limitations

1. **No question type field** - All cards are treated as simple flashcards
2. **No answer options** - Cannot store multiple choice options
3. **No correct answer tracking** - User self-reports accuracy
4. **Review DTO only accepts rating** - No field for selected answers
5. **Mastery calculation assumes self-report** - No objective scoring

---

## Proposed Architecture

### New Question Types

| Type | Description | User Interaction | Scoring |
|------|-------------|------------------|---------|
| `flashcard` | Current default | View back, self-rate | Self-report |
| `multiple_choice` | Single correct answer from 4 options | Click one option | Automatic |
| `multi_select` | Multiple correct answers from options | Check multiple boxes | Automatic (partial credit) |
| `true_false` | Binary true/false | Click True or False | Automatic |

### Extended Variant Schema

```typescript
interface VariantDTO {
  // Existing fields
  id: string
  conceptId: string
  dimension: Dimension
  difficulty: number
  front: string
  back: string
  hints: string[]

  // NEW: Question type metadata
  questionType: QuestionType
  options?: AnswerOption[]        // For MC/multi-select
  correctAnswerIndices?: number[] // Which options are correct
  explanation?: string            // Why the answer is correct
}

type QuestionType = 'flashcard' | 'multiple_choice' | 'multi_select' | 'true_false'

interface AnswerOption {
  id: string
  text: string
  isCorrect: boolean
}
```

---

## Implementation Plan

### Phase 1: Database Schema Migration (2 hours)

#### Task 1.1: Create Migration File

**File:** `src/main/infrastructure/database/migrations/003_question_types.ts`

```typescript
/**
 * @fileoverview Migration to add question type support to variants table
 * @lastmodified [DATE]
 *
 * Changes:
 * - Add question_type column to variants (default: 'flashcard')
 * - Add options column (JSON array) for MC/multi-select
 * - Add correct_indices column (JSON array) for correct answers
 * - Add explanation column for answer explanations
 */

import type { Database } from 'better-sqlite3'

export function up(db: Database): void {
  // Add new columns to variants table
  db.exec(`
    ALTER TABLE variants ADD COLUMN question_type TEXT DEFAULT 'flashcard'
      CHECK (question_type IN ('flashcard', 'multiple_choice', 'multi_select', 'true_false'));

    ALTER TABLE variants ADD COLUMN options TEXT DEFAULT NULL;

    ALTER TABLE variants ADD COLUMN correct_indices TEXT DEFAULT NULL;

    ALTER TABLE variants ADD COLUMN explanation TEXT DEFAULT NULL;
  `)

  // Add user_answer column to events table for tracking actual selections
  db.exec(`
    ALTER TABLE events ADD COLUMN user_answer TEXT DEFAULT NULL;

    ALTER TABLE events ADD COLUMN was_correct INTEGER DEFAULT NULL;
  `)
}

export function down(db: Database): void {
  // SQLite doesn't support DROP COLUMN easily, so we'd need to recreate tables
  // For simplicity, this migration is one-way
  throw new Error('This migration cannot be rolled back')
}
```

#### Task 1.2: Update Repository Methods

**File:** `src/main/infrastructure/database/repositories/variant.repository.ts`

```typescript
// Update getById, getByConceptId to include new fields
// Update create, update to handle new fields

function mapRowToVariant(row: VariantRow): VariantDTO {
  return {
    // ... existing fields
    questionType: row.question_type || 'flashcard',
    options: row.options ? JSON.parse(row.options) : undefined,
    correctAnswerIndices: row.correct_indices ? JSON.parse(row.correct_indices) : undefined,
    explanation: row.explanation || undefined,
  }
}

function mapVariantToRow(variant: CreateVariantDTO): Partial<VariantRow> {
  return {
    // ... existing fields
    question_type: variant.questionType || 'flashcard',
    options: variant.options ? JSON.stringify(variant.options) : null,
    correct_indices: variant.correctAnswerIndices ? JSON.stringify(variant.correctAnswerIndices) : null,
    explanation: variant.explanation || null,
  }
}
```

---

### Phase 2: Type Definitions (1 hour)

#### Task 2.1: Update Shared Types

**File:** `src/shared/types/ipc.ts`

```typescript
/**
 * Question type for card variants
 */
export type QuestionType = 'flashcard' | 'multiple_choice' | 'multi_select' | 'true_false'

/**
 * Answer option for multiple choice / multi-select questions
 */
export interface AnswerOption {
  id: string
  text: string
  isCorrect: boolean
}

/**
 * Updated VariantDTO with question type support
 */
export interface VariantDTO {
  // Existing fields...
  id: string
  conceptId: string
  dimension: Dimension
  difficulty: number
  front: string
  back: string
  hints: string[]
  lastShownAt: string | null
  createdAt: string
  updatedAt: string

  // Question type fields
  questionType: QuestionType
  options?: AnswerOption[]
  correctAnswerIndices?: number[]
  explanation?: string
}

/**
 * Updated CreateVariantDTO
 */
export interface CreateVariantDTO {
  conceptId: string
  dimension: Dimension
  difficulty?: number
  front: string
  back: string
  hints?: string[]

  // Question type fields
  questionType?: QuestionType
  options?: AnswerOption[]
  correctAnswerIndices?: number[]
  explanation?: string
}

/**
 * Updated ReviewSubmitDTO with answer selection
 */
export interface ReviewSubmitDTO {
  variantId: string
  conceptId: string
  dimension: Dimension
  rating: Rating                    // User self-report (still used)
  timeMs: number

  // NEW: For MC/multi-select
  selectedAnswerIndices?: number[]  // Which options the user selected
}

/**
 * Review result with scoring information
 */
export interface ReviewResultDTO {
  updatedMastery: MasteryDTO
  updatedSchedule: ScheduleDTO
  nextCard: ReviewCardDTO | null

  // NEW: Scoring feedback
  wasCorrect?: boolean              // For MC/multi-select
  correctAnswers?: number[]         // Which were correct
  partialScore?: number             // 0-1 for partial credit
  explanation?: string              // Why the answer was correct
}
```

---

### Phase 3: Scoring Logic (2 hours)

#### Task 3.1: Create Answer Evaluation Service

**File:** `src/main/domain/services/answer-evaluator.service.ts` (new file)

```typescript
/**
 * @fileoverview Service for evaluating user answers to objective questions
 * @lastmodified [DATE]
 *
 * Features: Multiple choice scoring, multi-select partial credit, true/false evaluation
 * Main APIs: evaluateAnswer, calculatePartialCredit
 * Constraints: Only for objective question types (not flashcards)
 * Patterns: Pure functions, no side effects
 */

import type { QuestionType, Rating } from '../../../shared/types/ipc'

export interface EvaluationResult {
  isCorrect: boolean
  partialScore: number  // 0.0 to 1.0
  suggestedRating: Rating
}

/**
 * Evaluate a user's answer for objective question types
 */
export function evaluateAnswer(
  questionType: QuestionType,
  correctIndices: number[],
  selectedIndices: number[],
  totalOptions: number
): EvaluationResult {
  switch (questionType) {
    case 'flashcard':
      // Flashcards don't have objective answers
      return { isCorrect: false, partialScore: 0, suggestedRating: 'good' }

    case 'true_false':
    case 'multiple_choice':
      return evaluateSingleAnswer(correctIndices, selectedIndices)

    case 'multi_select':
      return evaluateMultiSelect(correctIndices, selectedIndices, totalOptions)
  }
}

/**
 * Single-answer evaluation (true/false, multiple choice)
 */
function evaluateSingleAnswer(
  correctIndices: number[],
  selectedIndices: number[]
): EvaluationResult {
  const correct = correctIndices[0]
  const selected = selectedIndices[0]

  const isCorrect = correct === selected

  return {
    isCorrect,
    partialScore: isCorrect ? 1.0 : 0.0,
    suggestedRating: isCorrect ? 'good' : 'again',
  }
}

/**
 * Multi-select evaluation with partial credit
 *
 * Scoring formula: (correct selections - incorrect selections) / total correct
 * Minimum score: 0 (no negative scores)
 */
function evaluateMultiSelect(
  correctIndices: number[],
  selectedIndices: number[],
  totalOptions: number
): EvaluationResult {
  const correctSet = new Set(correctIndices)
  const selectedSet = new Set(selectedIndices)

  let correctSelections = 0
  let incorrectSelections = 0

  // Count correct and incorrect selections
  for (const selected of selectedIndices) {
    if (correctSet.has(selected)) {
      correctSelections++
    } else {
      incorrectSelections++
    }
  }

  // Count missed correct answers
  const missedCorrect = correctIndices.length - correctSelections

  // Calculate partial score (penalize wrong answers and missed answers)
  const rawScore = (correctSelections - incorrectSelections * 0.5 - missedCorrect * 0.5) / correctIndices.length
  const partialScore = Math.max(0, Math.min(1, rawScore))

  const isCorrect = correctSelections === correctIndices.length && incorrectSelections === 0

  // Map score to suggested rating
  let suggestedRating: Rating
  if (partialScore >= 0.9) {
    suggestedRating = 'easy'
  } else if (partialScore >= 0.7) {
    suggestedRating = 'good'
  } else if (partialScore >= 0.4) {
    suggestedRating = 'hard'
  } else {
    suggestedRating = 'again'
  }

  return { isCorrect, partialScore, suggestedRating }
}

/**
 * Convert partial score to accuracy score for mastery calculation
 */
export function partialScoreToAccuracy(partialScore: number): number {
  // Map partial score directly to accuracy
  // This preserves partial credit in mastery calculation
  return partialScore
}
```

#### Task 3.2: Integrate with Review Flow

**File:** `src/main/ipc/review.ipc.ts`

Update the `review:submit` handler:

```typescript
import { evaluateAnswer, partialScoreToAccuracy } from '../domain/services/answer-evaluator.service'

ipcMain.handle('review:submit', async (_event, dto: ReviewSubmitDTO) => {
  const variant = await variantRepository.getById(dto.variantId)

  let wasCorrect: boolean | undefined
  let partialScore: number | undefined
  let accuracyScore: number

  // For objective question types, evaluate the answer
  if (variant.questionType !== 'flashcard' && dto.selectedAnswerIndices) {
    const evaluation = evaluateAnswer(
      variant.questionType,
      variant.correctAnswerIndices ?? [],
      dto.selectedAnswerIndices,
      variant.options?.length ?? 0
    )

    wasCorrect = evaluation.isCorrect
    partialScore = evaluation.partialScore
    accuracyScore = partialScoreToAccuracy(evaluation.partialScore)
  } else {
    // Flashcards use self-reported rating
    accuracyScore = ratingToScore(dto.rating)
  }

  // Log event with answer data
  await eventRepository.insert({
    conceptId: dto.conceptId,
    variantId: dto.variantId,
    dimension: dto.dimension,
    difficulty: variant.difficulty,
    result: dto.rating,
    timeMs: dto.timeMs,
    hintsUsed: 0,
    userAnswer: dto.selectedAnswerIndices ? JSON.stringify(dto.selectedAnswerIndices) : null,
    wasCorrect: wasCorrect ?? null,
  })

  // Update mastery with objective score if available
  const updatedMastery = await masteryService.updateMastery(
    dto.dimension,
    accuracyScore,
    dto.timeMs,
    variant.difficulty
  )

  // ... rest of existing logic

  return {
    updatedMastery,
    updatedSchedule,
    nextCard,
    wasCorrect,
    correctAnswers: variant.correctAnswerIndices,
    partialScore,
    explanation: variant.explanation,
  }
})
```

---

### Phase 4: Review UI Components (3 hours)

#### Task 4.1: Create MultipleChoiceCard Component

**File:** `src/renderer/components/review/MultipleChoiceCard.tsx` (new file)

```tsx
/**
 * @fileoverview Multiple choice card component for review
 * @lastmodified [DATE]
 *
 * Features: Radio button selection, answer feedback, explanation display
 */

import React, { useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Alert,
  Box,
} from '@mui/material'
import type { AnswerOption } from '../../../shared/types/ipc'

interface MultipleChoiceCardProps {
  question: string
  options: AnswerOption[]
  onSubmit: (selectedIndex: number) => void
  feedback?: {
    wasCorrect: boolean
    correctIndex: number
    explanation?: string
  }
}

export function MultipleChoiceCard({
  question,
  options,
  onSubmit,
  feedback,
}: MultipleChoiceCardProps) {
  const [selected, setSelected] = useState<number | null>(null)

  const handleSubmit = () => {
    if (selected !== null) {
      onSubmit(selected)
    }
  }

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {question}
        </Typography>

        <RadioGroup
          value={selected?.toString() ?? ''}
          onChange={(e) => setSelected(parseInt(e.target.value))}
        >
          {options.map((option, index) => (
            <FormControlLabel
              key={option.id}
              value={index.toString()}
              control={<Radio />}
              label={option.text}
              disabled={!!feedback}
              sx={{
                ...(feedback && index === feedback.correctIndex && {
                  backgroundColor: 'success.light',
                  borderRadius: 1,
                }),
                ...(feedback && selected === index && !options[index].isCorrect && {
                  backgroundColor: 'error.light',
                  borderRadius: 1,
                }),
              }}
            />
          ))}
        </RadioGroup>

        {feedback && (
          <Box sx={{ mt: 2 }}>
            <Alert severity={feedback.wasCorrect ? 'success' : 'error'}>
              {feedback.wasCorrect ? 'Correct!' : 'Incorrect'}
            </Alert>
            {feedback.explanation && (
              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                {feedback.explanation}
              </Typography>
            )}
          </Box>
        )}

        {!feedback && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={selected === null}
            sx={{ mt: 2 }}
            fullWidth
          >
            Submit Answer
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
```

#### Task 4.2: Create MultiSelectCard Component

**File:** `src/renderer/components/review/MultiSelectCard.tsx` (new file)

```tsx
/**
 * @fileoverview Multi-select card component for review
 * @lastmodified [DATE]
 *
 * Features: Checkbox selection, partial credit feedback, answer explanation
 */

import React, { useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Alert,
  Box,
  LinearProgress,
} from '@mui/material'
import type { AnswerOption } from '../../../shared/types/ipc'

interface MultiSelectCardProps {
  question: string
  options: AnswerOption[]
  onSubmit: (selectedIndices: number[]) => void
  feedback?: {
    wasCorrect: boolean
    partialScore: number
    correctIndices: number[]
    explanation?: string
  }
}

export function MultiSelectCard({
  question,
  options,
  onSubmit,
  feedback,
}: MultiSelectCardProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const toggleOption = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const handleSubmit = () => {
    onSubmit([...selected])
  }

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {question}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Select all that apply
        </Typography>

        <FormGroup>
          {options.map((option, index) => (
            <FormControlLabel
              key={option.id}
              control={
                <Checkbox
                  checked={selected.has(index)}
                  onChange={() => toggleOption(index)}
                  disabled={!!feedback}
                />
              }
              label={option.text}
              sx={{
                ...(feedback && feedback.correctIndices.includes(index) && {
                  backgroundColor: 'success.light',
                  borderRadius: 1,
                }),
                ...(feedback && selected.has(index) && !options[index].isCorrect && {
                  backgroundColor: 'error.light',
                  borderRadius: 1,
                }),
              }}
            />
          ))}
        </FormGroup>

        {feedback && (
          <Box sx={{ mt: 2 }}>
            <Alert severity={feedback.wasCorrect ? 'success' : feedback.partialScore > 0.5 ? 'warning' : 'error'}>
              {feedback.wasCorrect
                ? 'All correct!'
                : `Score: ${Math.round(feedback.partialScore * 100)}%`}
            </Alert>
            <LinearProgress
              variant="determinate"
              value={feedback.partialScore * 100}
              sx={{ mt: 1, height: 8, borderRadius: 1 }}
              color={feedback.partialScore > 0.7 ? 'success' : feedback.partialScore > 0.4 ? 'warning' : 'error'}
            />
            {feedback.explanation && (
              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                {feedback.explanation}
              </Typography>
            )}
          </Box>
        )}

        {!feedback && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={selected.size === 0}
            sx={{ mt: 2 }}
            fullWidth
          >
            Submit Answer ({selected.size} selected)
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
```

#### Task 4.3: Update ReviewPage to Handle Question Types

**File:** `src/renderer/pages/ReviewPage.tsx`

```tsx
// Add imports
import { MultipleChoiceCard } from '../components/review/MultipleChoiceCard'
import { MultiSelectCard } from '../components/review/MultiSelectCard'

// In the card rendering logic:
function renderCard(card: ReviewCardDTO) {
  const { variant } = card

  switch (variant.questionType) {
    case 'multiple_choice':
    case 'true_false':
      return (
        <MultipleChoiceCard
          question={variant.front}
          options={variant.options ?? []}
          onSubmit={(index) => handleMCSubmit([index])}
          feedback={feedback}
        />
      )

    case 'multi_select':
      return (
        <MultiSelectCard
          question={variant.front}
          options={variant.options ?? []}
          onSubmit={handleMCSubmit}
          feedback={feedback}
        />
      )

    case 'flashcard':
    default:
      return (
        <FlashCard
          front={variant.front}
          back={variant.back}
          hints={variant.hints}
          revealed={isRevealed}
          onReveal={() => setIsRevealed(true)}
        />
      )
  }
}

// New handler for objective questions
const handleMCSubmit = async (selectedIndices: number[]) => {
  const result = await api.invoke('review:submit', {
    variantId: currentCard.variant.id,
    conceptId: currentCard.concept.id,
    dimension: currentCard.variant.dimension,
    rating: 'good', // Will be overridden by evaluation
    timeMs: responseTime,
    selectedAnswerIndices: selectedIndices,
  })

  setFeedback({
    wasCorrect: result.wasCorrect ?? false,
    partialScore: result.partialScore ?? 0,
    correctIndices: result.correctAnswers ?? [],
    explanation: result.explanation,
  })

  // Auto-advance after delay
  setTimeout(() => {
    setFeedback(null)
    setCurrentCard(result.nextCard)
  }, 2000)
}
```

---

### Phase 5: Variant Editor for Question Types (2 hours)

#### Task 5.1: Update VariantEditor with Question Type Selection

**File:** `src/renderer/components/VariantEditor.tsx`

Add question type selection and dynamic form fields:

```tsx
// State
const [questionType, setQuestionType] = useState<QuestionType>('flashcard')
const [options, setOptions] = useState<AnswerOption[]>([])
const [correctIndices, setCorrectIndices] = useState<number[]>([])
const [explanation, setExplanation] = useState('')

// Question type selector
<FormControl fullWidth margin="normal">
  <InputLabel>Question Type</InputLabel>
  <Select
    value={questionType}
    onChange={(e) => {
      setQuestionType(e.target.value as QuestionType)
      // Reset options when changing type
      if (e.target.value === 'true_false') {
        setOptions([
          { id: '1', text: 'True', isCorrect: false },
          { id: '2', text: 'False', isCorrect: false },
        ])
      } else if (e.target.value === 'flashcard') {
        setOptions([])
      } else {
        setOptions([])
      }
    }}
  >
    <MenuItem value="flashcard">Flashcard (self-report)</MenuItem>
    <MenuItem value="multiple_choice">Multiple Choice</MenuItem>
    <MenuItem value="multi_select">Multi-Select</MenuItem>
    <MenuItem value="true_false">True/False</MenuItem>
  </Select>
</FormControl>

// Options editor (for MC/multi-select)
{(questionType === 'multiple_choice' || questionType === 'multi_select') && (
  <OptionsEditor
    options={options}
    correctIndices={correctIndices}
    multiSelect={questionType === 'multi_select'}
    onChange={setOptions}
    onCorrectChange={setCorrectIndices}
  />
)}

// True/False correct answer selector
{questionType === 'true_false' && (
  <FormControl fullWidth margin="normal">
    <InputLabel>Correct Answer</InputLabel>
    <Select
      value={correctIndices[0]?.toString() ?? ''}
      onChange={(e) => setCorrectIndices([parseInt(e.target.value)])}
    >
      <MenuItem value="0">True</MenuItem>
      <MenuItem value="1">False</MenuItem>
    </Select>
  </FormControl>
)}

// Explanation field
{questionType !== 'flashcard' && (
  <TextField
    fullWidth
    margin="normal"
    label="Explanation (shown after answering)"
    multiline
    rows={2}
    value={explanation}
    onChange={(e) => setExplanation(e.target.value)}
    helperText="Explain why the correct answer is right"
  />
)}
```

#### Task 5.2: Create OptionsEditor Component

**File:** `src/renderer/components/OptionsEditor.tsx` (new file)

```tsx
/**
 * @fileoverview Editor for multiple choice / multi-select options
 */

import React from 'react'
import {
  Box,
  TextField,
  IconButton,
  Checkbox,
  Radio,
  Button,
  Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import type { AnswerOption } from '../../shared/types/ipc'

interface OptionsEditorProps {
  options: AnswerOption[]
  correctIndices: number[]
  multiSelect: boolean
  onChange: (options: AnswerOption[]) => void
  onCorrectChange: (indices: number[]) => void
}

export function OptionsEditor({
  options,
  correctIndices,
  multiSelect,
  onChange,
  onCorrectChange,
}: OptionsEditorProps) {
  const addOption = () => {
    onChange([
      ...options,
      { id: crypto.randomUUID(), text: '', isCorrect: false },
    ])
  }

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index)
    onChange(newOptions)
    // Update correct indices
    onCorrectChange(correctIndices.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)))
  }

  const updateOptionText = (index: number, text: string) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], text }
    onChange(newOptions)
  }

  const toggleCorrect = (index: number) => {
    if (multiSelect) {
      // Multi-select: toggle the index
      if (correctIndices.includes(index)) {
        onCorrectChange(correctIndices.filter((i) => i !== index))
      } else {
        onCorrectChange([...correctIndices, index])
      }
    } else {
      // Single select: replace
      onCorrectChange([index])
    }
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Answer Options {multiSelect ? '(select all correct answers)' : '(select the correct answer)'}
      </Typography>

      {options.map((option, index) => (
        <Box key={option.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {multiSelect ? (
            <Checkbox
              checked={correctIndices.includes(index)}
              onChange={() => toggleCorrect(index)}
            />
          ) : (
            <Radio
              checked={correctIndices.includes(index)}
              onChange={() => toggleCorrect(index)}
            />
          )}
          <TextField
            value={option.text}
            onChange={(e) => updateOptionText(index, e.target.value)}
            placeholder={`Option ${index + 1}`}
            size="small"
            sx={{ flexGrow: 1, mr: 1 }}
          />
          <IconButton onClick={() => removeOption(index)} size="small">
            <DeleteIcon />
          </IconButton>
        </Box>
      ))}

      <Button startIcon={<AddIcon />} onClick={addOption} size="small" sx={{ mt: 1 }}>
        Add Option
      </Button>
    </Box>
  )
}
```

---

### Phase 6: LLM Generation for Question Types (2 hours)

#### Task 6.1: Update Prompt Templates

**File:** `src/main/infrastructure/llm/prompts.ts`

Add templates for generating objective questions:

```typescript
export const QUESTION_TYPE_PROMPTS: Record<QuestionType, string> = {
  flashcard: EXISTING_PROMPT,

  multiple_choice: `
Generate a multiple choice question to test the concept.

Requirements:
- One clear question
- Exactly 4 answer options (A, B, C, D)
- Only ONE correct answer
- Incorrect options should be plausible but clearly wrong
- Include a brief explanation for why the correct answer is right

Return JSON:
{
  "front": "question text",
  "options": [
    { "text": "Option A", "isCorrect": false },
    { "text": "Option B", "isCorrect": true },
    { "text": "Option C", "isCorrect": false },
    { "text": "Option D", "isCorrect": false }
  ],
  "explanation": "Brief explanation of why option B is correct"
}
`,

  multi_select: `
Generate a multi-select question to test the concept.

Requirements:
- One clear question asking to "select all that apply"
- 4-6 answer options
- 2-3 correct answers (not all, not none)
- Mix of correct and plausible incorrect options
- Include explanation covering why each correct answer applies

Return JSON:
{
  "front": "question text (select all that apply)",
  "options": [
    { "text": "Option 1", "isCorrect": true },
    { "text": "Option 2", "isCorrect": false },
    { "text": "Option 3", "isCorrect": true },
    { "text": "Option 4", "isCorrect": false },
    { "text": "Option 5", "isCorrect": true }
  ],
  "explanation": "Options 1, 3, and 5 are correct because..."
}
`,

  true_false: `
Generate a true/false question to test the concept.

Requirements:
- One clear declarative statement
- Statement must be definitively true OR false
- Avoid ambiguous or trick statements
- Include brief explanation

Return JSON:
{
  "front": "declarative statement",
  "isTrue": true,
  "explanation": "This is true because..."
}
`,
}
```

#### Task 6.2: Update Generation Handler

**File:** `src/main/ipc/generation.ipc.ts`

Add support for generating specific question types:

```typescript
// Add to IPCChannels type
'variants:generateWithType': {
  args: {
    conceptId: string
    dimension: Dimension
    difficulty: number
    questionType: QuestionType
    count?: number
  }
  result: {
    variants: VariantDTO[]
    generatedAt: string
  }
}

// Add handler
ipcMain.handle('variants:generateWithType', async (_event, args) => {
  const { conceptId, dimension, difficulty, questionType, count = 3 } = args

  // Build prompt with question type template
  const typePrompt = QUESTION_TYPE_PROMPTS[questionType]

  // ... generation logic with type-specific parsing
})
```

---

## Testing Plan

### Unit Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Evaluate MC correct answer | isCorrect: true, score: 1.0 |
| Evaluate MC incorrect answer | isCorrect: false, score: 0.0 |
| Evaluate multi-select all correct | isCorrect: true, score: 1.0 |
| Evaluate multi-select partial | isCorrect: false, score: 0.5-0.9 |
| Evaluate multi-select none correct | isCorrect: false, score: 0.0 |
| Partial score with wrong selections | Penalized appropriately |

### Integration Tests

| Scenario | Expected |
|----------|----------|
| Create MC variant | Options stored in DB |
| Review MC card | Objective scoring applied |
| Review multi-select | Partial credit applied |
| Mastery updates | Uses objective score |

---

## Success Criteria

- [ ] Can create multiple choice variants with 4 options
- [ ] Can create multi-select variants with multiple correct answers
- [ ] Can create true/false variants
- [ ] Review UI displays appropriate component for each type
- [ ] Answers are objectively evaluated
- [ ] Partial credit is calculated for multi-select
- [ ] Feedback shows correct answers and explanation
- [ ] Mastery calculation uses objective scores
- [ ] LLM can generate all question types
- [ ] Existing flashcard behavior unchanged

---

## Estimated Timeline

| Task | Duration |
|------|----------|
| Database migration | 1 hour |
| Type definitions | 1 hour |
| Scoring service | 2 hours |
| Review UI components | 3 hours |
| Variant editor | 2 hours |
| LLM prompts | 1 hour |
| Testing | 2 hours |
| **Total** | **12 hours** |

---

## Rollback Plan

Migration adds columns (non-destructive). To rollback:
1. Revert code changes
2. New columns will be ignored
3. All variants continue working as flashcards

---

## Notes

- Backward compatible: existing flashcards unaffected
- Progressive enhancement: features additive
- Partial credit encourages learning even with wrong answers
- Objective scoring improves mastery accuracy
