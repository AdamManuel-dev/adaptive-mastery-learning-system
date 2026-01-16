# Configuration Reference

Technical specifications for application configuration options.

---

## Settings Structure

### SettingsDTO

Complete application settings object.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `ewmaAlpha` | `number` | `0.15` | EWMA smoothing factor |
| `targetTimes` | `Record<number, number>` | See table | Target times by difficulty |
| `antiFrustrationThreshold` | `number` | `3` | Failures before confidence card |
| `cardsPerSession` | `number` | `25` | Cards per review session |
| `newCardsPerDay` | `number` | `10` | New cards per day limit |
| `llm` | `LLMConfigDTO` | See section | LLM configuration |
| `theme` | `'light' \| 'dark' \| 'system'` | `'system'` | UI theme |

---

## Mastery Settings

### ewmaAlpha

EWMA (Exponentially Weighted Moving Average) smoothing factor.

| Property | Value |
|----------|-------|
| Type | `number` |
| Default | `0.15` |
| Range | 0.0 - 1.0 |

**Behavior:**
- Higher values (closer to 1.0): More weight on recent observations, faster response to changes
- Lower values (closer to 0.0): More weight on historical data, smoother trend
- Value of 0.15 provides balance between responsiveness and stability

**Formula:**
```
new_ewma = (1 - alpha) * current_ewma + alpha * new_observation
```

---

### targetTimes

Target response times in milliseconds for each difficulty level.

| Difficulty | Default (ms) | Description |
|------------|--------------|-------------|
| 1 | 5000 | Very Easy - Basic recall |
| 2 | 10000 | Easy - Simple recognition |
| 3 | 20000 | Medium - Moderate application |
| 4 | 40000 | Hard - Complex reasoning |
| 5 | 60000 | Very Hard - Deep analysis |

**Structure:**
```typescript
{
  1: 5000,
  2: 10000,
  3: 20000,
  4: 40000,
  5: 60000,
}
```

**Speed Score Calculation:**
```
score = 1 - clamp(timeMs / targetMs, 0, 2) / 2
```

| Response Time | Speed Score |
|---------------|-------------|
| 0 ms | 1.0 |
| target / 2 | 0.75 |
| target | 0.5 |
| target * 2 | 0.0 |

---

## Review Settings

### antiFrustrationThreshold

Number of consecutive failures before inserting a confidence card.

| Property | Value |
|----------|-------|
| Type | `number` |
| Default | `3` |
| Range | 1 - 10 |

**Behavior:**
- After this many consecutive failures, system inserts an easier "confidence card"
- Prevents frustration spirals
- Resets to 0 after a successful review

---

### cardsPerSession

Maximum number of cards in a single review session.

| Property | Value |
|----------|-------|
| Type | `number` |
| Default | `25` |
| Range | 5 - 100 |

---

### newCardsPerDay

Maximum number of new cards introduced per day.

| Property | Value |
|----------|-------|
| Type | `number` |
| Default | `10` |
| Range | 1 - 50 |

---

## LLM Configuration

### LLMConfigDTO

Configuration for LLM-based card generation.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `provider` | `'openai' \| 'anthropic' \| 'local'` | `'openai'` | LLM provider |
| `apiKey` | `string` | `''` | API key (required for cloud providers) |
| `model` | `string` | `'gpt-4o-mini'` | Model identifier |
| `baseUrl` | `string` | `undefined` | Custom API endpoint (for local) |

**Provider Options:**

| Provider | Models | Base URL |
|----------|--------|----------|
| `openai` | `gpt-4o-mini`, `gpt-4o`, `gpt-4-turbo` | Default OpenAI |
| `anthropic` | `claude-3-haiku`, `claude-3-sonnet`, `claude-3-opus` | Default Anthropic |
| `local` | Varies by setup | User-specified |

---

## Theme Settings

### theme

UI color theme preference.

| Value | Description |
|-------|-------------|
| `'light'` | Light color scheme |
| `'dark'` | Dark color scheme |
| `'system'` | Follow system preference |

---

## Algorithm Constants

### Mastery Calculator Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `DEFAULT_ALPHA` | 0.15 | EWMA smoothing factor |
| `DEFAULT_WEAK_THRESHOLD` | 0.7 | Weakness detection threshold |
| `ACCURACY_WEIGHT` | 0.7 | Weight for accuracy in combined score |
| `SPEED_WEIGHT` | 0.3 | Weight for speed in combined score |

**Source:** `src/domain/services/mastery-calculator.service.ts`

---

