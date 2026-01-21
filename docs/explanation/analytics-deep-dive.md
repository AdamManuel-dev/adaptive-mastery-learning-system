# Analytics Deep Dive: Understanding the Visualizations

**Understanding how the analytics dashboard transforms raw learning data into actionable insights**

---

## Why Analytics Matter for Learning

The Adaptive Mastery Learning System generates a wealth of data with every review: response times, accuracy rates, dimension performance, and temporal patterns. Raw data, however, is not insight. The analytics dashboard exists to transform this data into visual representations that reveal patterns invisible in individual review sessions.

This document explains the algorithms and design decisions behind each visualization, helping you understand not just what you see, but why the charts show what they do.

---

## The Health Score Gauge

### What It Shows

A semi-circle gauge displaying your overall mastery as a single percentage (0-100%).

### How It's Calculated

The health score aggregates mastery across all six cognitive dimensions:

```
overallScore = average(definitionMastery, paraphraseMastery, exampleMastery,
                       scenarioMastery, discriminationMastery, clozeMastery)
```

Each dimension's mastery is itself an EWMA (Exponentially Weighted Moving Average) combining accuracy and speed:

```
dimensionMastery = 0.7 × accuracyEwma + 0.3 × speedEwma
```

### Why a Gauge?

The gauge metaphor communicates health status intuitively:
- **Red zone (<40%)**: Like a car's warning light—attention needed
- **Yellow zone (40-70%)**: Making progress, room for improvement
- **Green zone (>70%)**: Healthy learning trajectory

### Design Decisions

**Why not show individual dimension scores?** The gauge answers a single question: "How am I doing overall?" The radar chart handles dimensional breakdown. Each visualization serves one purpose clearly.

**Why these thresholds?** The 40/70 split comes from learning science research on mastery thresholds. Below 40% mastery, knowledge is unstable and easily forgotten. Above 70%, retention becomes robust. The yellow zone represents the critical learning period.

### Status Text Mapping

| Score Range | Status | Interpretation |
|-------------|--------|----------------|
| 0-24% | Needs Attention | Very early stage or significant gaps |
| 25-39% | Getting Started | Building foundation |
| 40-54% | Making Progress | Active learning zone |
| 55-69% | Good Progress | Consolidating knowledge |
| 70-84% | Strong | Approaching mastery |
| 85-100% | Excellent | Robust, transferable knowledge |

---

## The Mastery Radar Chart

### What It Shows

A hexagonal spider/radar chart with six axes, one per cognitive dimension. The filled area represents your skill profile.

### Why a Radar Chart?

Radar charts excel at showing multi-dimensional profiles:
- **Shape reveals balance**: A symmetric hexagon indicates even development
- **Flat edges identify gaps**: Easy to spot where the shape collapses
- **Comparison over time**: Shape changes show progress direction

### Interpreting Shapes

**Balanced hexagon**: Even development across dimensions. You're building broad understanding.

**Spiked shape**: Strong in some areas, weak in others. Common for learners who over-rely on definition recall.

**Collapsed dimension**: Near-zero on one axis. That dimension needs immediate attention—knowledge is not transferring to that question type.

### The Illusion of Knowing

The radar chart directly addresses what learning scientists call the "illusion of knowing." Students often believe they understand material because they can recall definitions, but cannot apply concepts to scenarios or distinguish them from similar ideas.

A radar chart showing high definition mastery but low scenario mastery reveals this gap visually. The shape tells a story that a single number cannot.

### Why Six Dimensions?

The six dimensions map to different cognitive processes:

| Dimension | Cognitive Process | Why It Matters |
|-----------|------------------|----------------|
| Definition | Semantic retrieval | Foundation of vocabulary |
| Paraphrase | Recognition flexibility | Handles varied phrasing |
| Example | Classification | Applies categories |
| Scenario | Transfer | Uses knowledge practically |
| Discrimination | Distinction | Prevents confusion |
| Cloze | Contextual completion | Tests relationships |

Testing all six ensures genuine understanding, not just surface memorization.

---

## The Progress Timeline

### What It Shows

A line chart tracking overall mastery over the past 30 days.

### Why 30 Days?

The 30-day window balances two concerns:
- **Long enough** to show meaningful trends and the effects of sustained practice
- **Short enough** to remain responsive to recent changes

Learning progress follows non-linear patterns: rapid initial gains, plateaus, and occasional dips. Thirty days captures these patterns without overwhelming the user with long-term data.

### Interpreting Patterns

**Upward trend**: Practice is effective. The EWMA scores are increasing as successful reviews accumulate.

**Plateau**: Learning has stabilized at current level. May indicate:
- Mastery achieved (good plateau)
- Practice has stopped (stagnation plateau)
- Material difficulty has increased

**Dip**: Recent performance declined. Possible causes:
- Challenging new material added
- Reduced practice frequency
- Knowledge decay from gaps between sessions

**Oscillation**: Up-and-down pattern suggests inconsistent practice or material at the edge of competence.

### Why Line Chart?

Line charts emphasize continuity and trend. Progress is a journey, not discrete events. The connected line reinforces that today's performance builds on yesterday's.

---

## The Review Distribution Chart

### What It Shows

Stacked bar charts showing how review results (Again, Hard, Good, Easy) distribute across dimensions.

### The Four Ratings Explained

| Rating | Score | Meaning | What It Reveals |
|--------|-------|---------|-----------------|
| Again | 0.0 | Complete failure | Knowledge gap or decay |
| Hard | 0.4 | Recalled with struggle | Fragile knowledge |
| Good | 0.7 | Correct with effort | Solid but not automatic |
| Easy | 1.0 | Effortless recall | Mastered, may need challenge |

### Why Show Distribution?

