# Adaptive Selection Explanation: The Art of Choosing the Right Card

**Understanding how the system selects cards that maximize learning while preventing frustration**

---

## The Selection Problem

When a concept comes up for review, a traditional SRS shows the same card every time. The Adaptive Mastery Learning System faces a richer problem: each concept has multiple variants across six cognitive dimensions at various difficulty levels. Which one should we show?

This is fundamentally a multi-armed bandit problem with pedagogical constraints. We want to:

1. **Exploit**: Focus practice on weak areas where improvement is most needed
2. **Explore**: Occasionally test strong areas to maintain mastery
3. **Adapt**: Respond to learner state (frustration, confidence, fatigue)
4. **Constrain**: Prevent pathological selection patterns

The selection algorithm balances these competing goals through a weighted random selection with multiple boost and penalty factors.

---

## The Weight Formula

The core selection weight for each variant is calculated as:

```
weight = weaknessBoost * noveltyBoost * frustrationPenalty * difficultyAlignment
```

Each factor addresses a specific pedagogical concern. The multiplicative combination means that extreme values in any factor significantly influence the final weight, but no single factor completely dominates.

---

## Weakness Boost: Targeting Skill Gaps

### The Fundamental Insight

The weakness boost is the primary mechanism for adaptive learning. It ensures that dimensions where the learner struggles receive more practice while dimensions already mastered receive maintenance-level attention.

### The Calculation

The boost factor is calculated from the combined mastery score:

```
if combined_mastery < 0.7:
    boost = 1 + 2 * (0.7 - combined_mastery)
else:
    boost = 0.9
```

This produces:

| Combined Mastery | Boost Factor | Interpretation |
|-----------------|--------------|----------------|
| 0.20 | 2.0 | Very weak, strong boost |
| 0.40 | 1.6 | Weak, significant boost |
| 0.60 | 1.2 | Developing, moderate boost |
| 0.70+ | 0.9 | Strong, slight penalty |

### Why 0.7 as the Threshold?

The 0.7 threshold was chosen because:

1. **Aligns with combined mastery calculation**: The 70/30 weighting means 0.7 combined represents solid competence
2. **Matches common pedagogical targets**: 70% is often considered "proficiency" in educational contexts
3. **Provides meaningful range**: Below 0.7, there is significant room for the boost multiplier to vary

### Why the Linear Formula?

The `1 + 2 * (0.7 - mastery)` formula creates a linear relationship that:

- Ranges from 1.0 (at threshold) to 2.4 (at zero mastery)
- Provides smooth gradation without discontinuities
- Is easy to understand and debug

We considered exponential boosts but found they created too aggressive focusing that felt punishing to learners. Logarithmic boosts were too gentle to drive meaningful adaptation.

### The 0.9 Penalty for Strong Dimensions

Strong dimensions receive a 0.9 multiplier rather than 1.0 because some practice is still valuable. This ensures:

- Mastery is maintained over time
- The 20% maintenance rep guideline is naturally achieved
- Learners do not forget well-learned material

---

## Novelty Boost: Encouraging Variety

### Why Novelty Matters

Even within a weak dimension, learners benefit from seeing different question formulations. The novelty boost encourages the system to show variants the learner has not seen recently, supporting:

- **Transfer learning**: Different phrasings test the same knowledge differently
- **Pattern breaking**: Prevents learners from memorizing card-specific cues
- **Engagement**: Fresh content maintains interest

### The Calculation

```
if never_shown:
    boost = 2.0
elif days_since_shown > 7:
    boost = 1.5
elif days_since_shown >= 3:
    boost = 1.2
else:
    boost = 0.8
```

### Why These Time Thresholds?

The thresholds align with spaced repetition intervals:

- **Never shown (2.0x)**: New variants deserve strong exploration priority
- **7+ days (1.5x)**: Aligned with typical early SRS intervals; worth revisiting
- **3-7 days (1.2x)**: Recent enough to remember but worth checking
- **Under 3 days (0.8x)**: Just seen; penalty to encourage variety

### The "Never Shown" Case

New variants receive the highest boost because:

1. The system has no data on learner performance with this phrasing
2. Diversity of question types improves robust learning
3. New content creates engagement and curiosity

---

## Anti-Frustration Penalty: Preventing Spiral

### The Frustration Problem

When learners fail repeatedly, traditional SRS doubles down: the failed card comes back sooner, often leading to more failures. This creates a frustration spiral:

1. Learner fails difficult card
2. System shows it again soon
3. Learner fails again (now frustrated)
4. System shows it even sooner
5. Learner gives up or develops negative associations

### The Penalty Calculation

```
if consecutive_failures >= 3:
    penalty = 0.3
elif consecutive_failures == 2:
    penalty = 0.6
elif consecutive_failures == 1:
    penalty = 0.8
else:
    penalty = 1.0
```

### Why These Specific Values?

The graduated penalty reflects increasing concern:

- **1 failure (0.8x)**: Minor concern; slightly reduce challenge
- **2 failures (0.6x)**: Moderate concern; noticeably reduce challenge
- **3+ failures (0.3x)**: High concern; strongly reduce challenge

The 0.3 penalty at three failures is aggressive because psychological research shows that frustration compounds. Three consecutive failures signal that the current approach is not working.

### Connection to Confidence Cards

When `consecutive_failures >= 3`, the system also considers inserting a "confidence card"---an easy variant from a strong dimension. This breaks the failure pattern and restores learner confidence before returning to challenging material.

This is not a penalty for the learner; it is a recognition that learning conditions are suboptimal and need adjustment.

