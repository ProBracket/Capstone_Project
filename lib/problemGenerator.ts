/** Writes new practice problems for Bud's chat with the AI.
 *
 * SERVER ONLY: this file uses the OpenAI key, so it must only be imported by
 * server code (app/api/bud/problems/route.ts), never by a page.
 *
 * How one problem is made:
 *   1. Pick a topic for the child's grade from the curriculum
 *      (LESSON_FRAMEWORK in lib/learning_framework.ts, the same list the
 *      lessons use).
 *   2. Ask the AI to write ONE problem in exactly the Problem shape from
 *      lib/tutor.ts: question, accepted answers, 3 hints, explanation.
 *   3. Check it (Block C). Any failed check means the problem is thrown away.
 *   4. Ask the AI to solve its own question, separately. If that answer
 *      doesn't match the answer it wrote, the problem is thrown away, because
 *      one of the two is probably wrong.
 *
 * If a problem is thrown away, the caller uses a backup problem instead
 * (PRACTICE_PROBLEMS in lib/tutor.ts), so the chat always works.
 *
 * Privacy: the AI only receives a subject, a grade and a topic. No names,
 * no ids, nothing about the child.
 */

import OpenAI from "openai";
import { LESSON_FRAMEWORK } from "@/lib/learning_framework";
import { isMessageAllowed } from "@/lib/moderation";
import { isCorrect, isValidProblem, type Problem } from "@/lib/tutor";

// ─────────────────────────────────────────────────────────────
// BLOCK A: Settings
// ─────────────────────────────────────────────────────────────

// Same model as the rest of the app.
const MODEL = "gpt-4o-mini";

// The curriculum only covers Grades 4 to 9, so other levels are moved to
// the nearest covered grade (e.g. Grade 3 → 4, Grade 11 → 9).
const LOWEST_GRADE = 4;
const HIGHEST_GRADE = 9;

// Used when the child's level is unknown (no calibration yet).
const DEFAULT_GRADE = 5;

// The shape of one curriculum topic in LESSON_FRAMEWORK.
type Topic = {
  topic: string;
  outcomes: string[];
  keywords: string[];
};

// Extra guidance per subject, added to the AI's instructions. Literature
// needs the most: questions like "what is the theme?" usually have the answer
// word in the passage, or have more than one fair answer, so they fail the
// checks. These question types have one clear, short answer instead.
const SUBJECT_TIPS: Record<Problem["subject"], string> = {
  math: "- Word problems and number patterns are good, as long as the answer is one whole number.\n",
  science:
    "- Ask about a science fact, process, part or vocabulary word that has one clear name.\n",
  // Replaced by a randomly chosen type from LITERATURE_TYPES (see literatureTip).
  literature: "",
};

// Literature question types with one clear, short answer. One is picked at
// random each time, so the child doesn't get the same kind of question
// every conversation (the AI picks "simile" almost every time on its own).
const LITERATURE_TYPES = [
  "Give a sentence that uses a metaphor, personification, alliteration, hyperbole or onomatopoeia (NOT a simile), and ask which literary device it uses.",
  "Give a short sentence and ask for its point of view (first person or third person).",
  "Give a sentence with one word in quotes and ask for a synonym of that word. List several accepted synonyms.",
  "Give a sentence with one word in quotes and ask for an antonym of that word. List several accepted antonyms.",
  "Give a sentence with one word in quotes and ask for its part of speech (noun, verb, adjective or adverb).",
  "Give the definition of a literary or grammar term (for example setting, plot, conflict, narrator, prefix, suffix) and ask for the term.",
];

/** The extra guidance for literature: one random question type. */
function literatureTip(): string {
  const type = LITERATURE_TYPES[Math.floor(Math.random() * LITERATURE_TYPES.length)];
  return `- Question type: ${type}\n`;
}

// The JSON shape the AI must reply in ("Structured Outputs"). OpenAI
// guarantees the reply follows this shape, but NOT that the content is
// sensible, so Block C still checks everything.
const PROBLEM_SCHEMA = {
  type: "object",
  properties: {
    question: { type: "string" },
    answers: { type: "array", items: { type: "string" } },
    hints: { type: "array", items: { type: "string" } },
    explanation: { type: "string" },
  },
  required: ["question", "answers", "hints", "explanation"],
  additionalProperties: false,
};

