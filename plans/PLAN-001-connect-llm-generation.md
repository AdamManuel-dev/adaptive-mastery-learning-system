# PLAN-001: Connect LLM Card Generation Infrastructure

**Status:** Ready for Implementation
**Priority:** P1/High
**Complexity:** Medium (4-6 hours)
**Phase:** 5.1 LLM Integration (In Progress)

---

## Executive Summary

The LLM card generation infrastructure is **fully implemented** in `src/main/infrastructure/llm/` but is **not connected** to the frontend. This plan connects the existing OpenAI adapter to the UI via IPC channels and provides a user-facing generation interface.

---

## Current State Analysis

### What Exists (Ready to Use)

| Component | Location | Status |
|-----------|----------|--------|
| `OpenAIGenerator` class | `src/main/infrastructure/llm/generator.ts` | Complete |
| `LLMGateway` interface | `src/main/infrastructure/llm/types.ts` | Complete |
| Prompt templates (6 dimensions) | `src/main/infrastructure/llm/prompts.ts` | Complete |
| Custom error types | `src/main/infrastructure/llm/errors.ts` | Complete |
| OpenAI SDK dependency | `package.json` | Installed |
| LLM config types | `src/shared/types/ipc.ts` | Complete |

### What's Missing (To Be Built)

| Component | Purpose | Estimate |
|-----------|---------|----------|
| IPC Handler | `variants:generate` channel | 1 hour |
| Frontend API Hook | `useVariantGeneration()` | 1 hour |
| Generation UI | Button + modal in VariantEditor | 2 hours |
| Settings Integration | API key configuration | 1 hour |

---

## Implementation Plan

### Phase 1: IPC Channel (1 hour)

#### Task 1.1: Add IPC Type Definitions

**File:** `src/shared/types/ipc.ts`

Add new channel definition:

```typescript
// In IPCChannels interface
'variants:generate': {
  args: {
    conceptId: string
    dimension: Dimension
    difficulty: number
    count?: number  // Default: 3
  }
  result: {
    variants: Array<{
      front: string
      back: string
      hints: string[]
    }>
    generatedAt: string
  }
}
```

#### Task 1.2: Create Generation IPC Handler

**File:** `src/main/ipc/generation.ipc.ts` (new file)

```typescript
/**
 * @fileoverview IPC handlers for LLM-based variant generation
 * @lastmodified [DATE]
 *
 * Features: Variant generation via LLM, generation health check
 * Main APIs: variants:generate, settings:testConnection
 * Constraints: Requires valid OpenAI API key in settings
 * Patterns: Hexagonal architecture, Result type error handling
 */

import { ipcMain } from 'electron'
import { createGeneratorFromEnv, createOpenAIGenerator } from '../infrastructure/llm/generator'
import { conceptRepository } from '../infrastructure/database/repositories'
import type { IPCArgs, IPCResult, Dimension } from '../../shared/types/ipc'
import type { DifficultyLevel, GenerationRequest } from '../infrastructure/llm/types'

export function registerGenerationHandlers(): void {
  ipcMain.handle(
    'variants:generate',
    async (_event, args: IPCArgs<'variants:generate'>): Promise<IPCResult<'variants:generate'>> => {
      const { conceptId, dimension, difficulty, count = 3 } = args

      // Fetch concept data for generation context
      const concept = await conceptRepository.getById(conceptId)
      if (!concept) {
        throw new Error(`Concept not found: ${conceptId}`)
      }

      // Create generator (will throw if API key missing)
      const generator = createGeneratorFromEnv()

      // Build generation request
      const request: GenerationRequest = {
        concept: {
          name: concept.name,
          definition: concept.definition ?? '',
          facts: concept.facts ?? [],
        },
        dimension: dimension as Dimension,
        difficulty: difficulty as DifficultyLevel,
        count,
      }

      // Generate variants
      const result = await generator.generateVariants(request)

      if (!result.success) {
        throw result.error
      }

      return {
        variants: result.value.map(v => ({
          front: v.front,
          back: v.back,
          hints: [...v.hints],
        })),
        generatedAt: new Date().toISOString(),
      }
    }
  )
}
```

#### Task 1.3: Register Handler in Main Process

**File:** `src/main/index.ts`

```typescript
import { registerGenerationHandlers } from './ipc/generation.ipc'

// In initialization
registerGenerationHandlers()
```

---

### Phase 2: Frontend API Hook (1 hour)

#### Task 2.1: Create Generation Hook

**File:** `src/renderer/api/useVariantGeneration.ts` (new file)

