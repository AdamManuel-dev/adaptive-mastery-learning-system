# Type Definitions Reference

Technical specifications for TypeScript types, interfaces, and constants.

---

## Core Domain Types

### DimensionType

Enum representing cognitive testing dimensions.

```typescript
enum DimensionType {
  DEFINITION_RECALL = 'definition_recall',
  PARAPHRASE_RECOGNITION = 'paraphrase_recognition',
  EXAMPLE_CLASSIFICATION = 'example_classification',
  SCENARIO_APPLICATION = 'scenario_application',
  DISCRIMINATION = 'discrimination',
  CLOZE_FILL = 'cloze_fill',
}
```

**Source:** `src/shared/types/core.ts`

---

### ReviewResultType

Union type for review ratings.

```typescript
type ReviewResultType = 'again' | 'hard' | 'good' | 'easy'
```

**Source:** `src/shared/types/core.ts`

---

### DifficultyLevel

Union type for difficulty levels.

```typescript
type DifficultyLevel = 1 | 2 | 3 | 4 | 5
```

**Source:** `src/shared/types/core.ts`

---

### Concept

Interface for learning concept entities.

```typescript
interface Concept {
  readonly id: ConceptId;
  readonly name: string;
  readonly definition: string;
  readonly facts: readonly string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
```

**Source:** `src/shared/types/core.ts`

---

### Variant

Interface for card variant entities.

```typescript
interface Variant {
  readonly id: VariantId;
  readonly conceptId: ConceptId;
  readonly dimension: DimensionType;
  readonly difficulty: DifficultyLevel;
  readonly front: string;
  readonly back: string;
  readonly hints: readonly string[];
  readonly lastShownAt: Date | null;
}
```

**Source:** `src/shared/types/core.ts`

---

### ReviewEvent

Interface for review event entities.

```typescript
interface ReviewEvent {
  readonly id: EventId;
  readonly conceptId: ConceptId;
  readonly variantId: VariantId;
  readonly dimension: DimensionType;
  readonly difficulty: DifficultyLevel;
  readonly result: ReviewResultType;
  readonly timeMs: number;
  readonly hintsUsed: number;
  readonly createdAt: Date;
}
```

**Source:** `src/shared/types/core.ts`

---

### ScheduleEntry

Interface for SRS scheduling state.

```typescript
interface ScheduleEntry {
  readonly conceptId: ConceptId;
  readonly dueAt: Date;
  readonly intervalDays: number;
  readonly easeFactor: number;
}
```

**Source:** `src/shared/types/core.ts`

---

### DimensionMastery

Interface for dimension mastery metrics.

```typescript
interface DimensionMastery {
  readonly accuracyEwma: number;
  readonly speedEwma: number;
  readonly recentCount: number;
}
```

**Source:** `src/shared/types/core.ts`

---

### MasteryProfile

Type for complete mastery profile.

```typescript
type MasteryProfile = Record<DimensionType, DimensionMastery>
```

**Source:** `src/shared/types/core.ts`

---

### ConceptWithVariants

Convenience type for concept with loaded variants.

```typescript
type ConceptWithVariants = Concept & {
  readonly variants: readonly Variant[];
}
```

**Source:** `src/shared/types/core.ts`

---

## Branded ID Types

### ConceptId

Branded type for concept identifiers.

```typescript
type ConceptId = string & { readonly __brand: unique symbol }
```

**Source:** `src/shared/types/branded.ts`

---

### VariantId

Branded type for variant identifiers.

```typescript
type VariantId = string & { readonly __brand: unique symbol }
```

**Source:** `src/shared/types/branded.ts`

---

### EventId

Branded type for event identifiers.

```typescript
type EventId = string & { readonly __brand: unique symbol }
```

**Source:** `src/shared/types/branded.ts`

---

### ID Casting Functions

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `asConceptId` | `id: string` | `ConceptId` | Cast string to ConceptId |
| `asVariantId` | `id: string` | `VariantId` | Cast string to VariantId |
| `asEventId` | `id: string` | `EventId` | Cast string to EventId |
| `isValidUuid` | `value: string` | `boolean` | Validate UUID format |

**Source:** `src/shared/types/branded.ts`

---

## IPC Data Transfer Objects

### Dimension (IPC)

Simplified dimension type for IPC.

```typescript
type Dimension =
  | 'definition'
  | 'paraphrase'
  | 'example'
  | 'scenario'
  | 'discrimination'
  | 'cloze'
```

