# Adaptive Mastery Learning System - TODO List

**Generated from:** PRD.md v1.0.0
**Date:** 2025-01-16
**Status:** Planning Phase
**Total Tasks:** 147

---

## 📊 Overview

### Priority Levels
- **P1**: Critical path, blockers for other work
- **P2**: High priority, core functionality
- **P3**: Important but not blocking
- **P4**: Nice to have, quality improvements
- **P5**: Future enhancements, polish

### Complexity Estimates
- **S (Small)**: 1-4 hours
- **M (Medium)**: 4-8 hours
- **L (Large)**: 8-16 hours
- **XL (Extra Large)**: 16+ hours

### Value Indicators
- **H (High)**: Critical for MVP
- **M (Medium)**: Important for good UX
- **L (Low)**: Polish and optimization

---

## Phase 1: Foundation & Infrastructure (Weeks 1-2)

### 1.1 Project Setup & Configuration

- [ ] **[P1/S/H]** Initialize Node.js/TypeScript project with proper tsconfig
  - Dependencies: None
  - Owner: TBD
  - Estimate: 2 hours
  - Acceptance: Build succeeds, strict mode enabled

- [ ] **[P1/S/H]** Set up Electron project structure with main/renderer processes
  - Dependencies: Node.js setup
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Electron window opens successfully

- [ ] **[P1/S/M]** Configure ESLint with Airbnb + Prettier rules
  - Dependencies: Project initialization
  - Owner: TBD
  - Estimate: 2 hours
  - Acceptance: Linting runs without errors

- [ ] **[P1/S/M]** Set up Jest testing framework with React Testing Library
  - Dependencies: Project initialization
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Sample test passes

- [ ] **[P1/S/H]** Configure build system (webpack/vite) for Electron
  - Dependencies: Electron setup
  - Owner: TBD
  - Estimate: 4 hours
  - Acceptance: Hot reload works in dev mode

- [ ] **[P2/S/M]** Set up electron-builder for packaging
  - Dependencies: Electron configuration
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Can build .dmg/.exe/.AppImage

- [ ] **[P2/S/M]** Create config.example.json template
  - Dependencies: None
  - Owner: TBD
  - Estimate: 1 hour
  - Acceptance: File contains all required config keys

- [ ] **[P3/S/L]** Set up Git hooks with husky (pre-commit linting)
  - Dependencies: ESLint setup
  - Owner: TBD
  - Estimate: 2 hours
  - Acceptance: Hooks block commits with errors

- [ ] **[P3/S/L]** Create .gitignore with proper exclusions
  - Dependencies: None
  - Owner: TBD
  - Estimate: 1 hour
  - Acceptance: Config files and data excluded

### 1.2 Database Schema & Setup

- [ ] **[P1/M/H]** Install and configure better-sqlite3
  - Dependencies: Node.js setup
  - Owner: TBD
  - Estimate: 2 hours
  - Acceptance: Can create and query database

- [ ] **[P1/M/H]** Create `concepts` table schema
  - Dependencies: SQLite setup
  - Owner: TBD
  - Estimate: 2 hours
  - Fields: id, name, definition, facts (JSON)
  - Acceptance: Table creation script runs successfully

- [ ] **[P1/M/H]** Create `variants` table schema
  - Dependencies: SQLite setup
  - Owner: TBD
  - Estimate: 2 hours
  - Fields: id, concept_id, dimension, difficulty, front, back, hints (JSON), last_shown_at
  - Acceptance: Table with foreign key constraints

- [ ] **[P1/M/H]** Create `mastery` table schema
  - Dependencies: SQLite setup
  - Owner: TBD
  - Estimate: 2 hours
  - Fields: dimension, accuracy_ewma, speed_ewma, recent_count
  - Acceptance: Table with default values

- [ ] **[P1/M/H]** Create `events` table schema
  - Dependencies: SQLite setup
  - Owner: TBD
  - Estimate: 2 hours
  - Fields: id, concept_id, variant_id, dimension, difficulty, result, time_ms, hints_used, created_at
  - Acceptance: Table with auto-increment and timestamp

- [ ] **[P1/M/H]** Create `schedule` table schema
  - Dependencies: SQLite setup
  - Owner: TBD
  - Estimate: 2 hours
  - Fields: concept_id, due_at, interval_days, ease_factor
  - Acceptance: Table with proper indexing

- [ ] **[P1/S/H]** Add indexes for performance (concept_id, dimension, due_at)
  - Dependencies: All tables created
  - Owner: TBD
  - Estimate: 2 hours
  - Acceptance: Query performance < 50ms for typical operations

- [ ] **[P1/M/H]** Create database migration system
  - Dependencies: SQLite setup
  - Owner: TBD
  - Estimate: 4 hours
  - Acceptance: Can version and migrate schema changes

- [ ] **[P2/S/M]** Implement database initialization on first run
  - Dependencies: All tables defined
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Fresh install creates all tables

- [ ] **[P2/S/M]** Create seed data script with example concepts
  - Dependencies: Database schema
  - Owner: TBD
  - Estimate: 2 hours
  - Acceptance: Script populates 5-10 example concepts

- [ ] **[P3/M/M]** Implement database backup functionality
  - Dependencies: Database operational
  - Owner: TBD
  - Estimate: 4 hours
  - Acceptance: Can export/import .db files

### 1.3 Core TypeScript Types & Interfaces

- [ ] **[P1/S/H]** Define `Dimension` enum type
  - Dependencies: None
  - Owner: TBD
  - Estimate: 1 hour
  - Values: definition_recall, paraphrase_recognition, example_classification, scenario_application, discrimination, cloze_fill

- [ ] **[P1/S/H]** Define `ReviewResult` type
  - Dependencies: None
  - Owner: TBD
  - Estimate: 1 hour
  - Values: 'again' | 'hard' | 'good' | 'easy'

- [ ] **[P1/S/H]** Define `Concept` interface
  - Dependencies: None
  - Owner: TBD
  - Estimate: 1 hour
  - Acceptance: Matches database schema

- [ ] **[P1/S/H]** Define `Variant` interface
  - Dependencies: Dimension enum
  - Owner: TBD
  - Estimate: 1 hour
  - Acceptance: Matches database schema

- [ ] **[P1/S/H]** Define `ReviewEvent` interface
  - Dependencies: Dimension, ReviewResult types
  - Owner: TBD
  - Estimate: 1 hour
  - Acceptance: Includes all fields from PRD spec

- [ ] **[P1/S/H]** Define `DimensionMastery` interface
  - Dependencies: None
  - Owner: TBD
  - Estimate: 1 hour
  - Fields: accuracyEwma, speedEwma, recentCount

- [ ] **[P1/S/H]** Define `ScheduleEntry` interface
  - Dependencies: None
  - Owner: TBD
  - Estimate: 1 hour
  - Fields: conceptId, dueAt, intervalDays, easeFactor

- [ ] **[P2/S/M]** Define `ConceptWithVariants` composite type
  - Dependencies: Concept, Variant interfaces
  - Owner: TBD
  - Estimate: 1 hour
  - Acceptance: Useful for API responses

- [ ] **[P2/S/M]** Define `MasteryProfile` type for dashboard display
  - Dependencies: DimensionMastery
  - Owner: TBD
  - Estimate: 1 hour
  - Acceptance: Includes all 6 dimensions

### 1.4 Basic UI Framework Setup

- [ ] **[P1/M/H]** Set up React with TypeScript in renderer process
  - Dependencies: Electron setup
  - Owner: TBD
  - Estimate: 4 hours
  - Acceptance: Can render React components

- [ ] **[P2/M/M]** Choose and configure UI library (Material-UI/Tailwind/etc)
  - Dependencies: React setup
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Can use library components

- [ ] **[P2/M/M]** Create base layout component with navigation
  - Dependencies: UI library setup
  - Owner: TBD
  - Estimate: 4 hours
  - Acceptance: Header with route links

- [ ] **[P2/S/M]** Implement basic routing (react-router-dom)
  - Dependencies: React setup
  - Owner: TBD
  - Estimate: 3 hours
  - Routes: /review, /dashboard, /concepts
  - Acceptance: Navigation between pages works

