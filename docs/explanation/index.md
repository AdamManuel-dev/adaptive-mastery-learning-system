# Explanation: Understanding the Adaptive Mastery Learning System

**Conceptual documentation that illuminates the "why" behind design decisions**

---

## What Are These Documents?

This section contains **explanation** documentation following the [Diataxis framework](https://diataxis.fr/). Explanations are understanding-oriented: they discuss, illuminate, and provide context for the design decisions in the Adaptive Mastery Learning System.

These documents answer questions like:
- Why was this approach chosen over alternatives?
- What trade-offs were made and why?
- How do the pieces fit together conceptually?
- What research or principles informed the design?

Explanations are for **study**, not work. If you need to accomplish a specific task, see the [How-To guides](../how-to/). If you need precise technical specifications, see the [Reference](../reference/).

---

## The Documents

### [Architecture](./architecture.md)

**Why Hexagonal Architecture and Domain-Driven Design?**

Explores the structural choices that shape the system:
- Why the domain complexity justifies architectural investment
- The independence principle and how it protects business logic
- Trade-offs between simplicity and flexibility
- How the layers interact and why they are separated

*Read this to understand the big-picture organization of the codebase.*

---

### [Mastery Algorithm](./mastery-algorithm.md)

**Why EWMA and dual accuracy/speed metrics?**

Dives into the statistical and pedagogical foundations:
- Why simple averages fail for learning tracking
- How exponential smoothing balances stability and responsiveness
- Why tracking speed separately from accuracy matters
- The 70/30 weighting rationale
- Detecting fragile confidence and other learning states

*Read this to understand how the system models a learner's knowledge.*

---

### [Adaptive Selection](./adaptive-selection.md)

**How does the system choose which card to show?**

Explains the multi-factor selection algorithm:
- The exploration/exploitation balance in card selection
- Weakness boost and why it uses a linear formula
- Novelty boost and its connection to spaced repetition
- Anti-frustration mechanics and the psychology behind them
- Safety rails that prevent pathological patterns

*Read this to understand the "intelligence" behind adaptive card selection.*

---

### [Six Dimensions](./six-dimensions.md)

**Why test knowledge across multiple cognitive dimensions?**

Explores the framework that makes this system more than a flashcard app:
- The illusion of knowing and why definition recall is not enough
- Each dimension and what it reveals about understanding
- Connection to Bloom's Taxonomy and learning science
- The recognition vs. application gap
- Research backing for varied practice

*Read this to understand the pedagogical theory behind multi-dimensional testing.*

---

### [DDD Patterns](./ddd-patterns.md)

**Why these specific Domain-Driven Design patterns?**

Details the domain modeling decisions:
- Why Concept is the aggregate root
- Value objects and their role in the domain
- Repository pattern and persistence abstraction
- Port definitions and contracts between layers
- Domain services and where complex logic lives

*Read this to understand how domain concepts map to code structures.*

---

### [Technology Choices](./technology-choices.md)

**Why Electron, SQLite, React, Jotai, and the rest?**

Examines each technology decision:
- The local-first philosophy and why it matters
- Electron trade-offs and alternatives considered
- SQLite advantages for single-user applications
- React and the ecosystem benefits
- Jotai's atomic model vs. Redux
- MUI + Tailwind integration pattern

*Read this to understand the rationale behind the technology stack.*

---

### [Analytics Deep Dive](./analytics-deep-dive.md)

**How do the analytics visualizations work?**

Explores the algorithms and design decisions behind each chart:
- Health Score Gauge calculation and thresholds
- Mastery Radar Chart and the illusion of knowing
- Progress Timeline patterns and interpretation
- Review Distribution and quality indicators
- Response Time analysis and automaticity
- Weakness Heatmap temporal patterns

*Read this to understand what the charts reveal about your learning.*

---

## Reading Path

For new contributors or those seeking deep understanding, a recommended reading order:

1. **[Architecture](./architecture.md)** - Start with the big picture
2. **[Technology Choices](./technology-choices.md)** - Understand the stack
3. **[Six Dimensions](./six-dimensions.md)** - The core pedagogical insight
4. **[Mastery Algorithm](./mastery-algorithm.md)** - How learning is measured
5. **[Adaptive Selection](./adaptive-selection.md)** - How cards are chosen
6. **[Analytics Deep Dive](./analytics-deep-dive.md)** - Understanding the visualizations
7. **[DDD Patterns](./ddd-patterns.md)** - Deep dive into domain modeling

Each document is self-contained, but they build on each other conceptually.

---

## Related Documentation

| Need | Where to Look |
|------|---------------|
| Getting started | [Tutorials](../tutorials/) |
| Specific tasks | [How-To Guides](../how-to/) |
| Technical specs | [Reference](../reference/) |
| Understanding concepts | You are here |

---

## Contributing to Explanations

When adding or updating explanation documentation:

1. **Focus on why, not how** - Procedures belong in How-To guides
2. **Discuss alternatives** - Show trade-offs and decisions
3. **Provide context** - Connect to broader concepts and research
4. **Avoid code listings** - Reference code conceptually, link to Reference for details
5. **Welcome historical perspective** - Evolution of decisions adds understanding

Explanations are arguably the most valuable documentation because they transfer understanding that cannot be derived from code alone.

---

*"Code shows what; documentation shows why."*
