import { generateLesson } from "@/lib/lessons";

export async function POST(
  request: Request
) {
  const {
    subject,
    frameworkGrade,
    topic,
  } = await request.json();

  const lesson = await generateLesson(
    subject,
    frameworkGrade,
    topic
  );

  return Response.json(lesson);
}