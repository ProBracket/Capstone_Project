import { supabase } from "./supabase";

export async function getAchievements(childId: number) {
  return await supabase
    .from("achievements")
    .select("*")
    .eq("child_id", childId);
}