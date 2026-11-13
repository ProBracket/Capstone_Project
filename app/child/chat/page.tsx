/** Chat page (/child/chat): where the child talks with Bud.
 *
 * This file only handles the SCREEN: showing messages, the typing box,
 * and (later) the microphone and Bud's voice.
 * What Bud says is decided in lib/tutor.ts.
 */

// "use client" makes this page run in the browser. It needs to, because it
// reacts to typing and clicks (and later uses the microphone and speakers).
"use client";

import { useEffect, useRef, useState } from "react";
import {
  getBudReply,
  getOpeningReply,
  TUTOR_NAME,
  type TutorState,
} from "@/lib/tutor";

// ─────────────────────────────────────────────────────────────
// PIECE C1: Show Bud's opening message
// ─────────────────────────────────────────────────────────────

// One message in the chat.
// role uses the same words as the database: "child" or "assistant" (Bud).
type ChatMessage = {
  role: "child" | "assistant";
  text: string;
};

// Bud's first message and starting state. Calculated once, when the file
// loads, because every conversation starts the same way.
const OPENING = getOpeningReply();

export default function ChatPage() {
  // The list of messages on screen. Starts with Bud's opening message.
  // useState gives back two things:
  //   messages    = the current list (read it to draw the screen)
  //   setMessages = the only way to change it (React then redraws the page)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: OPENING.message },
  ]);

  // ─────────────────────────────────────────────────────────────
  // PIECE C2: The typing box and sending a message
  // ─────────────────────────────────────────────────────────────

  // Bud's memory (which problem, how many wrong tries, finished, results).
  // Passed to getBudReply with every message, then replaced with the new one.
  const [tutorState, setTutorState] = useState<TutorState>(OPENING.state);

  // What the child has typed in the box so far (empty to start).
  const [draft, setDraft] = useState("");

  /** Runs when the child presses Send (or the Enter key).
   * SubmitEvent = the event a form fires when it's submitted. (The other pages
   * use React.FormEvent, which the latest React types mark as outdated.)
   */
  function handleSend(event: React.SubmitEvent<HTMLFormElement>) {
    // Stop the browser's default form behaviour, which would reload the page.
    event.preventDefault();

    // Remove spaces at the start and end. Ignore empty messages.
    const text = draft.trim();
    if (text === "") {
      return;
    }

    // Ask Bud for a reply. All the rules live in lib/tutor.ts;
    // the page only passes the message along and shows the answer.
    const reply = getBudReply(tutorState, text);

    // Add two new bubbles: the child's message, then Bud's reply.
    // .concat() makes a NEW list (the old one is never changed), which is
    // what React needs to notice the change and redraw.
    setMessages(
      messages.concat(
        { role: "child", text: text },
        { role: "assistant", text: reply.message }
      )
    );

    // Keep Bud's updated memory for the next message.
    setTutorState(reply.state);

    // Empty the typing box, ready for the next message.
    setDraft("");
  }

  // ─────────────────────────────────────────────────────────────
  // PIECE C3: Auto-scroll and "Start over"
  // ─────────────────────────────────────────────────────────────

  // useRef: a reference to a real element on the screen. It's attached
  // (with ref={bottomRef} below) to an invisible marker after the last message.
  // null to start, because the marker doesn't exist until the page is drawn.
  const bottomRef = useRef<HTMLDivElement>(null);

  // useEffect: "after the screen redraws, run this code".
  // The [messages] at the end means: only run it when `messages` changes,
  // i.e. whenever a new bubble is added.
  useEffect(() => {
    // Scroll the chat so the bottom marker (the newest message) is in view.
    // ?. means "only if it exists": skip it if the marker isn't on screen yet.
    // behavior "smooth" = glide instead of jumping;
    // block "nearest"   = scroll only as much as needed (so the whole page doesn't jump).
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  /** Runs when the child clicks "Start over" after finishing.
   * Puts all three pieces of state back to how they were at the start.
   */
  function handleStartOver() {
    setMessages([{ role: "assistant", text: OPENING.message }]);
    setTutorState(OPENING.state);
    setDraft("");
  }

  return (
    // Full-height page with a soft background, content centred.
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 px-4 py-8 flex justify-center">
      {/* The chat card. flex-col stacks the title above the messages. */}
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl p-6 flex flex-col">
        <h1 className="text-3xl font-extrabold text-slate-800 mb-6">
          Chat with {TUTOR_NAME} 🌱
        </h1>

        {/* The list of messages, with a small gap between each one.
            h-[60vh] = 60% of the screen's height; overflow-y-auto = scroll
            inside this box when the messages don't fit, so the typing box
            below always stays visible. */}
        <div className="flex h-[60vh] flex-col gap-3 overflow-y-auto pr-2">
          {/* .map() turns each message in the list into a chat bubble.
              key={index} helps React keep track of which bubble is which. */}
          {messages.map((message, index) => (
            <div
              key={index}
              // Child's messages on the right in indigo; Bud's on the left in grey.
              // whitespace-pre-line makes the "\n" line breaks from tutor.ts show up.
              className={
                message.role === "child"
                  ? "self-end max-w-[80%] rounded-2xl bg-indigo-600 text-white px-4 py-3 whitespace-pre-line"
                  : "self-start max-w-[80%] rounded-2xl bg-slate-100 text-slate-800 px-4 py-3 whitespace-pre-line"
              }
            >
              {message.text}
            </div>
          ))}

          {/* Invisible marker after the last message. The auto-scroll
              (useEffect above) scrolls to here. */}
          <div ref={bottomRef} />
        </div>

        {/* Only shown once every problem is finished.
            {condition && (...)} means "draw this only if condition is true". */}
        {tutorState.finished && (
          <button
            type="button"
            onClick={handleStartOver}
            className="mt-4 self-center rounded-2xl border-2 border-indigo-600 px-6 py-2 font-bold text-indigo-600 hover:bg-indigo-50"
          >
            Start over 🔄
          </button>
        )}

        {/* The typing box and Send button.
            A <form> sends when the button is clicked OR when Enter is pressed,
            so we don't need extra code for the Enter key. */}
        <form onSubmit={handleSend} className="mt-6 flex gap-3">
          <input
            type="text"
            // The box always shows what's in `draft`...
            value={draft}
            // ...and every key press saves the new text into `draft`.
            onChange={(event) => setDraft(event.target.value)}
            placeholder={
              tutorState.finished ? "All done for today! 🌟" : "Type your answer..."
            }
            // No more typing once all the problems are finished.
            disabled={tutorState.finished}
            maxLength={200}
            // text-slate-800: dark typed text, set here so it doesn't inherit the
            // near-white text colour globals.css uses when the computer is in dark mode.
            // placeholder:text-slate-400: the grey hint text stays lighter than real typing.
            className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 disabled:bg-slate-100"
          />
          <button
            type="submit"
            disabled={tutorState.finished}
            className="rounded-2xl bg-indigo-600 px-6 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </main>
  );
}
