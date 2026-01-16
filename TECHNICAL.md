# Technical Architecture Document

**Project:** Adaptive Mastery Learning System
**Version:** 1.0.0
**Date:** 2025-01-16
**Architecture:** Domain-Driven Design + Hexagonal Architecture

---

## 1. Tech Stack

### Core Technologies

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Desktop Runtime** | Electron 34.x | Cross-platform desktop app |
| **Build System** | electron-vite + Vite 6.x | Fast HMR, optimized builds |
| **Language** | TypeScript 5.7 (strict mode) | Type safety |
| **Database** | better-sqlite3 | Local SQLite storage |

### Frontend Stack

| Technology | Purpose | Notes |
|------------|---------|-------|
| **React 19** | UI framework | Functional components only |
| **MUI (Material UI) 6.x** | Component library | Theming, accessibility |
| **Tailwind CSS 3.x** | Utility-first styling | Complements MUI for custom layouts |
| **Jotai 2.x** | State management | Atomic, minimal boilerplate |
| **React Router 7.x** | Navigation | Client-side routing |

### Backend/Main Process

| Technology | Purpose |
|------------|---------|
| **Node.js 20+** | Main process runtime |
| **better-sqlite3** | Synchronous SQLite operations |
| **OpenAI/Anthropic SDK** | LLM card generation |

---

## 2. Architecture Overview

### 2.1 Hexagonal Architecture (Ports & Adapters)

