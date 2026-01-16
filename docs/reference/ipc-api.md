# IPC API Reference

Technical specifications for Electron IPC communication channels.

---

## Overview

| Property | Value |
|----------|-------|
| Pattern | Request/Response (invoke/handle) |
| Transport | Electron IPC |
| Security | Context isolation via contextBridge |
| Error Handling | Structured IPCError type |

---

## Channel Groups

| Group | Prefix | Description |
|-------|--------|-------------|
| Concepts | `concepts:` | CRUD operations for learning concepts |
| Variants | `variants:` | CRUD operations for card variants |
| Review | `review:` | Review session operations |
| Mastery | `mastery:` | Mastery profile queries |
| Schedule | `schedule:` | SRS scheduling operations |
| Settings | `settings:` | Application configuration |

---

## Concept Channels

### concepts:getAll

Retrieves all concepts.

| Property | Value |
|----------|-------|
| Channel | `concepts:getAll` |
| Direction | Renderer -> Main |
| Arguments | `void` |
| Returns | `ConceptDTO[]` |

**Response Type:**
```typescript
ConceptDTO[]
```

---

### concepts:getById

Retrieves a concept by ID.

| Property | Value |
|----------|-------|
| Channel | `concepts:getById` |
| Direction | Renderer -> Main |
| Arguments | `string` (concept ID) |
| Returns | `ConceptDTO \| null` |

**Arguments:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | Yes | Concept UUID |

**Response Type:**
```typescript
ConceptDTO | null
```

---

### concepts:create

Creates a new concept.

| Property | Value |
|----------|-------|
| Channel | `concepts:create` |
| Direction | Renderer -> Main |
| Arguments | `CreateConceptDTO` |
| Returns | `ConceptDTO` |

**Arguments:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | Yes | Concept name |
| `definition` | `string` | No | Concept definition |

**Response Type:**
```typescript
ConceptDTO
```

---

### concepts:update

Updates an existing concept.

| Property | Value |
|----------|-------|
| Channel | `concepts:update` |
| Direction | Renderer -> Main |
| Arguments | `UpdateConceptDTO` |
| Returns | `ConceptDTO` |

**Arguments:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | Yes | Concept UUID |
| `name` | `string` | No | New name |
| `definition` | `string` | No | New definition |

**Response Type:**
```typescript
ConceptDTO
```

**Errors:**

| Code | Condition |
|------|-----------|
| `NOT_FOUND` | Concept with ID not found |

---

### concepts:delete

Deletes a concept and all related data.

| Property | Value |
|----------|-------|
| Channel | `concepts:delete` |
| Direction | Renderer -> Main |
| Arguments | `string` (concept ID) |
| Returns | `void` |

**Arguments:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | Yes | Concept UUID |

**Errors:**

| Code | Condition |
|------|-----------|
| `NOT_FOUND` | Concept with ID not found |

---

## Variant Channels

### variants:getByConceptId

Retrieves all variants for a concept.

| Property | Value |
|----------|-------|
| Channel | `variants:getByConceptId` |
| Direction | Renderer -> Main |
| Arguments | `string` (concept ID) |
| Returns | `VariantDTO[]` |

**Arguments:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `conceptId` | `string` | Yes | Parent concept UUID |

**Response Type:**
```typescript
VariantDTO[]
```

---

### variants:create

Creates a new variant.

| Property | Value |
|----------|-------|
| Channel | `variants:create` |
| Direction | Renderer -> Main |
| Arguments | `CreateVariantDTO` |
| Returns | `VariantDTO` |

**Arguments:**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `conceptId` | `string` | Yes | - | Parent concept UUID |
| `dimension` | `Dimension` | Yes | - | Cognitive dimension |
| `difficulty` | `number` | No | `3` | Difficulty level (1-5) |
| `front` | `string` | Yes | - | Question text |
| `back` | `string` | Yes | - | Answer text |

**Response Type:**
```typescript
VariantDTO
```

---

### variants:update

Updates an existing variant.

| Property | Value |
|----------|-------|
| Channel | `variants:update` |
| Direction | Renderer -> Main |
| Arguments | `UpdateVariantDTO` |
| Returns | `VariantDTO` |

**Arguments:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | Yes | Variant UUID |
| `dimension` | `Dimension` | No | New dimension |
| `difficulty` | `number` | No | New difficulty (1-5) |
| `front` | `string` | No | New question |
| `back` | `string` | No | New answer |

**Response Type:**
```typescript
VariantDTO
```

**Errors:**

| Code | Condition |
|------|-----------|
| `NOT_FOUND` | Variant with ID not found |

---

### variants:delete

Deletes a variant.

