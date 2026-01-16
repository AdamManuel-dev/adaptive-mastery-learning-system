# Domain Model Reference

Technical specifications for the Adaptive Mastery Learning System domain model.

---

## Bounded Context

**Name:** Learning
**Purpose:** Manage flashcard-based adaptive learning with mastery tracking

---

## Aggregate: Concept

The Concept aggregate is the primary aggregate root in the Learning bounded context.

### Aggregate Root: Concept

| Property | Type | Constraints | Description |
|----------|------|-------------|-------------|
| `id` | `ConceptId` | Required, UUID | Unique identifier |
| `name` | `string` | Required, unique, non-empty | Human-readable term name |
| `definition` | `string` | Required, non-empty | Canonical definition |
| `facts` | `readonly string[]` | Minimum 1 element | Supporting facts and key points |
| `createdAt` | `Date` | Required | Creation timestamp |
| `updatedAt` | `Date` | Required | Last modification timestamp |

**Invariants:**
- Must have at least one fact
- Name must be unique within user's concepts
- Definition must be non-empty

**Source:** `src/shared/types/core.ts`

---

### Entity: Variant

Variants belong to the Concept aggregate and represent different question types for testing a concept.

| Property | Type | Constraints | Description |
|----------|------|-------------|-------------|
| `id` | `VariantId` | Required, UUID | Unique identifier |
| `conceptId` | `ConceptId` | Required, FK | Reference to parent concept |
| `dimension` | `DimensionType` | Required, enum | Cognitive dimension tested |
| `difficulty` | `DifficultyLevel` | Required, 1-5 | Difficulty level |
| `front` | `string` | Required, non-empty | Question or prompt |
| `back` | `string` | Required, non-empty | Correct answer |
| `hints` | `readonly string[]` | Optional | Progressive hints |
| `lastShownAt` | `Date \| null` | Optional | Last display timestamp |

**Invariants:**
- Front and back must be non-empty
- Difficulty must be integer 1-5
- Must reference valid concept

**Source:** `src/shared/types/core.ts`

---

## Entity: ReviewEvent

Standalone entity capturing review interactions. Immutable after creation.

| Property | Type | Constraints | Description |
|----------|------|-------------|-------------|
| `id` | `EventId` | Required, UUID | Unique identifier |
| `conceptId` | `ConceptId` | Required, FK | Reviewed concept |
| `variantId` | `VariantId` | Required, FK | Reviewed variant |
| `dimension` | `DimensionType` | Required | Dimension tested |
| `difficulty` | `DifficultyLevel` | Required, 1-5 | Variant difficulty |
| `result` | `ReviewResultType` | Required | User's self-assessment |
| `timeMs` | `number` | Required, positive | Response time in milliseconds |
| `hintsUsed` | `number` | Required, >= 0 | Number of hints revealed |
| `createdAt` | `Date` | Required | Review timestamp |

**Invariants:**
- `timeMs` must be positive
- `hintsUsed` must be non-negative

**Source:** `src/shared/types/core.ts`

---

## Entity: ScheduleEntry

Tracks SRS scheduling state for each concept.

| Property | Type | Constraints | Description |
|----------|------|-------------|-------------|
| `conceptId` | `ConceptId` | Required, PK | Scheduled concept |
| `dueAt` | `Date` | Required | Next review due date |
| `intervalDays` | `number` | Required, >= 1 | Current interval in days |
| `easeFactor` | `number` | Required, 1.3-2.5 | SM-2 ease factor |

**Source:** `src/shared/types/core.ts`

---

## Value Objects

### ConceptId

Branded type for type-safe concept identification.

| Property | Type | Description |
|----------|------|-------------|
| `value` | `ConceptIdValue` | Underlying string (UUID format) |

**Static Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `create` | `value?: string` | `ConceptId` | Creates new ID (generates UUID if not provided) |
| `fromString` | `value: string` | `Result<ConceptId, ValidationError>` | Validates and creates from string |
| `of` | `value: string` | `ConceptId` | Creates from trusted string |

**Instance Methods:**

| Method | Returns | Description |
|--------|---------|-------------|
| `equals(other)` | `boolean` | Equality comparison |
| `toString()` | `string` | String representation |
| `toJSON()` | `string` | JSON serialization |
| `isUUID` | `boolean` | UUID format validation |

**Source:** `src/domain/value-objects/concept-id.vo.ts`

---

### VariantId

Branded type for type-safe variant identification. Same API as `ConceptId`.

**Source:** `src/domain/value-objects/variant-id.vo.ts`

---

### EventId

Branded type for type-safe event identification. Same API as `ConceptId`.