**Source:** `src/shared/types/ipc.ts`

---

### Rating

Simplified rating type for IPC.

```typescript
type Rating = 'again' | 'hard' | 'good' | 'easy'
```

**Source:** `src/shared/types/ipc.ts`

---

### ConceptDTO

```typescript
interface ConceptDTO {
  id: string;
  name: string;
  definition: string | null;
  createdAt: string;
  updatedAt: string;
}
```

**Source:** `src/shared/types/ipc.ts`

---

### CreateConceptDTO

```typescript
interface CreateConceptDTO {
  name: string;
  definition?: string;
}
```

**Source:** `src/shared/types/ipc.ts`

---

### UpdateConceptDTO

```typescript
interface UpdateConceptDTO {
  id: string;
  name?: string;
  definition?: string;
}
```

**Source:** `src/shared/types/ipc.ts`

---

### VariantDTO

```typescript
interface VariantDTO {
  id: string;
  conceptId: string;
  dimension: Dimension;
  difficulty: number;
  front: string;
  back: string;
  createdAt: string;
  updatedAt: string;
}
```

**Source:** `src/shared/types/ipc.ts`

---

### CreateVariantDTO

```typescript
interface CreateVariantDTO {
  conceptId: string;
  dimension: Dimension;
  difficulty?: number;
  front: string;
  back: string;
}
```

**Source:** `src/shared/types/ipc.ts`

---

### UpdateVariantDTO

```typescript
interface UpdateVariantDTO {
  id: string;
  dimension?: Dimension;
  difficulty?: number;
  front?: string;
  back?: string;
}
```

**Source:** `src/shared/types/ipc.ts`

---

### MasteryDTO

```typescript
interface MasteryDTO {
  dimension: Dimension;
  accuracyEwma: number;
  speedEwma: number;
  count: number;
}
```

**Source:** `src/shared/types/ipc.ts`

---

### MasteryProfileDTO

```typescript
interface MasteryProfileDTO {
  dimensions: MasteryDTO[];
  overallScore: number;
  weakestDimension: Dimension | null;
  strongestDimension: Dimension | null;
}
```

**Source:** `src/shared/types/ipc.ts`

---

### ScheduleDTO

```typescript
interface ScheduleDTO {
  conceptId: string;
  dueAt: string;
  intervalDays: number;
  ease: number;
}
```

**Source:** `src/shared/types/ipc.ts`

---

### UpdateScheduleDTO

```typescript
interface UpdateScheduleDTO {
  conceptId: string;
  dueAt?: string;
  intervalDays?: number;
  ease?: number;
}
```

**Source:** `src/shared/types/ipc.ts`

---

### ReviewCardDTO

```typescript
interface ReviewCardDTO {
  variant: VariantDTO;
  concept: ConceptDTO;
  schedule: ScheduleDTO;
}
```

**Source:** `src/shared/types/ipc.ts`

---

### ReviewSubmitDTO

```typescript
interface ReviewSubmitDTO {
  variantId: string;
  conceptId: string;
  dimension: Dimension;
  rating: Rating;
  timeMs: number;
}
```

**Source:** `src/shared/types/ipc.ts`

---

### ReviewResultDTO

```typescript
interface ReviewResultDTO {
  updatedMastery: MasteryDTO;
  updatedSchedule: ScheduleDTO;
  nextCard: ReviewCardDTO | null;
}
```

**Source:** `src/shared/types/ipc.ts`

---

### DueCountDTO

```typescript
interface DueCountDTO {
  total: number;
  byDimension: Record<Dimension, number>;
}
```

**Source:** `src/shared/types/ipc.ts`

---

### LLMConfigDTO

```typescript
interface LLMConfigDTO {
  provider: 'openai' | 'anthropic' | 'local';
  apiKey: string;
  model: string;
  baseUrl?: string;
}
```

**Source:** `src/shared/types/ipc.ts`

---

### SettingsDTO

```typescript
interface SettingsDTO {
  ewmaAlpha: number;
  targetTimes: Record<number, number>;
  antiFrustrationThreshold: number;
  cardsPerSession: number;
  newCardsPerDay: number;
  llm: LLMConfigDTO;
  theme: 'light' | 'dark' | 'system';
}
```

**Source:** `src/shared/types/ipc.ts`

---

## IPC Channel Types

### IPCChannels

Type mapping channels to request/response types.