```
┌─────────────────────────────────────────────────────────────────┐
│                        DRIVING ADAPTERS                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   React UI   │  │  IPC Handler │  │   CLI/Test   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         ▼                 ▼                 ▼                   │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║                    INPUT PORTS                            ║ │
│  ║  ReviewPort │ ConceptPort │ MasteryPort │ SchedulePort   ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
│                              │                                  │
│                              ▼                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                  APPLICATION SERVICES                      │ │
│  │  ReviewService │ ConceptService │ MasteryService │ etc.   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│                              ▼                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                     DOMAIN LAYER                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │ │
│  │  │  Entities   │  │   Value     │  │  Domain     │        │ │
│  │  │  Concept    │  │   Objects   │  │  Services   │        │ │
│  │  │  Variant    │  │  Dimension  │  │  Scheduler  │        │ │
│  │  │  Event      │  │  Mastery    │  │  Selector   │        │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│                              ▼                                  │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║                   OUTPUT PORTS                            ║ │
│  ║  ConceptRepository │ EventRepository │ LLMGateway │ etc.  ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
│         │                 │                 │                   │
│         ▼                 ▼                 ▼                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │SQLite Adapter│  │ LLM Adapter  │  │ File Adapter │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                       DRIVEN ADAPTERS                           │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Domain-Driven Design Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  React Components, Jotai Atoms, MUI/Tailwind Styling        │
├─────────────────────────────────────────────────────────────┤
│                    APPLICATION LAYER                         │
│  Use Cases, Application Services, DTOs, Command/Query       │
├─────────────────────────────────────────────────────────────┤
│                      DOMAIN LAYER                           │
│  Entities, Value Objects, Aggregates, Domain Services       │
│  Domain Events, Repository Interfaces (Ports)               │
├─────────────────────────────────────────────────────────────┤
│                   INFRASTRUCTURE LAYER                       │
│  Repository Implementations, Database, External APIs        │
│  IPC Communication, File System, LLM Adapters               │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Directory Structure

```
src/
├── main/                          # Electron main process
│   ├── index.ts                   # Entry point
│   ├── ipc/                       # IPC handlers (driving adapters)
│   │   ├── concept.ipc.ts
│   │   ├── review.ipc.ts
│   │   └── mastery.ipc.ts
│   └── infrastructure/            # Driven adapters
│       ├── database/
│       │   ├── connection.ts      # SQLite connection
│       │   ├── migrations/        # Schema migrations
│       │   └── repositories/      # Repository implementations
│       │       ├── sqlite-concept.repository.ts
│       │       ├── sqlite-variant.repository.ts
│       │       ├── sqlite-event.repository.ts
│       │       ├── sqlite-mastery.repository.ts
│       │       └── sqlite-schedule.repository.ts
│       └── llm/
│           ├── openai.adapter.ts
│           └── anthropic.adapter.ts
│
├── renderer/                      # Electron renderer (React)
│   ├── index.html
│   ├── main.tsx                   # React entry
│   ├── App.tsx                    # Root component + routing
│   ├── components/                # Presentational components
│   │   ├── ui/                    # Generic UI (buttons, cards)
│   │   ├── review/                # Review-specific components
│   │   ├── dashboard/             # Dashboard components
│   │   └── concept/               # Concept editor components
│   ├── pages/                     # Route pages
│   │   ├── ReviewPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ConceptsPage.tsx
│   │   └── SettingsPage.tsx
│   ├── hooks/                     # Custom React hooks
│   │   ├── useReview.ts
│   │   ├── useMastery.ts
│   │   └── useConcepts.ts
│   ├── state/                     # Jotai atoms
│   │   ├── atoms/
│   │   │   ├── review.atoms.ts
│   │   │   ├── mastery.atoms.ts
│   │   │   └── ui.atoms.ts
│   │   └── selectors/
│   │       └── derived.selectors.ts
│   ├── services/                  # Frontend services (IPC calls)
│   │   └── api.ts                 # IPC wrapper
│   └── styles/
│       ├── index.css              # Tailwind imports
│       └── theme.ts               # MUI theme config
│
├── preload/                       # Electron preload scripts
│   └── index.ts                   # Secure IPC bridge
│
├── domain/                        # Pure domain layer (shared)
│   ├── entities/                  # Domain entities
│   │   ├── concept.entity.ts
│   │   ├── variant.entity.ts
│   │   ├── review-event.entity.ts
│   │   └── schedule.entity.ts
│   ├── value-objects/             # Value objects
│   │   ├── dimension.vo.ts
│   │   ├── difficulty.vo.ts
│   │   ├── review-result.vo.ts
│   │   ├── mastery-score.vo.ts
│   │   └── concept-id.vo.ts
│   ├── aggregates/                # Aggregate roots
│   │   └── concept.aggregate.ts
│   ├── services/                  # Domain services
│   │   ├── mastery-calculator.service.ts
│   │   ├── card-selector.service.ts
│   │   ├── weakness-detector.service.ts
│   │   └── scheduler.service.ts
│   ├── events/                    # Domain events
│   │   ├── review-completed.event.ts
│   │   └── mastery-updated.event.ts
│   └── ports/                     # Port interfaces (contracts)
│       ├── input/                 # Driving ports (use cases)
│       │   ├── review.port.ts
│       │   ├── concept.port.ts
│       │   └── mastery.port.ts
│       └── output/                # Driven ports (repositories)
│           ├── concept.repository.ts
│           ├── variant.repository.ts
│           ├── event.repository.ts
│           ├── mastery.repository.ts
│           ├── schedule.repository.ts
│           └── llm-gateway.port.ts
│
├── application/                   # Application services
│   ├── services/
│   │   ├── review.service.ts
│   │   ├── concept.service.ts
│   │   ├── mastery.service.ts
│   │   └── generation.service.ts
│   ├── commands/                  # Command handlers
│   │   ├── submit-review.command.ts
│   │   ├── create-concept.command.ts
│   │   └── generate-variants.command.ts
│   ├── queries/                   # Query handlers
│   │   ├── get-due-cards.query.ts
│   │   ├── get-mastery-profile.query.ts
│   │   └── get-concept-details.query.ts
│   └── dto/                       # Data transfer objects
│       ├── review.dto.ts
│       ├── concept.dto.ts
│       └── mastery.dto.ts
│
└── shared/                        # Shared utilities
    ├── types/                     # Shared TypeScript types
    │   └── index.ts
    ├── constants/                 # App constants
    │   └── dimensions.ts
    └── utils/                     # Pure utility functions
        ├── ewma.ts
        └── id-generator.ts