Raw accuracy (% correct) hides important information. Consider two scenarios:
- **Scenario A**: 80% Good, 20% Hard
- **Scenario B**: 50% Easy, 30% Again, 20% Hard

Both might average to similar mastery scores, but they represent very different learning states. The distribution chart reveals this nuance.

### Interpreting Distribution Patterns

**Heavy "Again" in one dimension**: Systematic weakness. That question type is consistently failing.

**Heavy "Easy" across all dimensions**: Material may be too simple. Consider adding harder variants or new concepts.

**Even "Good" distribution**: Healthy learning. Knowledge is being consolidated at appropriate challenge level.

**Bimodal (lots of Easy and Again, few Good/Hard)**: Suggests some material is mastered while other material is not yet learned. May indicate need for more gradual difficulty progression.

---

## The Response Time Chart

### What It Shows

Average response times grouped by card difficulty level (1-5).

### Target Times by Difficulty

| Difficulty | Target | Rationale |
|------------|--------|-----------|
| 1 (Very Easy) | 5 seconds | Basic recall should be instant |
| 2 (Easy) | 10 seconds | Simple application |
| 3 (Medium) | 20 seconds | Standard complexity |
| 4 (Hard) | 40 seconds | Requires thought |
| 5 (Very Hard) | 60 seconds | Complex reasoning |

### Why Speed Matters

Speed indicates automaticity—how deeply knowledge is embedded. A correct answer that takes 30 seconds for a "Very Easy" card suggests fragile knowledge that may not transfer to real-world use.

The mastery calculation weights speed at 30% (vs 70% for accuracy) because:
- Accuracy is more important than speed
- But speed reveals depth of understanding
- Together, they provide a complete picture

### Interpreting Speed Patterns

**Flat across difficulties**: Either consistently fast (strong automaticity) or consistently slow (fragile knowledge). Compare to target times.

**Expected slope (slower at higher difficulty)**: Normal and healthy. Complex material should take longer.

**Inverted slope (faster at high difficulty)**: Unusual. May indicate:
- Easy cards are actually harder than labeled
- High-difficulty cards have been over-practiced
- Difficulty ratings need recalibration

**Outliers**: Individual dimensions with unusually slow times suggest that dimension needs more practice.

---

## The Weakness Heatmap

### What It Shows

A calendar-style grid where:
- Rows = dimensions
- Columns = days (last 30)
- Color = weakness severity

### Severity Levels

| Level | Color | Mastery Range | Meaning |
|-------|-------|---------------|---------|
| None | Green | >70% | No weakness |
| Mild | Yellow | 55-70% | Minor gap |
| Moderate | Orange | 40-55% | Needs attention |
| Critical | Red | <40% | Significant weakness |

### Why a Heatmap?

Heatmaps reveal temporal patterns that other visualizations miss:

**Horizontal bands**: Persistent weakness in a dimension across time. This dimension needs focused practice.

**Vertical bands**: Everything struggled on certain days. May indicate:
- Fatigue or distraction
- Difficult material introduced
- Gaps between practice sessions

**Scattered red cells**: Occasional struggles without pattern. Normal learning variability.

**Gradient from red to green**: Improvement over time. Practice is working.

### Reading Heatmap Patterns

**The dimension that stays red**: Your persistent weakness. The adaptive algorithm should be prioritizing this, but if it remains red, consider:
- Adding more variants for that dimension
- Checking if existing cards are well-designed
- Focusing manual practice on that question type

**The day everything went red**: Something happened that day. Sick? Distracted? New difficult material? Understanding why helps prevent recurrence.

**Green everywhere**: You've achieved broad competence. Time to add new concepts or increase difficulty.

---

## How the Charts Work Together

The six charts form a coherent analytical system:

1. **Health Score Gauge**: Overall status at a glance
2. **Mastery Radar**: Dimensional breakdown of that score
3. **Progress Timeline**: How we got here
4. **Review Distribution**: Quality of recent performance
5. **Response Time**: Depth of knowledge
6. **Weakness Heatmap**: Where and when problems occur

**Diagnostic flow:**
1. Check gauge: How am I overall?
2. Check radar: Where are my gaps?
3. Check heatmap: Are gaps persistent or recent?
4. Check timeline: Am I improving?
5. Check distribution: What's the quality of my reviews?
6. Check response time: Is my knowledge automatic?

---

## Data Sources and Refresh

### Where Data Comes From

| Chart | Primary Data Source |
|-------|---------------------|
| Health Score | `mastery:getProfile` (overallScore) |
| Mastery Radar | `mastery:getProfile` (dimension scores) |
| Progress Timeline | `analytics:getProgressTimeline` |
| Review Distribution | `analytics:getReviewDistribution` |
| Response Time | `analytics:getResponseTimeStats` |
| Weakness Heatmap | `analytics:getWeaknessHeatmap` |

### When Data Updates

Analytics refresh when you navigate to the Analytics page. They do not live-update during review sessions. Complete your reviews, then check analytics to see updated visualizations.

### Data Requirements

Charts require review history to display meaningful data. New users will see "No data available" until they complete reviews. The more reviews completed, the more accurate and useful the visualizations become.

---

## Limitations and Future Directions

### Current Limitations

**30-day window**: Long-term trends beyond a month require manual tracking or database queries.

**No export**: Analytics cannot currently be exported for external analysis.

**Aggregate only**: Charts show aggregated data, not individual card performance.

### Potential Future Enhancements

- Longer time windows (90 days, 1 year)
- Per-concept analytics
- Export to CSV/JSON
- Trend predictions
- Learning velocity metrics
- Optimal review scheduling suggestions

---

*See also: [Mastery Algorithm](./mastery-algorithm.md) for the underlying EWMA calculations, [Using Analytics Dashboard](../how-to/using-analytics.md) for practical usage guidance.*
