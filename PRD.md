# Product Requirements Document: Adaptive Mastery Learning System

**Version:** 1.0.0  
**Date:** January 2025  
**Type:** Local-first personal project (Electron or local server)

---

## 1. Executive Summary

A local spaced repetition system that goes beyond basic flashcard drilling by detecting which *types* of questions you struggle with and automatically rebalancing practice toward your weaknesses. Instead of treating all correct answers equally, it tracks performance across six cognitive dimensions and adapts card selection to push you toward genuine mastery.

**Core idea:** "Anki that teaches" rather than "Anki that drills."

**Deployment:** Local SQLite database, runs as Electron app or local Node.js server. No cloud dependencies except optional LLM API for card generation.

---

## 2. Problem Statement

Traditional SRS systems have a blind spot: they can't tell the difference between:
- Recognizing a definition vs. applying a concept
- Fast confident recall vs. slow uncertain recognition
- Memorizing a specific card vs. understanding the underlying idea

**Result:** Users ace definition cards but fail when asked to apply knowledge in scenarios. They've memorized flashcards, not concepts.

---

## 3. Goals

1. Detect when you're strong on definitions but weak on application
2. Automatically prioritize question types you struggle with
3. Generate new question variants targeting weak areas (via LLM)
4. Prevent frustration spirals when struggling
5. Show honest feedback about your actual mastery profile

---

## 4. User Stories

### Core
- As a learner, I want the system to detect my weak dimensions so I can focus on actual gaps
- As a learner, I want cards that test application, not just recognition
- As a learner, I want to see my skill breakdown across dimensions

### Adaptive
- As a learner, I want harder question types prioritized for concepts I "know"
- As a learner, I want scaffolded difficulty when I'm struggling
- As a learner, I want the system to back off after repeated failures

### Transparency
- As a learner, I want to understand why a card was selected
- As a learner, I want to see progress per dimension over time

---

## 5. Functional Requirements

### 5.1 Skill Dimensions

Six cognitive dimensions for testing any concept:

| Dimension | Description | Example |
|-----------|-------------|---------|
| `definition_recall` | Term ↔ definition | "What is X?" |
| `paraphrase_recognition` | Same meaning, different words | "Which means the same as X?" |
| `example_classification` | Is this an instance of X? | "Is this an example of mitosis?" |
| `scenario_application` | Apply to novel situation | "Given this case, what concept applies?" |
| `discrimination` | Distinguish similar concepts | "What's the difference between X and Y?" |
| `cloze_fill` | Fill in the blank | "X converts ___ into ___" |

Every card variant must be tagged with:
- `dimension` (one of the six)
- `difficulty` (1-5)
- `conceptId`

### 5.2 Review Event Logging

For every answer, store:

```typescript
interface ReviewEvent {
  conceptId: string
  variantId: string
  dimension: Dimension
  difficulty: number
  result: 'again' | 'hard' | 'good' | 'easy'
  timeToAnswerMs: number
  hintsUsed: number
  timestamp: Date
}
```

Time-to-answer matters: "correct but slow" = fragile knowledge.

### 5.3 Mastery Computation

Use exponentially-weighted moving averages (EWMA) per dimension:

```typescript
// Per dimension, maintain:
interface DimensionMastery {
  accuracyEwma: number  // 0-1
  speedEwma: number     // 0-1
  recentCount: number   // samples
}

// Update after each review:
const ratingScore = { again: 0, hard: 0.4, good: 0.7, easy: 1.0 }
const speedScore = 1 - clamp(timeToAnswer / targetTime, 0, 2) / 2

// EWMA update (α ≈ 0.15):
accuracyEwma = (1 - α) * accuracyEwma + α * ratingScore[result]
speedEwma = (1 - α) * speedEwma + α * speedScore

// Combined mastery:
mastery = 0.7 * accuracyEwma + 0.3 * speedEwma
```

### 5.4 Weakness Detection

Detect skill gaps:

```typescript
// Flag weakness when:
if (mastery['definition_recall'] >= 0.75 &&
    mastery['scenario_application'] <= 0.55 &&
    recentCount['both'] >= 20) {
  weaknessFocus = 'scenario_application'
}
```

Also detect:
- **Fragile confidence:** High accuracy + low speed
- **Dodging patterns:** Strong definitions, weak everything else

### 5.5 Adaptive Card Selection

When a concept is due, select which *variant* to show:

