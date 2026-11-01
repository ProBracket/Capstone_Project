/** Session helpers shared by any page that needs the logged-in user.
 * Pages call these instead of using the supabase client directly, so all
 * auth calls live in one place.
 */
import { supabase } from "@/lib/supabase";

/** Asks Supabase who is logged in. Returns { data: { user }, error }; user is null when nobody is signed in. */
export function getCurrentUser() {
  return supabase.auth.getUser();
}

/** Runs the callback whenever someone signs in or out.
 * Returns an unsubscribe function — call it when the page unmounts
 * (in the useEffect cleanup) so the listener doesn't keep running.
 */
export function onSignInOrOut(callback: () => void) {
  const { data } = supabase.auth.onAuthStateChange((event) => {
    // Other events (like token refresh) don't change who is logged in, so skip them
    if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
      callback();
    }
  });

  return () => data.subscription.unsubscribe();
}

/** Logs in with an email and password.
 * Returns { data: { user, session }, error }; error is set when the
 * account doesn't exist or the password is wrong.
 */
export function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email: email.trim(), // remove accidental spaces before/after the email
    password: password,
  });
}

/** Ends the current session. Returns { error }; error is null on success. */
export function signOut() {
  return supabase.auth.signOut();
}