- [ ] **[P3/S/L]** Set up theme system (light/dark mode support)
  - Dependencies: UI library setup
  - Owner: TBD
  - Estimate: 4 hours
  - Acceptance: Theme toggle works

---

## Phase 2: Core SRS Implementation (Week 3)

### 2.1 Database Operations Layer

- [ ] **[P1/M/H]** Implement `db.ts` connection management
  - Dependencies: better-sqlite3 installed
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Singleton pattern, error handling

- [ ] **[P1/M/H]** Create CRUD operations for `concepts` table
  - Dependencies: Database schema
  - Owner: TBD
  - Estimate: 4 hours
  - Methods: create, read, update, delete, list

- [ ] **[P1/M/H]** Create CRUD operations for `variants` table
  - Dependencies: Database schema
  - Owner: TBD
  - Estimate: 4 hours
  - Methods: create, readByConcept, update, delete

- [ ] **[P1/M/H]** Create operations for `events` table
  - Dependencies: Database schema
  - Owner: TBD
  - Estimate: 3 hours
  - Methods: insert, getHistory, getRecentByConcept

- [ ] **[P1/M/H]** Create operations for `schedule` table
  - Dependencies: Database schema
  - Owner: TBD
  - Estimate: 4 hours
  - Methods: getDue, updateSchedule, getNextDueDate

- [ ] **[P1/M/H]** Create operations for `mastery` table
  - Dependencies: Database schema
  - Owner: TBD
  - Estimate: 3 hours
  - Methods: get, update, initialize

- [ ] **[P2/M/M]** Add TypeScript types to all database operations
  - Dependencies: All CRUD operations
  - Owner: TBD
  - Estimate: 2 hours
  - Acceptance: Full type safety, no `any`

- [ ] **[P2/M/M]** Implement transaction support for complex operations
  - Dependencies: db.ts connection
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Can rollback on errors

- [ ] **[P3/S/M]** Add database query logging for debugging
  - Dependencies: Database operations
  - Owner: TBD
  - Estimate: 2 hours
  - Acceptance: Log queries in dev mode only

### 2.2 SM-2 Scheduling Algorithm

- [ ] **[P1/M/H]** Implement `scheduler.ts` with SM-2 algorithm
  - Dependencies: Schedule table operations
  - Owner: TBD
  - Estimate: 6 hours
  - Acceptance: Correct interval calculation

- [ ] **[P1/M/H]** Create `calculateNextInterval()` function
  - Dependencies: SM-2 algorithm
  - Owner: TBD
  - Estimate: 3 hours
  - Formula: interval = previousInterval * easeFactor

- [ ] **[P1/M/H]** Create `updateEaseFactor()` function
  - Dependencies: SM-2 algorithm
  - Owner: TBD
  - Estimate: 2 hours
  - Logic: Adjust based on review result (again/hard/good/easy)

- [ ] **[P1/M/H]** Create `getDueCards()` function
  - Dependencies: Schedule table
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Returns concepts due now or overdue

- [ ] **[P1/M/H]** Create `scheduleNextReview()` function
  - Dependencies: SM-2 functions
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Updates schedule table correctly

- [ ] **[P2/M/M]** Implement initial scheduling for new concepts
  - Dependencies: Scheduler functions
  - Owner: TBD
  - Estimate: 2 hours
  - Acceptance: New concepts appear in first session

- [ ] **[P2/S/M]** Add edge case handling (first review, overdue cards)
  - Dependencies: Scheduler implementation
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: No crashes on edge cases

- [ ] **[P3/M/M]** Write unit tests for SM-2 algorithm
  - Dependencies: Scheduler implementation
  - Owner: TBD
  - Estimate: 4 hours
  - Coverage: All rating types, boundary conditions

### 2.3 Basic Review UI (No Adaptation Yet)

- [ ] **[P1/L/H]** Create `Review.tsx` component skeleton
  - Dependencies: React setup, routing
  - Owner: TBD
  - Estimate: 4 hours
  - Acceptance: Component renders

- [ ] **[P1/M/H]** Implement card display with front/back
  - Dependencies: Review component
  - Owner: TBD
  - Estimate: 4 hours
  - Acceptance: Shows question, reveals answer

- [ ] **[P1/M/H]** Add rating buttons (Again/Hard/Good/Easy)
  - Dependencies: Card display
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Buttons trigger review submission

- [ ] **[P1/M/H]** Implement timer for tracking answer duration
  - Dependencies: Card display
  - Owner: TBD
  - Estimate: 2 hours
  - Acceptance: Accurate to milliseconds

- [ ] **[P1/M/H]** Create review session state management
  - Dependencies: Review component
  - Owner: TBD
  - Estimate: 4 hours
  - State: currentCard, sessionProgress, completedCount

- [ ] **[P1/M/H]** Implement "Show Answer" button functionality
  - Dependencies: Card display
  - Owner: TBD
  - Estimate: 2 hours
  - Acceptance: Reveals back of card

- [ ] **[P2/M/M]** Add session progress indicator (8/25)
  - Dependencies: Session state
  - Owner: TBD
  - Estimate: 2 hours
  - Acceptance: Updates in real-time

- [ ] **[P2/M/M]** Implement session completion screen
  - Dependencies: Review flow
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Shows summary, returns to dashboard

- [ ] **[P2/S/M]** Add keyboard shortcuts (Space = show, 1-4 = rating)
  - Dependencies: Review component
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: All interactions work via keyboard

- [ ] **[P3/S/L]** Add card flip animation
  - Dependencies: Card display
  - Owner: TBD
  - Estimate: 2 hours
  - Acceptance: Smooth CSS transition

### 2.4 Manual Card Creation UI

- [ ] **[P1/L/H]** Create `ConceptEditor.tsx` component
  - Dependencies: React setup
  - Owner: TBD
  - Estimate: 6 hours
  - Acceptance: Form renders with validation

- [ ] **[P1/M/H]** Implement concept creation form (name, definition, facts)
  - Dependencies: ConceptEditor component
  - Owner: TBD
  - Estimate: 4 hours
  - Fields: Text inputs with validation

- [ ] **[P1/M/H]** Add facts array input (add/remove fact fields)
  - Dependencies: Concept form
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Dynamic field management

- [ ] **[P1/M/H]** Create `VariantEditor.tsx` component
  - Dependencies: React setup
  - Owner: TBD
  - Estimate: 6 hours
  - Acceptance: Can create variants for concept

- [ ] **[P1/M/H]** Implement variant form (dimension, difficulty, front, back, hints)
  - Dependencies: VariantEditor component
  - Owner: TBD
  - Estimate: 4 hours
  - Acceptance: Dropdown for dimension, difficulty slider

- [ ] **[P2/M/M]** Add hints array input for variants
  - Dependencies: Variant form
  - Owner: TBD
  - Estimate: 2 hours
  - Acceptance: Can add multiple hints

- [ ] **[P2/M/M]** Implement save/cancel buttons with validation
  - Dependencies: Both editors
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Shows errors, prevents invalid saves

- [ ] **[P2/M/M]** Create concept list view with edit/delete actions
  - Dependencies: Concept CRUD operations
  - Owner: TBD
  - Estimate: 4 hours
  - Acceptance: Shows all concepts, clickable

- [ ] **[P3/S/M]** Add markdown support for card content
  - Dependencies: Card editors
  - Owner: TBD
  - Estimate: 3 hours
  - Library: marked or remark
  - Acceptance: Can render bold, italics, lists

- [ ] **[P3/S/L]** Implement card preview mode
  - Dependencies: Editors
  - Owner: TBD
  - Estimate: 2 hours
  - Acceptance: See how card will appear in review

---

## Phase 3: Instrumentation & Mastery Tracking (Week 3)

### 3.1 Event Logging System

- [ ] **[P1/M/H]** Create `logger.ts` module for event recording
  - Dependencies: Events table operations
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Can insert events with validation

- [ ] **[P1/M/H]** Implement `logReviewEvent()` function
  - Dependencies: Logger module
  - Owner: TBD
  - Estimate: 2 hours
  - Params: conceptId, variantId, dimension, difficulty, result, timeMs, hintsUsed

- [ ] **[P1/M/H]** Integrate event logging into review flow
  - Dependencies: Review component, logger
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Every answer creates event record