```typescript
interface IPCChannels {
  'concepts:getAll': { args: void; result: ConceptDTO[] };
  'concepts:getById': { args: string; result: ConceptDTO | null };
  'concepts:create': { args: CreateConceptDTO; result: ConceptDTO };
  'concepts:update': { args: UpdateConceptDTO; result: ConceptDTO };
  'concepts:delete': { args: string; result: void };
  'variants:getByConceptId': { args: string; result: VariantDTO[] };
  'variants:create': { args: CreateVariantDTO; result: VariantDTO };
  'variants:update': { args: UpdateVariantDTO; result: VariantDTO };
  'variants:delete': { args: string; result: void };
  'review:getNextCard': { args: void; result: ReviewCardDTO | null };
  'review:submit': { args: ReviewSubmitDTO; result: ReviewResultDTO };
  'review:getDueCount': { args: void; result: DueCountDTO };
  'mastery:getProfile': { args: void; result: MasteryProfileDTO };
  'mastery:getByDimension': { args: Dimension; result: MasteryDTO };
  'schedule:getDue': { args: void; result: ScheduleDTO[] };
  'schedule:update': { args: UpdateScheduleDTO; result: ScheduleDTO };
  'settings:get': { args: void; result: SettingsDTO };
  'settings:set': { args: Partial<SettingsDTO>; result: SettingsDTO };
}
```

**Source:** `src/shared/types/ipc.ts`

---

### IPCChannelName

Union type of all channel names.

```typescript
type IPCChannelName = keyof IPCChannels
```

**Source:** `src/shared/types/ipc.ts`

---

### IPCArgs

Utility type to extract arguments for a channel.

```typescript
type IPCArgs<T extends IPCChannelName> = IPCChannels[T]['args']
```

**Source:** `src/shared/types/ipc.ts`

---

### IPCResult

Utility type to extract result for a channel.

```typescript
type IPCResult<T extends IPCChannelName> = IPCChannels[T]['result']
```

**Source:** `src/shared/types/ipc.ts`

---

## Error Types

### IPCError

```typescript
interface IPCError {
  code: string;
  message: string;
  details?: unknown;
}
```

**Source:** `src/shared/types/ipc.ts`

---

### IPCResponse

```typescript
type IPCResponse<T> =
  | { success: true; data: T }
  | { success: false; error: IPCError }
```

**Source:** `src/shared/types/ipc.ts`

---

### DomainError

```typescript
class DomainError extends Error {
  constructor(message: string, public readonly code: string);
}
```

**Source:** `src/shared/errors/index.ts`

---

### ValidationError

```typescript
class ValidationError extends DomainError {
  constructor(message: string);
}
```

Error code: `VALIDATION_ERROR`

**Source:** `src/shared/errors/index.ts`

---

### NotFoundError

```typescript
class NotFoundError extends DomainError {
  constructor(
    public readonly entity: string,
    public readonly id: string
  );
}
```

Error code: `NOT_FOUND`

**Source:** `src/shared/errors/index.ts`

---

### BusinessRuleError

```typescript
class BusinessRuleError extends DomainError {
  constructor(
    message: string,
    public readonly rule: string
  );
}
```

Error code: `BUSINESS_RULE_VIOLATION`

**Source:** `src/shared/errors/index.ts`

---

### InvalidStateError

```typescript
class InvalidStateError extends DomainError {
  constructor(
    message: string,
    public readonly currentState: string,
    public readonly expectedState?: string
  );
}
```

Error code: `INVALID_STATE`

**Source:** `src/shared/errors/index.ts`

---

## Utility Types

### Result

Railway-oriented error handling type.

```typescript
type Result<T, E = Error> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly error: E }
```

**Source:** `src/shared/utils/result.ts`

---

### Result Utilities

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `Result.ok` | `value: T` | `Result<T, never>` | Create success result |
| `Result.err` | `error: E` | `Result<never, E>` | Create error result |
| `Result.isOk` | `result: Result<T, E>` | `boolean` | Type guard for success |
| `Result.isErr` | `result: Result<T, E>` | `boolean` | Type guard for error |
| `Result.unwrap` | `result: Result<T, E>` | `T` | Extract value (throws on error) |
| `Result.unwrapOr` | `result: Result<T, E>, defaultValue: T` | `T` | Extract with default |
| `Result.map` | `result: Result<T, E>, fn: (T) => U` | `Result<U, E>` | Transform value |
| `Result.flatMap` | `result: Result<T, E>, fn: (T) => Result<U, E>` | `Result<U, E>` | Chain operations |
| `Result.mapErr` | `result: Result<T, E>, fn: (E) => F` | `Result<T, F>` | Transform error |
| `Result.all` | `results: Result<T, E>[]` | `Result<T[], E>` | Collect results |