**Source:** `src/domain/value-objects/event-id.vo.ts`

---

### Dimension

Value object representing cognitive testing dimensions.

| Property | Type | Description |
|----------|------|-------------|
| `value` | `DimensionTypeValue` | Raw dimension type string |
| `displayName` | `string` | Human-readable name |
| `description` | `string` | Detailed description |

**DimensionType Values:**

| Value | Display Name | Description | Base Target Time (ms) |
|-------|--------------|-------------|----------------------|
| `definition` | Definition Recall | Recall exact definition from term | 5000 |
| `paraphrase` | Paraphrase Recognition | Recognize correct restatements | 8000 |
| `example` | Example Classification | Identify examples vs non-examples | 10000 |
| `scenario` | Scenario Application | Apply to novel scenarios | 15000 |
| `discrimination` | Discrimination | Distinguish from similar concepts | 12000 |
| `cloze` | Cloze Fill | Complete sentences with missing terms | 6000 |

**Static Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `fromString` | `value: string` | `Result<Dimension, ValidationError>` | Parse from string |
| `of` | `type: DimensionTypeValue` | `Dimension` | Create from known type |
| `fromSharedType` | `sharedType: SharedDimensionType` | `Dimension` | Convert from core enum |
| `all` | - | `Dimension[]` | All available dimensions |

**Instance Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `targetTimeMs` | `difficulty: number` | `number` | Target time for difficulty |
| `toSharedType` | - | `SharedDimensionType` | Convert to core enum |
| `equals` | `other: Dimension` | `boolean` | Equality comparison |
| `toString` | - | `string` | String representation |

**Difficulty Multipliers:**

| Difficulty | Multiplier |
|------------|------------|
| 1 | 0.5 |
| 2 | 0.75 |
| 3 | 1.0 |
| 4 | 1.5 |
| 5 | 2.0 |

**Source:** `src/domain/value-objects/dimension.vo.ts`

---

### Difficulty

Value object for card difficulty levels (1-5 scale).

| Property | Type | Description |
|----------|------|-------------|
| `value` | `DifficultyLevel` | Numeric level (1-5) |
| `targetTimeMs` | `number` | Target response time |
| `label` | `string` | Human-readable label |

**DifficultyLevel Values:**

| Level | Label | Target Time (ms) |
|-------|-------|------------------|
| 1 | Very Easy | 5000 |
| 2 | Easy | 10000 |
| 3 | Medium | 20000 |
| 4 | Hard | 40000 |
| 5 | Very Hard | 60000 |

**Static Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `create` | `value: number` | `Result<Difficulty, ValidationError>` | Create with validation |
| `of` | `level: DifficultyLevel` | `Difficulty` | Create from known level |
| `default` | - | `Difficulty` | Returns level 3 (Medium) |
| `easiest` | - | `Difficulty` | Returns level 1 |
| `hardest` | - | `Difficulty` | Returns level 5 |

**Instance Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `isHarderThan` | `other: Difficulty` | `boolean` | Compare difficulty |
| `isEasierThan` | `other: Difficulty` | `boolean` | Compare difficulty |
| `harder` | - | `Difficulty` | Next harder level (capped at 5) |
| `easier` | - | `Difficulty` | Next easier level (capped at 1) |
| `equals` | `other: Difficulty` | `boolean` | Equality comparison |
| `toString` | - | `string` | String representation |

**Source:** `src/domain/value-objects/difficulty.vo.ts`

---

### ReviewResult

Value object for flashcard review ratings.

| Property | Type | Description |
|----------|------|-------------|
| `value` | `ReviewRatingValue` | Raw rating string |

**ReviewRating Values:**

| Value | Score | Pass | Failure | Struggle | Description |
|-------|-------|------|---------|----------|-------------|
| `again` | 0.0 | No | Yes | Yes | Complete failure to recall |
| `hard` | 0.4 | No | No | Yes | Recalled with difficulty |
| `good` | 0.7 | Yes | No | No | Correct with acceptable effort |
| `easy` | 1.0 | Yes | No | No | Effortless recall |

**Static Constants:**

| Constant | Description |
|----------|-------------|
| `ReviewResult.AGAIN` | Singleton for 'again' |
| `ReviewResult.HARD` | Singleton for 'hard' |
| `ReviewResult.GOOD` | Singleton for 'good' |
| `ReviewResult.EASY` | Singleton for 'easy' |

**Static Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `fromString` | `value: string` | `Result<ReviewResult, ValidationError>` | Parse from string |
| `of` | `rating: ReviewRatingValue` | `ReviewResult` | Get singleton instance |
| `all` | - | `ReviewResult[]` | All possible results |

**Instance Methods:**

