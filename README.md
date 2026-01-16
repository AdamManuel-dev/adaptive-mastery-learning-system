# Adaptive Mastery Learning System

**Version:** 1.0.0
**Status:** In Development
**Type:** Local-first Electron application

> A spaced repetition system that goes beyond basic flashcard drilling by detecting which *types* of questions you struggle with and automatically rebalancing practice toward your weaknesses.

## 🎯 Core Innovation

Unlike traditional SRS systems (like Anki) that treat all correct answers equally, this system tracks your performance across **six cognitive dimensions** and adapts card selection to push you toward genuine mastery.

**The difference:**
- ❌ Traditional SRS: "You got it right, moving on"
- ✅ Adaptive Mastery: "You're strong on definitions but weak on application—let's practice scenarios"

## 🧠 Six Cognitive Dimensions

Every concept is tested across multiple ways of knowing:

| Dimension | Description | Example |
|-----------|-------------|---------|
| **Definition Recall** | Term ↔ definition | "What is mitosis?" |
| **Paraphrase Recognition** | Same meaning, different words | "Which means the same as cell division?" |
| **Example Classification** | Is this an instance of X? | "Is this an example of mitosis?" |
| **Scenario Application** | Apply to novel situation | "Given this cell behavior, what process is occurring?" |
| **Discrimination** | Distinguish similar concepts | "What's the difference between mitosis and meiosis?" |
| **Cloze Fill** | Fill in the blank | "Mitosis converts ___ into ___" |

## ✨ Key Features

### Adaptive Intelligence
- **Weakness Detection**: Automatically identifies skill gaps (e.g., strong on definitions, weak on scenarios)
- **Smart Card Selection**: Prioritizes question types you struggle with
- **Anti-Frustration Rails**: Backs off after repeated failures to prevent burnout
- **Speed Tracking**: "Correct but slow" = fragile knowledge

### Mastery Tracking
- **EWMA-based Scoring**: Exponentially-weighted moving averages per dimension
- **Honest Feedback**: Shows your actual skill profile, not just "cards due"
- **Trend Analysis**: Track improvement across dimensions over time

### LLM-Powered Generation
- **Automatic Variant Creation**: Generates new question types targeting weak areas
- **Fact-Grounded**: Uses only provided facts to prevent hallucinations
- **Scaffolded Difficulty**: Progressive complexity ladder for challenging concepts

### Transparency
- **Selection Reasoning**: "Focus: scenarios (you're strong on definitions)"
- **Visual Dashboard**: Skill bars showing mastery per dimension
- **Gap Identification**: Highlights biggest weakness for targeted practice

## 🏗️ Technical Architecture

```
┌─────────────────────────────────────┐
│  Electron App (Desktop)             │
├─────────────────────────────────────┤
│  Review Engine    │  Mastery Calc   │
│  Card Selector    │  Event Logger   │
├─────────────────────────────────────┤
│         SQLite Database             │
│         (better-sqlite3)            │
├─────────────────────────────────────┤
│  Optional: LLM API                  │
│  (OpenAI/Anthropic/Ollama)          │
└─────────────────────────────────────┘
```

### Tech Stack
- **Frontend**: React with TypeScript
- **Backend**: Electron main process (Node.js)
- **Database**: SQLite (local-first, no cloud dependencies)
- **LLM Integration**: Optional for card generation
- **SRS Algorithm**: SM-2 with adaptive dimension weighting

## 📊 How It Works

### 1. Review Event Logging
Every answer records:
- Dimension tested
- Result (again/hard/good/easy)
- Time to answer
- Hints used

### 2. Mastery Calculation
```typescript
// Per dimension EWMA update
accuracyEwma = (1 - α) * accuracyEwma + α * ratingScore
speedEwma = (1 - α) * speedEwma + α * speedScore
mastery = 0.7 * accuracyEwma + 0.3 * speedEwma
```

### 3. Adaptive Selection
```typescript
// Weight calculation for card selection
weight = baseWeight(difficulty)
       * weaknessBoost(dimension)    // Prioritize weak dimensions
       * noveltyBoost                 // Prefer unseen variants
       * antiFrustrationPenalty       // Back off after failures
```

### 4. Safety Rails
- Max 70% single-dimension focus per session
- 20% maintenance on strong dimensions
- Insert confidence-builder after 3 failures
- Max 4 consecutive same-dimension cards

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/adaptive-mastery-learning-system.git
cd adaptive-mastery-learning-system

# Install dependencies
npm install

