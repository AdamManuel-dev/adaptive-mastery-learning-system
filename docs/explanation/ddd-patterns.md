# DDD Patterns Explanation: Modeling the Learning Domain

**Understanding why specific Domain-Driven Design patterns were chosen**

---

## The Domain Model Challenge

Modeling a learning system presents interesting challenges. Unlike typical business applications where the domain is relatively stable (customers, orders, products), a learning system must model cognitive processes, evolving knowledge states, and complex selection algorithms.

Domain-Driven Design provides patterns that help manage this complexity, but applying them requires thoughtful decisions about what belongs where.

---

## Why Concept Is the Aggregate Root

### What Is an Aggregate Root?

In DDD, an aggregate is a cluster of domain objects treated as a single unit for data changes. The aggregate root is the single entity through which all access to the aggregate occurs.

### The Concept Aggregate

In the Adaptive Mastery Learning System, Concept serves as the aggregate root with Variant as a contained entity:

```
Concept (Aggregate Root)
  |
  +-- Variant 1
  +-- Variant 2
  +-- Variant 3
  ...
```

### Why This Structure?

**Invariants Belong Together**

A key DDD principle is that aggregates should enforce invariants. The Concept aggregate enforces:

- Every concept must have at least one variant
- Variants must reference valid dimension types
- Facts used by variants must come from the concept's fact list

If Variant were its own aggregate root, these invariants would be harder to enforce because changes to variants and concepts could happen independently.

**Transactional Boundaries**

Aggregate roots define transactional boundaries. When we modify a concept (adding facts, renaming), we often need to update or regenerate variants. Keeping them in the same aggregate means these operations are atomic.

**Navigation and Loading**

Access to variants always goes through concepts. We never need to load a variant without its parent concept. This aligns with the aggregate pattern: the root is the entry point.

### Alternatives Considered

**Variant as Aggregate Root**

We considered making Variant independent with a reference to Concept. This would allow:
- Loading variants without loading concepts
- More granular updates

But it would complicate:
- Ensuring variants stay consistent with concept facts
- Enforcing per-concept variant constraints
- Understanding the data model (concepts and variants would feel disconnected)

**Flat Structure**

We could avoid aggregates entirely with a simple relational model. This would work but loses the domain modeling benefits:
- No clear place for business rules
- Invariants spread across the codebase
- Harder to reason about data consistency

---

## Value Objects: Immutable Domain Concepts

### What Are Value Objects?

Value objects are domain elements defined by their attributes rather than identity. Two value objects with the same attributes are considered equal.

### Value Objects in This System

#### Dimension

The Dimension value object encapsulates the six cognitive testing dimensions:

```typescript
class Dimension {
  private constructor(private readonly type: DimensionTypeValue) {}

  get displayName(): string { ... }
  get description(): string { ... }
  targetTimeMs(difficulty: number): number { ... }
}
```

**Why a Value Object?**

- Dimensions are enumerated constants, not things with lifecycle
- Two "scenario" dimensions are always equal
- The metadata (display name, target time) is intrinsic to the type
- Behavior (calculating target time) belongs with the data

**Why Not Just an Enum?**

A plain TypeScript enum would be simpler but loses:
- Associated metadata
- Type-safe behavior
- Conversion logic between formats

The value object pattern encapsulates everything about a dimension in one place.

#### Difficulty

The Difficulty value object constrains valid difficulty levels (1-5):

```typescript
class Difficulty {
  private constructor(private readonly value: 1 | 2 | 3 | 4 | 5) {}

  static create(value: number): Result<Difficulty, ValidationError>

  get targetTimeMs(): number { ... }
}
```

**Why a Value Object?**

- Validation is guaranteed: you cannot have a Difficulty of 0 or 6
- Target time calculation is encapsulated
- Type safety prevents passing arbitrary numbers where difficulty is expected

#### ReviewResult

The ReviewResult value object represents the four-point rating scale:

```typescript
enum ReviewResultType {
  AGAIN = 'again',
  HARD = 'hard',
  GOOD = 'good',
  EASY = 'easy',
}

class ReviewResult {
  toScore(): number { ... }
}
```

**Why a Value Object?**

- Mapping to numeric scores belongs with the result type
- Prevents invalid result values
- Self-documenting code: `result.toScore()` is clearer than `ratingToScore(result)`

