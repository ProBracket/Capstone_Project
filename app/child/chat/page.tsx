/** Chat page (/child/chat): where the child talks with Bud.
 *
 * This file only handles the SCREEN: showing messages, the typing box,
 * and (later) the microphone and Bud's voice.
 * What Bud says is decided in lib/tutor.ts. The page then asks the AI
 * (app/api/bud/route.ts) to word that reply more naturally, and falls back to
 * the rule-based message if the AI is unavailable.
 */

// "use client" makes this page run in the browser. It needs to, because it
// reacts to typing and clicks (and later uses the microphone and speakers).
"use client";

import { useEffect, useRef, useState } from "react";
import ChildNavbar from "@/components/ChildNavbar";
import { getActiveChildId } from "@/lib/activeChild";
import { getChildLevel } from "@/lib/calibrationResults";
import {
  endConversation,
  saveMessage,
  startConversation,
  type MessageRole,
} from "@/lib/conversations";
import {
  getBudReply,
  getOpeningReply,
  getSummary,
  PRACTICE_PROBLEMS,
  TUTOR_NAME,
  type BudStep,
  type Problem,
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

// ─────────────────────────────────────────────────────────────
// PIECE C2b: Asking the AI to word Bud's reply
// ─────────────────────────────────────────────────────────────

// What /api/bud sends back (see app/api/bud/route.ts).
//   reply null   = use the rule-based message
//   blocked true = the child's message wasn't allowed; show reply instead
type BudAIResult = {
  reply: string | null;
  blocked: boolean;
};

/** Sends the child's message, the current step and the child's grade level
 * to /api/bud. level null = unknown (the AI then uses its default wording).
 * Never throws: if anything fails (offline, server error), it returns
 * reply: null so the page simply shows the rule-based message.
 */
async function askBudAI(
  childMessage: string,
  step: BudStep,
  level: number | null
): Promise<BudAIResult> {
  try {
    const response = await fetch("/api/bud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childMessage, step, level }),
    });
    if (!response.ok) {
      return { reply: null, blocked: false };
    }
    return await response.json();
  } catch {
    return { reply: null, blocked: false };
  }
}

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

  // true while waiting for the AI. Shows "Bud is thinking…" and stops the
  // child sending a second message before the first one is answered.
  const [thinking, setThinking] = useState(false);

  // The child's grade level for each subject, once looked up.
  // useRef (not useState) because changing it doesn't need to redraw anything.
  const levels = useRef<Partial<Record<Problem["subject"], number | null>>>({});

  /** The grade level Bud should talk at for this subject (TF-11).
   * Looked up once per subject (lib/calibrationResults.ts), then remembered.
   * null if no child is known (e.g. the chat was opened directly).
   */
  async function getLevel(subject: Problem["subject"]): Promise<number | null> {
    if (subject in levels.current) {
      return levels.current[subject] ?? null;
    }

    const childId = getActiveChildId();
    let level: number | null = null;
    if (childId !== null) {
      try {
        level = await getChildLevel(childId, subject);
      } catch {
        level = null; // e.g. offline: Bud still works, just without a level
      }
    }

    levels.current[subject] = level;
    return level;
  }

  // ─────────────────────────────────────────────────────────────
  // PIECE C6: Saving the conversation for parents (TF-15)
  // ─────────────────────────────────────────────────────────────

  // The id of this conversation in the database, once it has been started.
  // Kept as a Promise so that two messages sent close together share the
  // same conversation instead of starting two. null = not started yet.
  const conversation = useRef<Promise<string | null> | null>(null);

  // Saves happen one after another in this queue, so messages are stored
  // in the same order the child saw them, even on a slow connection.
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  /** Gets this conversation's id, starting the conversation (and saving
   * Bud's opening message) the first time it is needed.
   * Returns null if there's no known child or the database refused.
   */
  function getConversationId(): Promise<string | null> {
    if (conversation.current === null) {
      conversation.current = (async () => {
        const childId = getActiveChildId();
        if (childId === null) {
          return null; // chat opened without picking a child: nothing to save
        }
        const { data, error } = await startConversation(childId);
        if (error || !data) {
          console.error("Could not start the conversation:", error);
          return null;
        }
        await saveMessage(data.id, "assistant", OPENING.message);
        return data.id;
      })();
    }
    return conversation.current;
  }

  /** Adds a save to the queue. Never throws: if saving fails, the chat
   * keeps working and the problem is only logged for developers.
   */
  function queueSave(save: (conversationId: string) => PromiseLike<{ error: unknown }>) {
    saveQueue.current = saveQueue.current.then(async () => {
      try {
        const conversationId = await getConversationId();
        if (conversationId === null) {
          return;
        }
        const { error } = await save(conversationId);
        if (error) {
          console.error("Could not save the conversation:", error);
        }
      } catch (error) {
        console.error("Could not save the conversation:", error);
      }
    });
  }

  /** Saves one message on screen to the conversation. */
  function recordMessage(role: MessageRole, text: string) {
    queueSave((conversationId) => saveMessage(conversationId, role, text));
  }

  /** Runs when the child presses Send (or the Enter key).
   * SubmitEvent = the event a form fires when it's submitted. (The other pages
   * use React.FormEvent, which the latest React types mark as outdated.)
   * async = this function waits for the AI's reply partway through.
   */
  async function handleSend(event: React.SubmitEvent<HTMLFormElement>) {
    // Stop the browser's default form behaviour, which would reload the page.
    event.preventDefault();

    // Remove spaces at the start and end. Ignore empty messages,
    // and ignore new messages while Bud is still answering the last one.
    const text = draft.trim();
    if (text === "" || thinking) {
      return;
    }

    // 1. The rules decide what happens (correct, hint 2, explain...).
    //    All the rules live in lib/tutor.ts.
    const reply = getBudReply(tutorState, text);

    // 2. Show the child's message straight away and empty the typing box.
    //    (previous) => ... means "start from the latest list", which matters
    //    because the list may have changed while we wait for the AI.
    //    .concat() makes a NEW list, which is what React needs to redraw.
    setMessages((previous) => previous.concat({ role: "child", text: text }));
    setDraft("");
    // Saved for the parent's chat history, including messages that are
    // blocked, so parents can see what their child tried to ask.
    recordMessage("child", text);

    // 3. Ask the AI to word the reply. Start with the rule-based message;
    //    it is used whenever the AI doesn't give a usable reply.
    let budText = reply.message;
    let countThisMessage = true; // false if the message was blocked

    // "done" (conversation over) never needs the AI.
    if (reply.step.kind !== "done") {
      setThinking(true);
      // The child's level for this problem's subject, so the AI can use
      // words that fit their grade (TF-11).
      const subject = PRACTICE_PROBLEMS[reply.step.problemIndex].subject;
      const level = await getLevel(subject);
      const ai = await askBudAI(text, reply.step, level);
      setThinking(false);

      if (ai.blocked && ai.reply !== null) {
        // Not allowed: show the "talk with a parent" message and keep the old
        // state, so a blocked message never counts as a try.
        budText = ai.reply;
        countThisMessage = false;
      } else if (ai.reply !== null) {
        // The AI's words, then the part that always comes from the rules
        // (the next problem, or the problem repeated), if there is one.
        budText = ai.reply;
        if (reply.nextLine !== "") {
          budText = budText + "\n\n" + reply.nextLine;
        }
      }
    }

    // 4. Show Bud's reply, and save it for the parent's chat history.
    setMessages((previous) => previous.concat({ role: "assistant", text: budText }));
    recordMessage("assistant", budText);

    // 5. Keep Bud's updated memory for the next message (unless blocked).
    if (countThisMessage) {
      setTutorState(reply.state);

      // This message finished the last problem: mark the conversation as
      // ended and save the summary parents see (getSummary in lib/tutor.ts).
      if (!tutorState.finished && reply.state.finished) {
        const summary = getSummary(reply.state);
        queueSave((conversationId) => endConversation(conversationId, summary));
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // PIECE C3: Auto-scroll and "Start over"
  // ─────────────────────────────────────────────────────────────

  // useRef: a reference to a real element on the screen. It's attached
  // (with ref={bottomRef} below) to an invisible marker after the last message.
  // null to start, because the marker doesn't exist until the page is drawn.
  const bottomRef = useRef<HTMLDivElement>(null);

  // useEffect: "after the screen redraws, run this code".
  // The [messages, thinking] at the end means: only run it when one of those
  // changes, i.e. whenever a new bubble or the "thinking" bubble appears.
  useEffect(() => {
    // Scroll the chat so the bottom marker (the newest message) is in view.
    // ?. means "only if it exists": skip it if the marker isn't on screen yet.
    // behavior "smooth" = glide instead of jumping;
    // block "nearest"   = scroll only as much as needed (so the whole page doesn't jump).
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, thinking]);

  /** Runs when the child clicks "Start over" after finishing.
   * Puts all three pieces of state back to how they were at the start.
   */
  function handleStartOver() {
    setMessages([{ role: "assistant", text: OPENING.message }]);
    setTutorState(OPENING.state);
    setDraft("");
    // The next message starts a new conversation in the parent's history.
    conversation.current = null;
  }

  return (
    // <> </> (a "fragment") groups the sidebar and the page without adding
    // an extra box to the screen.
    <>
      {/* The child area's side menu (components/ChildNavbar.tsx), same as
          the other child pages. It is fixed to the left edge of the screen. */}
      <ChildNavbar />

      {/* Full-height page with a soft background, content centred.
          ml-72 = a left margin wider than the side menu (w-64), so the chat
          sits beside the menu instead of underneath it. */}
      <main className="ml-72 min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 px-8 py-12 flex justify-center">
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

            {/* A temporary bubble while waiting for the AI's reply. */}
            {thinking && (
              <div className="self-start rounded-2xl bg-slate-100 text-slate-500 italic px-4 py-3">
                {TUTOR_NAME} is thinking… 💭
              </div>
            )}

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
              // Also greyed out while Bud is thinking. (The typing box stays on,
              // so the child can start typing their next message.)
              disabled={tutorState.finished || thinking}
              className="rounded-2xl bg-indigo-600 px-6 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
