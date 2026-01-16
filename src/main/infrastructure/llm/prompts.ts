/**
 * @fileoverview Prompt templates for LLM-based flashcard variant generation
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Dimension-specific prompt templates, difficulty scaling, JSON output schema
 * Main APIs: buildPrompt, DIMENSION_PROMPTS, DIFFICULTY_MODIFIERS
 * Constraints: Output must be valid JSON array of variants
 * Patterns: Template composition with concept data and difficulty modifiers
 */

import type { ConceptInput, DifficultyLevel } from './types';
import type { Dimension } from '../../../shared/types/ipc';

/**
 * JSON schema for variant output validation
 */
export const VARIANT_OUTPUT_SCHEMA = `{
  "front": "string - the question or prompt",
  "back": "string - the correct answer or explanation",
  "hints": ["string - progressive hints, from subtle to explicit"]
}`;

/**
 * Difficulty modifiers that adjust complexity expectations
 */
export const DIFFICULTY_MODIFIERS: Record<DifficultyLevel, string> = {
  1: `Difficulty 1 (Beginner):
- Use simple, direct language
- Focus on the most fundamental aspects
- Provide clear, unambiguous answers
- Hints should be very helpful`,

  2: `Difficulty 2 (Elementary):
- Use straightforward language with some domain terms
- Include basic application of the concept
- Answers should be clear but may require some thought
- Hints should guide toward the answer`,

  3: `Difficulty 3 (Intermediate):
- Use standard domain terminology
- Require understanding of relationships and context
- May involve multiple aspects of the concept
- Hints should nudge without giving away the answer`,

  4: `Difficulty 4 (Advanced):
- Use precise technical language
- Require deeper analysis or synthesis
- May involve edge cases or nuanced understanding
- Hints should be subtle, requiring interpretation`,

  5: `Difficulty 5 (Expert):
- Assume mastery of fundamentals
- Require integration with related concepts
- May involve complex scenarios or rare cases
- Hints should be minimal and require expertise to use`,
};

/**
 * Prompt templates for each cognitive dimension
 */
export const DIMENSION_PROMPTS: Record<Dimension, string> = {
  definition: `Generate flashcard variants that test DEFINITION RECALL.

The learner should be able to recall or recognize the definition when shown the term.

Card format:
- FRONT: Show the term/concept name, ask for the definition
- BACK: The complete, accurate definition
- HINTS: Partial definition elements, key words, or memory cues

Example patterns:
- "Define [term]"
- "What is [term]?"
- "Explain what [term] means"`,

  paraphrase: `Generate flashcard variants that test PARAPHRASE RECOGNITION.

The learner should recognize correct restatements of the definition.

Card format:
- FRONT: Present a paraphrased statement, ask if it correctly describes the concept
- BACK: Yes/No with explanation of why it is or isn't correct
- HINTS: Key distinctions or elements to check

Example patterns:
- "Is this an accurate description of [term]: '[paraphrase]'?"
- "Which statement best captures the meaning of [term]?"
- "True or False: [paraphrase] describes [term]"`,

  example: `Generate flashcard variants that test EXAMPLE CLASSIFICATION.

The learner should correctly identify examples vs non-examples of the concept.

Card format:
- FRONT: Present a specific instance, ask if it's an example of the concept
- BACK: Yes/No with explanation of why it is or isn't an example
- HINTS: Key criteria to check, distinguishing features

Example patterns:
- "Is this an example of [term]: [instance]?"
- "Classify: [instance] - Example or Non-example?"
- "Which of these is an example of [term]?"`,

  scenario: `Generate flashcard variants that test SCENARIO APPLICATION.

The learner should apply the concept to novel, realistic situations.

Card format:
- FRONT: Present a scenario, ask how the concept applies or what should be done
- BACK: Explanation of how the concept applies in this situation
- HINTS: Relevant aspects of the concept, key considerations

Example patterns:
- "In this situation: [scenario]. How does [term] apply?"
- "Given [scenario], what would [term] suggest?"
- "Apply [term] to solve: [problem]"`,

  discrimination: `Generate flashcard variants that test DISCRIMINATION.

The learner should distinguish this concept from similar or easily confused concepts.

Card format:
- FRONT: Present two related concepts, ask what distinguishes them
- BACK: Clear explanation of the key differences
- HINTS: Dimensions of difference, specific distinguishing features

Example patterns:
- "How does [term] differ from [similar term]?"
- "What distinguishes [term] from [related concept]?"
- "Compare and contrast: [term] vs [similar term]"`,

  cloze: `Generate flashcard variants that test CLOZE FILL (fill-in-the-blank).

The learner should complete partial definitions or statements about the concept.

Card format:
- FRONT: Definition or key statement with a critical word/phrase blanked out
- BACK: The missing word/phrase with context
- HINTS: First letter, word length, category of answer

Example patterns:
- "[Term] is defined as _____ that..."
- "The key characteristic of [term] is _____"
- "Unlike [similar], [term] always involves _____"`,
};

/**
 * System prompt establishing the assistant's role and output format
 */
export const SYSTEM_PROMPT = `You are an expert educational content creator specializing in adaptive learning flashcards.

Your task is to generate high-quality flashcard variants that test specific cognitive dimensions of concept understanding.

CRITICAL REQUIREMENTS:
1. Output ONLY valid JSON array - no markdown, no explanation, no prefix/suffix
2. Each variant must have: "front", "back", and "hints" (array of 1-3 strings)
3. Content must be factually accurate based on the provided concept data
4. Difficulty must match the specified level
5. Variants should be diverse - don't repeat the same question pattern

OUTPUT FORMAT:
[
  ${VARIANT_OUTPUT_SCHEMA},
  ...
]`;

/**
 * Builds a complete prompt for variant generation
 *
 * @param concept - The concept to generate variants for
 * @param dimension - The cognitive dimension to target
 * @param difficulty - The difficulty level (1-5)
 * @param count - Number of variants to generate
 * @returns The complete user prompt string
 */
export function buildPrompt(
  concept: ConceptInput,
  dimension: Dimension,
  difficulty: DifficultyLevel,
  count: number
): string {
  const factsSection =
    concept.facts.length > 0
      ? `\nKEY FACTS:\n${concept.facts.map((f, i) => `${i + 1}. ${f}`).join('\n')}`
      : '';

  return `CONCEPT TO LEARN:
Name: ${concept.name}
Definition: ${concept.definition}${factsSection}

GENERATION TASK:
${DIMENSION_PROMPTS[dimension]}

${DIFFICULTY_MODIFIERS[difficulty]}

Generate exactly ${count} unique flashcard variant(s).

Remember: Output ONLY the JSON array, nothing else.`;
}

/**
 * Extracts JSON array from LLM response, handling common formatting issues
 *
 * @param response - Raw LLM response text
 * @returns Parsed JSON array or null if extraction fails
 */
export function extractJsonArray(response: string): unknown[] | null {
  const trimmed = response.trim();

  // Try direct parse first
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Continue to fallback strategies
  }

  // Try to find JSON array in the response
  const arrayMatch = trimmed.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Extraction failed
    }
  }

  // Try removing markdown code blocks
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Extraction failed
    }
  }

  return null;
}
