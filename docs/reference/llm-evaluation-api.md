# LLM Evaluation API Reference

Technical specifications for the LLM-based response evaluation system.

---

## Overview

| Property | Value |
|----------|-------|
| Purpose | Evaluate open-response answers using LLM |
| IPC Channel | `evaluation:evaluate` |
| Provider | OpenAI (primary), configurable |
| Default Model | gpt-4o-mini |
| Response Format | JSON with structured evaluation |

---

## IPC Channel

### evaluation:evaluate

Evaluates a user's open-response answer against a model answer.

**Request Type:** `EvaluationRequest`

**Response Type:** `LLMEvaluationResult`

**Usage:**

```typescript
const result = await window.api.evaluation.evaluate({
  question: 'What is mitosis?',
  modelAnswer: 'Cell division producing two identical daughter cells',
  userResponse: 'It is when a cell divides into two new cells',
  conceptName: 'Mitosis',
  dimension: 'definition',
})
```

---

## Request Types

### EvaluationRequest

```typescript
interface EvaluationRequest {
  /** The question that was asked */
  question: string

  /** The model/reference answer for comparison */
  modelAnswer: string

  /** The user's response to evaluate */
  userResponse: string

  /** Name of the concept being tested (for context) */
  conceptName?: string

  /** Dimension being tested (for evaluation criteria adjustment) */
  dimension?: Dimension

  /** Optional rubric for structured evaluation */
  rubric?: EvaluationRubric
}
```

### EvaluationRubric

```typescript
interface EvaluationRubric {
  /** Key points that should be mentioned in a good answer */
  keyPoints: string[]

  /** Alternative acceptable phrasings */
  acceptableVariations?: string[]

  /** Instructions for how to award partial credit */
  partialCreditCriteria?: string
}
```

---

## Response Types

### LLMEvaluationResult

```typescript
interface LLMEvaluationResult {
  /** Overall score from 0.0 to 1.0 */
  score: number

  /** Human-readable feedback for the user */
  feedback: string

  /** Which key points from the rubric were covered */
  keyPointsCovered: string[]

  /** Which key points from the rubric were missed */
  keyPointsMissed: string[]

  /** LLM's confidence in the evaluation (0.0 to 1.0) */
  confidence: number

  /** Suggested user rating based on the score */
  suggestedRating: Rating

  /** Whether the response demonstrated understanding of the concept */
  demonstratesUnderstanding: boolean
}
```

### Rating Mapping

| Score Range | Suggested Rating | Interpretation |
|-------------|------------------|----------------|
| 0.90 - 1.00 | `easy` | Excellent, comprehensive answer |
| 0.70 - 0.89 | `good` | Correct with minor gaps |
| 0.40 - 0.69 | `hard` | Partial understanding |
| 0.00 - 0.39 | `again` | Significant gaps |

---

## Configuration

### LLMConfig

```typescript
interface LLMConfig {
  /** LLM provider */
  provider: 'openai' | 'anthropic' | 'local'

  /** Model identifier */
  model: string

  /** API key for authentication */
  apiKey?: string

  /** Base URL override (for local or proxy) */
  baseUrl?: string

  /** Request timeout in milliseconds */
  timeoutMs?: number

  /** Maximum retry attempts */
  maxRetries?: number
}
```

### Default Values

| Property | Default |
|----------|---------|
| model | `gpt-4o-mini` |
| timeoutMs | 30000 (30 seconds) |
| maxRetries | 2 |
| temperature | 0.3 (for consistent evaluation) |
| max_tokens | 1024 |

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | API key for OpenAI |
| `OPENAI_MODEL` | Model override |
| `OPENAI_BASE_URL` | Base URL override |

---

## Error Types

### LLMConfigurationError

Thrown when configuration is invalid or missing.

```typescript
class LLMConfigurationError extends Error {
  readonly missingFields: string[]
}
```

**Common causes:**
- Missing API key
- Invalid model name
- Authentication failure (401/403)

### LLMAPIError

Thrown for general API communication errors.

```typescript
class LLMAPIError extends Error {
  readonly provider: string
  readonly statusCode?: number
}
```

**Common causes:**
- Network timeout
- Service unavailable
- Invalid request format

### LLMRateLimitError

Thrown when API rate limits are exceeded.

```typescript
class LLMRateLimitError extends Error {
  readonly retryAfterMs?: number
}
```

**Handling:**
- Automatic retry with exponential backoff
- `retryAfterMs` from `Retry-After` header when available