| Property | Value |
|----------|-------|
| Channel | `variants:delete` |
| Direction | Renderer -> Main |
| Arguments | `string` (variant ID) |
| Returns | `void` |

**Arguments:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | Yes | Variant UUID |

**Errors:**

| Code | Condition |
|------|-----------|
| `NOT_FOUND` | Variant with ID not found |

---

## Review Channels

### review:getNextCard

Retrieves the next card due for review.

| Property | Value |
|----------|-------|
| Channel | `review:getNextCard` |
| Direction | Renderer -> Main |
| Arguments | `void` |
| Returns | `ReviewCardDTO \| null` |

**Response Type:**
```typescript
ReviewCardDTO | null
```

Returns `null` when no cards are due for review.

**Selection Algorithm:**
1. Query schedules with `due_at <= now`
2. For first due concept, fetch variants
3. Use weighted selection based on mastery profile
4. Return combined card data

---

### review:submit

Submits a review result.

| Property | Value |
|----------|-------|
| Channel | `review:submit` |
| Direction | Renderer -> Main |
| Arguments | `ReviewSubmitDTO` |
| Returns | `ReviewResultDTO` |

**Arguments:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `variantId` | `string` | Yes | Reviewed variant UUID |
| `conceptId` | `string` | Yes | Reviewed concept UUID |
| `dimension` | `Dimension` | Yes | Dimension tested |
| `rating` | `Rating` | Yes | User self-assessment |
| `timeMs` | `number` | Yes | Response time (ms) |

**Rating Values:**

| Value | Description |
|-------|-------------|
| `again` | Complete failure |
| `hard` | Recalled with difficulty |
| `good` | Correct, normal effort |
| `easy` | Effortless recall |

**Response Type:**
```typescript
ReviewResultDTO
```

**Response Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `updatedMastery` | `MasteryDTO` | Updated dimension mastery |
| `updatedSchedule` | `ScheduleDTO` | Updated concept schedule |
| `nextCard` | `ReviewCardDTO \| null` | Next card (if available) |

---

### review:getDueCount

Retrieves count of due cards.

| Property | Value |
|----------|-------|
| Channel | `review:getDueCount` |
| Direction | Renderer -> Main |
| Arguments | `void` |
| Returns | `DueCountDTO` |

**Response Type:**
```typescript
DueCountDTO
```

**Response Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `total` | `number` | Total due cards |
| `byDimension` | `Record<Dimension, number>` | Count per dimension |

---

## Mastery Channels

### mastery:getProfile

Retrieves complete mastery profile.

| Property | Value |
|----------|-------|
| Channel | `mastery:getProfile` |
| Direction | Renderer -> Main |
| Arguments | `void` |
| Returns | `MasteryProfileDTO` |

**Response Type:**
```typescript
MasteryProfileDTO
```

**Response Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `dimensions` | `MasteryDTO[]` | All dimension scores |
| `overallScore` | `number` | Average combined score |
| `weakestDimension` | `Dimension \| null` | Lowest scoring dimension |
| `strongestDimension` | `Dimension \| null` | Highest scoring dimension |

---

### mastery:getByDimension

Retrieves mastery for a specific dimension.

| Property | Value |
|----------|-------|
| Channel | `mastery:getByDimension` |
| Direction | Renderer -> Main |
| Arguments | `Dimension` |
| Returns | `MasteryDTO` |

**Arguments:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `dimension` | `Dimension` | Yes | Target dimension |

**Response Type:**
```typescript
MasteryDTO
```

---

## Schedule Channels

### schedule:getDue

Retrieves all due schedules.

| Property | Value |
|----------|-------|
| Channel | `schedule:getDue` |
| Direction | Renderer -> Main |
| Arguments | `void` |
| Returns | `ScheduleDTO[]` |

**Response Type:**
```typescript
ScheduleDTO[]
```

Returns schedules where `due_at <= now`.

---

### schedule:update

Updates a schedule entry.

| Property | Value |
|----------|-------|
| Channel | `schedule:update` |
| Direction | Renderer -> Main |
| Arguments | `UpdateScheduleDTO` |
| Returns | `ScheduleDTO` |

**Arguments:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `conceptId` | `string` | Yes | Concept UUID |
| `dueAt` | `string` | No | New due date (ISO 8601) |
| `intervalDays` | `number` | No | New interval |
| `ease` | `number` | No | New ease factor |

**Response Type:**
```typescript
ScheduleDTO
```

Creates a new schedule if one does not exist for the concept.

---

## Settings Channels

### settings:get

Retrieves current settings.

