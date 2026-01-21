# Using Open-Response Questions

Task-oriented guides for working with LLM-evaluated open-response questions.

---

## Understand Open-Response Questions

**Goal:** Know when and how open-response questions appear.

Open-response questions differ from standard flashcards:

| Standard Card | Open-Response |
|--------------|---------------|
| Show answer, self-rate | Type answer, LLM evaluates |
| Binary correct/incorrect | Percentage score with feedback |
| Quick review | Deeper comprehension check |

Open-response questions appear during review sessions when a card is configured for this question type.

---

## Answer an Open-Response Question

**Goal:** Complete an open-response review.

1. Read the question displayed
2. Type your answer in the text area
3. Submit using one of:
   - Click **Submit Answer** button
   - Press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)
4. Wait for LLM evaluation (loading indicator shows)
5. Review your score and feedback
6. Click **Continue** or press `Space` to proceed

**Tips for good answers:**
- Address all aspects of the question
- Use specific terminology when appropriate
- Provide examples if asked
- Be concise but complete

---

## Interpret Evaluation Scores

**Goal:** Understand what your score means.

The LLM returns a score from 0-100% displayed in a circle and progress bar:

| Score Range | Color | Meaning |
|-------------|-------|---------|
| 70-100% | Green | Good understanding |
| 40-69% | Yellow | Partial understanding |
| 0-39% | Red | Needs more study |

The score reflects:
- Accuracy of key concepts
- Coverage of expected points
- Relevance of response

---

## Learn from Key Points Feedback

**Goal:** Identify what you covered and missed.

After evaluation, the Key Points section shows:

- **Covered points** (checkmarks): Concepts you addressed correctly
- **Missed points** (X marks): Important aspects you didn't mention

**Using this feedback:**
1. Note which points you missed
2. Review the model answer to understand the gap
3. Focus future study on missed concepts
4. Re-attempt similar questions to reinforce learning

---

## Study the Model Answer

**Goal:** Compare your response to an ideal answer.

The Model Answer section shows what a complete response would include.

**How to use:**
- Compare structure and coverage
- Note terminology you could have used
- Identify concepts you didn't mention
- Use as study material for future reviews

---

## Understand Evaluation Confidence

**Goal:** Know how reliable the evaluation is.

The Evaluation Confidence percentage indicates how certain the LLM is about its assessment:

| Confidence | Interpretation |
|------------|----------------|
| 90-100% | High confidence - evaluation is reliable |
| 70-89% | Moderate confidence - generally accurate |
| Below 70% | Lower confidence - may need human review |

Low confidence may occur when:
- The question is ambiguous
- Your answer uses unconventional phrasing
- The topic is complex or nuanced

---

## Use Keyboard Shortcuts

**Goal:** Navigate open-response cards efficiently.

| Stage | Shortcut | Action |
|-------|----------|--------|
| Answering | `Ctrl+Enter` / `Cmd+Enter` | Submit answer |
| After evaluation | `Space` | Continue to next card |

These shortcuts allow faster review sessions without reaching for the mouse.

---

## Handle Character Limits

**Goal:** Write effective answers within constraints.

Some questions have character limits. The counter shows:
- Current character count
- Maximum allowed characters
- Color changes to red when approaching/exceeding limit

**Strategies:**
- Focus on key concepts first
- Use concise phrasing
- Prioritize accuracy over length
- Remove filler words if near limit

---

## Configure LLM for Evaluation

**Goal:** Set up the LLM provider for evaluations.

Open-response evaluation requires a configured LLM API:

1. Go to **Settings** page
2. Find **LLM Configuration** section
3. Select provider (OpenAI, Anthropic, or Local)
4. Enter your API key
5. Specify model name
6. Click **Test Connection** to verify
7. Click **Save Settings**

**Supported providers:**
| Provider | Models |
|----------|--------|
| OpenAI | gpt-4, gpt-3.5-turbo |
| Anthropic | claude-3-opus, claude-3-sonnet |
| Local | Ollama-compatible models |

---

## Troubleshoot Evaluation Errors

**Goal:** Resolve issues with LLM evaluation.

### "Evaluation failed" error

**Causes:**
- Invalid or expired API key
- Rate limit exceeded
- Network connection issue
- Provider service outage

**Solutions:**
1. Check API key in Settings
2. Wait a few minutes (rate limits)
3. Check internet connection
4. Try a different provider temporarily

### Evaluation takes too long

**Causes:**
- Slow API response
- Large answer being processed
- Provider congestion

**Solutions:**
1. Wait for completion (usually under 30 seconds)
2. Refresh page if stuck beyond 60 seconds
3. Try with shorter answers
4. Check provider status page

### Unexpected scores

**Causes:**
- Ambiguous question
- Alternative valid interpretations
- LLM limitations

**Solutions:**
1. Check evaluation confidence score
2. Compare with model answer
3. Note if consistently off for certain topics
4. Consider the feedback for learning regardless

---

## Related

- [Customizing Reviews](./customizing-reviews.md) - Session configuration
- [Working with Variants](./working-with-variants.md) - Create open-response cards
- [Handling Errors](./handling-errors.md) - General error recovery
- [Reference: IPC API](../reference/ipc-api.md) - LLM evaluation API details
