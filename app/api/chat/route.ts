import OpenAI from "openai";
import { isMessageAllowed } from "@/lib/moderation";
import { BUD_PROMPT } from "@/lib/prompts";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const {
            message,
            history = [],
        } = await request.json();
    
    if (!isMessageAllowed(message)) {
  return Response.json({
    reply:
      "That's a question you should talk about with a parent or caregiver. 🌱"
  });
}

const conversation = history
  .map(
    (msg: {
      role: string;
      text: string;
    }) =>
      `${msg.role}: ${msg.text}`
  )
  .join("\n");

 const response = await openai.responses.create({
  model: "gpt-4o-mini",

  input: `
        Conversation History:

        ${conversation}

        Current User Message:

        ${message}
    `,
});

    return Response.json({
      reply: response.output_text,
    });
  } catch (error) {
    console.error("Chat error:", error);

    return Response.json(
      {
        error: "Failed to generate response",
      },
      {
        status: 500,
      }
    );
  }
}