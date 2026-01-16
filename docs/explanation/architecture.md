# Architecture Explanation: Why Hexagonal Architecture and DDD

**Understanding the structural choices that shape the Adaptive Mastery Learning System**

---

## The Problem We Needed to Solve

Building a spaced repetition system that goes beyond simple flashcard drilling requires architectural thinking that most SRS applications skip entirely. Traditional flashcard apps are essentially CRUD applications with a scheduling algorithm bolted on. The Adaptive Mastery Learning System demanded something more sophisticated because the core challenge is fundamentally different: we are not just storing and retrieving cards, we are modeling a complex learning process with multiple interacting subsystems.

Consider what happens during a single review:

1. The system must select which variant to show based on mastery state
2. The user's response triggers mastery calculations across multiple dimensions
3. The scheduler must update its model of long-term retention
4. Safety rails must monitor for frustration patterns
5. The UI must reflect all these state changes transparently

This is not a CRUD problem. It is a domain modeling problem.

---

## Why Domain-Driven Design

### The Complexity Threshold

Eric Evans introduced Domain-Driven Design specifically for applications where the domain complexity exceeds the technical complexity. Most flashcard applications do not cross this threshold because they model a simple domain: cards have fronts and backs, and a scheduling algorithm determines when to show them.

The Adaptive Mastery Learning System crosses this threshold because:

- **Six cognitive dimensions** create a multi-dimensional skill model per concept
- **Mastery calculation** involves statistical methods (EWMA) with domain-specific interpretations
- **Card selection** depends on weakness detection, novelty, and anti-frustration rules
- **Safety rails** encode pedagogical knowledge about learner psychology

Each of these areas contains rich domain logic that deserves careful modeling. DDD gives us the vocabulary and patterns to organize this complexity.

### Ubiquitous Language

DDD encourages developing a shared language between developers and domain experts. In this project, terms like "dimension," "mastery," "weakness," "fragile confidence," and "confidence card" have specific meanings that map directly to code constructs. When the code says `isFragileConfidence(mastery)`, it means exactly what a learning scientist would understand: high accuracy but slow response, indicating knowledge that has not yet become automatic.

This alignment between language and implementation reduces cognitive overhead and makes the system more maintainable.

---

## Why Hexagonal Architecture (Ports and Adapters)

### The Independence Principle

Hexagonal Architecture, introduced by Alistair Cockburn, solves a fundamental problem: how do we keep domain logic independent from infrastructure concerns? The Adaptive Mastery Learning System benefits enormously from this separation for several reasons.

**Infrastructure Will Change**

The current implementation uses:
- SQLite via better-sqlite3 for persistence
- Electron for desktop deployment
- OpenAI/Anthropic APIs for LLM card generation

None of these choices are permanent. We might want to:
- Add cloud sync (different database)
- Ship a web version (no Electron)
- Support local LLMs via Ollama
- Add a mobile companion app

Hexagonal Architecture means these changes affect only the adapters, not the domain logic. The mastery calculator does not know or care whether data comes from SQLite or PostgreSQL or a REST API.

**Testing Without Infrastructure**

The domain layer can be tested with pure unit tests because it has no dependencies on infrastructure. The mastery calculation tests do not need a database. The card selector tests do not need an Electron process. This makes tests fast, reliable, and focused on the actual business logic.

### Driving vs Driven Adapters

The architecture distinguishes between two types of adapters:

**Driving Adapters** initiate action into the system:
- React UI components that call application services
- IPC handlers that respond to renderer requests
- CLI tools for testing and administration

**Driven Adapters** are called by the system to perform work:
- Repository implementations that persist data
- LLM gateways that generate card content
- File system adapters for import/export

This distinction clarifies responsibilities. Driving adapters know about the application layer but not the domain. Driven adapters implement interfaces defined in the domain layer.

---

## The Layer Structure

### Presentation Layer

The React frontend with Jotai for state management lives here. This layer is responsible for:
- Rendering the UI based on current state
- Capturing user input
- Calling the application layer through IPC

The presentation layer has no business logic. It does not know how mastery is calculated or how cards are selected. It receives DTOs (Data Transfer Objects) and displays them.

### Application Layer

Application services orchestrate use cases by coordinating between domain services and repositories. A typical application service:

1. Receives a command or query
2. Retrieves necessary entities from repositories
3. Invokes domain services to perform business logic
4. Persists changes through repositories
5. Returns results as DTOs

The application layer handles transactions, logging, and error conversion. It does not contain business rules.

### Domain Layer

This is the heart of the system. The domain layer contains:

**Entities**: Objects with identity that persist over time
- Concept (aggregate root)
- Variant
- ReviewEvent
- Schedule

