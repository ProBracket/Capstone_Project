import { supabaseAI } from "@/lib/supabase-ai";

export async function createAIProfile(
  childId: string,
  childName: string,
  mathLevel: number,
  scienceLevel: number,
  literatureLevel: number
) {
  return await supabaseAI
    .from("ai_profiles")
    .upsert({
      child_id: childId,
      child_name: childName,
      math_level: mathLevel,
      science_level: scienceLevel,
      literature_level: literatureLevel,
    });
}

export async function getAIProfile(
  childId: string
) {
  return await supabaseAI
    .from("ai_profiles")
    .select("*")
    .eq("child_id", childId)
    .single();
}