**Source:** `src/shared/utils/result.ts`

---

## Domain Service Types

### Weakness

```typescript
interface Weakness {
  readonly dimension: DimensionType;
  readonly severity: 'critical' | 'moderate' | 'mild';
  readonly combinedScore: number;
  readonly reason: string;
}
```

**Source:** `src/domain/services/weakness-detector.service.ts`

---

### WeaknessProfile

```typescript
interface WeaknessProfile {
  readonly weaknesses: Weakness[];
  readonly primaryWeakness: Weakness | null;
  readonly hasFragileConfidence: DimensionType[];
  readonly isDodgingPattern: boolean;
  readonly overallHealth: 'poor' | 'fair' | 'good' | 'excellent';
}
```

**Source:** `src/domain/services/weakness-detector.service.ts`

---

### MasteryLevel

```typescript
type MasteryLevel = 'weak' | 'developing' | 'strong' | 'mastered'
```

**Source:** `src/domain/value-objects/mastery-score.vo.ts`

---

### MasteryScoreProps

```typescript
interface MasteryScoreProps {
  readonly accuracyEwma: number;
  readonly speedEwma: number;
  readonly recentCount: number;
}
```

**Source:** `src/domain/value-objects/mastery-score.vo.ts`

---

## Value Object Types

### ConceptIdValue

Branded string type for ConceptId internals.

```typescript
type ConceptIdValue = string & { readonly [ConceptIdBrand]: typeof ConceptIdBrand }
```

**Source:** `src/domain/value-objects/concept-id.vo.ts`

---

### VariantIdValue

Branded string type for VariantId internals.

```typescript
type VariantIdValue = string & { readonly [VariantIdBrand]: typeof VariantIdBrand }
```

**Source:** `src/domain/value-objects/variant-id.vo.ts`

---

### EventIdValue

Branded string type for EventId internals.

```typescript
type EventIdValue = string & { readonly [EventIdBrand]: typeof EventIdBrand }
```

**Source:** `src/domain/value-objects/event-id.vo.ts`

---

### DimensionTypeValue

Union type for dimension value object.

```typescript
type DimensionTypeValue =
  | 'definition'
  | 'paraphrase'
  | 'example'
  | 'scenario'
  | 'discrimination'
  | 'cloze'
```

**Source:** `src/domain/value-objects/dimension.vo.ts`

---

### ReviewRatingValue

Union type for review result value object.

```typescript
type ReviewRatingValue = 'again' | 'hard' | 'good' | 'easy'
```

**Source:** `src/domain/value-objects/review-result.vo.ts`

---

## Constants

### ALL_DIMENSIONS

Array of all dimension types.

```typescript
const ALL_DIMENSIONS: readonly DimensionType[] = [
  DimensionType.DEFINITION_RECALL,
  DimensionType.PARAPHRASE_RECOGNITION,
  DimensionType.EXAMPLE_CLASSIFICATION,
  DimensionType.SCENARIO_APPLICATION,
  DimensionType.DISCRIMINATION,
  DimensionType.CLOZE_FILL,
]
```

**Source:** `src/shared/constants/dimensions.ts`

---

### ALL_DIFFICULTY_LEVELS

Array of all difficulty levels.

```typescript
const ALL_DIFFICULTY_LEVELS: readonly DifficultyLevel[] = [1, 2, 3, 4, 5]
```

**Source:** `src/shared/constants/dimensions.ts`

---

### DEFAULT_DIFFICULTY

Default starting difficulty.

```typescript
const DEFAULT_DIFFICULTY: DifficultyLevel = 2
```

**Source:** `src/shared/constants/dimensions.ts`

---

### WEAKNESS_THRESHOLD

Mastery threshold for weakness detection.

```typescript
const WEAKNESS_THRESHOLD = 0.7
```

**Source:** `src/shared/constants/dimensions.ts`

---

### EWMA_ALPHA

Default EWMA smoothing factor.

```typescript
const EWMA_ALPHA = 0.15
```

**Source:** `src/shared/constants/dimensions.ts`

---

## Related Documentation

- [Domain Model Reference](./domain-model.md)
- [IPC API Reference](./ipc-api.md)
- [Configuration Reference](./configuration.md)