// ─────────────────────────────────────────────────────────────
// BLOCK B: Choosing a topic
// ─────────────────────────────────────────────────────────────

/** The curriculum grade to use for a child's level (0–12, or null).
 * Example: null → 5, 3 → 4, 7 → 7, 11 → 9
 */
export function toCurriculumGrade(level: number | null): number {
  if (level === null) {
    return DEFAULT_GRADE;
  }
  return Math.min(Math.max(level, LOWEST_GRADE), HIGHEST_GRADE);
}

/** Picks a random curriculum topic for this subject and grade, so each
 * conversation practises something different.
 */
function pickTopic(subject: Problem["subject"], grade: number): Topic {
  const topics: Topic[] = LESSON_FRAMEWORK[subject][grade as 4 | 5 | 6 | 7 | 8 | 9];
  // Math.random() gives a number from 0 up to (not including) 1, so this
  // gives a whole number from 0 to topics.length - 1.
  return topics[Math.floor(Math.random() * topics.length)];
}

// ─────────────────────────────────────────────────────────────
// BLOCK C: Checking a written problem
// ─────────────────────────────────────────────────────────────

/** Returns true only if the problem is safe and usable:
 *   - it has the right shape and sizes (isValidProblem in lib/tutor.ts)
 *   - no answer is longer than 3 words (long answers can't be checked reliably)
 *   - no answer has "/" or "." between digits (isCorrect removes punctuation,
 *     so "3/4" would become "34" and "7.5" would become "75")
 *   - a math problem's first answer is a plain whole number, like "56" or "1,200"
 *   - no text contains a blocked word (lib/moderation.ts)
 *   - the question and the hints do NOT already give away the answer
 *   - the explanation DOES contain the answer (otherwise the AI contradicted
 *     itself, and the explanation would teach the wrong thing)
 */
function isUsableProblem(problem: Problem): boolean {
  if (!isValidProblem(problem)) {
    return false;
  }

  // Short answers only: "56", "photosynthesis", "the protagonist".
  const isShort = (answer: string) => answer.trim().split(/\s+/).length <= 3;
  if (!problem.answers.every(isShort)) {
    return false;
  }

  // \d[/.]\d = a digit, then "/" or ".", then another digit (3/4, 7.5).
  if (problem.answers.some((answer) => /\d[/.]\d/.test(answer))) {
    return false;
  }

  // ^[\d,]+$ = only digits and commas from start to end ("56", "1,200").
  if (problem.subject === "math" && !/^[\d,]+$/.test(problem.answers[0].trim())) {
    return false;
  }

  // Every piece of text the child could see goes through moderation.
  const allText = [
    problem.question,
    ...problem.answers,
    ...problem.hints,
    problem.explanation,
  ];
  if (!allText.every((text) => isMessageAllowed(text))) {
    return false;
  }

  // isCorrect (lib/tutor.ts) spots an accepted answer inside any sentence,
  // so we can reuse it to look for the answer in the question and hints.
  if (isCorrect(problem, problem.question)) {
    return false;
  }
  if (problem.hints.some((hint) => isCorrect(problem, hint))) {
    return false;
  }
  if (!isCorrect(problem, problem.explanation)) {
    return false;
  }

  return true;
}

// ─────────────────────────────────────────────────────────────
// BLOCK D: Asking the AI
// ─────────────────────────────────────────────────────────────

/** Asks the AI to write one problem. Returns the problem, or null if the
 * reply wasn't valid JSON.
 */