#### MasteryScore

The MasteryScore value object combines accuracy, speed, and review count:

```typescript
class MasteryScore {
  get combined(): number { ... }
  get isWeak(): boolean { ... }
  get isFragile(): boolean { ... }
  get level(): MasteryLevel { ... }

  withUpdatedAccuracy(newValue: number): MasteryScore { ... }
}
```

**Why a Value Object?**

This is perhaps the most interesting value object because it encapsulates significant domain logic:

- **Derived calculations**: Combined mastery, weakness detection, fragile confidence
- **Immutable updates**: `withUpdatedAccuracy` returns a new instance
- **Semantic meaning**: A MasteryScore is not just three numbers; it represents a learning state

The alternative (storing raw numbers and calculating derived values elsewhere) would scatter domain logic and make it harder to ensure consistency.

### Value Object Design Principles

The value objects in this system follow consistent patterns:

**Static Factory Methods**

```typescript
static create(props: Props): Result<ValueObject, ValidationError>
static of(props: Props): ValueObject  // When validation is guaranteed
```

The `create` method validates input and returns a Result type. The `of` method is for trusted input (e.g., from database).

**Immutability**

Value objects never mutate. Methods like `withUpdatedAccuracy` return new instances. This prevents bugs from unexpected state changes and enables safe sharing.

**Equality by Value**

```typescript
equals(other: MasteryScore): boolean {
  return /* compare all attributes */
}
```

Two value objects with the same attributes are equal, regardless of memory identity.

---

## Repository Pattern: Abstracting Persistence

### What Is the Repository Pattern?

Repositories provide a collection-like interface for accessing domain objects, hiding the details of data storage and retrieval.

### Repository Interfaces in the Domain Layer

The domain layer defines repository interfaces:

```typescript
interface ConceptRepository {
  findById(id: ConceptId): Promise<Concept | null>
  findAll(): Promise<Concept[]>
  save(concept: Concept): Promise<void>
  delete(id: ConceptId): Promise<void>
}
```

**Why Interfaces in Domain, Implementations in Infrastructure?**

This separation enables:

1. **Domain independence**: Domain logic does not know about SQLite, file systems, or APIs
2. **Testing**: Tests can use in-memory implementations
3. **Flexibility**: Database can change without touching domain code
4. **Dependency inversion**: High-level modules do not depend on low-level modules

### Repository Design Decisions

#### Promise-Based Interface

All repository methods return Promises:

```typescript
findById(id: ConceptId): Promise<Concept | null>
```

Even though better-sqlite3 is synchronous, the interface is async because:
- Other implementations might be async (network, IndexedDB)
- Application code does not need to know storage characteristics
- Easier to add caching or other async operations later

#### Null vs Exception for Missing Entities

```typescript
findById(id: ConceptId): Promise<Concept | null>
```

We return null for missing entities rather than throwing because:
- Not finding an entity is often not exceptional
- Callers can decide how to handle missing entities
- Cleaner control flow than try/catch for expected cases

For truly exceptional cases (database corruption, connection failure), implementations throw infrastructure errors.

#### Save vs Create/Update Split

```typescript
save(concept: Concept): Promise<void>
```

A single save method handles both creation and updates (upsert). This simplifies the interface and matches how aggregates work: you get an aggregate, modify it, and save it back. The repository determines whether to insert or update.

### Repository Granularity

We have separate repositories for each aggregate root:

- ConceptRepository
- ScheduleRepository
- MasteryRepository (per-dimension mastery, not an aggregate)
- EventRepository (review events, not an aggregate)

Variant does not have its own repository because variants are accessed through Concept.

---

## Port Definitions: Contracts with the Outside World

### Input Ports (Driving)

Input ports define how the outside world can interact with the application:

```typescript
interface SubmitReviewPort {
  execute(command: SubmitReviewCommand): Promise<ReviewResult>
}

interface GetNextCardPort {
  execute(query: GetNextCardQuery): Promise<CardDTO | null>
}
```

**Why Use Ports?**

Input ports provide:
- Clear documentation of available operations
- Type-safe command and query objects
- Decoupling from specific UI or transport mechanisms

The React UI, IPC handlers, and CLI tools all use the same ports.

### Output Ports (Driven)

