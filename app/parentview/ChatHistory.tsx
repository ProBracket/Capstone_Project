/** Chat History screen (TF-15): parents read their children's conversations
 * with Bud. Opened from the Parent Dashboard, so only after the PIN.
 *
 * 1. The parent picks a child → their conversations are listed, newest first.
 * 2. The parent picks a conversation → the full transcript is shown.
 * Data comes from lib/conversations.ts. Read-only: nothing can be changed here.
 */
"use client";

import { useState } from "react";
import type { Child } from "@/lib/children";
import {
  getConversations,
  getMessages,
  type Conversation,
  type ConversationMessage,
} from "@/lib/conversations";
import { TUTOR_NAME } from "@/lib/tutor";

type Props = {
  profiles: Child[];
  onBack: () => void;
};

/** Shows a saved date and time in the parent's own format,
 * e.g. "2026-11-22T18:30:00Z" → "Nov 22, 2026, 1:30 PM".
 */
function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function ChatHistory({ profiles, onBack }: Props) {
  // The child whose conversations are shown, or null before one is picked.
  const [childId, setChildId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // The conversation being read, and its messages (null = showing the list).
  const [openConversation, setOpenConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); // red banner

  /** Runs when the parent picks a child: loads that child's conversations. */
  async function pickChild(id: string) {
    setChildId(id);
    setOpenConversation(null);
    setError("");
    setLoading(true);

    const { data, error } = await getConversations(id);

    setLoading(false);
    if (error) {
      setError(error.message);
      setConversations([]);
      return;
    }
    setConversations(data ?? []);
  }

  /** Runs when the parent picks a conversation: loads its transcript. */
  async function openTranscript(conversation: Conversation) {
    setError("");
    setLoading(true);

    const { data, error } = await getMessages(conversation.id);

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMessages(data ?? []);
    setOpenConversation(conversation);
  }

  // The picked child's name, for the headings.
  const childName = profiles.find((child) => child.id === childId)?.name ?? "";

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-semibold">Chat History</h2>
      <p className="mt-1 mb-6 text-sm text-slate-500">
        Read your children&apos;s conversations with {TUTOR_NAME}.
      </p>

      {/* 1. Pick a child */}
      {profiles.length === 0 ? (
        <p className="text-sm text-slate-500">No child profiles yet.</p>
      ) : (
        <div className="mb-6 flex flex-wrap gap-2">
          {profiles.map((child) => (
            <button
              key={child.id}
              type="button"
              onClick={() => void pickChild(child.id)}
              // The picked child's button is filled in.
              className={
                child.id === childId
                  ? "rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white"
                  : "rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
              }
            >
              {child.name}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading && <p className="text-sm text-slate-500">Loading…</p>}

      {/* 2. The picked child's conversations */}
      {!loading && childId !== null && openConversation === null && (
        conversations.length === 0 ? (
          <p className="text-sm text-slate-500">
            {childName} hasn&apos;t chatted with {TUTOR_NAME} yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => void openTranscript(conversation)}
                  className="w-full rounded-md border border-slate-200 px-4 py-3 text-left hover:bg-slate-50"
                >
                  <p className="font-medium">{formatDate(conversation.started_at)}</p>
                  <p className="text-sm text-slate-500">
                    {/* summary is saved when the child finishes all the problems */}
                    {conversation.summary ?? "Stopped before the end."}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )
      )}

      {/* 3. One conversation's transcript */}
      {!loading && openConversation !== null && (
        <div>
          <button
            type="button"
            onClick={() => setOpenConversation(null)}
            className="mb-4 text-sm font-medium text-blue-700 hover:underline"
          >
            ← All of {childName}&apos;s conversations
          </button>

          <p className="mb-4 text-sm text-slate-500">
            {formatDate(openConversation.started_at)}
            {openConversation.summary && ` · ${openConversation.summary}`}
          </p>

          <div className="flex flex-col gap-3">
            {messages.map((message) => (
              <div
                key={message.id}
                // Same layout as the child's chat: child on the right, Bud on the left.
                className={
                  message.role === "child"
                    ? "self-end max-w-[80%] rounded-2xl bg-indigo-600 px-4 py-3 text-white whitespace-pre-line"
                    : "self-start max-w-[80%] rounded-2xl bg-slate-100 px-4 py-3 text-slate-800 whitespace-pre-line"
                }
              >
                <p className="mb-1 text-xs opacity-75">
                  {message.role === "child" ? childName : TUTOR_NAME}
                </p>
                {message.content}
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onBack}
        className="mt-6 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
      >
        Back to Dashboard
      </button>
    </section>
  );
}
