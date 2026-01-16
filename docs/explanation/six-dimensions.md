# Six Dimensions Explanation: A Framework for Complete Understanding

**Understanding why the system tests knowledge across multiple cognitive dimensions**

---

## The Illusion of Knowing

Traditional flashcard systems create a dangerous illusion: learners believe they have mastered a concept because they can match a term to its definition. This illusion crumbles when they encounter the concept in a novel context, need to distinguish it from similar ideas, or must apply it to solve a problem.

The fundamental insight driving the Adaptive Mastery Learning System is that **knowing a definition is not the same as understanding a concept**. True mastery requires the ability to work with knowledge in multiple ways.

---

## The Six Dimensions

The system tests every concept across six cognitive dimensions:

### Definition Recall

**What it tests**: Can you produce the definition when given the term?

This is the classic flashcard task. Given "mitosis," you recall "cell division that produces two identical daughter cells." It tests the most basic form of declarative knowledge: the ability to retrieve a stored association.

Definition recall is necessary but insufficient for mastery. Many learners stop here, mistaking successful definition recall for complete understanding.

### Paraphrase Recognition

**What it tests**: Can you recognize equivalent meanings in different words?

This dimension probes whether you understand what the definition means, not just what it says. Given several restatements of a concept, can you identify which ones preserve the meaning?

Paraphrase recognition reveals:
- Rote memorization vs. semantic understanding
- Ability to process information flexibly
- Whether the learner can recognize the concept in others' explanations

A learner who can recall "cell division producing identical daughter cells" but cannot recognize "the process by which a cell replicates its genetic material and divides into two genetically identical copies" has fragile, surface-level knowledge.

### Example Classification

**What it tests**: Can you correctly identify instances and non-instances?

This dimension bridges abstract definition and concrete reality. Given specific cases, can you determine which are examples of the concept?

Example classification reveals:
- Understanding of concept boundaries
- Ability to apply criteria to specific cases
- Recognition of the concept "in the wild"

A learner might perfectly recite the definition of mitosis but fail to identify whether a particular cell image shows mitosis, meiosis, or neither.

### Scenario Application

**What it tests**: Can you apply the concept to solve novel problems?

This is the dimension most neglected by traditional flashcard systems. Given a situation you have never seen before, can you recognize where a concept applies and use it appropriately?

Scenario application reveals:
- Transfer of learning to new contexts
- Integration with other knowledge
- Practical utility of the learned concept

The gap between definition recall and scenario application is often the largest and most consequential. A medical student might define "compartment syndrome" perfectly but fail to recognize it in a patient presenting with atypical symptoms.

### Discrimination

**What it tests**: Can you distinguish this concept from similar or related concepts?

Many concepts exist in families of related ideas. Mitosis vs. meiosis. Simile vs. metaphor. Monetary policy vs. fiscal policy. True understanding requires knowing not just what a concept is, but what it is not.

Discrimination reveals:
- Fine-grained conceptual boundaries
- Resistance to confusion with near-neighbors
- Sophisticated understanding of a concept's unique features

Learners who cannot discriminate often experience interference: similar concepts blur together, and recalling one pulls up features of the other.

### Cloze Fill

**What it tests**: Can you complete statements about the concept?

Cloze (fill-in-the-blank) tests require generating specific terms in context. Unlike definition recall, which produces a complete definition, cloze tests require integrating knowledge with sentence structure.

Cloze fill reveals:
- Active production ability
- Understanding of concept relationships
- Grammatical/semantic integration of knowledge

Cloze tests often feel easier than free recall but can reveal gaps: "Mitosis converts one ___ into two ___" requires knowing not just what mitosis is but its inputs and outputs.

---

## Connection to Bloom's Taxonomy

The six dimensions map roughly to levels in Bloom's Taxonomy of cognitive skills:

| Bloom's Level | Corresponding Dimensions |
|---------------|-------------------------|
| Remember | Definition Recall, Cloze Fill |
| Understand | Paraphrase Recognition |
| Apply | Example Classification, Scenario Application |
| Analyze | Discrimination |
| Evaluate | (Future extension) |
| Create | (Future extension) |

This mapping is not exact because educational taxonomies are frameworks, not strict classifications. The key insight is that the six dimensions span a range of cognitive complexity.

Traditional flashcards operate almost exclusively at the Remember level. The Adaptive Mastery Learning System extends into Understand, Apply, and Analyze.

---

## Why These Six?

### Practical Constraints

We could define more dimensions (analogy construction, exception identification, hierarchical classification, etc.), but more is not always better:

1. **Card generation complexity**: Each dimension requires generating meaningful questions
2. **Cognitive load**: Tracking too many dimensions overwhelms both learners and UI
3. **Diminishing returns**: The first few dimensions capture most of the value

Six dimensions emerged from balancing comprehensiveness with practicality.

### Coverage Analysis

The six dimensions cover several important cognitive operations:

| Operation | Dimension(s) |
|-----------|-------------|
| Retrieval from memory | Definition Recall |
| Semantic processing | Paraphrase Recognition |
| Category judgment | Example Classification |
| Transfer | Scenario Application |
| Comparative analysis | Discrimination |
| Production in context | Cloze Fill |

This provides good coverage of how learners interact with conceptual knowledge.

### Gap Analysis

The dimensions specifically target the most common learning failures:

- **Definition/Application gap**: The disconnect between knowing what something is and being able to use it
- **Recognition/Production gap**: The difference between recognizing correct answers and generating them
- **Isolation/Discrimination gap**: Understanding a concept in isolation but confusing it with neighbors