### SM-2 Scheduler Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `MIN_EASE_FACTOR` | 1.3 | Minimum ease factor |
| `MAX_EASE_FACTOR` | 2.5 | Maximum ease factor |
| `DEFAULT_EASE_FACTOR` | 2.5 | Initial ease factor |
| `MIN_INTERVAL_DAYS` | 1 | Minimum review interval |
| `DEFAULT_INTERVAL_DAYS` | 1 | Initial interval |
| `HARD_INTERVAL_MULTIPLIER` | 1.2 | Multiplier for hard responses |

**Ease Factor Adjustments:**

| Result | Adjustment |
|--------|------------|
| `easy` | +0.15 |
| `good` | 0 |
| `hard` | -0.15 |
| `again` | -0.2 |

**Source:** `src/domain/services/scheduler.service.ts`

---

### Card Selector Constants

| Constant | Value | Description |
|----------|-------|-------------|
| Weakness boost range | 0.9 - 2.4 | Multiplier for weak dimensions |
| Novelty boost (never shown) | 2.0 | Boost for new cards |
| Novelty boost (> 7 days) | 1.5 | Boost for stale cards |
| Novelty boost (3-7 days) | 1.2 | Boost for aging cards |
| Novelty penalty (< 3 days) | 0.8 | Penalty for recent cards |
| Max session dimension percent | 0.7 | Maximum single dimension representation |

**Anti-Frustration Penalties:**

| Consecutive Failures | Penalty |
|---------------------|---------|
| 0 | 1.0 |
| 1 | 0.8 |
| 2 | 0.6 |
| >= 3 | 0.3 |

**Source:** `src/domain/services/card-selector.service.ts`

---

### Weakness Detector Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `WEAKNESS_THRESHOLD` | 0.7 | Below this is weak |
| `CRITICAL_THRESHOLD` | 0.4 | Critical severity |
| `MODERATE_THRESHOLD` | 0.55 | Moderate severity |
| `DEFAULT_MIN_SAMPLE_SIZE` | 5 | Minimum reviews for detection |
| `STRONG_DEFINITION_THRESHOLD` | 0.8 | Dodging pattern detection |
| `WEAK_OTHERS_THRESHOLD` | 0.6 | Dodging pattern detection |

**Severity Classification:**

| Severity | Combined Score Range |
|----------|---------------------|
| `critical` | < 0.4 |
| `moderate` | 0.4 - 0.55 |
| `mild` | 0.55 - 0.7 |

**Source:** `src/domain/services/weakness-detector.service.ts`

---

## Dimension Constants

### Display Names

| Dimension | Display Name |
|-----------|--------------|
| `definition_recall` | Definition Recall |
| `paraphrase_recognition` | Paraphrase Recognition |
| `example_classification` | Example Classification |
| `scenario_application` | Scenario Application |
| `discrimination` | Discrimination |
| `cloze_fill` | Cloze Fill |

### Action Verbs

| Dimension | Action Verb |
|-----------|-------------|
| `definition_recall` | Recall |
| `paraphrase_recognition` | Recognize |
| `example_classification` | Classify |
| `scenario_application` | Apply |
| `discrimination` | Distinguish |
| `cloze_fill` | Complete |

### Base Target Times

| Dimension | Base Time (ms) |
|-----------|----------------|
| `definition` | 5000 |
| `paraphrase` | 8000 |
| `example` | 10000 |
| `scenario` | 15000 |
| `discrimination` | 12000 |
| `cloze` | 6000 |

**Source:** `src/shared/constants/dimensions.ts`

---

## Difficulty Constants

### Labels

| Level | Label |
|-------|-------|
| 1 | Very Easy |
| 2 | Easy |
| 3 | Medium |
| 4 | Hard |
| 5 | Very Hard |

### Default Values

| Constant | Value |
|----------|-------|
| `DEFAULT_DIFFICULTY` | 2 |

### Difficulty Multipliers (for target time)

| Difficulty | Multiplier |
|------------|------------|
| 1 | 0.5 |
| 2 | 0.75 |
| 3 | 1.0 |
| 4 | 1.5 |
| 5 | 2.0 |

**Source:** `src/domain/value-objects/difficulty.vo.ts`, `src/shared/constants/dimensions.ts`

---

## Database Configuration

### Default Path

| Property | Value |
|----------|-------|
| Path | `./data/learning.db` |
| Type | SQLite |
| Library | better-sqlite3 |

---

## Environment Variables

Environment variables can override configuration values.

| Variable | Type | Description |
|----------|------|-------------|
| `OPENAI_API_KEY` | `string` | OpenAI API key |
| `ANTHROPIC_API_KEY` | `string` | Anthropic API key |
| `NODE_ENV` | `'development' \| 'production'` | Environment mode |

---

## Related Documentation

- [IPC API Reference](./ipc-api.md)
- [Type Definitions Reference](./types.md)
- [Domain Model Reference](./domain-model.md)