- [ ] **[P2/S/M]** Add event validation (required fields, ranges)
  - Dependencies: Logger module
  - Owner: TBD
  - Estimate: 2 hours
  - Acceptance: Rejects invalid events

- [ ] **[P2/M/M]** Implement event query functions (history, stats)
  - Dependencies: Events table
  - Owner: TBD
  - Estimate: 4 hours
  - Methods: getConceptHistory, getDimensionStats, getRecentEvents

- [ ] **[P3/S/M]** Add event export functionality (CSV/JSON)
  - Dependencies: Event queries
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Can export all events

### 3.2 EWMA Mastery Calculation

- [ ] **[P1/M/H]** Create `mastery.ts` module
  - Dependencies: Mastery table operations
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Module exports calculation functions

- [ ] **[P1/M/H]** Implement `updateEwma()` utility function
  - Dependencies: None
  - Owner: TBD
  - Estimate: 2 hours
  - Formula: (1 - α) * current + α * newValue
  - Acceptance: Alpha parameter configurable

- [ ] **[P1/M/H]** Implement `ratingToScore()` mapping
  - Dependencies: ReviewResult type
  - Owner: TBD
  - Estimate: 1 hour
  - Map: again=0, hard=0.4, good=0.7, easy=1.0

- [ ] **[P1/M/H]** Implement `speedScore()` calculation
  - Dependencies: None
  - Owner: TBD
  - Estimate: 3 hours
  - Formula: 1 - clamp(timeMs / targetMs, 0, 2) / 2
  - Acceptance: Handles all difficulty levels

- [ ] **[P1/M/H]** Create `updateMastery()` function
  - Dependencies: updateEwma, ratingToScore, speedScore
  - Owner: TBD
  - Estimate: 4 hours
  - Acceptance: Updates accuracy and speed EWMAs

- [ ] **[P1/M/H]** Implement `calculateCombinedMastery()` function
  - Dependencies: DimensionMastery interface
  - Owner: TBD
  - Estimate: 2 hours
  - Formula: 0.7 * accuracyEwma + 0.3 * speedEwma

- [ ] **[P1/M/H]** Integrate mastery updates into review flow
  - Dependencies: Review component, mastery module
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Mastery updates after each answer

- [ ] **[P2/M/M]** Initialize default mastery values for new users
  - Dependencies: Mastery table
  - Owner: TBD
  - Estimate: 2 hours
  - Defaults: accuracyEwma=0.5, speedEwma=0.5, recentCount=0

- [ ] **[P2/S/M]** Add mastery calculation edge case handling
  - Dependencies: Mastery calculations
  - Owner: TBD
  - Estimate: 2 hours
  - Cases: First review, very fast answers, very slow answers

- [ ] **[P3/M/M]** Write unit tests for all mastery calculations
  - Dependencies: Mastery module complete
  - Owner: TBD
  - Estimate: 4 hours
  - Coverage: EWMA, speed scoring, combined mastery

### 3.3 Dashboard with Mastery Visualization

- [ ] **[P1/L/H]** Create `Dashboard.tsx` component
  - Dependencies: React setup, routing
  - Owner: TBD
  - Estimate: 6 hours
  - Acceptance: Component renders with layout

- [ ] **[P1/M/H]** Implement mastery profile data fetching
  - Dependencies: Mastery table operations
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Loads all 6 dimension scores

- [ ] **[P1/M/H]** Create dimension skill bars component
  - Dependencies: Dashboard component
  - Owner: TBD
  - Estimate: 4 hours
  - Acceptance: Visual bars showing 0-100% per dimension

- [ ] **[P1/M/H]** Add mastery percentage labels
  - Dependencies: Skill bars
  - Owner: TBD
  - Estimate: 2 hours
  - Acceptance: Shows numeric percentage next to bars

- [ ] **[P2/M/M]** Implement gap detection and highlighting
  - Dependencies: Mastery data
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Highlights weakest dimension with ⚠️

- [ ] **[P2/M/M]** Add suggestion text ("Focus on scenarios")
  - Dependencies: Gap detection
  - Owner: TBD
  - Estimate: 2 hours
  - Acceptance: Shows actionable suggestion

- [ ] **[P2/M/M]** Display due cards count and "Start Review" button
  - Dependencies: Schedule operations
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Shows count, button navigates to review

- [ ] **[P2/S/M]** Add recent activity summary (cards reviewed today)
  - Dependencies: Events table
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Shows count and accuracy for today

- [ ] **[P3/M/M]** Implement color coding (red=weak, yellow=medium, green=strong)
  - Dependencies: Skill bars
  - Owner: TBD
  - Estimate: 2 hours
  - Thresholds: <50% red, 50-70% yellow, >70% green

- [ ] **[P3/S/L]** Add animations for skill bar updates
  - Dependencies: Skill bars
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Smooth transitions when values change

---

## Phase 4: Adaptive Selection & Weakness Detection (Weeks 4-5)

### 4.1 Weakness Detection System

- [ ] **[P1/M/H]** Create `detector.ts` module for weakness analysis
  - Dependencies: Mastery module
  - Owner: TBD
  - Estimate: 4 hours
  - Acceptance: Module exports detection functions

- [ ] **[P1/M/H]** Implement `detectWeakDimension()` function
  - Dependencies: Mastery data
  - Owner: TBD
  - Estimate: 4 hours
  - Logic: Compare dimensions, require minimum sample size

- [ ] **[P1/M/H]** Implement `detectFragileConfidence()` function
  - Dependencies: Mastery data
  - Owner: TBD
  - Estimate: 3 hours
  - Logic: High accuracy + low speed = fragile

- [ ] **[P1/M/H]** Implement `detectDodgingPattern()` function
  - Dependencies: Mastery data
  - Owner: TBD
  - Estimate: 3 hours
  - Logic: Strong definitions, weak everything else

- [ ] **[P2/M/M]** Create composite weakness profile
  - Dependencies: All detection functions
  - Owner: TBD
  - Estimate: 3 hours
  - Output: Primary weakness + confidence issues

- [ ] **[P2/S/M]** Add minimum sample size checks (20+ reviews)
  - Dependencies: Detection functions
  - Owner: TBD
  - Estimate: 2 hours
  - Acceptance: Only detects with sufficient data

- [ ] **[P3/M/M]** Write unit tests for weakness detection
  - Dependencies: Detector module
  - Owner: TBD
  - Estimate: 4 hours
  - Coverage: All detection scenarios

### 4.2 Weighted Card Selection Algorithm

- [ ] **[P1/L/H]** Create `selector.ts` module for adaptive selection
  - Dependencies: Mastery, Detector modules
  - Owner: TBD
  - Estimate: 6 hours
  - Acceptance: Module exports selection functions

- [ ] **[P1/M/H]** Implement `calculateWeaknessBoost()` function
  - Dependencies: Mastery data
  - Owner: TBD
  - Estimate: 3 hours
  - Formula: if mastery < 0.7, boost = 1 + 2 * (0.7 - mastery), else 0.9

- [ ] **[P1/M/H]** Implement `calculateNoveltyBoost()` function
  - Dependencies: Variant last_shown_at
  - Owner: TBD
  - Estimate: 2 hours
  - Logic: daysSinceShown > 7 ? 1.5 : 0.8

- [ ] **[P1/M/H]** Implement `calculateAntiFrustrationPenalty()` function
  - Dependencies: Recent event history
  - Owner: TBD
  - Estimate: 3 hours
  - Logic: consecutiveFailures >= 3 ? 0.3 : 1.0

- [ ] **[P1/M/H]** Implement `calculateBaseWeight()` function
  - Dependencies: Variant difficulty
  - Owner: TBD
  - Estimate: 2 hours
  - Logic: Weight based on difficulty level

- [ ] **[P1/L/H]** Implement `selectVariantForConcept()` main function
  - Dependencies: All weight functions
  - Owner: TBD
  - Estimate: 6 hours
  - Formula: weight = base * weakness * novelty * antiFrustration

- [ ] **[P1/M/H]** Add weighted random selection logic
  - Dependencies: selectVariantForConcept
  - Owner: TBD
  - Estimate: 4 hours
  - Acceptance: Higher weights = higher probability

- [ ] **[P2/M/M]** Integrate adaptive selection into review flow
  - Dependencies: Review component, selector module
  - Owner: TBD
  - Estimate: 4 hours
  - Acceptance: Review uses weighted selection

