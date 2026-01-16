# MVP Specification: Adaptive Mastery Learning System

**Version:** 0.1.0  
**Target:** 2-week build  
**Stack:** Electron + React + SQLite (or local Express server)

---

## What We're Building

A spaced repetition app that tracks *how* you answer (not just if you're right) and automatically gives you more of the question types you struggle with.

**One-liner:** Flashcards that detect your weak spots and push you to fix them.

---

## MVP Scope

### In Scope ✅

1. **Six dimensions** - Tag cards as definition/scenario/discrimination/etc.
2. **Timed responses** - Track answer speed, not just correctness
3. **EWMA mastery** - Running average per dimension
4. **Weighted selection** - Bias toward weak dimensions
5. **Basic dashboard** - See your dimension breakdown
6. **Anti-frustration** - Back off after 3 failures

### Out of Scope ❌

- LLM card generation (use manual cards for MVP)
- Import/export
- Multiple decks
- Settings UI
- Trends over time
- Pretty animations

---

## Data Model

### SQLite Schema (Minimal)

```sql
-- Concepts (what you're learning)
CREATE TABLE concepts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  definition TEXT
);

-- Card variants (different ways to test a concept)
CREATE TABLE variants (
  id TEXT PRIMARY KEY,
  concept_id TEXT REFERENCES concepts(id),
  dimension TEXT NOT NULL, -- 'definition'|'scenario'|'discrimination'|'cloze'|'example'|'paraphrase'
  difficulty INTEGER DEFAULT 3,
  front TEXT NOT NULL,
  back TEXT NOT NULL
);

-- Mastery state (one row per dimension)
CREATE TABLE mastery (
  dimension TEXT PRIMARY KEY,
  accuracy_ewma REAL DEFAULT 0.5,
  speed_ewma REAL DEFAULT 0.5,
  count INTEGER DEFAULT 0
);

-- SRS schedule (one row per concept)
CREATE TABLE schedule (
  concept_id TEXT PRIMARY KEY REFERENCES concepts(id),
  due_at TEXT,
  interval_days REAL DEFAULT 1,
  ease REAL DEFAULT 2.5
);

-- Review log (for debugging, not critical path)
CREATE TABLE reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  variant_id TEXT,
  dimension TEXT,
  result TEXT, -- 'again'|'hard'|'good'|'easy'
  time_ms INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### TypeScript Types

```typescript
type Dimension = 
  | 'definition' 
  | 'paraphrase' 
  | 'example' 
  | 'scenario' 
  | 'discrimination' 
  | 'cloze'

type Rating = 'again' | 'hard' | 'good' | 'easy'

interface Variant {
  id: string
  conceptId: string
  dimension: Dimension
  difficulty: number
  front: string
  back: string
}

interface DimensionMastery {
  dimension: Dimension
  accuracyEwma: number
  speedEwma: number
  count: number
}

interface ReviewResult {
  variantId: string
  result: Rating
  timeMs: number
}
```

---

## Core Algorithms

### 1. Mastery Update (after each review)

```typescript
const ALPHA = 0.15

const ratingScore: Record<Rating, number> = {
  again: 0.0,
  hard: 0.4,
  good: 0.7,
  easy: 1.0
}

function getSpeedScore(timeMs: number, difficulty: number): number {
  const targets = [5000, 10000, 20000, 40000, 60000]
  const target = targets[difficulty - 1] || 20000
  const ratio = Math.min(timeMs / target, 2)
  return 1 - ratio / 2
}

function updateMastery(
  current: DimensionMastery,
  result: Rating,
  timeMs: number,
  difficulty: number
): DimensionMastery {
  const accScore = ratingScore[result]
  const spdScore = getSpeedScore(timeMs, difficulty)
  
  return {
    dimension: current.dimension,
    accuracyEwma: (1 - ALPHA) * current.accuracyEwma + ALPHA * accScore,
    speedEwma: (1 - ALPHA) * current.speedEwma + ALPHA * spdScore,
    count: current.count + 1
  }
}

function getMasteryScore(m: DimensionMastery): number {
  return 0.7 * m.accuracyEwma + 0.3 * m.speedEwma
}
```

### 2. Card Selection (weighted by weakness)

```typescript
interface SelectionCandidate {
  variant: Variant
  weight: number
}

function selectVariant(
  variants: Variant[],
  mastery: Map<Dimension, DimensionMastery>,
  recentFailures: Map<Dimension, number>
): Variant {
  const candidates: SelectionCandidate[] = variants.map(v => {
    const m = mastery.get(v.dimension)
    const score = m ? getMasteryScore(m) : 0.5
    const failures = recentFailures.get(v.dimension) || 0
    
    // Weakness boost: weaker = higher weight
    let weight = 1
    if (score < 0.7) {
      weight = 1 + 2 * (0.7 - score) // up to 2.4x for very weak
    } else {
      weight = 0.9 // slight penalty for strong
    }
    
    // Anti-frustration: back off after failures
    if (failures >= 3) {
      weight *= 0.3
    }
    
    return { variant: v, weight }
  })
  
  // Weighted random selection
  const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0)
  let random = Math.random() * totalWeight
  
  for (const c of candidates) {
    random -= c.weight
    if (random <= 0) return c.variant
  }
  
  return candidates[0].variant
}
```

### 3. Simple SRS Scheduling (SM-2 variant)

```typescript
interface ScheduleUpdate {
  intervalDays: number
  ease: number
  dueAt: Date
}

