/** Child profile helpers.
 * Supabase only ever returns the logged-in parent's own children (row-level
 * security), so these functions never need to pass a parent id.
 */
import { supabase } from "@/lib/supabase";

/** One child profile, as stored in the children table. */
export type Child = {
  id: string;
  name: string;
  date_of_birth: string; // "YYYY-MM-DD"
  grade: number; // 0 = Kindergarten, 1–12 = grade
  // The parent's microphone switch for this child.
  // true  = the child may talk to Bud using the microphone
  // false = the child can only type (this is the default for new children)
  voice_enabled: boolean;
};

// Which columns to ask Supabase for whenever we load a child.
// Supabase sends back ONLY the columns listed here, so keep this in sync with
// the Child type above: every field there must be listed here too, or its
// value will silently be undefined.
// Every function below uses this one list, so a new column only needs adding once.
const CHILD_COLUMNS = "id, name, date_of_birth, grade, voice_enabled";

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
export function addChild(name: string, dateOfBirth: string, grade: number) {
  return supabase
    .from("children")
    .insert({ name: name.trim(), date_of_birth: dateOfBirth, grade })
    .select(CHILD_COLUMNS)
    .single();
}

/** Turns the microphone on or off for one child.
 * Returns { data: the updated child, error }.
 *
 * Like addChild, this only works while the parent area is unlocked (PIN entered).
 * That rule lives in the database, not here, so a child can never switch their
 * own microphone on, even by calling this function directly.
 */
export function setVoiceEnabled(childId: string, enabled: boolean) {
  return supabase
    .from("children") // 1. go to the children table
    .update({ voice_enabled: enabled }) // 2. change only this one column
    .eq("id", childId) // 3. ...and only on the row whose id matches this child.
    //                       Without this line, it would update EVERY child the parent has.
    .select(CHILD_COLUMNS) // 4. send back the updated row, so the screen shows what was really saved
    .single(); // 5. as one object instead of a list (we expect exactly one row)
}

/** Works out age in whole years from a "YYYY-MM-DD" date of birth.
 * Age is never stored, so it's always correct.
 */
export function getAge(dateOfBirth: string): number {
  // Split the string instead of using new Date(...) so time zones can't shift the day
  const [year, month, day] = dateOfBirth.split("-").map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;

  // Subtract a year if this year's birthday hasn't happened yet
  const thisMonth = today.getMonth() + 1;
  if (thisMonth < month || (thisMonth === month && today.getDate() < day)) {
    age -= 1;
  }

  return age;
}

/** 0 → "Kindergarten", 3 → "Grade 3" */
export function gradeLabel(grade: number): string {
  return grade === 0 ? "Kindergarten" : `Grade ${grade}`;
}
