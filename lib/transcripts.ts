import { supabaseAI } from "@/lib/supabase-ai";

export async function getConversations(childId: string) {
  return supabaseAI
    .from("conversations")
    .select("*")
    .eq("child_id", childId)
    .order("created_at", { ascending: false });
}

export async function getTranscript(conversationId: string) {
  return supabaseAI
    .from("conversation_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
}