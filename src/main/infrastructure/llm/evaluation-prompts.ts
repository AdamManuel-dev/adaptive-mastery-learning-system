/**
 * @fileoverview Prompt templates for LLM-based response evaluation
 * @lastmodified 2026-01-20T00:00:00Z
 *
 * Features: Evaluation prompt construction, rubric integration, dimension context
 * Main APIs: buildEvaluationPrompt, EVALUATION_SYSTEM_PROMPT
 * Constraints: Prompts must produce valid JSON output
 * Patterns: Template composition, dimension-specific context
 */

import type { Dimension, EvaluationRubric } from '../../../shared/types/ipc';

/**
 * System prompt for the LLM evaluator
 *
 * Establishes the evaluator's role and guidelines for consistent,
 * fair evaluation of student responses.
 */
export const EVALUATION_SYSTEM_PROMPT = `You are an expert educational evaluator assessing student responses to learning questions.

Your role is to:
1. Compare the student's response to the model answer
2. Identify which key concepts were correctly addressed
3. Provide constructive, encouraging feedback
4. Assign a fair score considering partial understanding

Guidelines:
- Be generous with semantically equivalent answers (different words, same meaning)
- Give partial credit for incomplete but correct information
- Penalize factual errors more than missing information
- Consider the cognitive dimension being tested
- Provide actionable feedback for improvement

You must respond with valid JSON only.`;

/**
 * Context descriptions for each cognitive dimension
 */
const DIMENSION_CONTEXTS: Record<Dimension, string> = {
  definition: 'Testing recall of the concept definition - focus on accuracy of key terms and meaning',
  paraphrase: 'Testing ability to recognize rephrased versions - accept equivalent wording',
  example: 'Testing ability to classify examples correctly - check for accurate categorization',
  scenario: 'Testing application to real-world situations - evaluate practical understanding',
  discrimination: 'Testing ability to distinguish from similar concepts - check for precise differentiation',
  cloze: 'Testing gap-filling ability - verify the filled content is contextually correct',
};

/**
 * Builds the evaluation prompt for the LLM
 *
 * @param question - The question that was asked
 * @param modelAnswer - The reference/model answer
 * @param userResponse - The user's response to evaluate
 * @param conceptName - Name of the concept being tested
 * @param dimension - The cognitive dimension being tested
 * @param rubric - Optional evaluation rubric with key points
 * @returns The complete evaluation prompt
 */
export function buildEvaluationPrompt(
  question: string,
  modelAnswer: string,
  userResponse: string,
  conceptName: string,
  dimension: Dimension,
  rubric?: EvaluationRubric
): string {
  const dimensionContext = DIMENSION_CONTEXTS[dimension];

  let rubricSection = '';
  if (rubric) {
    rubricSection = `
## Evaluation Rubric

Key points that should be addressed:
${rubric.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}
${
  rubric.acceptableVariations && rubric.acceptableVariations.length > 0
    ? `
Acceptable alternative phrasings:
${rubric.acceptableVariations.map((v) => `- ${v}`).join('\n')}`
    : ''
}
${
  rubric.partialCreditCriteria
    ? `
Partial credit guidance:
${rubric.partialCreditCriteria}`
    : ''
}
`;
  }

  return `## Evaluation Task

**Concept:** ${conceptName}
**Dimension:** ${dimension} (${dimensionContext})

**Question:**
${question}

**Model Answer:**
${modelAnswer}

**Student Response:**
${userResponse}
${rubricSection}
## Instructions

Evaluate the student's response and return JSON:

{
  "score": <number 0.0-1.0>,
  "feedback": "<constructive feedback string>",
  "keyPointsCovered": ["list", "of", "covered", "points"],
  "keyPointsMissed": ["list", "of", "missed", "points"],
  "confidence": <number 0.0-1.0 how confident you are>,
  "demonstratesUnderstanding": <boolean>
}

Scoring guide:
- 0.0-0.2: Completely incorrect or irrelevant
- 0.2-0.4: Major misconceptions with some relevant content
- 0.4-0.6: Partially correct, missing key elements
- 0.6-0.8: Mostly correct, minor gaps or imprecision
- 0.8-1.0: Excellent, demonstrates strong understanding`;
}

/**
 * Prompt for generating open response questions
 *
 * Used by the LLM generator to create open-ended questions
 * that require explanation rather than just recall.
 */
export const OPEN_RESPONSE_GENERATION_PROMPT = `
Generate an open-ended question to test deep understanding of the concept.

Requirements:
- Question should require explanation, not just recall
- Student must demonstrate understanding, not memorization
- Question should have a clear model answer
- Identify 3-5 key points that should be covered in a good answer

Return JSON:
{
  "front": "open-ended question requiring explanation",
  "back": "comprehensive model answer (2-4 sentences)",
  "rubric": {
    "keyPoints": [
      "first key concept that must be addressed",
      "second key concept",
      "third key concept"
    ],
    "partialCreditCriteria": "Give partial credit if student mentions X without Y..."
  },
  "maxLength": 500
}

The question should:
- Start with "Explain...", "Describe...", "Why...", or "How..."
- Require synthesis of knowledge, not just facts
- Have measurable criteria for evaluation
`;
