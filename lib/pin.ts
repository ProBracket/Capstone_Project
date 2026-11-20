/** Parent PIN helpers.
 * The PIN is checked inside Supabase (database functions), never in the
 * browser, so it can't be read or skipped from DevTools. A correct PIN turns
 * the parent-area switch ON; lockParentArea turns it OFF. While the switch is
 * OFF, Supabase refuses to add, edit, or remove children.
 */
import { supabase } from "@/lib/supabase";

/** Asks whether this parent has created a PIN yet. Returns { data: true/false, error }. */
export function hasParentPin() {
  return supabase.rpc("has_parent_pin");
}

/** First-time PIN setup (exactly 4 digits). Also turns the switch ON.
 * Returns { error }; error.message is safe to show (e.g. "PIN already set").
 */
export function setParentPin(pin: string) {
  return supabase.rpc("set_parent_pin", { new_pin: pin });
}

/** Checks the PIN. Returns { data: true } when correct (switch ON) and
 * { data: false } when wrong. After 5 wrong tries error is set
 * ("Too many wrong attempts...") and the PIN is locked for 5 minutes.
 */
export function verifyParentPin(pin: string) {
  return supabase.rpc("verify_parent_pin", { pin });
}

/** Turns the switch OFF. Call whenever the parent leaves Settings/Dashboard,
 * so a child can't get back in without the PIN.
 */
export function lockParentArea() {
  return supabase.rpc("lock_parent_area");
}
