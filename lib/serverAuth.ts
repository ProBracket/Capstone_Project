/** Login check for server routes that use the AI.
 *
 * SERVER ONLY: used by app/api/bud, app/api/bud/problems, app/api/lesson and
 * app/api/chat. Each one calls requireSignedIn(request) first, so only a
 * signed-in parent (the child uses the app on the parent's login) can make
 * the server call OpenAI. Without this, anyone on the internet could call
 * these addresses directly and spend the OpenAI credit.
 *
 * How it works: the page sends the parent's Supabase access token in the
 * "Authorization: Bearer <token>" header (lib/authHeaders.ts). Here we ask
 * Supabase whether that token belongs to a real, signed-in user. A token
 * can't be faked: Supabase checks its signature and that it hasn't expired.
 */
import { createClient, type User } from "@supabase/supabase-js";

/** Reads the token from "Authorization: Bearer <token>", or null. */
function readBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  // The header must start with "Bearer " (any capitalisation), then the token.
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

/** The signed-in user who sent this request, or null if there is no valid
 * login token. Never throws.
 */
export async function getSignedInUser(request: Request): Promise<User | null> {
  const token = readBearerToken(request);
  if (!token) {
    return null;
  }

  try {
    // A fresh client for this one check. It must not remember any session,
    // because the server handles requests from many different users.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    // getUser(token) asks the Supabase Auth server to check the token.
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return null;
    }
    return data.user;
  } catch {
    return null;
  }
}

/** The response every protected route sends when there's no valid login. */
export function notSignedInResponse(): Response {
  return Response.json({ error: "Please log in to use Bud." }, { status: 401 });
}