| Method | Returns | Description |
|--------|---------|-------------|
| `toScore()` | `number` | Numeric score for calculations |
| `isPass()` | `boolean` | True if good or easy |
| `isFailure()` | `boolean` | True if again |
| `isStruggle()` | `boolean` | True if again or hard |
| `equals(other)` | `boolean` | Equality comparison |
| `toString()` | `string` | String representation |

**Source:** `src/domain/value-objects/review-result.vo.ts`

---

### MasteryScore

Value object for dimension mastery tracking using EWMA.

| Property | Type | Constraints | Description |
|----------|------|-------------|-------------|
| `accuracyEwma` | `number` | 0-1 | EWMA of accuracy |
| `speedEwma` | `number` | 0-1 | EWMA of speed |
| `recentCount` | `number` | >= 0, integer | Reviews contributing to score |

**Derived Properties:**

| Property | Type | Formula | Description |
|----------|------|---------|-------------|
| `combined` | `number` | `0.7 * accuracy + 0.3 * speed` | Combined mastery score |
| `isWeak` | `boolean` | `combined < 0.7` | Needs more practice |
| `isFragile` | `boolean` | `accuracy > 0.7 && speed < 0.5` | Knows but lacks automaticity |
| `level` | `MasteryLevel` | See thresholds | Classification level |
| `percentage` | `number` | `combined * 100` | Score as percentage |

**MasteryLevel Thresholds:**

| Level | Combined Score Range |
|-------|---------------------|
| `weak` | < 0.5 |
| `developing` | 0.5 - 0.7 |
| `strong` | 0.7 - 0.85 |
| `mastered` | >= 0.85 |

**Static Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `create` | `props: MasteryScoreProps` | `Result<MasteryScore, ValidationError>` | Create with validation |
| `of` | `props: MasteryScoreProps` | `MasteryScore` | Create from trusted values |
| `initial` | - | `MasteryScore` | Default (0.5, 0.5, 0) |

**Instance Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `withUpdatedAccuracy` | `newValue: number, alpha?: number` | `MasteryScore` | New with updated accuracy |
| `withUpdatedSpeed` | `newValue: number, alpha?: number` | `MasteryScore` | New with updated speed |
| `withUpdatedBoth` | `accuracy: number, speed: number, alpha?: number` | `MasteryScore` | New with both updated |
| `equals` | `other: MasteryScore` | `boolean` | Equality comparison |
| `toProps` | - | `MasteryScoreProps` | Serialize to plain object |
| `toString` | - | `string` | Human-readable representation |

**Constants:**

| Constant | Value | Description |
|----------|-------|-------------|
| `DEFAULT_ALPHA` | 0.15 | Default EWMA smoothing factor |

**Source:** `src/domain/value-objects/mastery-score.vo.ts`

---

## Domain Services

### MasteryCalculator

Pure functions for mastery calculations.

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `updateEwma` | `current: number, newValue: number, alpha?: number` | `number` | Update EWMA value |
| `ratingToScore` | `result: ReviewResultType` | `number` | Convert rating to score |
| `calculateSpeedScore` | `timeMs: number, difficulty: DifficultyLevel` | `number` | Calculate speed score |
| `updateMastery` | `current: DimensionMastery, result: ReviewResultType, timeMs: number, difficulty: DifficultyLevel` | `DimensionMastery` | Full mastery update |
| `calculateCombinedMastery` | `mastery: DimensionMastery` | `number` | Combined score |
| `isFragileConfidence` | `mastery: DimensionMastery` | `boolean` | Detect fragile pattern |
| `isWeakDimension` | `mastery: DimensionMastery, threshold?: number` | `boolean` | Check weakness |
| `createInitialMastery` | - | `DimensionMastery` | Create default mastery |

**Constants:**

| Constant | Value | Description |
|----------|-------|-------------|
| `DEFAULT_ALPHA` | 0.15 | EWMA smoothing factor |
| `DEFAULT_WEAK_THRESHOLD` | 0.7 | Weakness threshold |
| `ACCURACY_WEIGHT` | 0.7 | Weight for accuracy in combined |
| `SPEED_WEIGHT` | 0.3 | Weight for speed in combined |

**Target Times by Difficulty:**

| Difficulty | Target Time (ms) |
|------------|------------------|
| 1 | 5000 |
| 2 | 10000 |
| 3 | 20000 |
| 4 | 40000 |
| 5 | 60000 |

**Speed Score Formula:**
```
score = 1 - clamp(timeMs / targetMs, 0, 2) / 2
```

- Score 1.0 when instant (0ms)
- Score 0.5 when at target time
- Score 0.0 when at 2x target or slower