**Value Objects**: Immutable objects defined by their attributes
- Dimension
- Difficulty
- ReviewResult
- MasteryScore

**Domain Services**: Business logic that does not belong to a single entity
- MasteryCalculator
- CardSelector
- WeaknessDetector
- Scheduler

**Ports**: Interfaces that define what the domain needs from the outside world
- ConceptRepository
- VariantRepository
- LLMGateway

The domain layer has no dependencies on any other layer. It is pure TypeScript with no imports from infrastructure, application, or presentation code.

### Infrastructure Layer

Concrete implementations of the ports defined in the domain layer:
- SQLite repositories
- LLM adapters (OpenAI, Anthropic)
- IPC communication
- File system operations

Infrastructure code is allowed to be "ugly" with framework-specific concerns because it is isolated from the business logic.

---

## Trade-offs and Alternatives Considered

### Why Not a Simple MVC Architecture?

A traditional Model-View-Controller architecture would be simpler to set up but creates problems as complexity grows:

1. **Fat controllers**: Business logic tends to accumulate in controllers because there is no designated place for it
2. **Anemic models**: Domain objects become data containers with no behavior
3. **Infrastructure leakage**: Database queries spread throughout the codebase

For a simple flashcard app, MVC would be fine. For the Adaptive Mastery Learning System, the domain complexity justifies the extra architectural investment.

### Why Not Full CQRS/Event Sourcing?

Command Query Responsibility Segregation (CQRS) and Event Sourcing are sometimes paired with DDD. We considered this approach but rejected it for v1 because:

1. **Learning curve**: CQRS adds significant complexity that would slow initial development
2. **Overkill for local-first**: Event sourcing shines in distributed systems; a single-user desktop app does not need it
3. **Debugging difficulty**: Event-sourced systems can be harder to debug and understand

We do use a simplified command/query pattern in the application layer, which provides most of the organizational benefits without the infrastructure overhead.

### Why a Single Bounded Context?

Domain-Driven Design recommends decomposing large systems into bounded contexts with well-defined interfaces. The Adaptive Mastery Learning System uses a single bounded context (Learning) because:

1. **Single user**: No need to separate user management, billing, or social features
2. **Cohesive domain**: All concepts in the system are tightly related to the learning process
3. **Simplicity**: Multiple bounded contexts add integration complexity

If the system grows to include features like shared decks or learning groups, we might introduce additional bounded contexts.

---

## Evolution of the Architecture

### Initial Sketches

Early designs explored simpler approaches:

1. **Single-file prototype**: All logic in one file to validate the core algorithms
2. **Feature folders**: Organizing by feature (review, mastery, generation) rather than layer

These approaches were useful for rapid prototyping but did not scale as the domain logic grew.

### The Current Structure

The current architecture emerged from recognizing that the domain logic was the most valuable and complex part of the system. Protecting this logic from infrastructure churn became the primary architectural goal.

### Future Possibilities

The architecture is designed to accommodate:

- **Web deployment**: Replace Electron adapters with web-based equivalents
- **Mobile apps**: Domain layer could be shared with React Native
- **Collaborative features**: Add repositories for sharing and sync
- **Alternative databases**: Swap SQLite for IndexedDB or PostgreSQL

Each of these changes would require new adapters but no changes to the domain layer.

---

## Connection to Broader Concepts

### Clean Architecture

The hexagonal structure aligns with Robert Martin's Clean Architecture principles:
- Dependencies point inward toward the domain
- Outer layers depend on abstractions defined by inner layers
- Business rules are independent of frameworks

### Functional Core, Imperative Shell

The domain services follow the "functional core, imperative shell" pattern:
- Domain services are pure functions with no side effects
- Application services handle the imperative coordination
- Infrastructure performs actual I/O

This separation makes the code easier to test and reason about.

### The Onion Architecture

Jeffrey Palermo's Onion Architecture uses similar layering with the domain at the center. Hexagonal Architecture emphasizes the ports and adapters metaphor, but the core principle is the same: business logic in the middle, infrastructure on the outside.

---

## Summary

The Adaptive Mastery Learning System uses Hexagonal Architecture with Domain-Driven Design patterns because the domain complexity demands it. The architecture protects valuable business logic from infrastructure churn, enables comprehensive testing without infrastructure dependencies, and provides a clear organizational structure for a complex problem domain.

The investment in architectural rigor pays dividends in maintainability, testability, and the ability to evolve the system as requirements change.

---

*See also: [DDD Patterns](./ddd-patterns.md) for detailed explanation of entity, value object, and aggregate patterns.*
