import { supabase } from "./supabase";

// one row in the "Your Chats" lists
export type ConversationPreview = {
    id: string;
    startedAt: string;
    title: string; // child's message
};

// One saved message, exactly as it is stored in conversaiton_messages
export type SavedMessage = {
    role: "child" | "assistant";
    content: string;
};

// The shape Supabase sends back for the list query below
type ConversationRow = {
    id: string;
    started_at: string;
    conversation_messages: { content: string }[];
};

/** The child's past conversation, newest first. Each one comes with only its first child message, used as the title */
export async function listConversations(
    childId: string
): Promise<ConversationPreview[]> {
    const { data, error } = await supabase.from("conversations")
    // Get each conversation plus its message (joined by conversation_id)
    .select("id, started_at, conversation_messages(content)")
    .eq("child_id", childId)
    .eq("conversation_messages.role", "child")
    .order("created_at", { referencedTable: "conversation_messages", ascending: true})
    .limit(1, {referencedTable: "conversation_messages"})
    // Newest conversations at the top, at most 30
    .order("started_at", {ascending: false})
    .limit(30);

    if (error) {
        console.error(error);
        return[];
    }

    return (data as ConversationRow[]).map((row) => ({
        id: row.id,
        startedAt: row.started_at,
        title: row.conversation_messages[0]?.content ?? "New chat",
    }));
}

/** Every message in one conversation, in the order they were sent. */
export async function getMessages(conversationId: string): Promise<SavedMessage[]> {
    const { data, error } = await supabase
    .from("conversation_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", {ascending: true })
    .order("id", {ascending: true });

    if (error) {
        console.error(error);
        return[];
    }
    return data as SavedMessage[];
}