async function writeProblem(
  openai: OpenAI,
  subject: Problem["subject"],
  grade: number,
  topic: Topic
): Promise<Problem | null> {
  const response = await openai.responses.create({
    model: MODEL,
    instructions:
      "You write practice problems for a children's tutoring app called Think First. " +
      "Children are aged 8 to 14. Everything must be kind, safe and age-appropriate.",
    input:
      `Write ONE ${subject} practice problem for a Grade ${grade} student.\n` +
      `Topic: ${topic.topic}\n` +
      `Learning outcomes: ${topic.outcomes.join("; ")}\n\n` +
      `Rules:\n` +
      `- It must be a ${subject} question. Test the learning outcomes above. ` +
      `No trivia about specific books, movies, people or brands.\n` +
      (subject === "literature" ? literatureTip() : SUBJECT_TIPS[subject]) +
      `- The question must contain everything needed to answer it. If it is about a ` +
      `passage or a sentence, include that short passage (1 to 3 sentences) inside the question.\n` +
      `- The question must have exactly ONE correct answer that is a number or 1 to 3 words. ` +
      `No multiple choice, no "explain why" questions, no opinion questions.\n` +
      `- For math, the answer must be a whole number: no fractions, no decimals, no ` +
      `coordinates, no units. The first item in "answers" is just the digits, e.g. "56".\n` +
      `- "answers" lists every way a child might correctly write that one answer ` +
      `(e.g. ["56", "fifty-six", "fifty six"] or ["evaporation"]). Each one is at most 3 words.\n` +
      `- "hints" has exactly 3 hints, from smallest to biggest. ` +
      `No hint may contain the answer itself.\n` +
      `- The answer word must NOT appear anywhere in the question or its passage.\n` +
      `- "explanation" gives the answer and explains why in 1 to 3 short sentences.\n` +
      `- Use simple words a Grade ${grade} student understands. Keep the question under 60 words.`,
    text: {
      format: {
        type: "json_schema",
        name: "practice_problem",
        schema: PROBLEM_SCHEMA,
        strict: true,
      },
    },
    max_output_tokens: 500,
  });

  try {
    const parsed = JSON.parse(response.output_text);
    // The subject is set by us, never by the AI.
    return { ...parsed, subject };
  } catch {
    return null;
  }
}

/** Asks the AI to solve the question on its own, without seeing the answer
 * it wrote. Returns its short answer.
 */
async function solveProblem(openai: OpenAI, problem: Problem): Promise<string> {
  const response = await openai.responses.create({
    model: MODEL,
    instructions:
      "Answer the question. Reply with ONLY the answer: a number or at most 3 words. " +
      "No sentence, no explanation. If the question cannot be answered from its own " +
      "text alone (for example it refers to a story that isn't included), reply UNANSWERABLE.",
    input: problem.question,
    max_output_tokens: 30,
  });
  return response.output_text.trim();
}

/** True if the solved answer matches the problem's answer. Either may contain
 * the other, so "56" matches "56 apples" and "photosynthesis" matches
 * "Photosynthesis.".
 */
function answersAgree(problem: Problem, solvedAnswer: string): boolean {
  if (isCorrect(problem, solvedAnswer)) {
    return true;
  }
  // The other direction: does an accepted answer contain the solved answer?
  const solvedAsProblem = { ...problem, answers: [solvedAnswer] };
  return problem.answers.some((answer) => isCorrect(solvedAsProblem, answer));
}

// ─────────────────────────────────────────────────────────────
// BLOCK E: The function the route calls
// ─────────────────────────────────────────────────────────────

/** Writes one checked problem for this subject and level.
 * Returns null if the AI fails or the problem fails any check; the caller
 * then uses a backup problem. Never throws.
 */
export async function generateProblem(
  openai: OpenAI,
  subject: Problem["subject"],
  level: number | null
): Promise<Problem | null> {
  try {
    const grade = toCurriculumGrade(level);
    const topic = pickTopic(subject, grade);

    const problem = await writeProblem(openai, subject, grade, topic);
    if (problem === null || !isUsableProblem(problem)) {
      console.warn("Generated problem rejected by checks:", subject);
      return null;
    }

    const solved = await solveProblem(openai, problem);
    if (!answersAgree(problem, solved)) {
      console.warn("Generated problem rejected: answers disagree:", subject);
      return null;
    }

    // Keep only the fields a Problem has (drops anything extra the AI added).
    return {
      subject,
      question: problem.question.trim(),
      answers: problem.answers.map((answer) => answer.trim()),
      hints: [problem.hints[0], problem.hints[1], problem.hints[2]],
      explanation: problem.explanation.trim(),
    };
  } catch (error) {
    console.error("Problem generation failed:", subject, error);
    return null;
  }
}