**Source:** `src/domain/services/mastery-calculator.service.ts`

---

### Scheduler

SM-2 spaced repetition scheduling service.

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `calculateNextInterval` | `currentInterval: number, easeFactor: number, result: ReviewResultType` | `number` | Calculate next interval |
| `updateEaseFactor` | `current: number, result: ReviewResultType` | `number` | Update ease factor |
| `scheduleNextReview` | `current: ScheduleEntry, result: ReviewResultType` | `ScheduleEntry` | Full schedule update |
| `createInitialSchedule` | `conceptId: ConceptId` | `ScheduleEntry` | Create initial schedule |
| `isOverdue` | `schedule: ScheduleEntry` | `boolean` | Check if due |
| `getOverdueDays` | `schedule: ScheduleEntry` | `number` | Days overdue |

**SM-2 Constants:**

| Constant | Value | Description |
|----------|-------|-------------|
| `MIN_EASE_FACTOR` | 1.3 | Minimum ease factor |
| `MAX_EASE_FACTOR` | 2.5 | Maximum ease factor |
| `DEFAULT_EASE_FACTOR` | 2.5 | Initial ease factor |
| `MIN_INTERVAL_DAYS` | 1 | Minimum interval |
| `HARD_INTERVAL_MULTIPLIER` | 1.2 | Multiplier for hard |

**Ease Factor Adjustments:**

| Result | Adjustment |
|--------|------------|
| `easy` | +0.15 |
| `good` | 0 |
| `hard` | -0.15 |
| `again` | -0.2 |

**Interval Calculation:**

| Result | Formula |
|--------|---------|
| `easy` | `interval * easeFactor` |
| `good` | `interval * easeFactor` |
| `hard` | `interval * 1.2` |
| `again` | `1` (reset) |

**Source:** `src/domain/services/scheduler.service.ts`

---

### CardSelector

Adaptive variant selection service.

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `calculateWeaknessBoost` | `mastery: DimensionMastery` | `number` | Weakness priority boost |
| `calculateNoveltyBoost` | `lastShownAt: Date \| null` | `number` | Novelty/staleness boost |
| `calculateAntiFrustrationPenalty` | `consecutiveFailures: number` | `number` | Frustration penalty |
| `calculateVariantWeight` | `variant: Variant, mastery: MasteryProfile, consecutiveFailures: number` | `number` | Combined selection weight |
| `weightedRandomSelect` | `items: T[], weights: number[]` | `T \| null` | Weighted random selection |
| `selectVariantForConcept` | `variants: Variant[], mastery: MasteryProfile, recentFailures: number` | `Variant \| null` | Select next variant |
| `enforceSessionDimensionCap` | `selectedDimensions: DimensionType[], maxPercentage?: number` | `boolean` | Check dimension cap |
| `shouldInsertConfidenceCard` | `consecutiveFailures: number` | `boolean` | Check frustration trigger |

**Weakness Boost:**
- Combined mastery < 0.7: `1 + 2 * (0.7 - combined)` (range: 1.0 - 2.4)
- Combined mastery >= 0.7: `0.9` (slight penalty)

**Novelty Boost:**

| Condition | Boost |
|-----------|-------|
| Never shown | 2.0 |
| > 7 days ago | 1.5 |
| 3-7 days ago | 1.2 |
| < 3 days ago | 0.8 |

**Anti-Frustration Penalty:**

| Consecutive Failures | Penalty |
|---------------------|---------|
| 0 | 1.0 |
| 1 | 0.8 |
| 2 | 0.6 |
| >= 3 | 0.3 |

**Source:** `src/domain/services/card-selector.service.ts`

---

### WeaknessDetector

Weakness detection and analysis service.

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `calculateCombinedScore` | `mastery: DimensionMastery` | `number` | Combined mastery score |
| `detectWeakDimension` | `profile: MasteryProfile, minSampleSize?: number` | `Weakness[]` | Find weak dimensions |
| `detectFragileConfidence` | `profile: MasteryProfile` | `DimensionType[]` | Find fragile dimensions |
| `detectDodgingPattern` | `profile: MasteryProfile` | `boolean` | Detect avoidance pattern |
| `analyzeWeaknesses` | `profile: MasteryProfile` | `WeaknessProfile` | Full weakness analysis |
| `getSuggestion` | `profile: WeaknessProfile` | `string` | Human-readable suggestion |
| `shouldPrioritizeDimension` | `profile: MasteryProfile, dimension: DimensionType` | `boolean` | Quick priority check |

**Weakness Interface:**