# Configure (optional - for LLM features)
cp config.example.json config.json
# Edit config.json with your API keys
```

### Development
```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Package as Electron app
npm run package
```

## 📁 Project Structure

```
adaptive-srs/
├── src/
│   ├── main/              # Electron main process / server
│   │   ├── db.ts          # SQLite operations
│   │   ├── mastery.ts     # EWMA calculations
│   │   ├── selector.ts    # Weighted card selection
│   │   ├── generator.ts   # LLM card generation
│   │   └── scheduler.ts   # SRS algorithm
│   ├── renderer/          # UI components
│   │   ├── Review.tsx     # Review screen
│   │   ├── Dashboard.tsx  # Mastery dashboard
│   │   └── CardEditor.tsx # Card creation/editing
│   └── shared/
│       └── types.ts       # TypeScript interfaces
├── data/
│   └── learning.db        # SQLite database (created on first run)
├── config.json            # API keys, settings
├── package.json
└── README.md
```

## 📋 Database Schema

### Core Tables
- **concepts**: Base knowledge units
- **variants**: Multiple question types per concept
- **mastery**: Per-dimension skill tracking (EWMA scores)
- **events**: Complete review history with timing
- **schedule**: SRS scheduling (concept-level)

See [PRD.md](./PRD.md) for complete schema details.

## 🎮 Usage Example

### Creating a Concept
```typescript
// Add a new concept
const concept = {
  name: "Mitosis",
  definition: "Cell division producing two identical daughter cells",
  facts: [
    "Involves prophase, metaphase, anaphase, telophase",
    "Results in diploid cells",
    "Used for growth and repair"
  ]
};

// System automatically generates 6 dimension variants
// or use LLM to create additional practice cards
```

### Review Session
1. System shows next due card
2. Card type selected based on your weakness profile
3. Answer with timing tracked
4. Rate difficulty (again/hard/good/easy)
5. Mastery scores update instantly
6. Next card adapts to your performance

### Dashboard View
```
Your Mastery Profile
────────────────────────────────────
Definition     ████████████░░  85%
Paraphrase     █████████░░░░░  68%
Examples       ████████░░░░░░  62%
Scenarios      ████░░░░░░░░░░  34%  ⚠️ Gap
Discrimination ██████░░░░░░░░  48%
Cloze          ████████████░░  82%
────────────────────────────────────
💡 Focus on scenario practice
   to close your biggest gap
```

## 🗺️ Development Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [x] SQLite schema
- [ ] Basic SRS scheduling (SM-2)
- [ ] Simple review UI
- [ ] Manual card creation

### Phase 2: Instrumentation (Week 3)
- [ ] Event logging with timing
- [ ] EWMA mastery calculation
- [ ] Basic dashboard with dimension bars

### Phase 3: Adaptation (Weeks 4-5)
- [ ] Weighted variant selection
- [ ] Weakness detection
- [ ] Anti-frustration mechanisms
- [ ] Selection reason display

### Phase 4: Generation (Week 6)
- [ ] LLM integration
- [ ] Scaffolding ladder
- [ ] Fact grounding validation

### Phase 5: Polish (Weeks 7-8)
- [ ] Trend tracking over time
- [ ] Import/export functionality
- [ ] Settings and configuration
- [ ] Bug fixes and UX refinement

## 🔬 Key Algorithms

### EWMA Update
```typescript
function updateEwma(current: number, newValue: number, alpha = 0.15): number {
  return (1 - alpha) * current + alpha * newValue;
}
```

### Speed Score Calculation
```typescript
function speedScore(timeMs: number, difficulty: number): number {
  const targetMs = [5000, 10000, 20000, 40000, 60000][difficulty - 1];
  const normalized = Math.min(timeMs / targetMs, 2);
  return 1 - normalized / 2;
}
```

### Weakness Boost
```typescript
function weaknessBoost(dimensionMastery: number): number {
  if (dimensionMastery < 0.7) {
    return 1 + 2 * (0.7 - dimensionMastery);
  }
  return 0.9;
}
```

## 🚫 Out of Scope (v1)

- Cloud sync / multi-device support
- User accounts / authentication
- Mobile apps (desktop only)
- Audio/image cards
- Shared decks / community content
- Cross-concept prerequisite sequencing

## ✅ Success Criteria

- [ ] Mastery scores update correctly after each review
- [ ] Weak dimensions receive higher selection weight
- [ ] Anti-frustration triggers after 3 consecutive failures
- [ ] Session stays within 70% single-dimension cap
- [ ] Dashboard shows accurate dimension breakdown
- [ ] LLM generates usable cards >80% of the time
- [ ] App runs fully offline (except LLM features)

## 📚 Documentation

- [PRD.md](./PRD.md) - Complete product requirements document
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture details (coming soon)
- [API.md](./API.md) - API documentation (coming soon)

## 🤝 Contributing

This is a personal learning project, but feedback and ideas are welcome! Feel free to:
- Open issues for bugs or feature suggestions
- Submit PRs for improvements
- Share your experience using the system

## 📄 License

ISC License - Copyright (c) 2025 Adam Manuel

## 🙏 Acknowledgments

- Inspired by spaced repetition research (Piotr Woźniak, Andy Matuschak)
- Built on SM-2 algorithm foundations
- Designed for genuine mastery, not just memorization

---

**Philosophy**: "Anki that teaches, not just drills."

The goal isn't to ace flashcards—it's to build robust, transferable knowledge that works in real-world scenarios.
