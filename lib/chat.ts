import { supabase } from "./supabase";

export async function getChatHistory(childId: number) {
  return await supabase
    .from("chat_history")
    .select("*")
    .eq("child_id", childId)
    .order("created_at");
}

export async function saveMessage(
  childId: number,
  sender: string,
  message: string
) {
  return await supabase
    .from("chat_history")
    .insert([
      {
        child_id: childId,
        sender,
        message,
      },
    ]);
}