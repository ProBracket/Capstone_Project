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
 * adding Captcha Turnstile in the LOgin page
 */
export function signInWithEmail(
  email: string,
  password: string,
  captchaToken: string
) {
  return supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
    options: {
      captchaToken: captchaToken}
  });
}

/** Creates a new account with a name, email and password.
 * Returns { data: { user, session }, error }.
 * - session is set → the parent is logged in right away
 * - session is null → Supabase sent a confirmation email first
 */
export function signUpWithEmail(
  fullName: string,
  email: string,
  password: string,
  captchaToken: string
) {
  return supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { full_name: fullName.trim() },
      // Token comes from Turnstile check on the signup page
      captchaToken,
    },
  });
}
/** Ends the current session. Returns { error }; error is null on success. */
export function signOut() {
  return supabase.auth.signOut();
}

export function signInWithGoogle() {
    return supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/parentview`}
    });
} 
/** Sends a "reset your password" email.
 * The link in the email opens our /reset-password page.
 * Returns { error }; error is null when the request was accepted.
 */
export function sendPasswordReset(email: string) {
  return supabase.auth.resetPasswordForEmail(email.trim(), {
    // where the link in the email takes the parent
    // (works on localhost and on the Vercel site)
    redirectTo: `${window.location.origin}/reset-password`,
  });
} 
/** Saves a new password for the parent who opened the reset link.
 * Returns { error }; error is null on success.
 */
export function updatePassword(newPassword: string) {
  return supabase.auth.updateUser({ password: newPassword });
}