```typescript
/**
 * @fileoverview React hook for LLM-based variant generation
 * @lastmodified [DATE]
 *
 * Features: Generate variants via IPC, loading/error states
 * Main APIs: useVariantGeneration
 * Patterns: React Query mutation pattern
 */

import { useMutation } from '@tanstack/react-query'
import type { Dimension } from '../../shared/types/ipc'

interface GenerateVariantsParams {
  conceptId: string
  dimension: Dimension
  difficulty: number
  count?: number
}

interface GeneratedVariant {
  front: string
  back: string
  hints: string[]
}

interface GenerateResult {
  variants: GeneratedVariant[]
  generatedAt: string
}

export function useVariantGeneration() {
  return useMutation({
    mutationFn: async (params: GenerateVariantsParams): Promise<GenerateResult> => {
      return window.api.invoke('variants:generate', params)
    },
  })
}
```

---

### Phase 3: Generation UI (2 hours)

#### Task 3.1: Add Generate Button to VariantEditor

**File:** `src/renderer/components/VariantEditor.tsx`

Add "Generate with AI" button next to the existing form:

```tsx
// New state
const [showGenerateModal, setShowGenerateModal] = useState(false)

// In form header
<Button
  variant="outlined"
  startIcon={<AutoAwesomeIcon />}
  onClick={() => setShowGenerateModal(true)}
  disabled={!conceptId}
>
  Generate with AI
</Button>
```

#### Task 3.2: Create GenerationModal Component

**File:** `src/renderer/components/GenerationModal.tsx` (new file)

```tsx
/**
 * @fileoverview Modal for LLM-based variant generation options and results
 * @lastmodified [DATE]
 *
 * Features: Dimension/difficulty selection, generation preview, accept/reject
 * Main APIs: GenerationModal component
 * Constraints: Requires API key configured in settings
 */

import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
} from '@mui/material'
import { useVariantGeneration } from '../api/useVariantGeneration'
import type { Dimension } from '../../shared/types/ipc'

interface GenerationModalProps {
  open: boolean
  onClose: () => void
  conceptId: string
  onAccept: (variants: Array<{ front: string; back: string; hints: string[] }>) => void
}

const DIMENSIONS: { value: Dimension; label: string }[] = [
  { value: 'definition', label: 'Definition Recall' },
  { value: 'paraphrase', label: 'Paraphrase Recognition' },
  { value: 'example', label: 'Example Classification' },
  { value: 'scenario', label: 'Scenario Application' },
  { value: 'discrimination', label: 'Discrimination' },
  { value: 'cloze', label: 'Cloze Fill' },
]

export function GenerationModal({ open, onClose, conceptId, onAccept }: GenerationModalProps) {
  const [dimension, setDimension] = useState<Dimension>('definition')
  const [difficulty, setDifficulty] = useState(3)
  const [count, setCount] = useState(3)
  const [selectedVariants, setSelectedVariants] = useState<Set<number>>(new Set())

  const { mutate, isPending, isError, error, data, reset } = useVariantGeneration()

  const handleGenerate = () => {
    mutate({ conceptId, dimension, difficulty, count })
  }

  const handleAccept = () => {
    if (!data) return
    const selected = data.variants.filter((_, i) => selectedVariants.has(i))
    onAccept(selected.length > 0 ? selected : data.variants)
    reset()
    onClose()
  }

  const toggleVariant = (index: number) => {
    setSelectedVariants(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Generate Card Variants with AI</DialogTitle>
      <DialogContent>
        {!data && (
          <>
            <FormControl fullWidth margin="normal">
              <InputLabel>Dimension</InputLabel>
              <Select
                value={dimension}
                onChange={(e) => setDimension(e.target.value as Dimension)}
                label="Dimension"
              >
                {DIMENSIONS.map(d => (
                  <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography gutterBottom>Difficulty Level: {difficulty}</Typography>
            <Slider
              value={difficulty}
              onChange={(_, v) => setDifficulty(v as number)}
              min={1}
              max={5}
              marks
              valueLabelDisplay="auto"
            />

            <Typography gutterBottom>Number of Variants: {count}</Typography>
            <Slider
              value={count}
              onChange={(_, v) => setCount(v as number)}
              min={1}
              max={5}
              marks
              valueLabelDisplay="auto"
            />
          </>
        )}

        {isPending && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Generating variants...</Typography>
          </div>
        )}

        {isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error?.message || 'Generation failed. Check your API key in settings.'}
          </Alert>
        )}

        {data && (
          <>
            <Alert severity="success" sx={{ mb: 2 }}>
              Generated {data.variants.length} variants. Select which to save:
            </Alert>
            {data.variants.map((variant, i) => (
              <Card key={i} sx={{ mb: 2, border: selectedVariants.has(i) ? '2px solid primary.main' : undefined }}>
                <CardContent>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedVariants.has(i)}
                        onChange={() => toggleVariant(i)}
                      />
                    }
                    label={`Variant ${i + 1}`}
                  />
                  <Typography variant="subtitle2">Front:</Typography>
                  <Typography sx={{ mb: 1, pl: 2 }}>{variant.front}</Typography>
                  <Typography variant="subtitle2">Back:</Typography>
                  <Typography sx={{ mb: 1, pl: 2 }}>{variant.back}</Typography>
                  {variant.hints.length > 0 && (
                    <>
                      <Typography variant="subtitle2">Hints:</Typography>
                      <ul style={{ margin: 0, paddingLeft: 32 }}>
                        {variant.hints.map((h, j) => (
                          <li key={j}><Typography variant="body2">{h}</Typography></li>
                        ))}
                      </ul>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {!data ? (
          <Button onClick={handleGenerate} variant="contained" disabled={isPending}>
            Generate
          </Button>
        ) : (
          <Button onClick={handleAccept} variant="contained">
            Accept Selected ({selectedVariants.size || data.variants.length})
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
```

