/** Server address /api/lesson: writes one lesson for a learning page.
 *
 * The page sends:  { subject, grade, topicName }
 *   subject   = "math", "science" or "literature"
 *   grade     = the curriculum grade (4 to 9)
 *   topicName = the name of one topic for that subject and grade,
 *               e.g. "Place Value"
 * We send back:    a Lesson (lib/lessonGenerator.ts), or { error } with
 *                  status 400 (bad request) or 503 (AI unavailable).
 *
 * Safety: the topic is looked up HERE, in our own curriculum list
 * (LESSON_FRAMEWORK). The page only sends its name. Text typed into the
 * request can never reach the AI's instructions.
 */

import OpenAI from "openai";
import { getSignedInUser, notSignedInResponse } from "@/lib/serverAuth";
import { LESSON_FRAMEWORK } from "@/lib/learning_framework";
import { generateLesson } from "@/lib/lessonGenerator";
import type { Topic } from "@/lib/problemGenerator";
import { SUBJECTS, type Problem } from "@/lib/tutor";

// The longest we wait for one AI call, in milliseconds (20 seconds).
const AI_TIMEOUT_MS = 20000;

/** Checks the request and finds the topic in the curriculum.
 * Returns null if anything is missing or doesn't exist.
 */
function readRequest(
  body: unknown
): { subject: Problem["subject"]; grade: number; topic: Topic } | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }
  const { subject, grade, topicName } = body as Record<string, unknown>;

  if (!SUBJECTS.includes(subject as Problem["subject"])) {
    return null;
  }
  if (typeof grade !== "number" || !Number.isInteger(grade) || grade < 4 || grade > 9) {
    return null;
  }
  if (typeof topicName !== "string") {
    return null;
  }

  const topics: Topic[] =
    LESSON_FRAMEWORK[subject as Problem["subject"]][grade as 4 | 5 | 6 | 7 | 8 | 9];
  const topic = topics.find((t) => t.topic === topicName);
  if (!topic) {
    return null;
  }

  return { subject: subject as Problem["subject"], grade, topic };
}

export async function POST(request: Request) {
  // 0. Only a signed-in parent may make the server call the AI
  //    (lib/serverAuth.ts). Checked first, before anything else is read.
  if (!(await getSignedInUser(request))) {
    return notSignedInResponse();
  }

  // 1. Read and check the request.
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const parsed = readRequest(body);
  if (parsed === null) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  // 2. No API key set up → no lesson (lessons are always written by the AI).
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Lessons are unavailable right now." }, { status: 503 });
  }

  // 3. Write the lesson.
  const openai = new OpenAI({ apiKey, timeout: AI_TIMEOUT_MS, maxRetries: 1 });
  const lesson = await generateLesson(openai, parsed.subject, parsed.grade, parsed.topic);
  if (lesson === null) {
    return Response.json(
      { error: "Bud couldn't write this lesson. Please try again." },
      { status: 503 }
    );
  }

  return Response.json(lesson);
}