function updateSchedule(
  current: { intervalDays: number; ease: number },
  result: Rating
): ScheduleUpdate {
  let { intervalDays, ease } = current
  
  switch (result) {
    case 'again':
      intervalDays = 1
      ease = Math.max(1.3, ease - 0.2)
      break
    case 'hard':
      intervalDays = intervalDays * 1.2
      ease = Math.max(1.3, ease - 0.15)
      break
    case 'good':
      intervalDays = intervalDays * ease
      break
    case 'easy':
      intervalDays = intervalDays * ease * 1.3
      ease = ease + 0.15
      break
  }
  
  const dueAt = new Date()
  dueAt.setDate(dueAt.getDate() + intervalDays)
  
  return { intervalDays, ease, dueAt }
}
```

---

## UI Components (React)

### App Structure

```
src/
├── main.ts              # Electron main / Express server
├── db.ts                # SQLite operations
├── App.tsx              # Router
├── components/
│   ├── Review.tsx       # Main review screen
│   ├── Answer.tsx       # Show answer + rating buttons
│   ├── Dashboard.tsx    # Dimension bars
│   └── AddCard.tsx      # Manual card creation
└── lib/
    ├── mastery.ts       # EWMA calculations
    ├── selector.ts      # Weighted selection
    └── scheduler.ts     # SRS logic
```

### Review Screen (Simplified)

```tsx
function Review() {
  const [card, setCard] = useState<Variant | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [startTime, setStartTime] = useState(0)
  
  useEffect(() => {
    loadNextCard()
  }, [])
  
  async function loadNextCard() {
    const dueConceptId = await db.getNextDueConcept()
    if (!dueConceptId) {
      setCard(null)
      return
    }
    
    const variants = await db.getVariants(dueConceptId)
    const mastery = await db.getAllMastery()
    const failures = await db.getRecentFailures()
    
    const selected = selectVariant(variants, mastery, failures)
    setCard(selected)
    setShowAnswer(false)
    setStartTime(Date.now())
  }
  
  async function handleRating(result: Rating) {
    if (!card) return
    
    const timeMs = Date.now() - startTime
    
    // Update mastery
    const current = await db.getMastery(card.dimension)
    const updated = updateMastery(current, result, timeMs, card.difficulty)
    await db.saveMastery(updated)
    
    // Update schedule
    const schedule = await db.getSchedule(card.conceptId)
    const newSchedule = updateSchedule(schedule, result)
    await db.saveSchedule(card.conceptId, newSchedule)
    
    // Log review
    await db.logReview(card.id, card.dimension, result, timeMs)
    
    // Track failures for anti-frustration
    if (result === 'again') {
      await db.incrementFailures(card.dimension)
    } else {
      await db.resetFailures(card.dimension)
    }
    
    loadNextCard()
  }
  
  if (!card) {
    return <div className="done">No cards due! 🎉</div>
  }
  
  return (
    <div className="review">
      <div className="focus-label">
        Focus: {card.dimension}
      </div>
      
      <div className="card">
        <div className="front">{card.front}</div>
        
        {showAnswer && (
          <div className="back">{card.back}</div>
        )}
      </div>
      
      {!showAnswer ? (
        <button onClick={() => setShowAnswer(true)}>
          Show Answer
        </button>
      ) : (
        <div className="ratings">
          <button onClick={() => handleRating('again')}>Again</button>
          <button onClick={() => handleRating('hard')}>Hard</button>
          <button onClick={() => handleRating('good')}>Good</button>
          <button onClick={() => handleRating('easy')}>Easy</button>
        </div>
      )}
    </div>
  )
}
```

### Dashboard (Minimal)

```tsx
function Dashboard() {
  const [mastery, setMastery] = useState<DimensionMastery[]>([])
  
  useEffect(() => {
    db.getAllMastery().then(setMastery)
  }, [])
  
  const dimensions: Dimension[] = [
    'definition', 'paraphrase', 'example', 
    'scenario', 'discrimination', 'cloze'
  ]
  
  return (
    <div className="dashboard">
      <h2>Your Mastery</h2>
      
      {dimensions.map(dim => {
        const m = mastery.find(x => x.dimension === dim)
        const score = m ? getMasteryScore(m) : 0.5
        const pct = Math.round(score * 100)
        const isWeak = score < 0.5
        
        return (
          <div key={dim} className="dimension-row">
            <span className="label">{dim}</span>
            <div className="bar">
              <div 
                className="fill" 
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="pct">{pct}%</span>
            {isWeak && <span className="warning">⚠️</span>}
          </div>
        )
      })}
    </div>
  )
}
```

### Add Card Form (Basic)

```tsx
function AddCard() {
  const [conceptId, setConceptId] = useState('')
  const [dimension, setDimension] = useState<Dimension>('definition')
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    
    await db.addVariant({
      id: crypto.randomUUID(),
      conceptId,
      dimension,
      difficulty: 3,
      front,
      back
    })
    
    setFront('')
    setBack('')
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <select 
        value={conceptId} 
        onChange={e => setConceptId(e.target.value)}
      >
        {/* populate from db.getConcepts() */}
      </select>
      
      <select
        value={dimension}
        onChange={e => setDimension(e.target.value as Dimension)}
      >
        <option value="definition">Definition</option>
        <option value="paraphrase">Paraphrase</option>
        <option value="example">Example</option>
        <option value="scenario">Scenario</option>
        <option value="discrimination">Discrimination</option>
        <option value="cloze">Cloze</option>
      </select>
      
      <textarea 
        placeholder="Front (question)"
        value={front}
        onChange={e => setFront(e.target.value)}
      />
      
      <textarea
        placeholder="Back (answer)"
        value={back}
        onChange={e => setBack(e.target.value)}
      />
      
      <button type="submit">Add Card</button>
    </form>
  )
}
```

---

## Database Operations

```typescript
// db.ts - SQLite wrapper (using better-sqlite3)
import Database from 'better-sqlite3'