```

---

## 4. Domain Model

### 4.1 Bounded Context: Learning

```
┌─────────────────────────────────────────────────────────────┐
│                  LEARNING BOUNDED CONTEXT                    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              CONCEPT AGGREGATE                       │    │
│  │  ┌───────────┐                                      │    │
│  │  │  Concept  │ ◄─── Aggregate Root                  │    │
│  │  │  (Entity) │                                      │    │
│  │  └─────┬─────┘                                      │    │
│  │        │ 1:N                                        │    │
│  │        ▼                                            │    │
│  │  ┌───────────┐                                      │    │
│  │  │  Variant  │ ◄─── Entity (within aggregate)       │    │
│  │  │  (Entity) │                                      │    │
│  │  └───────────┘                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  ReviewEvent    │  │    Schedule     │                   │
│  │  (Entity)       │  │    (Entity)     │                   │
│  └─────────────────┘  └─────────────────┘                   │
│                                                              │
│  VALUE OBJECTS:                                              │
│  ┌──────────┐ ┌────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │Dimension │ │ Difficulty │ │ReviewResult │ │MasteryScore│ │
│  └──────────┘ └────────────┘ └─────────────┘ └───────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Entities

#### Concept (Aggregate Root)
```typescript
interface ConceptProps {
  id: ConceptId
  name: string
  definition: string
  facts: string[]
  createdAt: Date
  updatedAt: Date
}

// Invariants:
// - Must have at least one fact
// - Name must be unique within user's concepts
// - Definition must be non-empty
```

#### Variant (Entity within Concept Aggregate)
```typescript
interface VariantProps {
  id: VariantId
  conceptId: ConceptId
  dimension: Dimension
  difficulty: Difficulty
  front: string
  back: string
  hints: string[]
  lastShownAt: Date | null
}

// Invariants:
// - Front and back must be non-empty
// - Difficulty must be 1-5
// - Must reference valid concept
```

#### ReviewEvent (Entity)
```typescript
interface ReviewEventProps {
  id: EventId
  conceptId: ConceptId
  variantId: VariantId
  dimension: Dimension
  difficulty: Difficulty
  result: ReviewResult
  timeMs: number
  hintsUsed: number
  createdAt: Date
}

// Invariants:
// - TimeMs must be positive
// - HintsUsed must be non-negative
```

### 4.3 Value Objects

#### Dimension
```typescript
enum DimensionType {
  DEFINITION_RECALL = 'definition_recall',
  PARAPHRASE_RECOGNITION = 'paraphrase_recognition',
  EXAMPLE_CLASSIFICATION = 'example_classification',
  SCENARIO_APPLICATION = 'scenario_application',
  DISCRIMINATION = 'discrimination',
  CLOZE_FILL = 'cloze_fill',
}

// Value object with display names, descriptions, target times
```

#### Difficulty
```typescript
class Difficulty {
  private constructor(private readonly value: 1 | 2 | 3 | 4 | 5) {}

  static create(value: number): Result<Difficulty, ValidationError>

  get targetTimeMs(): number {
    return [5000, 10000, 20000, 40000, 60000][this.value - 1]
  }
}
```

#### ReviewResult
```typescript
enum ReviewResultType {
  AGAIN = 'again',
  HARD = 'hard',
  GOOD = 'good',
  EASY = 'easy',
}

class ReviewResult {
  toScore(): number {
    return { again: 0, hard: 0.4, good: 0.7, easy: 1.0 }[this.value]
  }
}
```

#### MasteryScore
```typescript
class MasteryScore {
  constructor(
    readonly accuracyEwma: number,  // 0-1
    readonly speedEwma: number,      // 0-1
    readonly recentCount: number
  ) {}

  get combined(): number {
    return 0.7 * this.accuracyEwma + 0.3 * this.speedEwma
  }

  get isWeak(): boolean {
    return this.combined < 0.7
  }

  get isFragile(): boolean {
    return this.accuracyEwma > 0.7 && this.speedEwma < 0.5
  }
}
```