Output ports define what the application needs from the outside world:

```typescript
interface LLMGateway {
  generateVariants(
    concept: Concept,
    dimension: Dimension,
    difficulty: Difficulty,
    count: number
  ): Promise<GeneratedVariant[]>
}
```

**Why Gateway vs Repository?**

The naming convention distinguishes:
- **Repository**: For aggregate storage and retrieval
- **Gateway**: For external service integration

This distinction helps developers understand what kind of infrastructure is involved.

---

## Domain Services: Logic Without a Home

### When to Use Domain Services

Domain services handle logic that:
- Does not belong to a single entity
- Involves multiple entities
- Is purely domain-related (not infrastructure)

### Domain Services in This System

#### MasteryCalculator

Handles EWMA calculations and mastery analysis:

```typescript
const MasteryCalculator = {
  updateEwma,
  ratingToScore,
  calculateSpeedScore,
  updateMastery,
  calculateCombinedMastery,
  isFragileConfidence,
  isWeakDimension,
}
```

**Why a Service?**

Mastery calculation involves:
- MasteryScore values
- ReviewResult values
- Difficulty values
- Algorithm constants

No single entity owns this logic. It operates on multiple value objects to produce derived values.

#### CardSelector

Handles weighted card selection:

```typescript
function selectVariantForConcept(
  variants: Variant[],
  mastery: MasteryProfile,
  recentFailures: number
): Variant | null
```

**Why a Service?**

Card selection involves:
- Multiple variants
- The full mastery profile
- Session context (recent failures)
- Complex weight calculations

This is domain logic that spans multiple entities and value objects.

#### WeaknessDetector

Identifies skill gaps and patterns:

```typescript
interface WeaknessDetector {
  detectWeaknesses(profile: MasteryProfile): Weakness[]
  detectFragileConfidence(profile: MasteryProfile): Dimension[]
  detectDodgingPattern(profile: MasteryProfile): boolean
}
```

**Why a Service?**

Pattern detection requires analyzing the full mastery profile to identify specific learning states. This analytical capability belongs in the domain but not in any single entity.

### Stateless by Design

All domain services in this system are stateless. They take input, perform calculations, and return results without maintaining any state between calls. This makes them:
- Easy to test
- Thread-safe (relevant if we ever parallelize)
- Predictable and debuggable

---

## Result Type Pattern

### Why Result Instead of Exceptions?

Value object creation and domain operations use a Result type:

```typescript
type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E }
```

**Benefits of Result**

1. **Explicit error handling**: Callers must handle the error case
2. **Type safety**: The compiler ensures errors are not ignored
3. **No exception overhead**: Results are regular values
4. **Composition**: Results can be chained and transformed

**When We Still Use Exceptions**

Infrastructure errors (database failure, network timeout) still throw because:
- They are truly exceptional
- They typically require different handling (retry, abort, alert)
- Result types would clutter every infrastructure call

---

## Alternatives Not Chosen

### Event Sourcing

Storing all domain events rather than current state. Rejected because:
- Adds complexity without clear benefit for a single-user app
- Makes querying current state more complicated
- Overkill for the problem space

### CQRS (Command Query Responsibility Segregation)

Separate read and write models. We use a light version (separate command and query handlers) but not full CQRS with separate databases because:
- SQLite handles both reads and writes efficiently
- No need for read scaling
- Simpler to reason about and debug

### Active Record Pattern

Entities that know how to persist themselves. Rejected because:
- Couples domain to infrastructure
- Makes testing harder
- Violates single responsibility principle

---

## Summary

The DDD patterns in the Adaptive Mastery Learning System serve specific purposes:

1. **Concept as Aggregate Root**: Enforces invariants and defines transactional boundaries
2. **Value Objects**: Encapsulate domain concepts with behavior and immutability
3. **Repository Pattern**: Abstracts persistence for testability and flexibility
4. **Port Definitions**: Provide clear contracts between layers
5. **Domain Services**: Handle logic that spans multiple entities
6. **Result Type**: Makes error handling explicit and type-safe

These patterns add complexity but pay dividends in:
- Code organization
- Testability
- Maintainability
- Domain expressiveness

The investment is justified by the domain complexity of the adaptive learning system.

---

*See also: [Architecture](./architecture.md) for the overall structural context.*
