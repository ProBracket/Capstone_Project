/** Saving and reading Bud conversations (TF-15: parents can see transcripts).
 *
 * Tables (in the MAIN Supabase project, lib/supabase.js):
 *   conversations          one row per chat (child, start, end, summary)
 *   conversation_messages  every message in a chat, in order
 *
 * Why the main project and not the AI project: a transcript is personal
 * information (a child's own words, linked to that child). The main project
 * knows which parent is logged in, so its row-level security only lets a
 * parent read and add conversations for their OWN children
 * (owns_child() in docs/supabase-child-plan.md). Logged-out visitors get
 * nothing. The AI (OpenAI) never reads these tables.
 *
 * Messages are only ever added, never edited or deleted, so a transcript
 * can't be changed afterwards.
 */
import { supabase } from "@/lib/supabase";

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
  return supabase
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
  return supabase
    .from("conversation_messages")
    .insert({ conversation_id: conversationId, role, content });
}

/** Marks a conversation as finished and saves its summary for parents.
 * Returns { error }. If the table has no ended_at or summary column, this
 * only logs an error; the messages themselves are already saved.
 */
export function endConversation(conversationId: string, summary: string) {
  return supabase
    .from("conversations")
    .update({ ended_at: new Date().toISOString(), summary })
    .eq("id", conversationId);
}

/** A child's conversations, newest first. Returns { data, error }. */
export async function getConversations(childId: string) {
  const { data, error } = await supabase
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
  return supabase
    .from("conversation_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    // Messages are saved one after another (the chat's save queue), so
    // their creation times keep them in order.
    .order("created_at", { ascending: true })
    .overrideTypes<ConversationMessage[], { merge: false }>(); // tells TypeScript the shape of each row
}