- [ ] **[P2/M/M]** Implement consecutive dimension limiting (max 4 same)
  - Dependencies: Selector module
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Forces dimension variety

- [ ] **[P3/M/M]** Write unit tests for selection algorithm
  - Dependencies: Selector module complete
  - Owner: TBD
  - Estimate: 5 hours
  - Coverage: All weight calculations, edge cases

### 4.3 Safety Rails Implementation

- [ ] **[P1/M/H]** Implement session dimension cap (70% max)
  - Dependencies: Selector module
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Session never exceeds 70% single dimension

- [ ] **[P1/M/H]** Implement maintenance rep requirement (20% strong dimensions)
  - Dependencies: Selector module
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Strong dimensions still get practice

- [ ] **[P1/M/H]** Implement confidence card insertion after 3 failures
  - Dependencies: Selector module, event history
  - Owner: TBD
  - Estimate: 4 hours
  - Acceptance: Easy card appears after frustration

- [ ] **[P2/M/M]** Add difficulty reduction after repeated failures
  - Dependencies: Anti-frustration system
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Next card is easier after failures

- [ ] **[P2/S/M]** Implement automatic hint display on third failure
  - Dependencies: Review component
  - Owner: TBD
  - Estimate: 2 hours
  - Acceptance: Hints auto-show when struggling

- [ ] **[P3/M/M]** Write integration tests for safety rails
  - Dependencies: All safety features
  - Owner: TBD
  - Estimate: 4 hours
  - Coverage: Cap enforcement, frustration handling

### 4.4 Selection Reasoning Transparency

- [ ] **[P2/M/M]** Add selection reasoning to card metadata
  - Dependencies: Selector module
  - Owner: TBD
  - Estimate: 3 hours
  - Data: reason, weights breakdown

- [ ] **[P2/M/M]** Display selection reason in review UI
  - Dependencies: Review component, metadata
  - Owner: TBD
  - Estimate: 3 hours
  - Example: "Focus: scenarios (you're strong on definitions)"

- [ ] **[P2/S/M]** Add "Why this card?" info button
  - Dependencies: Selection metadata
  - Owner: TBD
  - Estimate: 2 hours
  - Acceptance: Shows weight breakdown on click

- [ ] **[P3/S/L]** Create selection reasoning tooltip/popover
  - Dependencies: Review UI
  - Owner: TBD
  - Estimate: 2 hours
  - Acceptance: Explains algorithm choices

---

## Phase 5: LLM Integration & Card Generation (Week 6)

### 5.1 LLM API Integration

- [ ] **[P2/M/M]** Create `generator.ts` module for LLM integration
  - Dependencies: config.json
  - Owner: TBD
  - Estimate: 4 hours
  - Acceptance: Module exports generation functions

- [ ] **[P2/M/M]** Implement OpenAI API client
  - Dependencies: Generator module
  - Owner: TBD
  - Estimate: 3 hours
  - Library: openai npm package

- [ ] **[P2/M/M]** Implement Anthropic API client (alternative)
  - Dependencies: Generator module
  - Owner: TBD
  - Estimate: 3 hours
  - Library: @anthropic-ai/sdk

- [ ] **[P2/S/M]** Add API key configuration handling
  - Dependencies: config.json
  - Owner: TBD
  - Estimate: 2 hours
  - Acceptance: Validates key, shows clear errors

- [ ] **[P3/M/L]** Implement Ollama local model support (optional)
  - Dependencies: Generator module
  - Owner: TBD
  - Estimate: 4 hours
  - Acceptance: Can use local LLMs

- [ ] **[P3/S/M]** Add LLM provider selection in settings
  - Dependencies: Multiple clients
  - Owner: TBD
  - Estimate: 2 hours
  - Options: OpenAI, Anthropic, Ollama

### 5.2 Prompt Engineering & Card Generation

- [ ] **[P2/M/M]** Design card generation prompt template
  - Dependencies: None
  - Owner: TBD
  - Estimate: 3 hours
  - Input: concept, dimension, difficulty, facts

- [ ] **[P2/M/M]** Implement `generateVariant()` function
  - Dependencies: LLM client, prompt template
  - Owner: TBD
  - Estimate: 4 hours
  - Acceptance: Returns structured card data

- [ ] **[P2/M/M]** Add fact grounding validation
  - Dependencies: Generate function
  - Owner: TBD
  - Estimate: 3 hours
  - Logic: Reject cards using facts not in concept

- [ ] **[P2/M/M]** Implement batch generation (3 variants at once)
  - Dependencies: Generate function
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Generates multiple variants per call

- [ ] **[P2/M/M]** Add JSON response parsing and validation
  - Dependencies: Generate function
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Validates structure, handles errors

- [ ] **[P2/S/M]** Implement retry logic for failed generations
  - Dependencies: Generate function
  - Owner: TBD
  - Estimate: 2 hours
  - Logic: Retry up to 3 times on failure

- [ ] **[P3/M/M]** Add generation quality scoring
  - Dependencies: Generated variants
  - Owner: TBD
  - Estimate: 4 hours
  - Criteria: Length, clarity, difficulty appropriateness

### 5.3 Scaffolding Ladder for Difficult Concepts

- [ ] **[P2/M/M]** Implement difficulty level 1 generation (multiple choice + hints)
  - Dependencies: Generator module
  - Owner: TBD
  - Estimate: 4 hours
  - Acceptance: Generates MC questions

- [ ] **[P2/M/M]** Implement difficulty level 2 generation (short "what concept?")
  - Dependencies: Generator module
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Generates brief questions

- [ ] **[P2/M/M]** Implement difficulty level 3 generation (full scenario)
  - Dependencies: Generator module
  - Owner: TBD
  - Estimate: 4 hours
  - Acceptance: Generates complex scenarios

- [ ] **[P2/M/M]** Implement difficulty level 4 generation (discrimination)
  - Dependencies: Generator module
  - Owner: TBD
  - Estimate: 4 hours
  - Acceptance: Generates "why not X?" questions

- [ ] **[P2/M/M]** Add automatic difficulty progression logic
  - Dependencies: Mastery data, generator
  - Owner: TBD
  - Estimate: 3 hours
  - Logic: Increase difficulty as mastery improves

### 5.4 Automatic Variant Generation Trigger

- [ ] **[P2/M/M]** Implement `checkVariantNeeds()` function
  - Dependencies: Selector module, variants table
  - Owner: TBD
  - Estimate: 3 hours
  - Logic: Detect missing variants for weak dimensions

- [ ] **[P2/M/M]** Trigger generation when weak dimension lacks variants
  - Dependencies: checkVariantNeeds, generator
  - Owner: TBD
  - Estimate: 4 hours
  - Acceptance: Auto-generates needed variants

- [ ] **[P2/S/M]** Add background generation queue
  - Dependencies: Generation trigger
  - Owner: TBD
  - Estimate: 4 hours
  - Acceptance: Doesn't block review flow

- [ ] **[P3/M/M]** Implement generation history and caching
  - Dependencies: Generator module
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Avoids duplicate generations

- [ ] **[P3/S/L]** Add UI notification for new auto-generated cards
  - Dependencies: Generation system
  - Owner: TBD
  - Estimate: 2 hours
  - Acceptance: Toast notification on generation

### 5.5 Manual Generation UI

- [ ] **[P2/M/M]** Add "Generate Variants" button to concept editor
  - Dependencies: ConceptEditor component
  - Owner: TBD
  - Estimate: 2 hours
  - Acceptance: Button triggers generation

- [ ] **[P2/M/M]** Create generation options modal
  - Dependencies: Generate button
  - Owner: TBD
  - Estimate: 4 hours
  - Options: Dimension, difficulty, count

- [ ] **[P2/M/M]** Display generated variants for review/edit
  - Dependencies: Generation complete
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Can accept/reject/edit each

- [ ] **[P2/S/M]** Add loading state during generation
  - Dependencies: Generation modal
  - Owner: TBD
  - Estimate: 2 hours
  - Acceptance: Shows spinner, disables buttons

- [ ] **[P3/S/L]** Implement regeneration for poor quality cards
  - Dependencies: Generation UI
  - Owner: TBD
  - Estimate: 2 hours
  - Acceptance: "Try Again" button

