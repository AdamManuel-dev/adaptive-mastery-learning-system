# Working with Variants

Task-oriented guides for creating and managing card variants.

---

## Manually create a variant for a dimension

**Goal:** Add a new question card testing a specific cognitive dimension.

> **Note:** The variant editor UI is in development. Use the API directly for now.

**Via API (developer console or script):**

```javascript
await window.api.variants.create({
  conceptId: 'your-concept-id',
  dimension: 'scenario',      // One of: definition, paraphrase, example, scenario, discrimination, cloze
  difficulty: 3,              // 1 (easiest) to 5 (hardest)
  front: 'Given this cell showing chromosome alignment, what process is occurring?',
  back: 'Mitosis - specifically the metaphase stage where chromosomes align at the cell equator.'
})
```

**Dimension types:**
| Dimension | Purpose | Example prompt |
|-----------|---------|----------------|
| `definition` | Term recall | "What is X?" |
| `paraphrase` | Recognition | "Which means the same as X?" |
| `example` | Classification | "Is this an example of X?" |
| `scenario` | Application | "Given situation Y, what concept applies?" |
| `discrimination` | Distinction | "What differs between X and Z?" |
| `cloze` | Fill-in-blank | "X converts ___ into ___" |

---

## Generate variants with LLM

**Goal:** Auto-generate question cards using AI.

1. Configure LLM in **Settings** > **LLM Configuration**:
   - Select provider (OpenAI, Anthropic, or Local)
   - Enter API key
   - Specify model name
   - Click **Test Connection**
2. Click **Save Settings**

> **Note:** LLM generation is not yet implemented in the UI. The infrastructure is prepared for Phase 4 development.

**Planned workflow:**
1. Select a concept
2. Click "Generate Variants"
3. Choose target dimensions
4. Review generated cards
5. Accept, edit, or reject each

---

## Edit variant difficulty

**Goal:** Adjust how hard a variant is rated.

**Via API:**

```javascript
await window.api.variants.update({
  id: 'variant-id',
  difficulty: 4  // New difficulty level (1-5)
})
```

Difficulty affects:
- Card selection weight
- Expected response time for speed scoring
- Anti-frustration calculations

---

## Edit variant content

**Goal:** Fix or improve question/answer text.

**Via API:**

```javascript
await window.api.variants.update({
  id: 'variant-id',
  front: 'Updated question text',
  back: 'Updated answer text'
})
```

Edit variants when:
- The question is ambiguous
- The answer is incomplete
- You want to add clarity after confusion

---

## Preview variant before saving

**Goal:** Check how a card will appear before committing.

> **Note:** Preview functionality requires the variant editor UI (in development).

**Current approach:**
1. Create the variant
2. Start a review session
3. The card may appear if due
4. Edit if needed after seeing it in context

---

## Delete a variant

**Goal:** Remove a question card you no longer want.

**Via API:**

```javascript
await window.api.variants.delete('variant-id')
```

**Warning:** Deleting a variant removes its review history. The concept remains.

---

## List all variants for a concept

**Goal:** See what question cards exist for a concept.

**Via API:**

```javascript
const variants = await window.api.variants.getByConceptId('concept-id')
console.table(variants)
```

Returns array with: `id`, `dimension`, `difficulty`, `front`, `back`, timestamps.

---

## Related

- [Creating Concepts](./creating-concepts.md) - Add concepts to attach variants to
- [Reference: Domain Model](../reference/domain-model.md#dimension) - Full dimension specifications
