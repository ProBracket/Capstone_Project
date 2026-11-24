import { supabase } from "./supabase";

export async function getLessons(subject: string) {
  return await supabase
    .from("lessons")
    .select("*")
    .eq("subject", subject);
}