import OpenAI from "openai";
import { getSignedInUser, notSignedInResponse } from "@/lib/serverAuth";
import { isMessageAllowed } from "@/lib/moderation";
import { BUD_PROMPT } from "@/lib/prompts";

export async function POST(request: Request) {
  // 0. Only a signed-in parent may make the server call the AI
  //    (lib/serverAuth.ts). Checked first, before anything else is read.
  if (!(await getSignedInUser(request))) {
    return notSignedInResponse();
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "Bud isn't set up yet (missing OpenAI key)." },
        { status: 500 }
      );
    }
    const openai = new OpenAI({ apiKey });

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
        ${BUD_PROMPT}
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