/** Server address /api/bud/problems: the problems for one chat conversation.
 *
 * The chat page calls this once when it opens (and again on "Start over").
 * For each subject (math, science, literature) it asks lib/problemGenerator.ts
 * for a new AI-written problem at the child's level. If the AI can't make a
 * problem that passes every check, the backup problem for that subject from
 * PRACTICE_PROBLEMS (lib/tutor.ts) is used instead. The chat always gets
 * exactly one problem per subject.
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
import { generateProblem } from "@/lib/problemGenerator";
import { PRACTICE_PROBLEMS, SUBJECTS, type Problem } from "@/lib/tutor";

// How many times to ask the AI per subject before using the backup problem.
const ATTEMPTS_PER_SUBJECT = 3;

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

/** The backup problem for a subject (the first one in PRACTICE_PROBLEMS). */
function backupProblem(subject: Problem["subject"]): Problem {
  const backup = PRACTICE_PROBLEMS.find((problem) => problem.subject === subject);
  // Every subject has a backup problem, so this is only a safety net.
  return backup ?? PRACTICE_PROBLEMS[0];
}

export async function POST(request: Request) {
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

  // 2. No API key set up → backup problems for every subject.
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({
      problems: SUBJECTS.map(backupProblem),
      generated: SUBJECTS.map(() => false),
    });
  }
  const openai = new OpenAI({ apiKey, timeout: AI_TIMEOUT_MS, maxRetries: 1 });

  // 3. Make all three subjects at the same time (Promise.all), so the child
  //    waits for the slowest one instead of all three in a row.
  const results = await Promise.all(
    SUBJECTS.map(async (subject) => {
      const level = readLevel(levels?.[subject]);
      for (let attempt = 1; attempt <= ATTEMPTS_PER_SUBJECT; attempt++) {
        const problem = await generateProblem(openai, subject, level);
        if (problem !== null) {
          return { problem, generated: true };
        }
      }
      return { problem: backupProblem(subject), generated: false };
    })
  );

  return Response.json({
    problems: results.map((result) => result.problem),
    generated: results.map((result) => result.generated),
  });
}