---

## Phase 6: Polish & Enhancement (Week 7-8)

### 6.1 Trend Tracking Over Time

- [ ] **[P2/L/M]** Create `trends` table for historical mastery snapshots
  - Dependencies: Database schema
  - Owner: TBD
  - Estimate: 3 hours
  - Fields: dimension, mastery_score, recorded_at

- [ ] **[P2/M/M]** Implement daily mastery snapshot function
  - Dependencies: Trends table, mastery module
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Records once per day per dimension

- [ ] **[P2/M/M]** Create `TrendChart.tsx` component
  - Dependencies: React, charting library
  - Owner: TBD
  - Estimate: 6 hours
  - Library: recharts or chart.js

- [ ] **[P2/M/M]** Implement trend line visualization
  - Dependencies: TrendChart component
  - Owner: TBD
  - Estimate: 4 hours
  - Acceptance: Shows 30-day trend per dimension

- [ ] **[P3/M/M]** Add trend arrows to dashboard (↑/↓/→)
  - Dependencies: Trend data
  - Owner: TBD
  - Estimate: 2 hours
  - Logic: Compare current to 7 days ago

- [ ] **[P3/S/L]** Implement trend smoothing (rolling average)
  - Dependencies: Trend calculations
  - Owner: TBD
  - Estimate: 2 hours
  - Acceptance: Reduces noise in chart

### 6.2 Import/Export Functionality

- [ ] **[P2/M/M]** Implement concept export to JSON
  - Dependencies: Concepts table
  - Owner: TBD
  - Estimate: 3 hours
  - Format: {concepts: [], variants: []}

- [ ] **[P2/M/M]** Implement concept import from JSON
  - Dependencies: Concepts table
  - Owner: TBD
  - Estimate: 4 hours
  - Acceptance: Validates structure, handles duplicates

- [ ] **[P2/M/M]** Create import/export UI in settings
  - Dependencies: Import/export functions
  - Owner: TBD
  - Estimate: 4 hours
  - Acceptance: File picker, drag-and-drop

- [ ] **[P3/M/M]** Add CSV export for events (data analysis)
  - Dependencies: Events table
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Exports all columns

- [ ] **[P3/S/L]** Implement Anki deck import (community compatibility)
  - Dependencies: Import system
  - Owner: TBD
  - Estimate: 6 hours
  - Format: Parse .apkg files

- [ ] **[P3/S/L]** Add backup automation (daily .db copy)
  - Dependencies: Database operations
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Auto-backup to backups/ folder

### 6.3 Settings & Configuration

- [ ] **[P2/M/M]** Create `Settings.tsx` component
  - Dependencies: React setup
  - Owner: TBD
  - Estimate: 4 hours
  - Acceptance: Settings page renders

- [ ] **[P2/M/M]** Implement LLM API key configuration UI
  - Dependencies: Settings component
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Masked input, test connection button

- [ ] **[P2/S/M]** Add EWMA alpha parameter configuration
  - Dependencies: Settings component
  - Owner: TBD
  - Estimate: 2 hours
  - Default: 0.15, Range: 0.05-0.3

- [ ] **[P2/S/M]** Add target answer time configuration per difficulty
  - Dependencies: Settings component
  - Owner: TBD
  - Estimate: 2 hours
  - Defaults: [5s, 10s, 20s, 40s, 60s]

- [ ] **[P3/S/M]** Add theme preference (light/dark/auto)
  - Dependencies: Theme system
  - Owner: TBD
  - Estimate: 2 hours
  - Acceptance: Persists across restarts

- [ ] **[P3/S/L]** Add session length configuration (cards per session)
  - Dependencies: Settings component
  - Owner: TBD
  - Estimate: 2 hours
  - Default: 25, Range: 10-50

- [ ] **[P3/S/L]** Implement settings persistence to config file
  - Dependencies: All settings
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Survives app restart

### 6.4 UX Refinements

- [ ] **[P3/M/M]** Add undo functionality for review ratings
  - Dependencies: Review component
  - Owner: TBD
  - Estimate: 4 hours
  - Acceptance: Can undo last rating

- [ ] **[P3/S/M]** Implement review streak counter
  - Dependencies: Events table
  - Owner: TBD
  - Estimate: 2 hours
  - Acceptance: Shows consecutive days studied

- [ ] **[P3/S/M]** Add congratulatory messages on mastery improvements
  - Dependencies: Mastery updates
  - Owner: TBD
  - Estimate: 2 hours
  - Acceptance: Toast on dimension level-up

- [ ] **[P3/S/L]** Implement card difficulty feedback ("too easy"/"too hard")
  - Dependencies: Review component
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Adjusts difficulty based on feedback

- [ ] **[P3/S/L]** Add "study mode" focus (only practice weak dimension)
  - Dependencies: Selector module
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Session focuses on chosen dimension

- [ ] **[P4/S/L]** Implement confetti animation on session completion
  - Dependencies: Review completion screen
  - Owner: TBD
  - Estimate: 2 hours
  - Library: canvas-confetti

### 6.5 Performance Optimization

- [ ] **[P3/M/M]** Add database query indexing optimization
  - Dependencies: All queries implemented
  - Owner: TBD
  - Estimate: 4 hours
  - Acceptance: All queries < 50ms

- [ ] **[P3/M/M]** Implement lazy loading for concept list
  - Dependencies: Concept list component
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Pagination or virtual scrolling

- [ ] **[P3/S/M]** Add React component memoization
  - Dependencies: All components
  - Owner: TBD
  - Estimate: 3 hours
  - Usage: React.memo, useMemo, useCallback

- [ ] **[P3/S/M]** Optimize bundle size (code splitting)
  - Dependencies: Build configuration
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Initial load < 1MB

- [ ] **[P4/M/L]** Add service worker for offline functionality
  - Dependencies: Electron app
  - Owner: TBD
  - Estimate: 4 hours
  - Acceptance: Works without internet (except LLM)

---

## Phase 7: Testing & Quality Assurance

### 7.1 Unit Testing

- [ ] **[P2/L/M]** Write tests for EWMA calculations
  - Dependencies: Mastery module
  - Owner: TBD
  - Estimate: 3 hours
  - Coverage: >90%

- [ ] **[P2/L/M]** Write tests for SM-2 scheduler
  - Dependencies: Scheduler module
  - Owner: TBD
  - Estimate: 4 hours
  - Coverage: All rating types, edge cases

- [ ] **[P2/M/M]** Write tests for selector algorithms
  - Dependencies: Selector module
  - Owner: TBD
  - Estimate: 4 hours
  - Coverage: All weight calculations

- [ ] **[P2/M/M]** Write tests for weakness detection
  - Dependencies: Detector module
  - Owner: TBD
  - Estimate: 3 hours
  - Coverage: All detection scenarios

- [ ] **[P2/M/M]** Write tests for database operations
  - Dependencies: Database module
  - Owner: TBD
  - Estimate: 5 hours
  - Coverage: CRUD operations, transactions

- [ ] **[P3/M/M]** Write tests for LLM integration
  - Dependencies: Generator module
  - Owner: TBD
  - Estimate: 4 hours
  - Strategy: Mock API responses

- [ ] **[P3/M/M]** Achieve 80%+ overall test coverage
  - Dependencies: All tests written
  - Owner: TBD
  - Estimate: 6 hours
  - Tool: Jest coverage reports

### 7.2 Integration Testing

- [ ] **[P2/L/M]** Write integration tests for review flow
  - Dependencies: Review component, backend
  - Owner: TBD
  - Estimate: 5 hours
  - Scenarios: Complete review session

- [ ] **[P2/M/M]** Write integration tests for mastery updates
  - Dependencies: Review flow, mastery module
  - Owner: TBD
  - Estimate: 4 hours
  - Scenarios: Mastery changes after reviews

- [ ] **[P2/M/M]** Write integration tests for adaptive selection
  - Dependencies: Selector, mastery, scheduler
  - Owner: TBD
  - Estimate: 4 hours
  - Scenarios: Weak dimension prioritization

- [ ] **[P3/M/M]** Write integration tests for card generation
  - Dependencies: Generator, database
  - Owner: TBD
  - Estimate: 4 hours
  - Scenarios: Auto-generation triggers

