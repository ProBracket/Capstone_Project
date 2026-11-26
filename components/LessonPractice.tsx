/** Practice box at the end of a lesson: the child answers the lesson's
 * practice problems with Bud, using the same Think First rules as the chat
 * (lib/tutor.ts): a wrong answer gets hint 1, 2, then 3, the 4th wrong try
 * gets the explanation, and "just tell me" gets encouragement, not the answer.
 *
 * Bud's replies here are the rule-based messages from lib/tutor.ts, so they
 * appear instantly. Nothing is sent to the AI and nothing is saved.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import {
  getBudReply,
  getOpeningReply,
  TUTOR_NAME,
  type Problem,
  type TutorState,
} from "@/lib/tutor";

// One message in the practice box: from the child or from Bud.
type PracticeMessage = {
  role: "child" | "assistant";
  text: string;
};

type LessonPracticeProps = {
  problems: Problem[]; // the lesson's practice problems (at least 1)
};

export default function LessonPractice({ problems }: LessonPracticeProps) {
  // Bud's opening message and memory for these problems. useState(() => ...)
  // runs getOpeningReply only once, when the box first appears.
  const [tutorState, setTutorState] = useState<TutorState>(
    () => getOpeningReply(problems).state
  );
  const [messages, setMessages] = useState<PracticeMessage[]>(() => [
    { role: "assistant", text: getOpeningReply(problems).message },
  ]);
  const [draft, setDraft] = useState("");

  // Keep the newest message in view, inside the box only.
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const list = listRef.current;
    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  }, [messages]);

  /** Runs when the child presses Check (or Enter). */
  function handleSend(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); // stop the page from reloading
    const text = draft.trim();
    if (text === "" || tutorState.finished) {
      return;
    }

    // The rules decide Bud's reply and his new memory (lib/tutor.ts).
    const reply = getBudReply(tutorState, text);

    setMessages((previous) =>
      previous.concat(
        { role: "child", text: text },
        { role: "assistant", text: reply.message }
      )
    );
    setTutorState(reply.state);
    setDraft("");
  }

  return (
    <section className="mt-8 overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <header className="flex items-center gap-3 border-b border-border px-6 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-xl">
          🌱
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Practice with {TUTOR_NAME}</h3>
          <p className="text-sm text-muted">Try first! Bud gives hints if you need them.</p>
        </div>
      </header>

      {/* Messages. max-h + overflow-y-auto = the box scrolls, not the page. */}
      <div ref={listRef} className="flex max-h-96 flex-col gap-3 overflow-y-auto px-6 py-5">
        {messages.map((message, index) =>
          message.role === "child" ? (
            <div
              key={index}
              className="self-end max-w-[75%] rounded-2xl rounded-br-md bg-primary px-4 py-2 text-on-primary whitespace-pre-line"
            >
              {message.text}
            </div>
          ) : (
            <div
              key={index}
              className="self-start max-w-[85%] rounded-2xl rounded-bl-md bg-surface-muted px-4 py-2 text-foreground whitespace-pre-line"
            >
              {message.text}
            </div>
          )
        )}
      </div>

      {/* Answer box. A <form> sends on the button OR the Enter key. */}
      <form onSubmit={handleSend} className="flex gap-3 border-t border-border px-6 py-4">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={tutorState.finished ? "Practice finished! 🌟" : "Type your answer..."}
          disabled={tutorState.finished}
          maxLength={200}
          className="flex-1 rounded-full border border-border bg-background px-5 py-2 text-foreground placeholder:text-muted outline-none transition focus:border-primary disabled:bg-surface-muted"
        />
        <button
          type="submit"
          disabled={tutorState.finished || draft.trim() === ""}
          className="rounded-full bg-primary px-6 py-2 font-semibold text-on-primary transition hover:bg-primary-hover disabled:opacity-50"
        >
          Check
        </button>
      </form>
    </section>
  );
}
