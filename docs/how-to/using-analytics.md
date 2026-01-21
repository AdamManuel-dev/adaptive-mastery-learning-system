# Using the Analytics Dashboard

Task-oriented guides for understanding and using the analytics visualizations.

---

## Navigate to the Analytics Dashboard

**Goal:** Access the analytics visualizations.

1. Click **Analytics** in the left sidebar navigation
2. The dashboard displays 6 chart visualizations

The page loads all charts with individual loading states and error boundaries for graceful handling.

---

## Interpret the Health Score Gauge

**Goal:** Understand your overall learning health at a glance.

The Health Score Gauge displays a semi-circle gauge showing your overall mastery percentage.

**Reading the gauge:**
- **0-40%**: Needs significant improvement (red zone)
- **40-70%**: Making progress (yellow zone)
- **70-100%**: Strong mastery (green zone)

The score aggregates performance across all six cognitive dimensions.

---

## Analyze Dimension Mastery with the Radar Chart

**Goal:** Identify strengths and weaknesses across all learning dimensions.

The Mastery Radar Chart displays your mastery level for each of the six dimensions as a filled polygon:

| Axis | Dimension | What It Measures |
|------|-----------|------------------|
| Top | Definition | Term recall ability |
| Upper-right | Paraphrase | Recognition of meaning |
| Lower-right | Example | Instance classification |
| Bottom | Scenario | Real-world application |
| Lower-left | Discrimination | Distinguishing similar concepts |
| Upper-left | Cloze | Fill-in-the-blank completion |

**Using the radar chart:**
- Points closer to the edge indicate stronger mastery
- Identify "flat" areas to focus practice
- Compare shape changes over time

---

## Track Progress Over Time

**Goal:** Monitor mastery growth trends.

The Progress Timeline Chart shows mastery progression over the past 30 days.

**Features:**
- X-axis: Date
- Y-axis: Mastery percentage (0-100%)
- Line shows trend of overall mastery

**What to look for:**
- Upward trends indicate effective learning
- Plateaus may suggest need for varied practice
- Dips might indicate challenging material or reduced practice

---

## Analyze Review Distribution

**Goal:** Understand how review results vary by dimension.

The Review Distribution Chart shows stacked bars for each dimension with review result categories:

| Color | Result | Meaning |
|-------|--------|---------|
| Red | Again | Complete failure |
| Orange | Hard | Recalled with difficulty |
| Green | Good | Correct with effort |
| Blue | Easy | Effortless recall |

**Use this to:**
- Identify dimensions with high "Again" rates
- See which areas feel "Easy" (may need more challenge)
- Balance effort across dimensions

---

## Evaluate Response Time

**Goal:** Understand your response speed across difficulty levels.

The Response Time Chart shows average response times grouped by card difficulty (1-5).

**Interpretation:**
- Faster times at lower difficulties = expected
- Slow times on "Easy" cards = may indicate fragile knowledge
- Consistent times across difficulties = strong automaticity

**Target times by difficulty:**
| Difficulty | Target Time |
|------------|-------------|
| 1 (Very Easy) | 5 seconds |
| 2 (Easy) | 10 seconds |
| 3 (Medium) | 20 seconds |
| 4 (Hard) | 40 seconds |
| 5 (Very Hard) | 60 seconds |

---

## Identify Weakness Patterns with the Heatmap

**Goal:** Spot recurring problem areas over time.

The Weakness Heatmap displays a grid where:
- Rows represent dimensions
- Columns represent time periods (days/weeks)
- Color intensity indicates weakness severity

**Reading the heatmap:**
- Darker cells = more struggles in that dimension/time
- Horizontal dark bands = persistent weakness in a dimension
- Vertical dark bands = difficult periods across all dimensions

**Taking action:**
- Focus practice on dimensions with consistent dark cells
- Review what changed during dark vertical periods

---

## Handle Chart Loading Errors

**Goal:** Recover when a chart fails to load.

Each chart has its own error boundary. If a chart fails:

1. The affected chart shows "Unable to load [Chart Name]"
2. Other charts continue functioning normally
3. Error details appear below the message

**To resolve:**
1. Refresh the page (may fix temporary issues)
2. Check if you have review data (empty data may cause errors)
3. Complete some reviews to generate analytics data
4. Report persistent errors

---

## Export Analytics Data

**Goal:** Save analytics for external analysis.

> **Note:** Export is not yet implemented in the UI.

**Workaround:** Access the SQLite database directly:

```bash
# Export review events for analysis
sqlite3 -json data/learning.db "SELECT * FROM events ORDER BY timestamp DESC"

# Export mastery data
sqlite3 -json data/learning.db "SELECT * FROM mastery"
```

---

## Related

- [Managing Mastery Scores](./managing-mastery.md) - View and interpret mastery profiles
- [Customizing Reviews](./customizing-reviews.md) - Focus practice on weak areas
- [Reference: Database Schema](../reference/database-schema.md) - Underlying data structure
