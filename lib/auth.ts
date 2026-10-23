/** Session helpers shared by any page that needs the logged-in user. */
import { supabase } from "@/lib/supabase";

export function getCurrentUser() {
  return supabase.auth.getUser();
}

/** Runs the callback whenever someone signs in or out. Returns an unsubscribe function. */
export function onSignInOrOut(callback: () => void) {
  const { data } = supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
      callback();
    }
  });

  return () => data.subscription.unsubscribe();
}

export function signOut() {
  return supabase.auth.signOut();
}
