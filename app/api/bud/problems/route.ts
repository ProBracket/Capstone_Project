/** Server address /api/bud/problems: the problems for one round of chat.
 *
 * The chat page calls this when it opens, and again on "More questions".
 * A round has QUESTIONS_PER_SUBJECT questions for each subject (lib/tutor.ts),
 * asked in the order math, science, literature, math, science, literature.
 * Each one is a new AI-written problem at the child's level
 * (lib/problemGenerator.ts), on a different curriculum topic. If the AI can't
 * make a problem that passes every check, a backup problem for that subject
 * from PRACTICE_PROBLEMS (lib/tutor.ts) is used instead, so the round is
 * always complete.
 *
 * The page sends:  { levels: { math, science, literature } }
 *   each level = the child's grade level for that subject (0–12), or null
 *   if unknown. Only these numbers are shared with the AI, never the
 *   child's name or id.
 * We send back:    { problems: Problem[], generated: boolean[] }
 *   generated[i] = true if problems[i] was written by the AI, false if it
 *   is a backup problem (useful for testing).
 */

import OpenAI from "openai";
import { getSignedInUser, notSignedInResponse } from "@/lib/serverAuth";
import {
  generateProblem,
  shuffledTopics,
  toCurriculumGrade,
} from "@/lib/problemGenerator";
import {
  PRACTICE_PROBLEMS,
  QUESTIONS_PER_SUBJECT,
  SUBJECTS,
  type Problem,
} from "@/lib/tutor";

// How many times to ask the AI for one question before using a backup.
const ATTEMPTS_PER_QUESTION = 3;

// The longest we wait for one AI call, in milliseconds (15 seconds).
const AI_TIMEOUT_MS = 15000;

/** Reads one level from the request: a whole number from 0 to 12, or null
 * for anything else (missing, text, 99...).
 */
function readLevel(value: unknown): number | null {
  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 12
  ) {
    return value;
  }
  return null;
}

/** A backup problem for a subject. number = which question of this subject
 * it is in the round (0 = first, 1 = second), so the two backups for one
 * subject are different problems.
 */
function backupProblem(subject: Problem["subject"], number: number): Problem {
  const backups = PRACTICE_PROBLEMS.filter((problem) => problem.subject === subject);
  // % wraps around if there are fewer backups than questions.
  return backups[number % backups.length];
}

// One question to fill in the round: which subject, and whether it is that
// subject's 1st or 2nd question.
type Slot = { subject: Problem["subject"]; number: number };

/** The slots of a round, in the order Bud asks them.
 * With 2 per subject: math 0, science 0, literature 0, math 1, science 1, literature 1.
 */
function roundSlots(): Slot[] {
  const slots: Slot[] = [];
  for (let number = 0; number < QUESTIONS_PER_SUBJECT; number++) {
    for (const subject of SUBJECTS) {
      slots.push({ subject, number });
    }
  }
  return slots;
}

export async function POST(request: Request) {
  // 0. Only a signed-in parent may make the server call the AI
  //    (lib/serverAuth.ts). Checked first, before anything else is read.
  if (!(await getSignedInUser(request))) {
    return notSignedInResponse();
  }

  // 1. Read the levels. A missing or broken body just means "levels unknown".
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const levels =
    typeof body === "object" && body !== null && "levels" in body
      ? (body as { levels: Record<string, unknown> }).levels ?? {}
      : {};

  const slots = roundSlots();

  // 2. No API key set up → backup problems for the whole round.
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({
      problems: slots.map((slot) => backupProblem(slot.subject, slot.number)),
      generated: slots.map(() => false),
    });
  }
  const openai = new OpenAI({ apiKey, timeout: AI_TIMEOUT_MS, maxRetries: 1 });

  // 3. Each subject's grade and topics in a random order, worked out once.
  const plans = Object.fromEntries(
    SUBJECTS.map((subject) => {
      const grade = toCurriculumGrade(readLevel(levels?.[subject]));
      return [subject, { grade, topics: shuffledTopics(subject, grade) }];
    })
  );

  // 4. Make every question at the same time (Promise.all), so the child waits
  //    for the slowest one instead of all of them in a row.
  //    Topics are handed out so no two questions in a subject share one:
  //    question 0 tries topics 0, 2, 4...; question 1 tries topics 1, 3, 5...
  const results = await Promise.all(
    slots.map(async ({ subject, number }) => {
      const { grade, topics } = plans[subject];
      for (let attempt = 0; attempt < ATTEMPTS_PER_QUESTION; attempt++) {
        const topicIndex = (number + attempt * QUESTIONS_PER_SUBJECT) % topics.length;
        const problem = await generateProblem(openai, subject, grade, topics[topicIndex]);
        if (problem !== null) {
          return { problem, generated: true };
        }
      }
      return { problem: backupProblem(subject, number), generated: false };
    })
  );

  return Response.json({
    problems: results.map((result) => result.problem),
    generated: results.map((result) => result.generated),
  });
}
