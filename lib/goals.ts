import { supabase } from "./supabase";

export async function getGoals(childId: number) {
  return await supabase
    .from("goals")
    .select("*")
    .eq("child_id", childId)
    .order("id", { ascending: true });
}

export async function addGoal(
  childId: number,
  title: string,
  description: string
) {
  return await supabase
    .from("goals")
    .insert([
      {
        child_id: childId,
        title,
        description,
      },
    ]);
}