const db = new Database('learning.db')

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS concepts (...)
  CREATE TABLE IF NOT EXISTS variants (...)
  CREATE TABLE IF NOT EXISTS mastery (...)
  CREATE TABLE IF NOT EXISTS schedule (...)
  CREATE TABLE IF NOT EXISTS reviews (...)
`)

export function getNextDueConcept(): string | null {
  const row = db.prepare(`
    SELECT concept_id FROM schedule 
    WHERE due_at <= datetime('now')
    ORDER BY due_at ASC
    LIMIT 1
  `).get()
  return row?.concept_id || null
}

export function getVariants(conceptId: string): Variant[] {
  return db.prepare(`
    SELECT * FROM variants WHERE concept_id = ?
  `).all(conceptId)
}

export function getMastery(dimension: string): DimensionMastery {
  const row = db.prepare(`
    SELECT * FROM mastery WHERE dimension = ?
  `).get(dimension)
  
  return row || {
    dimension,
    accuracyEwma: 0.5,
    speedEwma: 0.5,
    count: 0
  }
}

export function getAllMastery(): DimensionMastery[] {
  return db.prepare(`SELECT * FROM mastery`).all()
}

export function saveMastery(m: DimensionMastery): void {
  db.prepare(`
    INSERT OR REPLACE INTO mastery 
    (dimension, accuracy_ewma, speed_ewma, count)
    VALUES (?, ?, ?, ?)
  `).run(m.dimension, m.accuracyEwma, m.speedEwma, m.count)
}

export function getSchedule(conceptId: string) {
  return db.prepare(`
    SELECT * FROM schedule WHERE concept_id = ?
  `).get(conceptId) || { intervalDays: 1, ease: 2.5 }
}

export function saveSchedule(conceptId: string, s: ScheduleUpdate): void {
  db.prepare(`
    INSERT OR REPLACE INTO schedule
    (concept_id, due_at, interval_days, ease)
    VALUES (?, ?, ?, ?)
  `).run(conceptId, s.dueAt.toISOString(), s.intervalDays, s.ease)
}

export function logReview(
  variantId: string, 
  dimension: string, 
  result: string, 
  timeMs: number
): void {
  db.prepare(`
    INSERT INTO reviews (variant_id, dimension, result, time_ms)
    VALUES (?, ?, ?, ?)
  `).run(variantId, dimension, result, timeMs)
}

// Anti-frustration tracking (in-memory is fine for MVP)
const failures = new Map<string, number>()

export function getRecentFailures(): Map<string, number> {
  return failures
}

export function incrementFailures(dimension: string): void {
  failures.set(dimension, (failures.get(dimension) || 0) + 1)
}

export function resetFailures(dimension: string): void {
  failures.set(dimension, 0)
}
```

---

## Build Steps

### Week 1: Core Loop

**Days 1-2:** Project setup
- [ ] Initialize Electron or Express project
- [ ] Set up SQLite with better-sqlite3
- [ ] Create schema and db.ts wrapper