### LLMValidationError

Thrown when LLM response cannot be parsed.

```typescript
class LLMValidationError extends Error {
  readonly rawResponse?: string
}
```

**Common causes:**
- Invalid JSON response
- Missing required fields
- Out-of-range values

---

## Retry Behavior

The evaluator implements automatic retries:

| Attempt | Delay |
|---------|-------|
| 1st retry | ~1 second + jitter |
| 2nd retry | ~2 seconds + jitter |
| Rate limit | 5+ seconds or `Retry-After` header |

**Not retried:**
- `LLMValidationError` (response format issues)
- `LLMConfigurationError` (configuration problems)

---

## Evaluation Prompt Structure

The LLM receives a structured prompt:

```
System: [Evaluation guidelines and scoring criteria]

User:
## Context
Concept: {conceptName}
Dimension: {dimension}

## Question
{question}

## Reference Answer
{modelAnswer}

## User's Response
{userResponse}

## Evaluation Criteria
{rubric details if provided}

Evaluate the response and return JSON...
```

---

## Response JSON Schema

The LLM is instructed to return:

```json
{
  "score": 0.75,
  "feedback": "Good understanding of the core concept...",
  "keyPointsCovered": ["cell division", "two cells"],
  "keyPointsMissed": ["identical", "daughter cells"],
  "confidence": 0.85,
  "demonstratesUnderstanding": true
}
```

### Validation Rules

| Field | Validation |
|-------|------------|
| score | Required, number, 0.0-1.0 |
| feedback | Optional, string, defaults to "No feedback provided" |
| keyPointsCovered | Optional, string array, defaults to [] |
| keyPointsMissed | Optional, string array, defaults to [] |
| confidence | Optional, number 0.0-1.0, defaults to 0.7 |
| demonstratesUnderstanding | Optional, boolean, defaults to score >= 0.5 |

---

## Integration Points

### ReviewPage Integration

The ReviewPage component uses evaluation for open-response cards:

```typescript
// When user submits response
const evaluation = await api.evaluation.evaluate({
  question: card.front,
  modelAnswer: card.back,
  userResponse: userInput,
  conceptName: card.conceptName,
  dimension: card.dimension,
})

// Display results in OpenResponseCard component
```

### OpenResponseCard Component

Props for displaying evaluation:

```typescript
interface OpenResponseCardProps {
  question: string
  maxLength?: number
  onSubmit: (response: string) => Promise<void>
  evaluation?: LLMEvaluationResult
  modelAnswer?: string
  isEvaluating?: boolean
  onContinue?: () => void
}
```

---

## Performance Characteristics

| Metric | Typical Value |
|--------|---------------|
| Response time | 2-8 seconds |
| Token usage | ~500-800 tokens |
| Cost per evaluation | ~$0.001-0.002 (gpt-4o-mini) |

---

## Dimension-Specific Evaluation

Evaluation criteria adjust based on dimension:

| Dimension | Evaluation Focus |
|-----------|------------------|
| definition | Accuracy of key terms |
| paraphrase | Semantic equivalence |
| example | Correct classification |
| scenario | Appropriate application |
| discrimination | Clear distinction |
| cloze | Contextual accuracy |

---

## Testing Connection

### settings:testConnection

Tests LLM configuration before saving.

**Request Type:** `LLMConfigDTO`

**Response Type:** `ConnectionTestResultDTO`

```typescript
interface ConnectionTestResultDTO {
  success: boolean
  message: string
  latencyMs?: number
}
```

**Usage:**

```typescript
const result = await window.api.settings.testConnection({
  provider: 'openai',
  apiKey: 'sk-...',
  model: 'gpt-4o-mini',
})

if (result.success) {
  console.log(`Connected in ${result.latencyMs}ms`)
}
```

---

## Source Files

| Component | Location |
|-----------|----------|
| Evaluator implementation | `src/main/infrastructure/llm/evaluator.ts` |
| Evaluation prompts | `src/main/infrastructure/llm/evaluation-prompts.ts` |
| IPC handler | `src/main/ipc/evaluation.ipc.ts` |
| Type definitions | `src/shared/types/ipc.ts` |
| Error types | `src/main/infrastructure/llm/errors.ts` |

---

## Related Documentation

- [How-To: Open-Response Questions](../how-to/open-response-questions.md)
- [How-To: Working with Variants](../how-to/working-with-variants.md)
- [Reference: Configuration](./configuration.md)
- [Reference: IPC API](./ipc-api.md)
