/** Headers for calling our AI routes from a page (browser side).
 *
 * Adds the signed-in parent's login token, so the route can check it
 * (lib/serverAuth.ts). If nobody is signed in, only the JSON header is sent
 * and the route answers 401; the pages then fall back to the rule-based
 * messages and backup questions, so nothing breaks.
 */
import { supabase } from "@/lib/supabase";

export async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    // The current login session, kept by the Supabase client in the browser
    // (and refreshed automatically before it expires).
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // No session available: send without a token.
  }
  return headers;
}