### 7.3 End-to-End Testing

- [ ] **[P3/L/M]** Set up Playwright for E2E testing
  - Dependencies: Electron app
  - Owner: TBD
  - Estimate: 4 hours
  - Acceptance: Can launch app and interact

- [ ] **[P3/M/M]** Write E2E test: Create concept and review
  - Dependencies: Playwright setup
  - Owner: TBD
  - Estimate: 4 hours
  - Flow: Create → Review → Rate → Verify mastery update

- [ ] **[P3/M/M]** Write E2E test: Complete full session
  - Dependencies: Playwright setup
  - Owner: TBD
  - Estimate: 4 hours
  - Flow: Start session → Complete 25 cards → View completion

- [ ] **[P3/M/M]** Write E2E test: Adaptive selection works
  - Dependencies: Playwright setup
  - Owner: TBD
  - Estimate: 5 hours
  - Flow: Multiple sessions → Verify weak dimension prioritized

- [ ] **[P4/M/L]** Write E2E test: Import/export workflow
  - Dependencies: Playwright setup
  - Owner: TBD
  - Estimate: 3 hours
  - Flow: Export → Import → Verify data integrity

---

## Phase 8: Documentation & Deployment

### 8.1 Code Documentation

- [ ] **[P2/M/M]** Add JSDoc comments to all public APIs
  - Dependencies: All modules complete
  - Owner: TBD
  - Estimate: 6 hours
  - Standard: JSDoc format with examples

- [ ] **[P2/M/M]** Document database schema with examples
  - Dependencies: Schema finalized
  - Owner: TBD
  - Estimate: 3 hours
  - Location: docs/database.md

- [ ] **[P2/M/M]** Create algorithm documentation (EWMA, SM-2, selector)
  - Dependencies: Algorithms implemented
  - Owner: TBD
  - Estimate: 4 hours
  - Location: docs/algorithms.md

- [ ] **[P3/M/M]** Generate API reference documentation
  - Dependencies: JSDoc comments
  - Owner: TBD
  - Estimate: 3 hours
  - Tool: TypeDoc

### 8.2 User Documentation

- [ ] **[P2/L/M]** Write user guide: Getting started
  - Dependencies: App functional
  - Owner: TBD
  - Estimate: 4 hours
  - Topics: Installation, first concept, first review

- [ ] **[P2/M/M]** Write user guide: Creating effective cards
  - Dependencies: None
  - Owner: TBD
  - Estimate: 3 hours
  - Topics: Best practices, fact grounding, difficulty levels

- [ ] **[P2/M/M]** Write user guide: Understanding mastery scores
  - Dependencies: Mastery system complete
  - Owner: TBD
  - Estimate: 3 hours
  - Topics: Dimensions, EWMA, interpreting dashboard

- [ ] **[P3/M/M]** Create FAQ document
  - Dependencies: User testing
  - Owner: TBD
  - Estimate: 3 hours
  - Common questions from testing

- [ ] **[P3/S/L]** Add in-app help tooltips
  - Dependencies: UI complete
  - Owner: TBD
  - Estimate: 4 hours
  - Coverage: Key features and concepts

### 8.3 Deployment Preparation

- [ ] **[P2/M/M]** Create production build configuration
  - Dependencies: Build system
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Optimized bundles

- [ ] **[P2/M/M]** Set up code signing for macOS
  - Dependencies: electron-builder
  - Owner: TBD
  - Estimate: 4 hours
  - Requirement: Apple Developer account

- [ ] **[P2/M/M]** Set up code signing for Windows
  - Dependencies: electron-builder
  - Owner: TBD
  - Estimate: 4 hours
  - Requirement: Code signing certificate

- [ ] **[P2/M/M]** Create installer packages (.dmg, .exe, .AppImage)
  - Dependencies: electron-builder
  - Owner: TBD
  - Estimate: 3 hours
  - Acceptance: Installable on all platforms

- [ ] **[P3/M/M]** Set up auto-update functionality
  - Dependencies: electron-updater
  - Owner: TBD
  - Estimate: 5 hours
  - Acceptance: App checks for updates on launch

- [ ] **[P3/S/M]** Create release notes template
  - Dependencies: None
  - Owner: TBD
  - Estimate: 2 hours
  - Format: Markdown with sections

- [ ] **[P3/S/M]** Set up GitHub Releases workflow
  - Dependencies: Packaging complete
  - Owner: TBD
  - Estimate: 3 hours
  - Tool: GitHub Actions

### 8.4 Operational Documentation

- [ ] **[P3/M/M]** Document database backup procedures
  - Dependencies: Backup functionality
  - Owner: TBD
  - Estimate: 2 hours
  - Location: docs/operations.md

- [ ] **[P3/S/M]** Document troubleshooting common issues
  - Dependencies: User testing
  - Owner: TBD
  - Estimate: 3 hours
  - Topics: Database corruption, LLM errors, performance

- [ ] **[P3/S/M]** Create development setup guide
  - Dependencies: Project complete
  - Owner: TBD
  - Estimate: 2 hours
  - Location: CONTRIBUTING.md

---

## Phase 9: Launch Preparation

### 9.1 Beta Testing

- [ ] **[P2/M/M]** Recruit 5-10 beta testers
  - Dependencies: Functional app
  - Owner: TBD
  - Estimate: 3 hours
  - Target: Students, learners, SRS users

- [ ] **[P2/L/M]** Conduct 2-week beta test period
  - Dependencies: Beta testers recruited
  - Owner: TBD
  - Estimate: 40 hours (2 weeks)
  - Feedback: Bug reports, UX issues, feature requests

- [ ] **[P2/M/M]** Implement critical beta feedback
  - Dependencies: Beta testing complete
  - Owner: TBD
  - Estimate: 10 hours
  - Priority: P1 bugs, major UX issues

- [ ] **[P3/M/M]** Analyze usage patterns from beta
  - Dependencies: Beta testing
  - Owner: TBD
  - Estimate: 4 hours
  - Metrics: Session length, dimensions used, generation frequency

### 9.2 Polish & Bug Fixes

- [ ] **[P2/L/M]** Fix all P1/P2 bugs from testing
  - Dependencies: Testing phases
  - Owner: TBD
  - Estimate: 15 hours
  - Acceptance: No critical bugs remain

- [ ] **[P3/M/M]** Address P3 bugs and minor issues
  - Dependencies: P1/P2 bugs fixed
  - Owner: TBD
  - Estimate: 8 hours
  - Acceptance: Known issues documented

- [ ] **[P3/M/M]** Perform UI polish pass
  - Dependencies: Beta feedback
  - Owner: TBD
  - Estimate: 6 hours
  - Focus: Consistency, spacing, colors, animations

- [ ] **[P3/S/M]** Optimize app startup time
  - Dependencies: All features complete
  - Owner: TBD
  - Estimate: 4 hours
  - Target: < 2 seconds to interactive

### 9.3 Launch Assets

- [ ] **[P2/S/M]** Create app icon (multiple resolutions)
  - Dependencies: None
  - Owner: TBD
  - Estimate: 3 hours
  - Sizes: 16x16 to 1024x1024

- [ ] **[P2/S/M]** Design splash screen/loading screen
  - Dependencies: None
  - Owner: TBD
  - Estimate: 2 hours
  - Acceptance: Branded, professional

- [ ] **[P3/S/L]** Create marketing screenshots
  - Dependencies: App complete
  - Owner: TBD
  - Estimate: 3 hours
  - Count: 5-7 screenshots showing key features

- [ ] **[P3/S/L]** Record demo video
  - Dependencies: App complete
  - Owner: TBD
  - Estimate: 4 hours
  - Length: 2-3 minutes, shows full workflow

---

## Success Criteria Validation

### Core Functionality Verification

- [ ] **[P1/M/H]** Verify mastery scores update correctly after each review
  - Dependencies: Mastery system complete
  - Owner: TBD
  - Estimate: 2 hours
  - Method: Manual testing + automated tests

- [ ] **[P1/M/H]** Verify weak dimensions receive higher selection weight
  - Dependencies: Selector complete
  - Owner: TBD
  - Estimate: 2 hours
  - Method: Log selection weights, verify bias