**Days 3-4:** Review flow
- [ ] Basic Review component (show card, reveal answer)
- [ ] Rating buttons (again/hard/good/easy)
- [ ] SM-2 scheduling (concept-level)

**Days 5-7:** Mastery tracking
- [ ] EWMA update on each review
- [ ] Timing capture (start → answer)
- [ ] Store dimension mastery in DB

### Week 2: Adaptation

**Days 8-9:** Weighted selection
- [ ] Implement selectVariant with weakness boost
- [ ] Test that weak dimensions get selected more

**Days 10-11:** Anti-frustration
- [ ] Track consecutive failures per dimension
- [ ] Reduce weight after 3 failures
- [ ] (Optional) Insert easy card after streak

**Days 12-13:** Dashboard
- [ ] Show mastery bars per dimension
- [ ] Flag weak dimensions
- [ ] Basic styling

**Day 14:** Polish
- [ ] Add card form
- [ ] Seed some test data
- [ ] Bug fixes

---

## Test Data (Seed Script)

```typescript
// seed.ts
const concepts = [
  { id: '1', name: 'Photosynthesis', definition: 'Process by which plants convert light to energy' },
  { id: '2', name: 'Mitosis', definition: 'Cell division producing two identical cells' },
  { id: '3', name: 'Osmosis', definition: 'Movement of water across a semipermeable membrane' },
]

const variants = [
  // Concept 1: Photosynthesis
  { id: 'v1', conceptId: '1', dimension: 'definition', difficulty: 1,
    front: 'What is photosynthesis?',
    back: 'Process by which plants convert light to energy' },
  { id: 'v2', conceptId: '1', dimension: 'scenario', difficulty: 3,
    front: 'A plant is placed in a dark room for a week. What process is impaired and why?',
    back: 'Photosynthesis is impaired because it requires light to convert energy' },
  { id: 'v3', conceptId: '1', dimension: 'discrimination', difficulty: 4,
    front: 'How does photosynthesis differ from cellular respiration?',
    back: 'Photosynthesis converts light to chemical energy; respiration converts chemical energy to ATP' },
  
  // Concept 2: Mitosis
  { id: 'v4', conceptId: '2', dimension: 'definition', difficulty: 1,
    front: 'What is mitosis?',
    back: 'Cell division producing two identical daughter cells' },
  { id: 'v5', conceptId: '2', dimension: 'example', difficulty: 2,
    front: 'Is skin cell replacement an example of mitosis?',
    back: 'Yes - skin cells divide via mitosis to replace damaged cells' },
  { id: 'v6', conceptId: '2', dimension: 'discrimination', difficulty: 4,
    front: 'How does mitosis differ from meiosis?',
    back: 'Mitosis produces 2 identical cells; meiosis produces 4 genetically different cells' },
    
  // Concept 3: Osmosis  
  { id: 'v7', conceptId: '3', dimension: 'definition', difficulty: 1,
    front: 'What is osmosis?',
    back: 'Movement of water across a semipermeable membrane from low to high solute concentration' },
  { id: 'v8', conceptId: '3', dimension: 'scenario', difficulty: 3,
    front: 'A red blood cell is placed in distilled water. What happens and why?',
    back: 'The cell swells and may burst (lyse) due to osmosis - water moves into the cell' },
  { id: 'v9', conceptId: '3', dimension: 'cloze', difficulty: 2,
    front: 'Osmosis moves water from ___ solute concentration to ___ solute concentration',
    back: 'low, high' },
]

// Insert into DB
concepts.forEach(c => db.addConcept(c))
variants.forEach(v => db.addVariant(v))

// Initialize schedules (all due now)
concepts.forEach(c => {
  db.saveSchedule(c.id, { 
    intervalDays: 1, 
    ease: 2.5, 
    dueAt: new Date() 
  })
})
```

---

## Definition of Done

MVP is complete when:

- [ ] Can add concepts and card variants (with dimension tags)
- [ ] Review session shows cards and accepts ratings
- [ ] Answer timing is captured and affects mastery
- [ ] Mastery EWMA updates correctly per dimension
- [ ] Card selection biases toward weak dimensions
- [ ] Anti-frustration reduces selection weight after 3 failures
- [ ] Dashboard shows mastery bars for all 6 dimensions
- [ ] SRS scheduling works (cards come back at intervals)
- [ ] App runs locally without internet

---

## What's Next (Post-MVP)

1. **LLM generation** - Auto-create cards for weak dimensions
2. **Scaffolding** - Progressive difficulty within dimensions
3. **Trends** - Show improvement over time
4. **Import/export** - Backup and share decks
5. **Multiple decks** - Separate subjects
6. **Settings** - Tune EWMA alpha, target times, etc.
