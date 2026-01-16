# Mastery Algorithm Explanation: Why EWMA and Dual Metrics

**Understanding the statistical and pedagogical foundations of mastery tracking**

---

## The Problem with Traditional SRS Metrics

Traditional spaced repetition systems track a single metric: did you get it right or wrong? This binary approach, while simple, loses crucial information about the quality of recall. Consider two learners who both answer "good" to a flashcard:

- **Learner A**: Answers instantly with confidence
- **Learner B**: Struggles for 30 seconds before eventually recalling

Standard SRS treats these identically. Both cards get the same interval increase. Yet these learners have fundamentally different relationships with the material. Learner A has automated the knowledge; Learner B is still in the fragile recognition phase.

The Adaptive Mastery Learning System addresses this by tracking two independent metrics: **accuracy** and **speed**. The combination reveals the true state of learning in ways a single metric cannot.

---

## Why Exponentially Weighted Moving Averages

### The Problem with Simple Averages

A simple average of recent performance has a critical flaw: all observations are weighted equally. If you struggled with a concept six months ago but have been acing it recently, a simple average still counts those old failures.

We could use only recent observations (e.g., last 10 reviews), but this creates a different problem: high volatility. A single bad day could tank your mastery score.

### How EWMA Solves Both Problems

Exponentially Weighted Moving Averages provide an elegant solution. The formula is deceptively simple:

```
new_ewma = (1 - alpha) * current_ewma + alpha * new_observation
```

The key insight is the **alpha parameter** (we use 0.15). With each new observation:

- The new observation contributes 15% to the updated score
- Historical observations contribute 85%, but this compounds over time
- Very old observations fade naturally without being abruptly dropped

This creates a "half-life" effect where older data gradually loses influence. With alpha = 0.15, it takes approximately 4-5 observations to reduce an old observation's influence by half.

### Why Alpha = 0.15?

The choice of alpha = 0.15 balances responsiveness and stability:

| Alpha Value | Behavior | Implication |
|-------------|----------|-------------|
| 0.05 | Very stable | Slow to detect improvement or decline |
| 0.15 | Balanced | Responsive but not volatile |
| 0.30 | Responsive | Quick adaptation but noisy |
| 0.50 | Very responsive | Essentially a 2-observation window |

We chose 0.15 because spaced repetition reviews happen relatively infrequently (days or weeks apart). A higher alpha would make the system too reactive to individual reviews. A lower alpha would frustrate learners who improve but do not see their scores update.

The value is configurable in the system settings because different learners may prefer different responsiveness levels.

---

## The Dual-Metric Approach

### Why Track Speed Separately?

Speed and accuracy measure different aspects of learning. Cognitive science distinguishes between:

- **Declarative knowledge**: Knowing the facts
- **Procedural fluency**: Being able to use knowledge quickly and effortlessly

High accuracy with slow speed indicates declarative knowledge without procedural fluency. This is the "fragile confidence" state that traditional SRS cannot detect.

### Speed Score Calculation

The speed score converts raw response time into a normalized 0-1 value. The system uses difficulty-adjusted target times:

| Difficulty | Target Time | Rationale |
|------------|-------------|-----------|
| Level 1 | 5 seconds | Simple recall of definitions |
| Level 2 | 10 seconds | Basic comprehension |
| Level 3 | 20 seconds | Analysis and application |
| Level 4 | 40 seconds | Complex reasoning |
| Level 5 | 60 seconds | Deep synthesis |

The speed score formula normalizes time against the target:

```
speed_score = 1 - clamp(actual_time / target_time, 0, 2) / 2
```

This produces:
- **1.0** when instant (0ms)
- **0.5** when at target time
- **0.0** when at 2x target time or slower

Responses slower than 2x the target time are treated the same because the bottleneck at that point is likely not cognitive (user distraction, interruption, etc.).

### Accuracy Score Mapping

The four-point rating scale maps to accuracy scores:

| Rating | Score | Meaning |
|--------|-------|---------|
| Again | 0.0 | Complete failure, need immediate re-review |
| Hard | 0.4 | Struggled but eventually recalled |
| Good | 0.7 | Correct with normal effort |
| Easy | 1.0 | Effortless recall |

These values are not arbitrary. They reflect the probability of future successful recall based on spaced repetition research. A "hard" response suggests approximately 40% retention strength compared to a fully mastered item.

---

## The 70/30 Weighting Rationale

Combined mastery is calculated as:

```
combined = 0.7 * accuracy + 0.3 * speed
```

Why these specific weights?

### Accuracy Is Primary

Accuracy matters more than speed because incorrect answers indicate fundamental gaps. A learner who is slow but accurate has the knowledge; they just need more practice for automaticity. A learner who is fast but inaccurate has a dangerous illusion of knowledge.

### Speed Is Significant

