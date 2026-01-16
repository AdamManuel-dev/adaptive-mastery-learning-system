# Customizing Review Sessions

Task-oriented guides for adjusting how review sessions work.

---

## Adjust session size

**Goal:** Change the maximum number of cards per session.

1. Navigate to **Settings** page
2. Find **Review Settings** section
3. Change **Cards per Session** value (5-100)
4. Click **Save Settings**

Sessions end when you reach this limit or run out of due cards.

---

## Change new cards per day limit

**Goal:** Control how many new cards are introduced daily.

1. Navigate to **Settings** page
2. Find **Review Settings** section
3. Change **New Cards per Day** value (1-50)
4. Click **Save Settings**

Lower values prevent overwhelm. Higher values accelerate learning.

---

## Focus on a specific dimension

**Goal:** Practice only one type of question (e.g., scenarios).

The system automatically prioritizes your weakest dimensions. To manually focus:

1. Check your **Dashboard** for the current weakest dimension
2. Review cards normally - the algorithm increases weight for weak dimensions
3. Rate honestly - the system detects true weaknesses over time

**Note:** Manual dimension filtering is not available in v1. The adaptive algorithm handles dimension targeting automatically based on your mastery profile.

See [Explanation: Adaptive Selection](../explanation/adaptive-selection.md) for how dimension weighting works.

---

## Skip frustration cards

**Goal:** Stop seeing cards you've failed repeatedly.

The system includes anti-frustration rails that automatically:
- Insert confidence-builder cards after 3 consecutive failures
- Cap same-dimension cards at 4 consecutive
- Maintain 20% practice on strong dimensions

**If you're still frustrated:**

1. Rate honestly - use "Again" only when truly forgotten
2. Consider editing the variant to make it clearer
3. Create easier variants for the same concept

---

## Change difficulty targeting

**Goal:** Get easier or harder cards.

Card selection is based on:
- Due date (spaced repetition schedule)
- Your dimension mastery profile
- Variant difficulty level (1-5)

**To get easier cards:**
- Create more difficulty-1 and difficulty-2 variants
- Let your mastery scores build naturally

**To get harder cards:**
- Create difficulty-4 and difficulty-5 variants
- The system auto-targets gaps in your mastery

---

## Use keyboard shortcuts during review

**Goal:** Speed up your review flow.

| Key | Action |
|-----|--------|
| `Space` | Show answer |
| `1` | Rate "Again" |
| `2` | Rate "Hard" |
| `3` | Rate "Good" |
| `4` | Rate "Easy" |

Shortcuts only work when not typing in an input field.

---

## End a review session early

**Goal:** Stop reviewing before completing all due cards.

1. Click **Exit Review** link in the top-right
2. You return to the Dashboard

Progress is saved. Remaining cards stay due.

---

## Related

- [Managing Mastery](./managing-mastery.md) - Understand your skill profile
- [Reference: Domain Model](../reference/domain-model.md#reviewresult) - How ratings affect scheduling