### 4.4 Domain Services

#### MasteryCalculator
```typescript
interface MasteryCalculator {
  updateMastery(
    current: MasteryScore,
    result: ReviewResult,
    timeMs: number,
    difficulty: Difficulty
  ): MasteryScore
}
```

#### CardSelector
```typescript
interface CardSelector {
  selectVariant(
    concept: Concept,
    masteryProfile: MasteryProfile,
    recentEvents: ReviewEvent[]
  ): Variant
}
```

#### WeaknessDetector
```typescript
interface WeaknessDetector {
  detectWeaknesses(profile: MasteryProfile): Weakness[]
  detectFragileConfidence(profile: MasteryProfile): Dimension[]
  detectDodgingPattern(profile: MasteryProfile): boolean
}
```

#### Scheduler
```typescript
interface Scheduler {
  calculateNextReview(
    current: Schedule,
    result: ReviewResult
  ): Schedule

  getDueConcepts(schedules: Schedule[]): ConceptId[]
}
```

---

## 5. Port Definitions

### 5.1 Input Ports (Driving)

```typescript
// Use case: Submit a review answer
interface SubmitReviewPort {
  execute(command: SubmitReviewCommand): Promise<ReviewResult>
}

// Use case: Get next card for review
interface GetNextCardPort {
  execute(query: GetNextCardQuery): Promise<CardDTO | null>
}

// Use case: Create a new concept
interface CreateConceptPort {
  execute(command: CreateConceptCommand): Promise<ConceptDTO>
}

// Use case: Get mastery profile
interface GetMasteryProfilePort {
  execute(): Promise<MasteryProfileDTO>
}
```

### 5.2 Output Ports (Driven)

```typescript
// Repository: Concepts
interface ConceptRepository {
  findById(id: ConceptId): Promise<Concept | null>
  findAll(): Promise<Concept[]>
  save(concept: Concept): Promise<void>
  delete(id: ConceptId): Promise<void>
}

// Repository: Variants
interface VariantRepository {
  findByConceptId(conceptId: ConceptId): Promise<Variant[]>
  findById(id: VariantId): Promise<Variant | null>
  save(variant: Variant): Promise<void>
  updateLastShown(id: VariantId, timestamp: Date): Promise<void>
}

// Repository: Events
interface EventRepository {
  save(event: ReviewEvent): Promise<void>
  findByConceptId(conceptId: ConceptId, limit?: number): Promise<ReviewEvent[]>
  findByDimension(dimension: Dimension, limit?: number): Promise<ReviewEvent[]>
  findRecent(limit: number): Promise<ReviewEvent[]>
}

// Repository: Mastery
interface MasteryRepository {
  findByDimension(dimension: Dimension): Promise<MasteryScore>
  findAll(): Promise<Map<Dimension, MasteryScore>>
  save(dimension: Dimension, score: MasteryScore): Promise<void>
}

// Repository: Schedule
interface ScheduleRepository {
  findByConceptId(conceptId: ConceptId): Promise<Schedule | null>
  findDue(before: Date): Promise<Schedule[]>
  save(schedule: Schedule): Promise<void>
}

// Gateway: LLM
interface LLMGateway {
  generateVariants(
    concept: Concept,
    dimension: Dimension,
    difficulty: Difficulty,
    count: number
  ): Promise<GeneratedVariant[]>
}
```

---

## 6. State Management (Jotai)

### 6.1 Atom Architecture

