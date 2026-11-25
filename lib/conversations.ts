/** Saving and reading Bud conversations (TF-15: parents can see transcripts).
 *
 * Tables (in the AI Supabase project, lib/supabase-ai.ts, the same place the
 * chat has saved to since #28):
 *   conversations          one row per chat (child, start, end, summary)
 *   conversation_messages  every message in a chat, in order
 *
 * Messages are only ever added, never edited or deleted, so a transcript
 * can't be changed afterwards.
 */
import { supabaseAI } from "@/lib/supabase-ai";

// Who wrote a message. Same words as the database: "assistant" = Bud.
export type MessageRole = "child" | "assistant";

/** One conversation, as the parent's history list shows it. */
export type Conversation = {
  id: string;
  started_at: string; // date and time, e.g. "2026-11-22T18:30:00Z"
  ended_at: string | null; // null = the child left before finishing
  summary: string | null; // e.g. "Practised 3 problems: ..."
};

/** One message in a transcript. */
export type ConversationMessage = {
  id: number | string;
  role: MessageRole;
  content: string;
  created_at: string;
};

// A row as it comes back from the database. Reading "*" (every column) and
// picking fields here keeps this working whether the table names its start
// time "started_at" or "created_at".
type ConversationRow = {
  id: string;
  started_at?: string | null;
  created_at?: string | null;
  ended_at?: string | null;
  summary?: string | null;
};

/** Starts a new conversation for a child.
 * Returns { data: { id }, error }; the id is used to save each message.
 */
export function startConversation(childId: string) {
  return supabaseAI
    .from("conversations")
    .insert({ child_id: childId })
    .select("id")
    .single();
}

/** Adds one message to a conversation. Returns { error }. */
export function saveMessage(
  conversationId: string,
  role: MessageRole,
  content: string
) {
  return supabaseAI
    .from("conversation_messages")
    .insert({ conversation_id: conversationId, role, content });
}

/** Marks a conversation as finished and saves its summary for parents.
 * Returns { error }. If the table has no ended_at or summary column, this
 * only logs an error; the messages themselves are already saved.
 */
export function endConversation(conversationId: string, summary: string) {
  return supabaseAI
    .from("conversations")
    .update({ ended_at: new Date().toISOString(), summary })
    .eq("id", conversationId);
}

/** A child's conversations, newest first. Returns { data, error }. */
export async function getConversations(childId: string) {
  const { data, error } = await supabaseAI
    .from("conversations")
    .select("*")
    .eq("child_id", childId);

  if (error || !data) {
    return { data: null, error };
  }

  const conversations: Conversation[] = (data as ConversationRow[]).map((row) => ({
    id: row.id,
    started_at: row.started_at ?? row.created_at ?? "",
    ended_at: row.ended_at ?? null,
    summary: row.summary ?? null,
  }));

  // Newest first. ISO dates sort correctly as text.
  conversations.sort((a, b) => b.started_at.localeCompare(a.started_at));
  return { data: conversations, error: null };
}

/** Every message in one conversation, in the order they were sent.
 * Returns { data, error }.
 */
export function getMessages(conversationId: string) {
  return supabaseAI
    .from("conversation_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    // Messages are saved one after another (the chat's save queue), so
    // their creation times keep them in order.
    .order("created_at", { ascending: true })
    .overrideTypes<ConversationMessage[], { merge: false }>(); // tells TypeScript the shape of each row
}
