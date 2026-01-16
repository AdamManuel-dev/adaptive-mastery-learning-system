# Managing Mastery

Task-oriented guides for understanding and managing your mastery scores.

---

## View your mastery profile

**Goal:** See your skill breakdown across all six dimensions.

1. Navigate to **Dashboard**
2. Scroll to **Mastery by Dimension** section
3. Review the skill bars showing accuracy percentage per dimension

The display shows:
- **Percentage**: Your EWMA accuracy score (0-100%)
- **Review count**: How many reviews contribute to the score
- **Weakest/Strongest**: Badges indicating your gaps and strengths

---

## Identify your weakest dimension

**Goal:** Find where to focus practice.

1. Navigate to **Dashboard**
2. Look for the **Needs Work** badge on a dimension
3. The warning banner states: "Focus area: [Dimension] needs more practice"

The algorithm automatically prioritizes weak dimensions. Check Dashboard regularly to track improvement.

---

## Interpret fragile confidence warnings

**Goal:** Understand "correct but slow" feedback.

**Fragile confidence** means:
- High accuracy (>70%) but slow speed (<50%)
- You know the material but lack automaticity
- The knowledge may fail under time pressure

**How it appears:**
- Dashboard may show high accuracy with low combined mastery
- The system weights both accuracy (70%) and speed (30%)

**What to do:**
1. Keep practicing - speed improves with repetition
2. Focus on quick retrieval, not careful deliberation
3. Time yourself mentally before revealing answers

---

## Reset mastery scores for a dimension

**Goal:** Start fresh with a dimension's tracking.

> **Note:** Manual mastery reset is not available in v1 UI.

**Workaround via database:**

```bash
# Access SQLite database
sqlite3 data/learning.db

# View current mastery (example)
SELECT * FROM mastery WHERE dimension = 'scenario';

# Reset a dimension's EWMA to default
UPDATE mastery
SET accuracy_ewma = 0.5, speed_ewma = 0.5, count = 0
WHERE dimension = 'scenario';
```

**Warning:** This erases historical learning data for that dimension.

---

## Export mastery history

**Goal:** Back up or analyze your learning data.

**Via database export:**

```bash
# Export mastery table to JSON
sqlite3 -json data/learning.db "SELECT * FROM mastery"

# Export review events for detailed history
sqlite3 -json data/learning.db "SELECT * FROM events ORDER BY created_at DESC"
```

**Event data includes:**
- Variant and concept IDs
- Dimension and difficulty
- Rating given (again/hard/good/easy)
- Response time in milliseconds
- Hints used count

---

## Understand mastery calculation

**Goal:** Know how scores are computed.

The system uses EWMA (Exponentially Weighted Moving Average):

```
newAccuracy = (1 - alpha) * oldAccuracy + alpha * ratingScore
newSpeed = (1 - alpha) * oldSpeed + alpha * speedScore
mastery = 0.7 * accuracy + 0.3 * speed
```

- `alpha = 0.15` (default) - Recent reviews matter more
- Rating scores: again=0, hard=0.4, good=0.7, easy=1.0
- Speed score: Based on response time vs. difficulty target

See [Explanation: Mastery Algorithm](../explanation/mastery-algorithm.md) for details.

---

## Check mastery for a specific dimension

**Goal:** Get detailed metrics for one dimension.

**Via API:**

```javascript
const mastery = await window.api.mastery.getByDimension('scenario')
console.log(mastery)
// { dimension: 'scenario', accuracyEwma: 0.72, speedEwma: 0.45, count: 23 }
```

---

## Get complete mastery profile

**Goal:** Retrieve all dimension scores programmatically.

**Via API:**

```javascript
const profile = await window.api.mastery.getProfile()
console.log(profile)
// {
//   dimensions: [...],
//   overallScore: 68,
//   weakestDimension: 'scenario',
//   strongestDimension: 'definition'
// }
```

---

## Related

- [Customizing Reviews](./customizing-reviews.md) - Adjust session behavior
- [Reference: Mastery API](../reference/ipc-api.md#mastery-channels) - Full API specification
