import { supabase } from "./supabase";

export async function getProgress(childId: number) {
  return await supabase
    .from("progress")
    .select("*")
    .eq("child_id", childId);
}

export async function updateProgress(
  childId: number,
  subject: string,
  percentage: number
) {
  return await supabase
    .from("progress")
    .upsert({
      child_id: childId,
      subject,
      percentage,
    });
}