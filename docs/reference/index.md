# Reference Documentation

Technical specifications for the Adaptive Mastery Learning System.

---

## Overview

| Property | Value |
|----------|-------|
| Application | Adaptive Mastery Learning System |
| Version | 1.0.0 |
| Architecture | Domain-Driven Design + Hexagonal (Ports & Adapters) |
| Platform | Electron (Desktop) |
| Language | TypeScript 5.7 (strict mode) |
| Database | SQLite (better-sqlite3) |

---

## Reference Documents

### [Domain Model](./domain-model.md)

Complete specifications for domain entities, value objects, aggregates, and services.

| Section | Contents |
|---------|----------|
| Bounded Context | Learning context definition |
| Concept Aggregate | Aggregate root and Variant entity |
| Standalone Entities | ReviewEvent, ScheduleEntry |
| Value Objects | ConceptId, VariantId, EventId, Dimension, Difficulty, ReviewResult, MasteryScore |
| Domain Services | MasteryCalculator, Scheduler, CardSelector, WeaknessDetector |
| Port Definitions | Input ports (use cases), Output ports (repositories, gateways) |

---

### [Database Schema](./database-schema.md)

Complete SQLite database schema specifications.

| Section | Contents |
|---------|----------|
| Tables | concepts, variants, mastery, events, schedule |
| Columns | Types, constraints, defaults |
| Indexes | Performance optimization indexes |
| Foreign Keys | Referential integrity constraints |
| Migrations | Schema version history |
| Query Patterns | Common query examples |

---

### [IPC API](./ipc-api.md)

Electron IPC channel specifications for main/renderer communication.

| Section | Contents |
|---------|----------|
| Concept Channels | CRUD operations |
| Variant Channels | CRUD operations |
| Review Channels | Session management |
| Mastery Channels | Profile queries |
| Schedule Channels | SRS operations |
| Settings Channels | Configuration |
| Error Handling | IPCError structure |
| Renderer Bridge | window.api specification |

---

### [Configuration](./configuration.md)

Application settings and algorithm constants.

| Section | Contents |
|---------|----------|
| Settings Structure | SettingsDTO properties |
| Mastery Settings | EWMA, target times |
| Review Settings | Session limits, anti-frustration |
| LLM Configuration | Provider options |
| Algorithm Constants | MasteryCalculator, Scheduler, CardSelector, WeaknessDetector |
| Dimension Constants | Display names, target times |
| Difficulty Constants | Labels, multipliers |

---

### [Type Definitions](./types.md)

TypeScript type and interface specifications.

| Section | Contents |
|---------|----------|
| Core Domain Types | DimensionType, ReviewResultType, entities |
| Branded ID Types | ConceptId, VariantId, EventId |
| IPC DTOs | All data transfer objects |
| IPC Channel Types | Type-safe channel definitions |
| Error Types | DomainError hierarchy, IPCError |
| Utility Types | Result type for error handling |
| Domain Service Types | Weakness, WeaknessProfile |
| Constants | Dimension arrays, defaults |

---

## Quick Reference

### Entity Summary

| Entity | Primary Key | Parent | Description |
|--------|-------------|--------|-------------|
| Concept | `id` (UUID) | - | Learning topic (aggregate root) |
| Variant | `id` (UUID) | Concept | Question card |
| ReviewEvent | `id` (UUID) | - | Review history record |
| ScheduleEntry | `concept_id` | Concept | SRS scheduling state |

---

### Dimension Summary

| Dimension | Code | Description |
|-----------|------|-------------|
| Definition Recall | `definition` | Recall definition from term |
| Paraphrase Recognition | `paraphrase` | Recognize correct restatements |
| Example Classification | `example` | Identify examples vs non-examples |
| Scenario Application | `scenario` | Apply to novel scenarios |
| Discrimination | `discrimination` | Distinguish from similar concepts |
| Cloze Fill | `cloze` | Complete sentences |

---

### Rating Summary

| Rating | Score | Pass | Description |
|--------|-------|------|-------------|
| `again` | 0.0 | No | Complete failure |
| `hard` | 0.4 | No | Recalled with difficulty |
| `good` | 0.7 | Yes | Correct, normal effort |
| `easy` | 1.0 | Yes | Effortless recall |

---

### Difficulty Summary

| Level | Label | Target Time |
|-------|-------|-------------|
| 1 | Very Easy | 5 seconds |
| 2 | Easy | 10 seconds |
| 3 | Medium | 20 seconds |
| 4 | Hard | 40 seconds |
| 5 | Very Hard | 60 seconds |

---

### IPC Channel Summary

| Group | Channels |
|-------|----------|
| Concepts | `concepts:getAll`, `concepts:getById`, `concepts:create`, `concepts:update`, `concepts:delete` |
| Variants | `variants:getByConceptId`, `variants:create`, `variants:update`, `variants:delete` |
| Review | `review:getNextCard`, `review:submit`, `review:getDueCount` |
| Mastery | `mastery:getProfile`, `mastery:getByDimension` |
| Schedule | `schedule:getDue`, `schedule:update` |
| Settings | `settings:get`, `settings:set` |

---

### Key Constants

| Constant | Value | Location |
|----------|-------|----------|
| EWMA Alpha | 0.15 | MasteryCalculator |
| Weakness Threshold | 0.7 | WeaknessDetector |
| Accuracy Weight | 0.7 | MasteryCalculator |
| Speed Weight | 0.3 | MasteryCalculator |
| Min Ease Factor | 1.3 | Scheduler |
| Max Ease Factor | 2.5 | Scheduler |
| Default Ease Factor | 2.5 | Scheduler |
| Min Interval (days) | 1 | Scheduler |
| Anti-Frustration Threshold | 3 | CardSelector |

---

## Source File Locations

| Document | Primary Sources |
|----------|----------------|
| Domain Model | `src/domain/`, `src/shared/types/core.ts` |
| Database Schema | `src/main/infrastructure/database/migrations/` |
| IPC API | `src/main/ipc/`, `src/shared/types/ipc.ts`, `src/preload/` |
| Configuration | `src/main/ipc/settings.ipc.ts`, `src/shared/constants/` |
| Type Definitions | `src/shared/types/`, `src/shared/errors/`, `src/domain/value-objects/` |

---

## Architecture Layers

```
Presentation Layer (Renderer)
  |
  v
IPC Bridge (Preload)
  |
  v
Application Layer (IPC Handlers)
  |
  v
Domain Layer (Entities, Value Objects, Services)
  |
  v
Infrastructure Layer (Repositories, Database)
```

---

## Related Documentation

For learning-oriented documentation, see:
- Tutorials (getting started)
- How-To Guides (task-oriented)
- Explanations (understanding)
