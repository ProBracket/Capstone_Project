/** Child profile helpers.
 * Supabase only ever returns the logged-in parent's own children (row-level
 * security), so these functions never need to pass a parent id.
 */
import { supabase } from "@/lib/supabase";

/** One child profile, as stored in the children table. */
export type Child = {
  id: string;
  name: string;
  age: number; // in years, typed in by the parent
  grade: number; // 0 = Kindergarten, 1–12 = grade
};

const CHILD_COLUMNS = "id, name, age, grade";

/** Gets the logged-in parent's children, in the order they were added. Returns { data, error }. */
export function getChildren() {
  return supabase
    .from("children")
    .select(CHILD_COLUMNS)
    .order("created_at", { ascending: true });
}

/** Adds a child for the logged-in parent and returns { data: the new child, error }.
 * Only works while the parent area is unlocked (PIN entered); otherwise
 * Supabase rejects it with a row-level security error (code "42501").
 */
export function addChild(name: string, age: number, grade: number) {
  return supabase
    .from("children")
    .insert({ name: name.trim(), age, grade })
    .select(CHILD_COLUMNS)
    .single();
}

/** 0 → "Kindergarten", 3 → "Grade 3" */
export function gradeLabel(grade: number): string {
  return grade === 0 ? "Kindergarten" : `Grade ${grade}`;
}
