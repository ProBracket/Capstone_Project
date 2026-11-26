/** Writes a lesson with the AI: short concept sections to read, then
 * practice problems the child answers with Bud's Think First rules.
 *
 * SERVER ONLY: this file uses the OpenAI key, so it must only be imported by
 * server code (app/api/lesson/route.ts), never by a page.
 *
 * The lesson comes back as structured data (Lesson below), not one block of
 * Markdown, so the page can show tidy sections and real practice questions.
 *
 * Practice problems are made by generateProblem (lib/problemGenerator.ts),
 * the same writer and safety checks Bud's chat uses. Each one practises a
 * different learning outcome of the topic.
 *
 * Privacy: the AI only receives a subject, a grade and a curriculum topic.
 */

import OpenAI from "openai";
import { isMessageAllowed } from "@/lib/moderation";
import { generateProblem, type Topic } from "@/lib/problemGenerator";
import { UNIVERSAL_AI_RULES } from "@/lib/prompts";
import type { Problem } from "@/lib/tutor";

// ─────────────────────────────────────────────────────────────
// BLOCK A: What a lesson looks like
// ─────────────────────────────────────────────────────────────

// One section of the lesson, e.g. { heading: "What is a fraction?", text: "..." }
export type LessonSection = {
  heading: string;
  text: string;
};

// A whole lesson, as the page receives it.
export type Lesson = {
  title: string;
  sections: LessonSection[]; // 2 to 4 short sections to read
  summary: string; // the main ideas in 1 to 3 sentences
  problems: Problem[]; // 0 to 3 practice problems (0 only if the AI failed)
};

// Same model as the rest of the app.
const MODEL = "gpt-4o-mini";

// How many times to ask for one practice problem before leaving it out.
const ATTEMPTS_PER_PROBLEM = 3;

// The JSON shape the AI must reply in for the reading part of the lesson.
const LESSON_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    sections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          heading: { type: "string" },
          text: { type: "string" },
        },
        required: ["heading", "text"],
        additionalProperties: false,
      },
    },
    summary: { type: "string" },
  },
  required: ["title", "sections", "summary"],
  additionalProperties: false,
};

// ─────────────────────────────────────────────────────────────
// BLOCK B: Checking the reading part
// ─────────────────────────────────────────────────────────────

/** Is this text, not empty, and no longer than the limit? */
function isText(text: unknown, maxLength: number): text is string {
  return typeof text === "string" && text.trim() !== "" && text.length <= maxLength;
}

/** Returns the reading part of the lesson in a safe shape, or null if it is
 * missing parts, far too long, or contains a blocked word.
 */
function readLessonText(value: unknown): Omit<Lesson, "problems"> | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const { title, sections, summary } = value as Record<string, unknown>;

  if (!isText(title, 120) || !isText(summary, 600) || !Array.isArray(sections)) {
    return null;
  }
  if (sections.length < 2 || sections.length > 4) {
    return null;
  }
  const cleanSections: LessonSection[] = [];
  for (const section of sections) {
    const { heading, text } = (section ?? {}) as Record<string, unknown>;
    if (!isText(heading, 120) || !isText(text, 1200)) {
      return null;
    }
    cleanSections.push({ heading: heading.trim(), text: text.trim() });
  }

  // Every piece of text the child will read goes through moderation.
  const allText = [title, summary, ...cleanSections.flatMap((s) => [s.heading, s.text])];
  if (!allText.every((text) => isMessageAllowed(text))) {
    return null;
  }

  return { title: title.trim(), sections: cleanSections, summary: summary.trim() };
}

// ─────────────────────────────────────────────────────────────
// BLOCK C: Asking the AI
// ─────────────────────────────────────────────────────────────

/** Asks the AI for the reading part of the lesson. Returns null on failure. */
async function writeLessonText(
  openai: OpenAI,
  subject: Problem["subject"],
  grade: number,
  topic: Topic
): Promise<Omit<Lesson, "problems"> | null> {
  const response = await openai.responses.create({
    model: MODEL,
    instructions:
      "You are Bud, a friendly tutor in a children's learning app called Think First.\n" +
      UNIVERSAL_AI_RULES,
    input:
      `Write a short ${subject} lesson for a Grade ${grade} student.\n` +
      `Topic: ${topic.topic}\n` +
      `Learning outcomes: ${topic.outcomes.join("; ")}\n` +
      `Keywords: ${topic.keywords.join(", ")}\n\n` +
      `Rules:\n` +
      `- "sections": exactly 3 sections, one for each learning outcome. Each has a short ` +
      `heading and 3 to 5 sentences of plain text that explain the idea with an everyday example.\n` +
      `- Plain text only: no Markdown, no symbols like # or *, no lists.\n` +
      `- No questions for the student in the sections (practice questions are added separately).\n` +
      `- "summary": the most important ideas in 1 to 3 sentences.\n` +
      `- Use simple, friendly words a Grade ${grade} student understands.`,
    text: {
      format: {
        type: "json_schema",
        name: "lesson",
        schema: LESSON_SCHEMA,
        strict: true,
      },
    },
    max_output_tokens: 1200,
  });

  try {
    return readLessonText(JSON.parse(response.output_text));
  } catch {
    return null;
  }
}

/** One practice problem for one learning outcome of the topic, or null.
 * Giving the problem writer just ONE outcome keeps the three problems from
 * all asking about the same thing.
 */
async function practiceProblem(
  openai: OpenAI,
  subject: Problem["subject"],
  grade: number,
  topic: Topic,
  outcome: string
): Promise<Problem | null> {
  const focusedTopic: Topic = { ...topic, outcomes: [outcome] };
  for (let attempt = 0; attempt < ATTEMPTS_PER_PROBLEM; attempt++) {
    const problem = await generateProblem(openai, subject, grade, focusedTopic);
    if (problem !== null) {
      return problem;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// BLOCK D: The function the route calls
// ─────────────────────────────────────────────────────────────

/** Writes a whole lesson: the reading part and up to 3 practice problems,
 * all at the same time. Returns null if the reading part failed (the page
 * then shows an error). Practice problems that fail every check are simply
 * left out. Never throws.
 */
export async function generateLesson(
  openai: OpenAI,
  subject: Problem["subject"],
  grade: number,
  topic: Topic
): Promise<Lesson | null> {
  try {
    // Up to 3 outcomes, one practice problem each.
    const outcomes = topic.outcomes.slice(0, 3);

    // The reading part and all practice problems are written at the same time.
    const [lessonText, problems] = await Promise.all([
      writeLessonText(openai, subject, grade, topic),
      Promise.all(
        outcomes.map((outcome) => practiceProblem(openai, subject, grade, topic, outcome))
      ),
    ]);

    if (lessonText === null) {
      console.warn("Lesson text rejected by checks:", subject, topic.topic);
      return null;
    }

    return {
      ...lessonText,
      // Keep only the problems that passed (filter out the nulls).
      problems: problems.filter((problem): problem is Problem => problem !== null),
    };
  } catch (error) {
    console.error("Lesson generation failed:", subject, error);
    return null;
  }
}