- [ ] **[P1/M/H]** Verify anti-frustration triggers after 3 consecutive failures
  - Dependencies: Safety rails complete
  - Owner: TBD
  - Estimate: 2 hours
  - Method: Deliberately fail cards, observe behavior

- [ ] **[P1/M/H]** Verify session stays within 70% single-dimension cap
  - Dependencies: Safety rails complete
  - Owner: TBD
  - Estimate: 2 hours
  - Method: Complete multiple sessions, analyze distribution

- [ ] **[P1/M/H]** Verify dashboard shows accurate dimension breakdown
  - Dependencies: Dashboard complete
  - Owner: TBD
  - Estimate: 2 hours
  - Method: Cross-reference with database values

- [ ] **[P2/M/M]** Verify LLM generates usable cards >80% of the time
  - Dependencies: Generator complete
  - Owner: TBD
  - Estimate: 3 hours
  - Method: Generate 50 cards, manually rate quality

- [ ] **[P1/M/H]** Verify app runs fully offline (except LLM features)
  - Dependencies: All features complete
  - Owner: TBD
  - Estimate: 2 hours
  - Method: Disconnect network, test all features

---

## Out of Scope (Future Roadmap)

### Explicitly Deferred (v1)

- [ ] **[Future]** Cloud sync / multi-device support
  - Complexity: XL
  - Estimate: 40+ hours
  - Requires: Backend server, authentication, conflict resolution

- [ ] **[Future]** User accounts / authentication system
  - Complexity: L
  - Estimate: 20+ hours
  - Requires: Auth service, user management

- [ ] **[Future]** Mobile apps (iOS/Android)
  - Complexity: XL
  - Estimate: 80+ hours
  - Requires: React Native or separate implementations

- [ ] **[Future]** Audio/image/video cards
  - Complexity: L
  - Estimate: 20+ hours
  - Requires: Media storage, playback, recording

- [ ] **[Future]** Shared decks / community content
  - Complexity: XL
  - Estimate: 40+ hours
  - Requires: Marketplace, moderation, licensing

- [ ] **[Future]** Contextual bandit optimization
  - Complexity: L
  - Estimate: 15+ hours
  - Requires: Advanced ML algorithms

- [ ] **[Future]** Cross-concept prerequisite sequencing
  - Complexity: XL
  - Estimate: 30+ hours
  - Requires: Knowledge graph, dependency management

---

## Risk Mitigation & Contingency

### High-Risk Items Requiring Investigation

- [ ] **[P1/M/H]** Research better-sqlite3 performance with large datasets
  - Risk: Slow queries with 10,000+ cards
  - Mitigation: Indexing, pagination, benchmarking
  - Estimate: 4 hours

- [ ] **[P1/M/H]** Validate EWMA alpha parameter sensitivity
  - Risk: Mastery scores too volatile or too stable
  - Mitigation: Simulation with test data
  - Estimate: 3 hours

- [ ] **[P2/M/M]** Test LLM generation quality across providers
  - Risk: Poor quality cards, hallucinations
  - Mitigation: Compare OpenAI vs Anthropic vs local models
  - Estimate: 4 hours

- [ ] **[P2/M/M]** Investigate Electron packaging issues per platform
  - Risk: Installers fail on certain OS versions
  - Mitigation: Test on multiple machines, VMs
  - Estimate: 5 hours

### Buffer Tasks for Unknown Complexity

- [ ] **[P3/L/L]** Buffer: Unforeseen architecture refactoring
  - Estimate: 10 hours
  - Use: If major design flaw discovered

- [ ] **[P3/M/L]** Buffer: Additional UI/UX iterations
  - Estimate: 8 hours
  - Use: If beta feedback requires redesign

- [ ] **[P3/M/L]** Buffer: Performance optimization deep dive
  - Estimate: 8 hours
  - Use: If app is slow with real data

---

## Summary Statistics

**Total Tasks:** 147
- **P1 (Critical):** 72 tasks
- **P2 (High):** 48 tasks
- **P3 (Medium):** 24 tasks
- **P4 (Low):** 3 tasks

**Estimated Total Effort:** 450-550 hours (56-69 work days)

**Phase Breakdown:**
- Phase 1 (Foundation): ~40 hours
- Phase 2 (Core SRS): ~50 hours
- Phase 3 (Mastery): ~40 hours
- Phase 4 (Adaptation): ~60 hours
- Phase 5 (LLM): ~50 hours
- Phase 6 (Polish): ~50 hours
- Phase 7 (Testing): ~40 hours
- Phase 8 (Documentation): ~35 hours
- Phase 9 (Launch): ~30 hours
- Buffer: ~25 hours

**Critical Path:** Phase 1 → Phase 2 → Phase 3 → Phase 4 (Adaptive selection is core value prop)

---

## ⚡ Agent-Accelerated Timeline

### Time Acceleration with AI Agents

**Agent Efficiency Multiplier:** 8x faster than manual development
**Maximum Parallelization:** 5 agents simultaneously
**Total Speedup:** ~40x (8x speed × 5 parallel agents)

### Complexity Estimates (Agent-Accelerated)

| Complexity | Manual Time | Agent Time | Description |
|------------|-------------|------------|-------------|
| **S (Small)** | 1-4 hours | 7.5-30 min | Quick setup, configuration tasks |
| **M (Medium)** | 4-8 hours | 30-60 min | Standard implementation work |
| **L (Large)** | 8-16 hours | 1-2 hours | Complex features, algorithms |
| **XL (Extra Large)** | 16+ hours | 2+ hours | Major systems, integrations |

### Phase Timeline (Agent-Accelerated)

| Phase | Manual | Single Agent | 5 Agents Parallel | Key Deliverables |
|-------|--------|--------------|-------------------|------------------|
| **Phase 1: Foundation** | 40h | 5.0h | ~1.0h | Database schema, TypeScript types, basic UI |
| **Phase 2: Core SRS** | 50h | 6.25h | ~1.25h | SM-2 algorithm, review flow, card editor |
| **Phase 3: Mastery** | 40h | 5.0h | ~1.0h | EWMA calculations, event logging, dashboard |
| **Phase 4: Adaptation** | 60h | 7.5h | ~1.5h | Weakness detection, adaptive selection, safety rails |
| **Phase 5: LLM** | 50h | 6.25h | ~1.25h | API integration, card generation, scaffolding |
| **Phase 6: Polish** | 50h | 6.25h | ~1.25h | Trends, import/export, settings, performance |
| **Phase 7: Testing** | 40h | 5.0h | ~1.0h | Unit, integration, E2E tests (80%+ coverage) |
| **Phase 8: Documentation** | 35h | 4.4h | ~0.9h | Code docs, user guides, deployment prep |
| **Phase 9: Launch** | 30h | 3.75h | ~0.75h | Beta testing, bug fixes, launch assets |
| **Buffer Tasks** | 25h | 3.1h | ~0.6h | Contingency for unknowns |
| **TOTAL** | **450-550h** | **56-69h** | **11-14h** | Complete v1.0 application |

### Parallel Execution Strategy

#### Phase 1: Foundation (5 agents × 1 hour = 1 hour)
- **Agent 1:** Project setup + ESLint + Jest + build system (4 tasks)
- **Agent 2:** Database schema creation (concepts, variants, mastery tables) (3 tasks)
- **Agent 3:** Database schema (events, schedule, indexes) + migrations (3 tasks)
- **Agent 4:** TypeScript types and interfaces (8 tasks)
- **Agent 5:** React + UI library + routing + layout (4 tasks)

#### Phase 2: Core SRS (5 agents × 1.25 hours = 1.25 hours)
- **Agent 1:** Database operations layer (CRUD for all tables) (6 tasks)
- **Agent 2:** SM-2 scheduling algorithm implementation (7 tasks)
- **Agent 3:** Review UI component and flow (9 tasks)
- **Agent 4:** Card creation UI (ConceptEditor + VariantEditor) (10 tasks)
- **Agent 5:** Database validation, transactions, logging (3 tasks)

#### Phase 3: Mastery Tracking (5 agents × 1 hour = 1 hour)
- **Agent 1:** Event logging system (6 tasks)
- **Agent 2:** EWMA mastery calculations (10 tasks)
- **Agent 3:** Dashboard component and visualization (10 tasks)
- **Agent 4:** Unit tests for mastery module
- **Agent 5:** Integration with review flow