---

### Phase 4: Settings Integration (1 hour)

#### Task 4.1: Add API Key Configuration UI

**File:** `src/renderer/pages/SettingsPage.tsx` (or create if not exists)

Add section for LLM configuration:

```tsx
<Card sx={{ mb: 2 }}>
  <CardContent>
    <Typography variant="h6" gutterBottom>LLM Configuration</Typography>

    <FormControl fullWidth margin="normal">
      <InputLabel>Provider</InputLabel>
      <Select
        value={settings.llm.provider}
        onChange={(e) => updateSettings({ llm: { ...settings.llm, provider: e.target.value } })}
      >
        <MenuItem value="openai">OpenAI</MenuItem>
        <MenuItem value="anthropic">Anthropic (coming soon)</MenuItem>
        <MenuItem value="local">Local (Ollama)</MenuItem>
      </Select>
    </FormControl>

    <TextField
      fullWidth
      margin="normal"
      label="API Key"
      type="password"
      value={settings.llm.apiKey}
      onChange={(e) => updateSettings({ llm: { ...settings.llm, apiKey: e.target.value } })}
      helperText="Your OpenAI API key (stored locally)"
    />

    <TextField
      fullWidth
      margin="normal"
      label="Model"
      value={settings.llm.model}
      onChange={(e) => updateSettings({ llm: { ...settings.llm, model: e.target.value } })}
      helperText="Default: gpt-4o-mini"
    />

    <Button
      variant="outlined"
      onClick={handleTestConnection}
      disabled={testingConnection}
      sx={{ mt: 2 }}
    >
      {testingConnection ? <CircularProgress size={20} /> : 'Test Connection'}
    </Button>
  </CardContent>
</Card>
```

#### Task 4.2: Implement Connection Test Handler

The `settings:testConnection` IPC channel already exists. Implement the handler:

**File:** `src/main/ipc/settings.ipc.ts`

```typescript
ipcMain.handle(
  'settings:testConnection',
  async (_event, config: LLMConfigDTO): Promise<ConnectionTestResultDTO> => {
    const startTime = Date.now()

    try {
      const generator = createOpenAIGenerator({
        apiKey: config.apiKey,
        model: config.model,
        baseUrl: config.baseUrl,
      })

      const result = await generator.healthCheck()

      return {
        success: result.success,
        message: result.success ? 'Connection successful' : result.error?.message ?? 'Unknown error',
        latencyMs: Date.now() - startTime,
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
        latencyMs: Date.now() - startTime,
      }
    }
  }
)
```

---

## Testing Plan

### Unit Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Generate with valid concept | Returns 1-5 variants |
| Generate with missing API key | Throws LLMConfigurationError |
| Generate with invalid concept ID | Throws concept not found error |
| Test connection with valid key | Returns success: true |
| Test connection with invalid key | Returns success: false with error message |

### Integration Tests

| Scenario | Steps | Expected |
|----------|-------|----------|
| Full generation flow | Open modal → Select options → Generate → Accept | Variants saved to database |
| Settings persistence | Save API key → Restart app | Key persists |
| Error recovery | Invalid key → Update key → Regenerate | Generation succeeds |

---

## Success Criteria

- [ ] Can generate variants from VariantEditor UI
- [ ] Generated variants appear in preview modal
- [ ] Can select/deselect variants before saving
- [ ] API key can be configured in Settings
- [ ] Connection test works and shows latency
- [ ] Errors are displayed clearly to user
- [ ] Loading states are shown during generation

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| OpenAI SDK | Installed | `openai@^4.78.0` |
| React Query | Installed | For mutation hooks |
| Generator infrastructure | Complete | `src/main/infrastructure/llm/` |

---

## Rollback Plan

If issues arise:
1. Revert IPC handler registration in `src/main/index.ts`
2. Remove new files (non-breaking)
3. UI changes are isolated to new components

---

## Estimated Timeline

| Task | Duration |
|------|----------|
| IPC Channel setup | 1 hour |
| Frontend hook | 30 min |
| Generation modal | 1.5 hours |
| Settings integration | 1 hour |
| Testing & polish | 1 hour |
| **Total** | **5 hours** |

---

## Notes

- The existing LLM infrastructure is well-designed with proper error handling, retry logic, and prompt engineering
- All 6 cognitive dimensions have specialized prompts
- Difficulty levels 1-5 are supported with appropriate modifiers
- JSON response validation is robust with multiple fallback strategies