```typescript
// Primitive atoms (source of truth)
const reviewSessionAtom = atom<ReviewSession | null>(null)
const currentCardAtom = atom<CardDTO | null>(null)
const masteryProfileAtom = atom<MasteryProfile | null>(null)
const conceptsAtom = atom<ConceptDTO[]>([])

// Derived atoms (computed)
const sessionProgressAtom = atom((get) => {
  const session = get(reviewSessionAtom)
  if (!session) return null
  return {
    current: session.completedCount,
    total: session.totalCards,
    percentage: (session.completedCount / session.totalCards) * 100
  }
})

const weakestDimensionAtom = atom((get) => {
  const profile = get(masteryProfileAtom)
  if (!profile) return null
  return Object.entries(profile)
    .sort(([, a], [, b]) => a.combined - b.combined)[0]
})

// Action atoms (side effects)
const submitReviewAtom = atom(
  null,
  async (get, set, result: ReviewResultType) => {
    const card = get(currentCardAtom)
    if (!card) return

    await api.submitReview({ variantId: card.id, result, timeMs: /* timer */ })

    // Refresh state
    const [newCard, newProfile] = await Promise.all([
      api.getNextCard(),
      api.getMasteryProfile()
    ])

    set(currentCardAtom, newCard)
    set(masteryProfileAtom, newProfile)
  }
)
```

### 6.2 Atom Organization

```
state/
├── atoms/
│   ├── review.atoms.ts      # Review session state
│   ├── mastery.atoms.ts     # Mastery profile state
│   ├── concepts.atoms.ts    # Concept list state
│   └── ui.atoms.ts          # UI state (theme, modals)
├── selectors/
│   ├── review.selectors.ts  # Derived review state
│   └── mastery.selectors.ts # Derived mastery state
└── actions/
    ├── review.actions.ts    # Review side effects
    └── concept.actions.ts   # Concept CRUD side effects
```

---

## 7. Styling Strategy

### 7.1 MUI + Tailwind Integration

```typescript
// Theme configuration (MUI)
const theme = createTheme({
  palette: {
    primary: { main: '#3b82f6' },    // Tailwind blue-500
    secondary: { main: '#8b5cf6' },  // Tailwind violet-500
    error: { main: '#ef4444' },      // Tailwind red-500
    success: { main: '#22c55e' },    // Tailwind green-500
    warning: { main: '#f59e0b' },    // Tailwind amber-500
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '0.5rem',
        },
      },
    },
  },
})
```

### 7.2 Usage Guidelines

| Use Case | Technology | Example |
|----------|------------|---------|
| **Complex components** | MUI | Dialogs, Tables, Forms |
| **Layout** | Tailwind | Flexbox, Grid, Spacing |
| **Custom styling** | Tailwind | Colors, Shadows, Animations |
| **Theming** | MUI Theme | Dark/Light mode |
| **Icons** | MUI Icons | @mui/icons-material |

```tsx
// Example: Combining MUI + Tailwind
<Card className="p-6 hover:shadow-lg transition-shadow">
  <CardContent className="flex flex-col gap-4">
    <Typography variant="h5" className="text-gray-900 dark:text-white">
      Card Title
    </Typography>
    <div className="flex gap-2">
      <Button variant="contained" className="flex-1">
        Primary Action
      </Button>
      <Button variant="outlined" className="flex-1">
        Secondary
      </Button>
    </div>
  </CardContent>
</Card>
```

---

## 8. IPC Communication

### 8.1 Type-Safe IPC Channels

```typescript
// Shared channel definitions
type IPCChannels = {
  // Queries
  'concepts:getAll': { args: void; result: ConceptDTO[] }
  'concepts:getById': { args: string; result: ConceptDTO | null }
  'mastery:getProfile': { args: void; result: MasteryProfileDTO }
  'review:getNextCard': { args: void; result: CardDTO | null }
  'schedule:getDueCount': { args: void; result: number }

  // Commands
  'concepts:create': { args: CreateConceptDTO; result: ConceptDTO }
  'concepts:update': { args: UpdateConceptDTO; result: ConceptDTO }
  'concepts:delete': { args: string; result: void }
  'review:submit': { args: SubmitReviewDTO; result: ReviewResultDTO }
  'variants:generate': { args: GenerateVariantsDTO; result: VariantDTO[] }
}
```

### 8.2 Preload Bridge

