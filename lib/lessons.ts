import OpenAI from "openai";

import { LESSON_FRAMEWORK } from "@/lib/learning_framework";

import { getAIProfile } from "@/lib/ai-profiles";

import { UNIVERSAL_AI_RULES } from "@/lib/prompts";

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

export async function generateLesson(
  subject: "math" | "science" | "literature",
  frameworkGrade: number,
  topic: {
    topic: string;
    outcomes: string[];
    keywords: string[];
  }
) {
  const lessonPrompt = `
${UNIVERSAL_AI_RULES}

You are Bud, an educational tutor for children.

Create a lesson for a child working at approximately Grade ${frameworkGrade} ${subject}.

Topic:
${topic.topic}

Learning Outcomes:
${topic.outcomes.join("\n")}

Keywords:
${topic.keywords.join(", ")}

Requirements:

Create the lesson in EXACTLY this structure:

# Lesson Title

## Concept 1
Explain the first concept clearly using age-appropriate language.

### Practice Question 1
Provide one short practice question related to Concept 1.

## Concept 2
Explain the second concept clearly.

### Practice Question 2
Provide one short practice question related to Concept 2.

## Concept 3
Explain the third concept clearly.

### Practice Question 3
Provide one short practice question related to Concept 3.

## Lesson Summary
Briefly summarize the most important ideas learned.

Additional Rules:

Use grade-appropriate language.

Keep explanations short and easy to understand.

Use real-world examples where appropriate.

Do not provide answers.

Do not provide answer keys.

Do not evaluate student responses.

Keep the lesson between 500 and 800 words.

Be friendly and encouraging.

Return the lesson in Markdown format.
`;

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await openai.responses.create({
    model: "gpt-4o-mini",
    input: lessonPrompt,
    max_output_tokens: 1200,
  });

  return {
    subject,
    frameworkGrade,
    topic,
    lesson: response.output_text,
  };
}