---

## The Recognition vs. Application Gap

This gap deserves special attention because it represents the most common and consequential failure mode for flashcard learners.

### Why the Gap Exists

Recognition and production involve different memory processes:

- **Recognition** requires only familiarity detection: "This matches something I know"
- **Production** requires reconstruction: "I must generate the correct information"

Recognition is easier because the correct answer is present; you just need to identify it. Production requires you to construct the answer from scratch.

Traditional flashcards mostly train recognition. Even when they seem to require production (typing the answer), learners often use partial cues and pattern matching rather than true reconstruction.

### How Dimensions Address the Gap

The scenario application dimension specifically targets this gap by:

- Presenting novel situations not seen before
- Requiring identification of relevant concepts (not just recall)
- Demanding application of knowledge to produce answers

A learner who scores well on definition recall but poorly on scenario application has a quantified recognition/application gap that the system can then target.

---

## Research Backing

### Varied Practice

Cognitive psychology research consistently shows that varied practice produces better retention and transfer than constant practice. The six dimensions provide natural variation in how knowledge is tested.

Key studies:

- Kornell & Bjork (2008) on interleaving's benefits for category learning
- Rohrer & Taylor (2007) on shuffled practice improving math performance
- Kang & Pashler (2012) on transfer benefits from varied examples

### Desirable Difficulties

Robert Bjork's concept of "desirable difficulties" supports testing across multiple dimensions. Challenges that feel harder during learning often produce better long-term retention.

The harder dimensions (scenario application, discrimination) create desirable difficulties that strengthen underlying knowledge structures.

### Transfer-Appropriate Processing

Morris, Bransford, and Franks (1977) demonstrated that memory performance depends on the match between encoding and retrieval conditions. Testing across multiple dimensions ensures that knowledge is encoded in multiple ways, supporting retrieval in varied contexts.

---

## Target Times by Dimension

Each dimension has a different cognitive complexity, reflected in target response times:

| Dimension | Base Target | Rationale |
|-----------|-------------|-----------|
| Definition Recall | 5 seconds | Direct memory retrieval |
| Cloze Fill | 6 seconds | Retrieval plus integration |
| Paraphrase Recognition | 8 seconds | Semantic comparison |
| Example Classification | 10 seconds | Category judgment |
| Discrimination | 12 seconds | Comparative analysis |
| Scenario Application | 15 seconds | Novel problem analysis |

These targets are multiplied by difficulty level, so a Level 5 scenario application has a 30-second target (15 * 2.0).

The targets reflect both cognitive complexity and typical question length. Scenario questions tend to have longer stems, requiring more reading time.

---

## Dimension Interactions

The dimensions are not independent. Performance in one dimension often correlates with performance in others, but not always:

### Positive Correlations

- **Definition Recall and Cloze Fill**: Both involve direct memory retrieval
- **Example Classification and Scenario Application**: Both require applying criteria to specific cases
- **Paraphrase Recognition and Discrimination**: Both involve semantic comparison

### Surprising Disconnects

- **High Definition, Low Application**: The classic flashcard trap
- **High Example, Low Discrimination**: Can recognize instances but confuses with neighbors
- **High Speed, Low Accuracy (any dimension)**: Indicates guessing or pattern matching

These patterns help identify specific learning needs.

---

## Dimension-Specific Learning Interventions

When weakness is detected in a dimension, the system can apply targeted interventions:

### Definition Recall Weakness

- Increase basic exposure
- Simplify related concepts
- Build foundation before advancing

### Paraphrase Recognition Weakness

- Generate multiple phrasings
- Practice synonym identification
- Focus on meaning extraction

### Example Classification Weakness

- Provide more boundary cases
- Contrast clear examples with edge cases
- Highlight critical features

### Scenario Application Weakness

- Start with simpler scenarios
- Scaffold with hints about relevant concepts
- Build transfer skills gradually

### Discrimination Weakness

- Direct comparison questions
- Feature analysis tasks
- Contrast similar concepts side-by-side

### Cloze Fill Weakness

- Vary blank positions
- Practice key term generation
- Context completion exercises

---

## Future Dimension Possibilities

The system is designed to accommodate additional dimensions:

### Analogy Construction

"X is to Y as ___ is to ___"

Tests relational understanding and transfer to new domains.

### Hierarchical Classification

"Where does X fit in the taxonomy of Y?"

Tests understanding of category structures.

### Temporal/Causal Reasoning

"What happens before/after X?"

Tests understanding of processes and sequences.

### Metacognitive Calibration

"How confident are you?" followed by actual test

Tests awareness of own knowledge state.

These extensions would require careful integration with the existing framework.

---

## Summary

The six cognitive dimensions represent a significant advance over traditional single-dimension flashcard systems. By testing knowledge in multiple ways:

1. **Illusions are exposed**: Learners cannot mistake definition recall for complete understanding
2. **Gaps are quantified**: Specific weaknesses can be identified and targeted
3. **Transfer is improved**: Varied testing creates more robust, transferable knowledge
4. **Learning is efficient**: Practice is directed where it matters most

The framework is grounded in cognitive psychology research on varied practice, desirable difficulties, and transfer-appropriate processing. While not exhaustive, the six dimensions capture the most important ways learners need to work with conceptual knowledge.

---

*See also: [Adaptive Selection](./adaptive-selection.md) for how dimension mastery influences card selection.*
