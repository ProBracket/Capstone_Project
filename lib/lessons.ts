/** Lesson topics for the child's learning pages (browser side).
 *
 * getTopicsForSubject reads the child's level for a subject from their AI
 * profile and returns the curriculum topics for that grade.
 * The lesson itself is written on the server (lib/lessonGenerator.ts,
 * called by app/api/lesson/route.ts), because it needs the OpenAI key.
 */
import { LESSON_FRAMEWORK } from "@/lib/learning_framework";
import { getAIProfile } from "@/lib/ai-profiles";

export async function getTopicsForSubject(
  childId: string,
  subject: "math" | "science" | "literature"
) {
  const { data: profile, error } = await getAIProfile(childId);

  if (error || !profile) {
    throw new Error("AI profile not found");
  }

  let level: number;

  switch (subject) {
    case "math":
      level = profile.math_level;
      break;

    case "science":
      level = profile.science_level;
      break;

    case "literature":
      level = profile.literature_level;
      break;
  }

  const frameworkGrade = Math.min(
    Math.max(level, 4),
    9
  );

  const topics =
    LESSON_FRAMEWORK[subject][
      frameworkGrade as 4 | 5 | 6 | 7 | 8 | 9
    ];

  return {
    level,
    frameworkGrade,
    topics,
  };
}