```typescript
// preload/index.ts
contextBridge.exposeInMainWorld('api', {
  concepts: {
    getAll: () => ipcRenderer.invoke('concepts:getAll'),
    getById: (id: string) => ipcRenderer.invoke('concepts:getById', id),
    create: (dto: CreateConceptDTO) => ipcRenderer.invoke('concepts:create', dto),
    update: (dto: UpdateConceptDTO) => ipcRenderer.invoke('concepts:update', dto),
    delete: (id: string) => ipcRenderer.invoke('concepts:delete', id),
  },
  review: {
    getNextCard: () => ipcRenderer.invoke('review:getNextCard'),
    submit: (dto: SubmitReviewDTO) => ipcRenderer.invoke('review:submit', dto),
  },
  mastery: {
    getProfile: () => ipcRenderer.invoke('mastery:getProfile'),
  },
  // ...
})
```

---

## 9. Testing Strategy

### 9.1 Test Pyramid

```
         ┌─────────────┐
         │    E2E      │  ← Playwright (critical flows)
         │   Tests     │
        ┌┴─────────────┴┐
        │  Integration  │  ← Repository + Service tests
        │    Tests      │
       ┌┴───────────────┴┐
       │   Unit Tests    │  ← Domain logic, Value Objects
       │                 │
       └─────────────────┘
```

### 9.2 Test Organization

```
__tests__/
├── unit/
│   ├── domain/
│   │   ├── entities/
│   │   ├── value-objects/
│   │   └── services/
│   └── application/
│       └── services/
├── integration/
│   ├── repositories/
│   └── ipc/
└── e2e/
    ├── review-flow.spec.ts
    └── concept-crud.spec.ts
```

### 9.3 Test Examples

```typescript
// Unit test: Domain service
describe('MasteryCalculator', () => {
  it('should increase accuracy EWMA on good result', () => {
    const calculator = new MasteryCalculatorImpl()
    const current = new MasteryScore(0.5, 0.5, 10)
    const result = ReviewResult.create('good')

    const updated = calculator.updateMastery(
      current,
      result,
      5000,
      Difficulty.create(1)
    )

    expect(updated.accuracyEwma).toBeGreaterThan(current.accuracyEwma)
  })
})

// Integration test: Repository
describe('SQLiteConceptRepository', () => {
  let repository: ConceptRepository
  let db: Database

  beforeEach(() => {
    db = new Database(':memory:')
    runMigrations(db)
    repository = new SQLiteConceptRepository(db)
  })

  it('should persist and retrieve concept', async () => {
    const concept = Concept.create({
      name: 'Test Concept',
      definition: 'A test definition',
      facts: ['Fact 1', 'Fact 2'],
    })

    await repository.save(concept)
    const retrieved = await repository.findById(concept.id)

    expect(retrieved).toEqual(concept)
  })
})
```

---

## 10. Error Handling

### 10.1 Result Type Pattern

```typescript
type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E }

// Usage in domain
class Concept {
  static create(props: CreateConceptProps): Result<Concept, ValidationError> {
    if (!props.name.trim()) {
      return { success: false, error: new ValidationError('Name is required') }
    }
    if (props.facts.length === 0) {
      return { success: false, error: new ValidationError('At least one fact required') }
    }
    return { success: true, value: new Concept(props) }
  }
}
```

### 10.2 Error Types

```typescript
// Domain errors
class DomainError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message)
  }
}

class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR')
  }
}

class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`, 'NOT_FOUND')
  }
}

// Application errors
class ApplicationError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message)
  }
}

