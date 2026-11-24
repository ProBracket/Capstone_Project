/** Saving and reading Bud conversations (TF-15: parents can see transcripts).
 *
 * Uses Gael's tables:
 *   conversations          one row per chat (child, start, end, summary)
 *   conversation_messages  every message in a chat, in order
 *
 * Supabase only lets a parent read or add rows for their OWN children
 * (row-level security), so these functions never pass a parent id.
 * Messages can only be added, never edited or deleted, so a transcript
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
  id: number;
  role: MessageRole;
  content: string;
  created_at: string;
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
 * Returns { error }.
 */
export function endConversation(conversationId: string, summary: string) {
  return supabase
    .from("conversations")
    .update({ ended_at: new Date().toISOString(), summary })
    .eq("id", conversationId);
}

/** A child's conversations, newest first. Returns { data, error }. */
export function getConversations(childId: string) {
  return supabase
    .from("conversations")
    .select("id, started_at, ended_at, summary")
    .eq("child_id", childId)
    .order("started_at", { ascending: false })
    .overrideTypes<Conversation[], { merge: false }>(); // tells TypeScript the shape of each row
}

/** Every message in one conversation, in the order they were sent.
 * Returns { data, error }.
 */
export function getMessages(conversationId: string) {
  return supabase
    .from("conversation_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("id", { ascending: true }) // id goes up with every message, so it keeps the order
    .overrideTypes<ConversationMessage[], { merge: false }>(); // tells TypeScript the shape of each row
}
