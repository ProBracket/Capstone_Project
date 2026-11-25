import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return Response.json(
      { error: "Login required" },
      { status: 401 }
    );
  }

  const token = authorization.slice(7);

  try {
    const { childId } = await request.json();

    if (typeof childId !== "string" || !childId) {
      return Response.json(
        { error: "Child profile required" },
        { status: 400 }
      );
    }

    const main = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: {
          headers: { Authorization: authorization },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { data: { user }, error: authError } =
      await main.auth.getUser(token);

    if (authError || !user) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const unlocked = await main.rpc("parent_area_unlocked");

    if (unlocked.error || unlocked.data !== true) {
      return Response.json(
        { error: "Parent PIN required" },
        { status: 403 }
      );
    }

    const child = await main
      .from("children")
      .select("id")
      .eq("id", childId)
      .eq("parent_id", user.id)
      .maybeSingle();

    if (child.error || !child.data) {
      return Response.json(
        { error: "Child access denied" },
        { status: 403 }
      );
    }

    const ai = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_AI_URL!,
      process.env.SUPABASE_AI_SECRET_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const sessions = await ai
      .from("conversations")
      .select("id,child_id,created_at")
      .eq("child_id", childId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (sessions.error) throw sessions.error;

    const conversations = sessions.data ?? [];
    const ids = conversations.map(item => item.id);

    const messages = ids.length
      ? await ai
          .from("conversation_messages")
          .select("id,conversation_id,role,content,created_at")
          .in("conversation_id", ids)
          .order("created_at", { ascending: true })
          .limit(500)
      : { data: [], error: null };

    if (messages.error) throw messages.error;

    return Response.json(
      {
        conversations,
        messages: messages.data ?? [],
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch {
    return Response.json(
      { error: "Unable to retrieve transcripts" },
      { status: 500 }
    );
  }
}