---

## Difficulty Alignment: Matching Challenge to Skill

### The Zone of Proximal Development

Vygotsky's concept of the "zone of proximal development" suggests that optimal learning happens when challenges are slightly above current ability. Too easy and there is no growth; too hard and there is no success.

### The Alignment Calculation

The system maps combined mastery (0-1) to an ideal difficulty (1-5):

```
ideal_difficulty = 1 + combined_mastery * 4
```

Then calculates alignment based on the gap:

| Difficulty Gap | Factor | Interpretation |
|---------------|--------|----------------|
| Challenge zone (+0.5 to +1) | 1.2 | Slightly above level, optimal |
| Close match (within 1) | 1.0 | Appropriate |
| Moderate gap (1-2) | 0.7 | Somewhat mismatched |
| Large gap (2+) | 0.5 | Significantly mismatched |

### Why Boost the Challenge Zone?

The 1.2 boost for being slightly above ideal difficulty implements "desirable difficulty." A card that is achievable but stretching creates better learning than one that is comfortably easy.

However, this boost is modest (1.2x) because the other factors should primarily drive selection. Difficulty alignment is a refinement, not a primary driver.

---

## Safety Rails: Preventing Pathological Patterns

### Session Dimension Cap

No single dimension should exceed 70% of a review session:

```
for each dimension:
    if (count[dimension] / total_cards) > 0.70:
        cap_exceeded = true
```

This prevents:

- **Tunnel vision**: Obsessive focus on one weakness at the expense of others
- **Fatigue**: Repeating the same cognitive task becomes less effective
- **Skill atrophy**: Other dimensions need maintenance

### Why 70%?

The 70% cap allows significant focus (up to 17-18 cards in a 25-card session) while guaranteeing variety. This threshold was chosen to:

- Allow meaningful weakness targeting
- Ensure at least 30% coverage of other dimensions
- Align with research on task switching and cognitive fatigue

### Maintenance Rep Guarantee

The system ensures approximately 20% of cards come from strong dimensions:

- Prevents mastery decay from neglect
- Provides confidence-building successes
- Keeps the full skill range exercised

### Maximum Consecutive Same-Dimension

No more than 4 consecutive cards from the same dimension:

```
if last_4_cards_same_dimension:
    force_dimension_switch = true
```

This prevents:

- Cognitive fatigue from task repetition
- Boredom from monotony
- Missing important signals from other dimensions

### Why 4 Cards?

Four consecutive cards is enough to:

- Establish a focused practice block
- Allow the learner to develop momentum
- Not so long that diminishing returns set in

Research on interleaved practice suggests that some blocking is beneficial for initial learning, but pure blocking is inferior to interleaving for retention.

---

## Weighted Random Selection

### Why Random at All?

After calculating weights, the system uses weighted random selection rather than just picking the highest weight. This introduces controlled randomness because:

1. **Exploration**: The highest-weight choice might not always be optimal
2. **Unpredictability**: Learners cannot game the system by predicting cards
3. **Edge cases**: Strict maximization can create strange patterns

### The Algorithm

```
total_weight = sum(all_weights)
random_point = random() * total_weight

cumulative = 0
for each (card, weight):
    cumulative += weight
    if random_point < cumulative:
        return card
```

### Weight Interpretation

Weights are relative, not absolute. A card with weight 2.0 is twice as likely to be selected as one with weight 1.0, but neither has a guaranteed selection probability until we know all weights.

---

## Selection Transparency

### Why Show Selection Reasoning?

The UI displays why each card was selected:

- "Focus: scenarios (you're strong on definitions)"
- "Confidence builder after tough stretch"
- "Exploring new question type"

This transparency:

1. **Builds trust**: Learners understand the system is helping, not punishing
2. **Educates**: Helps learners understand their own skill profile
3. **Reduces frustration**: Difficult cards feel purposeful, not arbitrary

### Connection to the Dashboard

The mastery dashboard and selection reasoning create a feedback loop. Learners can see their weak dimensions on the dashboard and then see those dimensions prioritized during review. This reinforces the system's adaptive nature.

---

## Alternatives Considered

### Pure Greedy Selection

Always selecting the highest-weight card creates problems:
- Stuck in local optima
- No exploration of borderline cases
- Predictable and gameable

### Thompson Sampling

A Bayesian approach that balances exploration and exploitation based on uncertainty. While theoretically elegant, it:
- Requires maintaining probability distributions per variant
- Adds significant complexity
- May not provide meaningful improvement for the typical session size

### Contextual Bandits

Machine learning approaches that learn selection policies. Rejected because:
- Require significant training data
- Add deployment complexity
- Hard to explain to users

### Manual Selection

Letting learners choose what to practice. Rejected as the primary mechanism because:
- Learners tend to avoid weak areas (the "comfort zone" problem)
- Removes the adaptive benefit
- But offered as an optional mode for advanced users

---

## Summary

The adaptive selection algorithm balances multiple factors through weighted random selection:

1. **Weakness boost** ensures struggling dimensions receive more practice
2. **Novelty boost** encourages variety and prevents memorization of specific cards
3. **Frustration penalty** protects learners from spiral patterns
4. **Difficulty alignment** matches challenge to current skill level
5. **Safety rails** prevent pathological patterns and ensure balanced practice

The multiplicative combination allows each factor to influence selection while no single factor completely dominates. The result is a selection process that feels intelligent and responsive without being predictable or punishing.

---

*See also: [Mastery Algorithm](./mastery-algorithm.md) for how mastery scores are calculated.*