| Property | Type | Description |
|----------|------|-------------|
| `dimension` | `DimensionType` | Weak dimension |
| `severity` | `'critical' \| 'moderate' \| 'mild'` | Severity level |
| `combinedScore` | `number` | Combined mastery score |
| `reason` | `string` | Human-readable explanation |

**Severity Thresholds:**

| Severity | Combined Score Range |
|----------|---------------------|
| `critical` | < 0.4 |
| `moderate` | 0.4 - 0.55 |
| `mild` | 0.55 - 0.7 |

**WeaknessProfile Interface:**

| Property | Type | Description |
|----------|------|-------------|
| `weaknesses` | `Weakness[]` | All weaknesses (sorted worst first) |
| `primaryWeakness` | `Weakness \| null` | Most critical weakness |
| `hasFragileConfidence` | `DimensionType[]` | Fragile dimensions |
| `isDodgingPattern` | `boolean` | Avoidance detected |
| `overallHealth` | `'poor' \| 'fair' \| 'good' \| 'excellent'` | Health assessment |

**Overall Health Thresholds:**

| Health | Average Score Range |
|--------|-------------------|
| `excellent` | >= 0.85 |
| `good` | 0.7 - 0.85 |
| `fair` | 0.5 - 0.7 |
| `poor` | < 0.5 |

**Dodging Pattern Detection:**
- Definition recall score > 0.8
- Average of other dimensions < 0.6

**Source:** `src/domain/services/weakness-detector.service.ts`

---

## Port Definitions

### Input Ports (Driving)

Interfaces defining use cases that drive the application.

#### SubmitReviewPort

| Method | Parameters | Returns |
|--------|------------|---------|
| `execute` | `command: SubmitReviewCommand` | `Promise<ReviewResult>` |

#### GetNextCardPort

| Method | Parameters | Returns |
|--------|------------|---------|
| `execute` | `query: GetNextCardQuery` | `Promise<CardDTO \| null>` |

#### CreateConceptPort

| Method | Parameters | Returns |
|--------|------------|---------|
| `execute` | `command: CreateConceptCommand` | `Promise<ConceptDTO>` |

#### GetMasteryProfilePort

| Method | Parameters | Returns |
|--------|------------|---------|
| `execute` | - | `Promise<MasteryProfileDTO>` |

---

### Output Ports (Driven)

Interfaces defining infrastructure dependencies.

#### ConceptRepository

| Method | Parameters | Returns |
|--------|------------|---------|
| `findById` | `id: ConceptId` | `Promise<Concept \| null>` |
| `findAll` | - | `Promise<Concept[]>` |
| `save` | `concept: Concept` | `Promise<void>` |
| `delete` | `id: ConceptId` | `Promise<void>` |

#### VariantRepository

| Method | Parameters | Returns |
|--------|------------|---------|
| `findByConceptId` | `conceptId: ConceptId` | `Promise<Variant[]>` |
| `findById` | `id: VariantId` | `Promise<Variant \| null>` |
| `save` | `variant: Variant` | `Promise<void>` |
| `updateLastShown` | `id: VariantId, timestamp: Date` | `Promise<void>` |

#### EventRepository

| Method | Parameters | Returns |
|--------|------------|---------|
| `save` | `event: ReviewEvent` | `Promise<void>` |
| `findByConceptId` | `conceptId: ConceptId, limit?: number` | `Promise<ReviewEvent[]>` |
| `findByDimension` | `dimension: Dimension, limit?: number` | `Promise<ReviewEvent[]>` |
| `findRecent` | `limit: number` | `Promise<ReviewEvent[]>` |

#### MasteryRepository

| Method | Parameters | Returns |
|--------|------------|---------|
| `findByDimension` | `dimension: Dimension` | `Promise<MasteryScore>` |
| `findAll` | - | `Promise<Map<Dimension, MasteryScore>>` |
| `save` | `dimension: Dimension, score: MasteryScore` | `Promise<void>` |

#### ScheduleRepository

| Method | Parameters | Returns |
|--------|------------|---------|
| `findByConceptId` | `conceptId: ConceptId` | `Promise<Schedule \| null>` |
| `findDue` | `before: Date` | `Promise<Schedule[]>` |
| `save` | `schedule: Schedule` | `Promise<void>` |

#### LLMGateway

| Method | Parameters | Returns |
|--------|------------|---------|
| `generateVariants` | `concept: Concept, dimension: Dimension, difficulty: Difficulty, count: number` | `Promise<GeneratedVariant[]>` |

---

## Related Documentation

- [Database Schema Reference](./database-schema.md)
- [IPC API Reference](./ipc-api.md)
- [Type Definitions Reference](./types.md)
- [Configuration Reference](./configuration.md)
