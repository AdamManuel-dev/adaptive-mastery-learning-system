# Adaptive Mastery Learning System

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Electron](https://img.shields.io/badge/Electron-34.0-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

> **Spaced repetition that adapts to *how* you learn, not just *what* you've memorized.**

A local-first Electron application that detects which types of questions you struggle with and automatically rebalances practice toward your weaknesses.

<p align="center">
  <img src="docs/assets/dashboard-preview.png" alt="Dashboard Preview" width="700">
</p>

## Why This Exists

Traditional flashcard apps treat all correct answers equally. Get a definition right? Great, you're done.

But real mastery means more than recall. Can you apply the concept? Recognize it in different contexts? Distinguish it from similar ideas?

**This system tracks your performance across six cognitive dimensions** and adapts card selection to push you toward genuine mastery—not just memorization.

| Traditional SRS | Adaptive Mastery |
|-----------------|------------------|
| "You got it right, moving on" | "You're strong on definitions but weak on application—let's practice scenarios" |

## Features

### Six Cognitive Dimensions

Every concept is tested across multiple ways of knowing:

| Dimension | What It Tests | Example |
|-----------|---------------|---------|
| **Definition** | Term ↔ meaning | "What is mitosis?" |
| **Paraphrase** | Recognition in different words | "Which means the same as cell division?" |
| **Example** | Instance classification | "Is this an example of mitosis?" |
| **Scenario** | Application to new situations | "Given this cell behavior, what's happening?" |
| **Discrimination** | Distinguishing similar concepts | "How does mitosis differ from meiosis?" |
| **Cloze** | Contextual completion | "Mitosis produces ___ identical cells" |

### Intelligent Adaptation

- **Weakness Detection** — Automatically identifies skill gaps across dimensions
- **Smart Selection** — Prioritizes question types you struggle with
- **Anti-Frustration** — Backs off after repeated failures to prevent burnout
- **Speed Tracking** — "Correct but slow" indicates fragile knowledge

### Analytics Dashboard

Visual tracking of your mastery profile with charts showing:
- Overall health score
- Per-dimension mastery radar
- Progress timeline over 30 days
- Weakness heatmap
- Response time analysis
- Review distribution

### LLM-Powered Generation

Optional AI integration (OpenAI, Anthropic, or local Ollama) for:
- Automatic question variant generation
- Open-response evaluation with detailed feedback
- Fact-grounded content (no hallucinations)

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/AdamManuel-dev/adaptive-mastery-learning-system.git
cd adaptive-mastery-learning-system

# Install dependencies
npm install

# Start development mode
npm run dev
```

### Building

```bash
# Build for production
npm run build

# Package as desktop app
npm run make

# Platform-specific builds
npm run make:mac
npm run make:win
npm run make:linux
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Electron 34 |
| **Frontend** | React 19, TypeScript 5.7 |
| **Database** | SQLite (better-sqlite3) |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **LLM** | OpenAI / Anthropic / Ollama (optional) |
| **Build** | electron-vite, Electron Forge |

## Project Structure

```
src/
├── main/                    # Electron main process
│   ├── infrastructure/      # Database, LLM integration
│   │   ├── database/        # SQLite repos, migrations
│   │   └── llm/             # LLM client, evaluator
│   └── ipc/                 # IPC handlers
├── renderer/                # React frontend
│   ├── components/          # UI components
│   │   ├── charts/          # Analytics visualizations
│   │   └── review/          # Review card components
│   ├── contexts/            # React contexts
│   ├── hooks/               # Custom hooks
│   └── pages/               # Route pages
├── shared/                  # Shared types
└── preload/                 # Electron preload scripts
```

## Documentation

Comprehensive documentation following the [Diátaxis framework](https://diataxis.fr/):

| Goal | Type | Link |
|------|------|------|
| Learn the basics | Tutorial | [Getting Started](./docs/tutorials/getting-started.md) |
| Accomplish a task | How-To | [How-To Guides](./docs/how-to/index.md) |
| Look up details | Reference | [Reference Docs](./docs/reference/index.md) |
| Understand why | Explanation | [Explanations](./docs/explanation/index.md) |

**Quick links:**
- [Domain Model](./docs/reference/domain-model.md) — Entities and aggregates
- [Database Schema](./docs/reference/database-schema.md) — SQLite tables
- [IPC API](./docs/reference/ipc-api.md) — Communication channels
- [Mastery Algorithm](./docs/explanation/mastery-algorithm.md) — EWMA scoring
- [Accessibility](./docs/reference/accessibility.md) — WCAG compliance

## Development

```bash
# Run in development mode
npm run dev

# Run web-only mode (no Electron)
npm run dev:web

# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format

# Testing
npm run test
npm run test:watch
npm run test:coverage
```

## Configuration

LLM features require API configuration in Settings:

1. Open the app and navigate to **Settings**
2. Select your LLM provider (OpenAI, Anthropic, or Local)
3. Enter your API key
4. Test the connection

All data is stored locally—no cloud sync, no accounts required.

## Contributing

Contributions are welcome! Please feel free to:

1. **Report bugs** — Open an issue with reproduction steps
2. **Suggest features** — Describe your use case
3. **Submit PRs** — Fork, branch, and open a pull request

### Development Guidelines

- Follow existing code style (ESLint + Prettier enforced)
- Add tests for new functionality
- Update documentation for user-facing changes
- Use conventional commits (`feat:`, `fix:`, `docs:`, etc.)

## License

[ISC License](./LICENSE) — Copyright (c) 2025 Adam Manuel

## Acknowledgments

Built on research from spaced repetition pioneers (Piotr Wozniak, Andy Matuschak) and designed for genuine mastery over surface-level memorization.

---

<p align="center">
  <strong>Philosophy:</strong> "Anki that teaches, not just drills."
</p>
