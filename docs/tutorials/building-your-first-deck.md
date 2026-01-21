# Building Your First Study Deck

**Time to complete:** 45 minutes
**Difficulty:** Beginner
**Prerequisites:** Completed [Getting Started](./getting-started.md) tutorial

By the end of this tutorial, you will have:
- Created a coherent study deck with 5+ related concepts
- Added multiple card variants across different dimensions
- Completed a focused review session
- Observed how the adaptive system targets your weaknesses

---

## What You'll Build

A study deck on **Cell Biology Basics** containing:
- 5 related concepts
- Multiple question types per concept
- A complete review cycle showing adaptive selection

This tutorial demonstrates how to organize concepts for effective learning.

---

## Step 1: Plan Your Deck

Before creating concepts, plan the topics you want to learn.

**Our Cell Biology deck will include:**

| Concept | Definition |
|---------|------------|
| Mitosis | Cell division producing two identical daughter cells |
| Meiosis | Cell division producing four genetically different gametes |
| DNA | Molecule carrying genetic instructions for life |
| Chromosome | Thread-like structure of DNA and proteins |
| Gene | Unit of heredity on a chromosome |

**Why these concepts?** They are related and can be tested for discrimination (distinguishing similar concepts).

---

## Step 2: Create the First Concept

Navigate to **Concepts** page and click **Add Concept**.

Enter:
- **Name:** `Mitosis`
- **Definition:** `Cell division that produces two genetically identical daughter cells, used for growth and repair in multicellular organisms`

Click **Create**.

**Verification checkpoint:** You see the Mitosis card in your concept list.

---

## Step 3: Create Related Concepts

Create 4 more concepts using the same process:

### Concept 2: Meiosis

- **Name:** `Meiosis`
- **Definition:** `Cell division that produces four genetically different gametes (sex cells), reducing chromosome number by half for sexual reproduction`

### Concept 3: DNA

- **Name:** `DNA`
- **Definition:** `Deoxyribonucleic acid - the molecule that carries genetic instructions for development, functioning, growth, and reproduction of all living organisms`

### Concept 4: Chromosome

- **Name:** `Chromosome`
- **Definition:** `A thread-like structure made of DNA and proteins found in the nucleus, carrying genetic information in the form of genes`

### Concept 5: Gene

- **Name:** `Gene`
- **Definition:** `A segment of DNA on a chromosome that codes for a specific protein or trait, serving as the basic unit of heredity`

**Verification checkpoint:** Your Concepts page shows 5 concept cards.

---

## Step 4: Verify Card Variants Were Created

When you create a concept, the system automatically generates a definition card variant.

Click on any concept card to view its details.

**Verification checkpoint:** Each concept has at least one variant (definition type).

---

## Step 5: Add a Discrimination Variant

Discrimination cards test your ability to distinguish similar concepts. Let's add one for Mitosis vs Meiosis.

**Via the developer console** (press `Ctrl+Shift+I` or `Cmd+Option+I`):

```javascript
// First, get the concept ID for Mitosis
const concepts = await window.api.concepts.getAll()
const mitosis = concepts.find(c => c.name === 'Mitosis')

// Create a discrimination variant
await window.api.variants.create({
  conceptId: mitosis.id,
  dimension: 'discrimination',
  difficulty: 3,
  front: 'What is the key difference between mitosis and meiosis?',
  back: 'Mitosis produces 2 identical diploid cells for growth/repair. Meiosis produces 4 different haploid gametes for reproduction.'
})
```

**Verification checkpoint:** Console shows the created variant object.

---

## Step 6: Add a Scenario Variant

Scenario cards test application to real situations.

```javascript
// Create a scenario variant for DNA
const dna = concepts.find(c => c.name === 'DNA')

await window.api.variants.create({
  conceptId: dna.id,
  dimension: 'scenario',
  difficulty: 4,
  front: 'A scientist finds that two organisms have 98% identical genetic sequences. What molecule did they compare, and what does this suggest about the organisms?',
  back: 'They compared DNA sequences. The high similarity suggests the organisms are closely related evolutionarily and share a recent common ancestor.'
})
```

---

## Step 7: Add an Example Variant

Example cards test instance classification.

```javascript
// Create an example variant for Chromosome
const chromosome = concepts.find(c => c.name === 'Chromosome')

await window.api.variants.create({
  conceptId: chromosome.id,
  dimension: 'example',
  difficulty: 2,
  front: 'Is the X chromosome an example of a chromosome? Why or why not?',
  back: 'Yes. The X chromosome is a sex chromosome - a specific type of chromosome that determines biological sex. It contains DNA and genes like all chromosomes.'
})
```

---

## Step 8: Add a Cloze Variant

Cloze cards test contextual understanding.