| Property | Value |
|----------|-------|
| Channel | `settings:get` |
| Direction | Renderer -> Main |
| Arguments | `void` |
| Returns | `SettingsDTO` |

**Response Type:**
```typescript
SettingsDTO
```

---

### settings:set

Updates settings.

| Property | Value |
|----------|-------|
| Channel | `settings:set` |
| Direction | Renderer -> Main |
| Arguments | `Partial<SettingsDTO>` |
| Returns | `SettingsDTO` |

**Arguments:**

All properties are optional. Only provided properties are updated.

| Name | Type | Description |
|------|------|-------------|
| `ewmaAlpha` | `number` | EWMA smoothing factor |
| `targetTimes` | `Record<number, number>` | Target times by difficulty |
| `antiFrustrationThreshold` | `number` | Failures before confidence card |
| `cardsPerSession` | `number` | Cards per review session |
| `newCardsPerDay` | `number` | New cards per day limit |
| `llm` | `LLMConfigDTO` | LLM configuration |
| `theme` | `'light' \| 'dark' \| 'system'` | UI theme |

**Response Type:**
```typescript
SettingsDTO
```

Returns complete settings after merge.

---

## Error Handling

### IPCError

Structured error type for IPC operations.

| Property | Type | Description |
|----------|------|-------------|
| `code` | `string` | Error code |
| `message` | `string` | Human-readable message |
| `details` | `unknown` | Additional context |

### Error Codes

| Code | Description |
|------|-------------|
| `NOT_FOUND` | Requested resource does not exist |
| `VALIDATION_ERROR` | Input validation failed |
| `INTERNAL_ERROR` | Unexpected server error |

### Error Response Format

```typescript
interface IPCError {
  code: string;
  message: string;
  details?: unknown;
}
```

### Response Wrapper (Optional)

```typescript
type IPCResponse<T> =
  | { success: true; data: T }
  | { success: false; error: IPCError }
```

---

## Renderer API Bridge

The preload script exposes a typed API object at `window.api`.

### API Structure

```typescript
window.api = {
  concepts: {
    getAll: () => Promise<ConceptDTO[]>,
    getById: (id: string) => Promise<ConceptDTO | null>,
    create: (data: CreateConceptDTO) => Promise<ConceptDTO>,
    update: (data: UpdateConceptDTO) => Promise<ConceptDTO>,
    delete: (id: string) => Promise<void>,
  },
  variants: {
    getByConceptId: (conceptId: string) => Promise<VariantDTO[]>,
    create: (data: CreateVariantDTO) => Promise<VariantDTO>,
    update: (data: UpdateVariantDTO) => Promise<VariantDTO>,
    delete: (id: string) => Promise<void>,
  },
  review: {
    getNextCard: () => Promise<ReviewCardDTO | null>,
    submit: (data: ReviewSubmitDTO) => Promise<ReviewResultDTO>,
    getDueCount: () => Promise<DueCountDTO>,
  },
  mastery: {
    getProfile: () => Promise<MasteryProfileDTO>,
    getByDimension: (dimension: Dimension) => Promise<MasteryDTO>,
  },
  schedule: {
    getDue: () => Promise<ScheduleDTO[]>,
    update: (data: UpdateScheduleDTO) => Promise<ScheduleDTO>,
  },
  settings: {
    get: () => Promise<SettingsDTO>,
    set: (data: Partial<SettingsDTO>) => Promise<SettingsDTO>,
  },
}
```

---

## Handler Registration

IPC handlers are registered in the main process during app initialization.

| Handler Module | Channels Registered |
|----------------|---------------------|
| `registerConceptHandlers()` | `concepts:*` |
| `registerVariantHandlers()` | `variants:*` |
| `registerReviewHandlers()` | `review:*` |
| `registerMasteryHandlers()` | `mastery:*` |
| `registerScheduleHandlers()` | `schedule:*` |
| `registerSettingsHandlers()` | `settings:*` |

**Registration Entry Point:**
```typescript
registerIPCHandlers() // src/main/ipc/index.ts
```

---

## Dimension Mapping

IPC uses simplified dimension strings. Mapping to core enum:

| IPC Dimension | Core DimensionType |
|---------------|-------------------|
| `definition` | `DEFINITION_RECALL` |
| `paraphrase` | `PARAPHRASE_RECOGNITION` |
| `example` | `EXAMPLE_CLASSIFICATION` |
| `scenario` | `SCENARIO_APPLICATION` |
| `discrimination` | `DISCRIMINATION` |
| `cloze` | `CLOZE_FILL` |

---

## Related Documentation

- [Type Definitions Reference](./types.md)
- [Domain Model Reference](./domain-model.md)
- [Configuration Reference](./configuration.md)
