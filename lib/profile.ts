/** Profile data helpers.
 * For now the name is stored in the auth user's metadata (a JSON field on
 * the login record), not in a database table. When we add a profiles table,
 * its queries go here and the pages that use these functions won't change.
 */
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

/** Reads the user's name. Falls back to `name`, which some sign-in providers set instead of `full_name`. */
export function getFullName(user: User | null): string {
  return user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? "";
}

/** Saves a new name for the logged-in user. Returns { data: { user }, error } with the updated user. */
export function updateFullName(fullName: string) {
  return supabase.auth.updateUser({
    data: {
      full_name: fullName.trim(),
    },
  });
}