#### Phase 4: Adaptation (5 agents × 1.5 hours = 1.5 hours)
- **Agent 1:** Weakness detection system (7 tasks)
- **Agent 2:** Weighted card selection algorithm (10 tasks)
- **Agent 3:** Safety rails implementation (6 tasks)
- **Agent 4:** Selection reasoning transparency (4 tasks)
- **Agent 5:** Integration and testing

#### Phase 5: LLM Integration (5 agents × 1.25 hours = 1.25 hours)
- **Agent 1:** LLM API clients (OpenAI, Anthropic, Ollama) (6 tasks)
- **Agent 2:** Prompt engineering and card generation (6 tasks)
- **Agent 3:** Scaffolding ladder (difficulty levels 1-4) (5 tasks)
- **Agent 4:** Automatic generation triggers (4 tasks)
- **Agent 5:** Manual generation UI (5 tasks)

#### Phase 6: Polish (5 agents × 1.25 hours = 1.25 hours)
- **Agent 1:** Trend tracking system (6 tasks)
- **Agent 2:** Import/export functionality (6 tasks)
- **Agent 3:** Settings and configuration UI (7 tasks)
- **Agent 4:** UX refinements and features (6 tasks)
- **Agent 5:** Performance optimization (5 tasks)

#### Phase 7: Testing (5 agents × 1 hour = 1 hour)
- **Agent 1:** Unit tests (mastery, scheduler, selector) (7 tasks)
- **Agent 2:** Integration tests (review flow, adaptive selection) (4 tasks)
- **Agent 3:** E2E tests with Playwright (5 tasks)
- **Agent 4:** Test coverage analysis and gap filling
- **Agent 5:** Performance and load testing

#### Phase 8: Documentation (5 agents × 0.9 hours = 0.9 hours)
- **Agent 1:** Code documentation (JSDoc, API reference) (4 tasks)
- **Agent 2:** User documentation (guides, tutorials) (3 tasks)
- **Agent 3:** Deployment preparation (packaging, signing) (5 tasks)
- **Agent 4:** Operational documentation (backup, troubleshooting) (3 tasks)
- **Agent 5:** Documentation review and polish

#### Phase 9: Launch (3-5 agents × 0.75 hours = 0.75 hours)
- **Agent 1:** Beta testing coordination and feedback (4 tasks)
- **Agent 2:** Critical bug fixes from testing (4 tasks)
- **Agent 3:** Launch assets (icon, screenshots, demo video) (4 tasks)
- **Sequential:** Some tasks (beta testing period) must run sequentially

### Critical Path Analysis (Agent-Accelerated)

**Sequential Dependencies (Must Complete in Order):**
1. **Phase 1 → Phase 2:** Database schema required for operations layer (~2.25h cumulative)
2. **Phase 2 → Phase 3:** Review flow required for event logging (~3.25h cumulative)
3. **Phase 3 → Phase 4:** Mastery tracking required for adaptive selection (~4.75h cumulative)
4. **Phase 4 → Testing:** Adaptive selection is MVP, ready for validation (~5.75h cumulative)

**Parallel Opportunities:**
- Phase 5 (LLM) can run parallel to Phase 6 (Polish) after Phase 4 completes
- Phase 7 (Testing) can start incrementally during Phase 4-6 development
- Phase 8 (Documentation) can run parallel to Phase 7
- Phase 9 (Launch) requires all previous phases complete

**Optimized Timeline with Smart Parallelization:**
- **Hours 0-1:** Phase 1 (Foundation) - 5 agents in parallel
- **Hours 1-2.25:** Phase 2 (Core SRS) - 5 agents in parallel
- **Hours 2.25-3.25:** Phase 3 (Mastery) - 5 agents in parallel
- **Hours 3.25-4.75:** Phase 4 (Adaptation) - 5 agents in parallel
- **Hours 4.75-6:** Phase 5 (LLM) + Phase 6 (Polish) - 5 agents split
- **Hours 6-7:** Phase 7 (Testing) - 5 agents in parallel
- **Hours 7-7.9:** Phase 8 (Documentation) - 5 agents in parallel
- **Hours 7.9-8.65:** Phase 9 (Launch prep) - 3-5 agents
- **Days 8.65-22.65 (14 days):** Beta testing period (sequential)
- **Hours 22.65-23.4:** Post-beta fixes and final polish

**Total Calendar Time:** ~23.5 hours active development + 14 days beta testing

### Task Distribution by Priority (Agent-Accelerated)

| Priority | Task Count | Manual Hours | Agent Hours | Parallel (5 agents) |
|----------|------------|--------------|-------------|---------------------|
| **P1 (Critical)** | 72 | 240h | 30h | ~6h |
| **P2 (High)** | 48 | 150h | 18.75h | ~3.75h |
| **P3 (Medium)** | 24 | 50h | 6.25h | ~1.25h |
| **P4 (Low)** | 3 | 10h | 1.25h | ~0.25h |

### Resource Allocation Recommendations

**Optimal Agent Specialization:**
1. **Backend Agent:** Database, algorithms, scheduling, mastery calculations
2. **Frontend Agent:** React components, UI/UX, visualization, dashboard
3. **Integration Agent:** LLM integration, API clients, generation system
4. **Testing Agent:** Unit tests, integration tests, E2E tests, coverage
5. **Documentation Agent:** Code docs, user guides, deployment, operations

**Sequential Bottlenecks to Watch:**
- Database schema changes affect all dependent work
- Review flow integration touches many modules
- Beta testing period cannot be accelerated (requires real user feedback)
- Code signing and packaging requires manual credential setup

**Efficiency Gains:**
- **Manual development:** 450-550 hours (11-14 weeks full-time)
- **Single AI agent:** 56-69 hours (7-9 work days)
- **5 AI agents parallel:** 11-14 hours (< 2 work days active development)
- **Calendar time with beta:** ~16 days (2 days dev + 14 days beta)

### Real-World Timeline Estimate

**Development Sprint:** 2-3 days intensive work
- Day 1: Phases 1-4 (core functionality) - 8 hours
- Day 2: Phases 5-7 (LLM, polish, testing) - 6 hours
- Day 3: Phases 8-9 (documentation, launch prep) - 2 hours

**Beta Testing:** 14 days with real users
- Collect feedback, monitor usage
- Fix critical bugs as they arise

**Final Polish:** 1 day
- Address beta feedback
- Final QA pass
- Prepare release

**Total Calendar Time:** 17-18 days from kickoff to v1.0 launch

---

## Notes for Implementation

1. **Prioritization Strategy:**
   - Complete all P1 tasks before moving to P2
   - P1 tasks establish critical infrastructure and core algorithms
   - P2 tasks add essential features for MVP
   - P3/P4 tasks are polish and quality improvements

2. **Testing Strategy:**
   - Write unit tests alongside implementation
   - Integration tests after each phase completion
   - E2E tests after Phase 6 (full feature set)

3. **Documentation Strategy:**
   - JSDoc comments during implementation
   - User documentation after beta testing (real usage feedback)
   - Architecture documentation as decisions are made

4. **Flexibility:**
   - Task estimates are based on single developer
   - Actual time may vary ±50% depending on experience
   - Use buffer tasks if schedule slips

5. **Dependencies:**
   - Many tasks can be parallelized within phases
   - Database operations are prerequisite for most backend work
   - UI components can be developed alongside backend with mock data

---

**Last Updated:** 2025-01-16 (Added agent-accelerated timeline analysis)
**Next Review:** After Phase 1 completion

---

## 🚀 Quick Start with AI Agents

**To launch development with 5 parallel agents:**

```bash
# Phase 1: Foundation (1 hour)
claude-agent --agent=backend --tasks="Database schema setup"
claude-agent --agent=frontend --tasks="React + UI setup"
claude-agent --agent=backend --tasks="TypeScript types"
claude-agent --agent=devops --tasks="Project configuration"
claude-agent --agent=backend --tasks="Migration system"

# Monitor progress, then proceed to Phase 2...
```

**Expected Timeline:**
- **Active development:** 11-14 hours with 5 agents
- **Beta testing:** 14 days
- **Total to launch:** 17-18 days

**Key Success Factor:** Proper task distribution across specialized agents maximizes parallelization and minimizes sequential bottlenecks.