```javascript
// Create a cloze variant for Gene
const gene = concepts.find(c => c.name === 'Gene')

await window.api.variants.create({
  conceptId: gene.id,
  dimension: 'cloze',
  difficulty: 2,
  front: 'A _____ is a segment of DNA that codes for a specific _____, and is the basic unit of _____.',
  back: 'A GENE is a segment of DNA that codes for a specific PROTEIN, and is the basic unit of HEREDITY.'
})
```

---

## Step 9: Start Your Review Session

Navigate to **Dashboard** and click **Start Review Session**.

You should now have multiple cards due from your new deck.

**What to observe:**
- Cards from different concepts appear
- Different question types test the same material differently
- The system tracks your performance per dimension

---

## Step 10: Complete the Review Cycle

Answer all due cards, rating honestly:
- **Again** if you forgot completely
- **Hard** if you struggled but recalled
- **Good** if you knew it with normal effort
- **Easy** if it was effortless

**Tip:** Don't rate everything "Easy" - honest ratings help the adaptive algorithm work.

---

## Step 11: Observe the Adaptive Selection

After completing several cards, notice how the system adapts:

1. If you struggled with discrimination cards, more will appear
2. If definitions were easy, fewer basic cards appear
3. The "Selection Reason" shows why each card was chosen

**Verification checkpoint:** Navigate to Dashboard and observe:
- Mastery bars for dimensions you practiced
- Different mastery levels across dimensions

---

## Step 12: Review Your Mastery Profile

Check the **Analytics** page to see your performance:

- **Mastery Radar Chart**: Shows your skill across all 6 dimensions
- **Weakness Heatmap**: Highlights areas needing attention

**Verification checkpoint:** The radar chart shows values for dimensions you practiced.

---

## Congratulations!

You have successfully built and studied your first deck:

1. Created 5 related concepts
2. Added variants across 5 different dimensions
3. Completed an adaptive review session
4. Observed how the system targets weaknesses

**What you learned:**
- How to organize related concepts into a coherent deck
- How different dimension variants test the same material
- How the adaptive algorithm adjusts to your performance
- How to interpret your mastery profile

---

## Next Steps

| Task | Description |
|------|-------------|
| Add more concepts | Expand your Cell Biology deck |
| Create paraphrase variants | Test recognition with different wording |
| Use LLM generation | Auto-generate variants (requires API key) |
| Track progress over time | Review Analytics after multiple sessions |

---

## Deck Building Best Practices

### 1. Group Related Concepts

Concepts that relate to each other enable:
- Discrimination cards (compare/contrast)
- Deeper understanding through connections
- More effective review sessions

### 2. Vary Question Types

For each concept, aim for variants in multiple dimensions:
- **Definition**: Basic recall
- **Paraphrase**: Recognition flexibility
- **Example**: Instance identification
- **Scenario**: Real-world application
- **Discrimination**: Distinguishing from similar concepts
- **Cloze**: Contextual completion

### 3. Calibrate Difficulty

Use the 1-5 difficulty scale appropriately:
- **1-2**: Foundational knowledge
- **3**: Standard complexity
- **4-5**: Advanced application or synthesis

### 4. Start Small, Expand Gradually

- Begin with 5-10 concepts
- Add 2-3 variants per concept
- Expand based on mastery progress

---

## Troubleshooting

### No new cards appearing

**Problem:** Dashboard shows "0 Cards Due" after creating concepts.

**Solution:** New concepts generate definition cards immediately. If cards don't appear:
1. Refresh the page
2. Check that concepts were saved (visible in Concepts page)
3. Ensure you haven't already reviewed and rated them "Easy"

### Variants not creating

**Problem:** Console commands fail with errors.

**Solution:**
1. Ensure concept exists before creating variants
2. Check that `conceptId` matches an existing concept
3. Verify dimension is one of: `definition`, `paraphrase`, `example`, `scenario`, `discrimination`, `cloze`

### Mastery not updating

**Problem:** Dashboard mastery bars don't change after reviews.

**Solution:**
1. Ensure you submitted ratings (not just revealed answers)
2. Refresh the Dashboard page
3. Check multiple dimensions if you only practiced one type

---

## Quick Reference

### Dimension Types

| Dimension | Purpose | When to Use |
|-----------|---------|-------------|
| definition | Term recall | Every concept (auto-created) |
| paraphrase | Recognition | When wording flexibility matters |
| example | Classification | When examples clarify meaning |
| scenario | Application | For practical understanding |
| discrimination | Distinction | For similar/confusing concepts |
| cloze | Context | For relationships and connections |

### Console Commands

```javascript
// Get all concepts
const concepts = await window.api.concepts.getAll()

// Find a specific concept
const target = concepts.find(c => c.name === 'ConceptName')

// Create a variant
await window.api.variants.create({
  conceptId: target.id,
  dimension: 'dimension_type',
  difficulty: 3,
  front: 'Question text',
  back: 'Answer text'
})

// List variants for a concept
const variants = await window.api.variants.getByConceptId(target.id)
```

---

*See also: [Working with Variants](../how-to/working-with-variants.md) for detailed variant management.*