The 30% weight for speed is high enough to matter but low enough to avoid penalizing thoughtful learners. This weight means:

- A highly accurate (0.9) but slow (0.3) learner scores: 0.7 * 0.9 + 0.3 * 0.3 = 0.72
- A fast (0.9) but somewhat inaccurate (0.6) learner scores: 0.7 * 0.6 + 0.3 * 0.9 = 0.69

The slow-but-accurate learner edges ahead, but the fast-but-inaccurate learner is not far behind. Both need work, but on different aspects.

### Alternatives Considered

We considered other weighting schemes:

**80/20 weighting**: Too little emphasis on speed. Fragile knowledge would not be detected.

**50/50 weighting**: Would penalize thoughtful learners too heavily. Also assumes speed and accuracy are equally important, which contradicts learning research.

**Dynamic weighting**: Adjust weights based on dimension or difficulty. This adds complexity without clear evidence of benefit. We opted for simplicity with the option to revisit based on user feedback.

---

## Detecting Learning States

The dual-metric approach enables detection of specific learning states:

### Weak Dimension

```
combined_mastery < 0.7
```

A dimension is weak when overall performance is below 70%. This threshold was chosen because:

- Below 70% suggests less than 50% probability of correct recall at next optimal interval
- 70% aligns with common "passing grade" intuitions
- The 0.7 threshold provides headroom for the weakness boost calculation

### Fragile Confidence

```
accuracy > 0.7 AND speed < 0.5
```

This state indicates knowledge that exists but lacks automaticity. The learner can recall the information but requires significant cognitive effort. This knowledge is:

- Vulnerable to interference
- Likely to degrade under time pressure
- Not yet transferable to novel contexts

The system flags fragile confidence to prioritize speed-building exercises.

### Dodging Pattern

When a learner shows:
- Strong definition recall (> 0.75)
- Weak application skills (< 0.55)
- Sufficient data (20+ reviews across both)

This suggests the learner is "dodging" difficult question types by over-practicing easy recall. The system detects this pattern and adjusts selection weights accordingly.

---

## Initial State and Cold Start

New dimensions start at 0.5 for both accuracy and speed. This neutral starting point:

- Does not unfairly boost or penalize new learners
- Provides a middle ground that quickly adapts with actual data
- Requires approximately 5-7 reviews to stabilize to the learner's true level

The system tracks `recentCount` to know how much confidence to place in the current scores. Low counts indicate high uncertainty.

---

## Mathematical Properties

### Bounded Output

EWMA values are always bounded between 0 and 1 because:
- New observations are clamped to [0, 1]
- The convex combination of two values in [0, 1] is always in [0, 1]

This guarantee simplifies downstream calculations and UI display.

### Monotonic Convergence

If a learner achieves consistent perfect performance (all 1.0 observations), the EWMA will converge monotonically toward 1.0. The same applies in reverse. There are no oscillations or instabilities.

### Information Decay

The "effective memory" of the system is approximately 1/alpha observations. With alpha = 0.15, this is about 6-7 observations. Information older than this still influences the score but with diminishing impact.

---

## Connection to Learning Science

### Desirable Difficulties

The speed metric connects to Robert Bjork's concept of "desirable difficulties." Some struggle during learning actually improves long-term retention. The system acknowledges this by not treating slow-but-accurate responses as failures.

### Fluency Illusions

The dual-metric approach helps detect "fluency illusions" where learners mistake familiarity for true knowledge. High speed with low accuracy over time would reveal this pattern.

### Testing Effect

Each review is both an assessment and a learning opportunity. The EWMA smoothing ensures that even failed reviews contribute to the learning process rather than just penalizing the learner.

---

## Alternatives Not Chosen

### Bayesian Knowledge Tracing

BKT models knowledge as a hidden state with transition probabilities. While theoretically elegant, BKT:
- Requires more parameters to tune
- Can be computationally expensive
- Often shows limited practical improvement over simpler methods

### Deep Knowledge Tracing

Neural network approaches to knowledge tracing require substantial training data and are overkill for a single-user desktop application.

### Simple Percentage Tracking

Tracking "percentage correct over last N trials" loses temporal information and creates discontinuities when old trials drop off.

---

## Summary

The mastery algorithm uses EWMA with dual accuracy/speed metrics because this approach:

1. **Captures nuance** that binary right/wrong tracking misses
2. **Balances stability and responsiveness** through exponential smoothing
3. **Detects specific learning states** like fragile confidence
4. **Remains computationally simple** for a desktop application
5. **Aligns with learning science** research on fluency and desirable difficulties

The 70/30 weighting and 0.15 alpha values represent carefully considered defaults that work well for most learners while remaining configurable for those who want different behavior.

---

*See also: [Adaptive Selection](./adaptive-selection.md) for how mastery scores influence card selection.*