```typescript
weight = baseWeight(difficulty)
       * weaknessBoost(dimension)
       * noveltyBoost
       * antiFrustrationPenalty

// Weakness boost (push toward weak dimensions):
if (mastery[dimension] < 0.7) {
  weaknessBoost = 1 + 2 * (0.7 - mastery[dimension])
} else {
  weaknessBoost = 0.9
}

// Novelty boost (prefer unseen variants):
noveltyBoost = daysSinceShown > 7 ? 1.5 : 0.8

// Anti-frustration (back off after failures):
if (consecutiveFailures[dimension] >= 3) {
  antiFrustrationPenalty = 0.3
  // Also: reduce difficulty, add hints
}
```

### 5.6 Safety Rails

| Rule | Limit |
|------|-------|
| Max single-dimension focus per session | 70% |
| Maintenance reps on strong dimensions | 20% |
| Max consecutive same-dimension cards | 4 |
| Insert confidence card after | 3 failures in a row |

### 5.7 Variant Generation (Optional LLM)

When weak dimension lacks variants for a due concept:

```
Prompt: Generate 3 {dimension} cards for concept "{name}"

Definition: {definition}
Facts (use ONLY these): {facts}

Difficulty: {target}
Format: JSON array with front, back, hints
```

**Scaffolding ladder for scenarios:**
1. Multiple-choice with hints
2. Short "what concept?" question
3. Full scenario requiring explanation
4. Discrimination: "Why not X instead?"

### 5.8 UI Transparency

Show with each card:
- "Focus: scenarios (you're strong on definitions)"
- "Confidence builder after tough stretch"

Dashboard:
- Skill bars per dimension (0-100%)
- "Biggest gap: scenarios vs definitions"
- Trend arrows (improving/declining)

---

## 6. Technical Requirements

### 6.1 Architecture

```
┌─────────────────────────────────────┐
│  Electron App / Local Web Server    │
├─────────────────────────────────────┤
│  Review Engine    │  Mastery Calc   │
│  Card Selector    │  Event Logger   │
├─────────────────────────────────────┤
│         SQLite Database             │
├─────────────────────────────────────┤
│  Optional: LLM API (card gen only)  │
└─────────────────────────────────────┘
```

### 6.2 Data Models (SQLite)

```sql
-- Concepts
CREATE TABLE concepts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  definition TEXT NOT NULL,
  facts TEXT -- JSON array for grounding
);

-- Card variants
CREATE TABLE variants (
  id TEXT PRIMARY KEY,
  concept_id TEXT REFERENCES concepts(id),
  dimension TEXT NOT NULL,
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  hints TEXT, -- JSON array
  last_shown_at TEXT
);

-- User mastery state
CREATE TABLE mastery (
  dimension TEXT PRIMARY KEY,
  accuracy_ewma REAL DEFAULT 0.5,
  speed_ewma REAL DEFAULT 0.5,
  recent_count INTEGER DEFAULT 0
);

-- Review events (for history/debugging)
CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  concept_id TEXT,
  variant_id TEXT,
  dimension TEXT,
  difficulty INTEGER,
  result TEXT,
  time_ms INTEGER,
  hints_used INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- SRS scheduling (concept-level)
CREATE TABLE schedule (
  concept_id TEXT PRIMARY KEY,
  due_at TEXT,
  interval_days REAL,
  ease_factor REAL DEFAULT 2.5
);
```

### 6.3 Tech Stack Options

**Option A: Electron**
- Frontend: React/Svelte/Vue
- Backend: Node.js in main process
- Database: better-sqlite3
- Packaging: electron-builder

**Option B: Local Server**
- Server: Express/Fastify/Hono
- Frontend: Any SPA or server-rendered
- Database: better-sqlite3
- Run: `npm start` opens browser

**LLM Integration:**
- OpenAI/Anthropic API for card generation
- Local models via Ollama (optional)
- Store API key in local config file

### 6.4 File Structure

```
adaptive-srs/
├── src/
│   ├── main/           # Electron main process / server
│   │   ├── db.ts       # SQLite operations
│   │   ├── mastery.ts  # EWMA calculations
│   │   ├── selector.ts # Weighted card selection
│   │   ├── generator.ts # LLM card generation
│   │   └── scheduler.ts # SRS algorithm
│   ├── renderer/       # UI
│   │   ├── Review.tsx
│   │   ├── Dashboard.tsx
│   │   └── CardEditor.tsx
│   └── shared/
│       └── types.ts
├── data/
│   └── learning.db     # SQLite database
├── config.json         # API keys, settings
└── package.json
```

