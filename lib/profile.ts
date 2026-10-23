/** Profile data. For now the name lives in the auth user's metadata, not a table. */
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export function getFullName(user: User | null): string {
  return user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? "";
}

export function updateFullName(fullName: string) {
  return supabase.auth.updateUser({
    data: {
      full_name: fullName.trim(),
    },
  });
}
