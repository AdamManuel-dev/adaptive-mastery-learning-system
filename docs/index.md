# Adaptive Mastery Learning System Documentation

Welcome to the documentation for the Adaptive Mastery Learning System - a spaced repetition system that detects which types of questions you struggle with and automatically rebalances practice toward your weaknesses.

## Quick Navigation

**I want to...**

- 🆕 **Learn the basics** → [Start Tutorial](tutorials/getting-started.md)
- 🎯 **Get something done** → [How-to Guides](how-to/index.md)
- 📖 **Look up details** → [Reference](reference/index.md)
- 💡 **Understand why** → [Explanation](explanation/index.md)

---

## Documentation Map

This documentation follows the [Diátaxis framework](https://diataxis.fr/) for clear, organized technical documentation:

| If you need... | And you're... | Go to |
|---------------|---------------|--------|
| To **learn** | New to this | **[Tutorials](tutorials/)** - Hands-on learning experiences |
| To **do** | Already competent | **[How-to](how-to/)** - Task-oriented problem solving |
| **Information** | Working | **[Reference](reference/)** - Technical specifications |
| **Understanding** | Studying | **[Explanation](explanation/)** - Conceptual clarity |

---

## The Four Quadrants

```
                    ACQUISITION                    COGNITIVE
                    (Action)                      (Study)

    PRACTICAL   ┌──────────────┬──────────────┐
    (Work)      │   HOW-TO     │  REFERENCE   │
                │              │              │
                │ Get tasks    │ Look up      │
                │ done         │ information  │
                ├──────────────┼──────────────┤
    THEORETICAL │  TUTORIAL    │ EXPLANATION  │
    (Study)     │              │              │
                │ Learn by     │ Understand   │
                │ doing        │ concepts     │
                └──────────────┴──────────────┘
```

---

## Getting Started Paths

### New User Path

1. Start with [Getting Started Tutorial](tutorials/getting-started.md) - 30 minutes to your first successful review session
2. Complete [Understanding Mastery Tutorial](tutorials/understanding-mastery.md) - Learn to interpret your skill profile
3. Explore [How-to Guides](how-to/) - Learn common tasks at your own pace
4. Read [Explanation docs](explanation/) - Deepen your understanding of the system

### Developer Path

1. Review [Architecture Explanation](explanation/architecture.md) - Understand the Hexagonal + DDD design
2. Study [Domain Model Reference](reference/domain-model.md) - See entities, value objects, and aggregates
3. Explore [Database Schema](reference/database-schema.md) - Understand data structure
4. Check [IPC API Reference](reference/ipc-api.md) - Learn communication patterns
5. Read [Technology Choices](explanation/technology-choices.md) - Understand stack decisions

### Troubleshooting Path

1. Check [Troubleshooting How-to](how-to/troubleshooting.md) - Common issues and solutions
2. Review [Configuration Reference](reference/configuration.md) - Verify settings
3. Consult [IPC API Reference](reference/ipc-api.md) - Debug communication issues

---

## Core Concepts at a Glance

### What Makes This System Different?

Traditional spaced repetition systems (like Anki) treat all correct answers equally. This system:

- **Tracks 6 cognitive dimensions** - definition, paraphrase, examples, scenarios, discrimination, cloze
- **Detects skill gaps** - "Strong on definitions, weak on application"
- **Adapts card selection** - Prioritizes question types you struggle with
- **Prevents frustration** - Backs off after repeated failures
- **Shows honest feedback** - Your actual skill profile, not just "cards due"
- **Keyboard-first design** - Full keyboard navigation with Space and 1-4 rating shortcuts
- **Accessible by default** - WCAG 2.1 AA compliant with screen reader support
- **Graceful error handling** - Error boundaries and toast notifications for clear feedback

Learn more in [Six Dimensions Explanation](explanation/six-dimensions.md)

---

## Documentation Sections

### 📘 [Tutorials](tutorials/)

**Learning-oriented** - Hands-on experiences that guarantee success

- [Getting Started](tutorials/getting-started.md) - Install, create first concept, complete first review
- [Understanding Your Mastery Profile](tutorials/understanding-mastery.md) - Interpret dashboard, identify weaknesses

### 📗 [How-to Guides](how-to/)

**Task-oriented** - Practical steps to accomplish specific goals

- [Creating and Managing Concepts](how-to/creating-concepts.md)
- [Customizing Review Sessions](how-to/customizing-reviews.md)
- [Working with Variants](how-to/working-with-variants.md)
- [Managing Mastery Scores](how-to/managing-mastery.md)
- [Using Keyboard Shortcuts](how-to/using-keyboard-shortcuts.md)
- [Handling Errors](how-to/handling-errors.md)
- [Using Notifications](how-to/using-notifications.md)
- [Troubleshooting](how-to/troubleshooting.md)

### 📕 [Reference](reference/)

**Information-oriented** - Dry technical specifications for lookup

- [Domain Model](reference/domain-model.md) - Entities, value objects, aggregates, ports
- [Database Schema](reference/database-schema.md) - Tables, columns, constraints
- [IPC API](reference/ipc-api.md) - Channels, types, error codes
- [Configuration](reference/configuration.md) - Settings, defaults, environment variables
- [Type Definitions](reference/types.md) - Core types, DTOs, constants
- [Accessibility](reference/accessibility.md) - WCAG compliance, keyboard shortcuts, screen reader support

### 📙 [Explanation](explanation/)

**Understanding-oriented** - Conceptual clarity and context

- [Architecture](explanation/architecture.md) - Why Hexagonal + DDD?
- [Mastery Algorithm](explanation/mastery-algorithm.md) - EWMA-based scoring rationale
- [Adaptive Selection](explanation/adaptive-selection.md) - Card selection weights and safety
- [Six Dimensions](explanation/six-dimensions.md) - Cognitive framework research
- [DDD Patterns](explanation/ddd-patterns.md) - Aggregate roots, value objects, ports
- [Technology Choices](explanation/technology-choices.md) - Electron, SQLite, Jotai, MUI

---

## Documentation Principles

This documentation strictly follows **Diátaxis boundaries**:

✅ **Tutorials** - Action + Study = Learning experience
- Concrete steps with guaranteed success
- Show expected output for verification
- No reference dumps or explanations

✅ **How-to** - Action + Work = Problem solving
- Address specific goals
- Assume competence
- Quick answers first, alternatives second

✅ **Reference** - Cognition + Work = Information lookup
- Describe machinery only
- Complete specifications
- No instructions or teaching

✅ **Explanation** - Cognition + Study = Understanding
- Provide context and "why"
- Discuss alternatives and trade-offs
- No step-by-step instructions

---

## Contributing to Documentation

If you're improving this documentation:

1. Respect Diátaxis boundaries - don't mix types
2. Tutorials must guarantee success through concrete steps
3. How-to guides address specific real-world tasks
4. Reference docs are exhaustively complete
5. Explanations illuminate without instructing

See the [Diátaxis website](https://diataxis.fr/) for detailed guidance.

---

## Project Links

- [GitHub Repository](https://github.com/yourusername/adaptive-mastery-learning-system)
- [README](../README.md) - Project overview
- [PRD](../PRD.md) - Product requirements
- [TECHNICAL](../TECHNICAL.md) - Architecture document

---

**Version:** 1.0.0
**Last Updated:** 2025-01-16
**Documentation Framework:** [Diátaxis](https://diataxis.fr/)
