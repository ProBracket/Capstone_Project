import { supabase } from "./supabase";

export async function getChallenges() {
  return await supabase
    .from("challenges")
    .select("*")
    .order("id", { ascending: true });
}