---

## 7. Design Requirements

### 7.1 Review Screen

```
┌────────────────────────────────────┐
│ Progress: 8/25        [Settings]   │
├────────────────────────────────────┤
│                                    │
│ 📎 Focus: Application practice     │
│                                    │
│ ┌────────────────────────────────┐ │
│ │                                │ │
│ │  A patient presents with...    │ │
│ │  What condition is most        │ │
│ │  likely?                       │ │
│ │                                │ │
│ └────────────────────────────────┘ │
│                                    │
│    [Hint]         [Show Answer]    │
│                                    │
├────────────────────────────────────┤
│ ●●●○○ Difficulty    🎯 Scenario    │
└────────────────────────────────────┘
```

### 7.2 Answer Screen

```
┌────────────────────────────────────┐
│ Answer: Condition X                │
│                                    │
│ Because symptoms Y and Z are       │
│ characteristic of...               │
├────────────────────────────────────┤
│                                    │
│  [Again]  [Hard]  [Good]  [Easy]   │
│                                    │
└────────────────────────────────────┘
```

### 7.3 Dashboard

```
┌────────────────────────────────────┐
│ Your Mastery Profile               │
├────────────────────────────────────┤
│ Definition    ████████████░░  85%  │
│ Paraphrase    █████████░░░░░  68%  │
│ Examples      ████████░░░░░░  62%  │
│ Scenarios     ████░░░░░░░░░░  34%  │ ⚠️ Gap
│ Discrimination██████░░░░░░░░  48%  │
│ Cloze         ████████████░░  82%  │
├────────────────────────────────────┤
│ 💡 Focus on scenario practice      │
│    to close your biggest gap       │
└────────────────────────────────────┘
```

---

## 8. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- SQLite schema and basic CRUD
- Standard SRS scheduling (SM-2)
- Simple review UI without adaptation
- Manual card creation

### Phase 2: Instrumentation (Week 3)
- Event logging with timing
- EWMA mastery calculation
- Basic dashboard with dimension bars

### Phase 3: Adaptation (Week 4-5)
- Weighted variant selection
- Weakness detection and flagging
- Anti-frustration mechanisms
- Selection reason display

### Phase 4: Generation (Week 6)
- LLM integration for card generation
- Scaffolding ladder implementation
- Fact grounding validation

### Phase 5: Polish (Week 7-8)
- Trend tracking over time
- Import/export functionality
- Settings and configuration
- Bug fixes and UX refinement

---

## 9. Out of Scope (v1)

- Cloud sync / multi-device
- User accounts / authentication
- Mobile apps (Electron desktop only)
- Audio/image cards
- Shared decks / community content
- Contextual bandit optimization
- Cross-concept prerequisite sequencing

---

## 10. Success Criteria

- [ ] Mastery scores update correctly after each review
- [ ] Weak dimensions receive higher selection weight
- [ ] Anti-frustration triggers after 3 consecutive failures
- [ ] Session stays within 70% single-dimension cap
- [ ] Dashboard shows accurate dimension breakdown
- [ ] LLM generates usable cards >80% of the time
- [ ] App runs fully offline (except LLM features)

---

## Appendix: Key Algorithms

### EWMA Update
```typescript
function updateEwma(current: number, newValue: number, alpha = 0.15): number {
  return (1 - alpha) * current + alpha * newValue
}
```

### Rating to Score
```typescript
const ratingToScore = {
  again: 0.0,
  hard: 0.4,
  good: 0.7,
  easy: 1.0
}
```

### Speed Score
```typescript
function speedScore(timeMs: number, difficulty: number): number {
  const targetMs = [5000, 10000, 20000, 40000, 60000][difficulty - 1]
  const normalized = Math.min(timeMs / targetMs, 2)
  return 1 - normalized / 2
}
```

### Weakness Boost
```typescript
function weaknessBoost(dimensionMastery: number): number {
  if (dimensionMastery < 0.7) {
    return 1 + 2 * (0.7 - dimensionMastery)
  }
  return 0.9
}
```

---

**Next step after v1:** Turn dimension scores into automatic curriculum sequencing—so the system knows *what* to learn next, not just *how* to quiz what's due.