// Infrastructure errors
class InfrastructureError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message)
  }
}
```

---

## 11. Configuration

### 11.1 Config Schema

```typescript
interface AppConfig {
  database: {
    path: string        // Default: './data/learning.db'
  }
  mastery: {
    ewmaAlpha: number   // Default: 0.15
    weaknessThreshold: number  // Default: 0.7
  }
  scheduler: {
    defaultEaseFactor: number  // Default: 2.5
    minEaseFactor: number      // Default: 1.3
  }
  llm: {
    provider: 'openai' | 'anthropic' | 'ollama'
    apiKey?: string
    model?: string
    baseUrl?: string    // For Ollama
  }
  review: {
    sessionSize: number        // Default: 25
    maxSingleDimensionPercent: number  // Default: 0.7
    maintenanceRepPercent: number      // Default: 0.2
    maxConsecutiveSameDimension: number // Default: 4
    frustrationThreshold: number       // Default: 3
  }
}
```

### 11.2 Config File

```json
{
  "database": {
    "path": "./data/learning.db"
  },
  "mastery": {
    "ewmaAlpha": 0.15,
    "weaknessThreshold": 0.7
  },
  "llm": {
    "provider": "openai",
    "apiKey": "${OPENAI_API_KEY}",
    "model": "gpt-4o-mini"
  },
  "review": {
    "sessionSize": 25
  }
}
```

---

## 12. Development Workflow

### 12.1 Commands

```bash
# Development
npm run dev          # Start Electron with hot reload

# Quality
npm run typecheck    # TypeScript check
npm run lint         # ESLint
npm run lint:fix     # ESLint with auto-fix
npm run format       # Prettier format
npm run test         # Jest tests
npm run test:watch   # Jest watch mode
npm run test:coverage # Coverage report

# Build
npm run build        # Production build
npm run preview      # Preview production build
```

### 12.2 Git Workflow

```
main
  └── feature/xxx
        └── PR → Code Review → Merge
```

---

## 13. Implementation Order

### Phase 1: Foundation
1. Project setup (package.json, tsconfig, electron-vite)
2. Domain value objects (Dimension, Difficulty, ReviewResult)
3. Domain entities (Concept, Variant, ReviewEvent)
4. Database schema and migrations
5. Repository implementations

### Phase 2: Core Features
1. SM-2 Scheduler service
2. Mastery calculator service
3. Basic Review UI
4. Concept CRUD UI
5. IPC handlers

### Phase 3: Adaptation
1. Weakness detector service
2. Card selector service
3. Safety rails implementation
4. Dashboard with mastery visualization

### Phase 4: LLM Integration
1. LLM gateway interface
2. OpenAI/Anthropic adapters
3. Card generation service
4. Generation UI

### Phase 5: Polish
1. Trend tracking
2. Import/export
3. Settings UI
4. Testing and bug fixes

---

## 14. Code Conventions

### 14.1 Naming

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `mastery-calculator.service.ts` |
| Classes | PascalCase | `MasteryCalculator` |
| Interfaces | PascalCase with suffix | `ConceptRepository` |
| Functions | camelCase | `calculateNextReview` |
| Constants | SCREAMING_SNAKE | `MAX_DIFFICULTY` |
| Types | PascalCase | `ReviewResultType` |
| Atoms | camelCase + Atom suffix | `masteryProfileAtom` |

### 14.2 File Headers

```typescript
/**
 * @fileoverview Mastery calculation domain service
 * @module domain/services/mastery-calculator
 * @lastmodified 2025-01-16T00:00:00Z
 *
 * Implements EWMA-based mastery scoring with accuracy and speed components.
 * Used by the card selector to determine weakness-based prioritization.
 */
```

### 14.3 Import Order

```typescript
// 1. Node.js built-ins
import { resolve } from 'path'

// 2. External packages
import { atom } from 'jotai'
import { Button } from '@mui/material'

// 3. Internal - Domain
import { Concept } from '@/domain/entities/concept.entity'

// 4. Internal - Application
import { ReviewService } from '@/application/services/review.service'

// 5. Internal - UI
import { CardDisplay } from '@/renderer/components/review/CardDisplay'

// 6. Types
import type { ConceptDTO } from '@/application/dto/concept.dto'
```

---

**Document Version:** 1.0.0
**Last Updated:** 2025-01-16
**Next Review:** After Phase 1 completion
