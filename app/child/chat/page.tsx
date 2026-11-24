"use client";

import ChildNavbar from "@/components/ChildNavbar";
import { useState, useEffect, useRef, type SubmitEvent } from "react";
import { supabase } from "@/lib/supabase";

type ChatMessage = {
  role: "user" | "bud";
  text: string;
};

// Ideas shown before the first message. Clicking one fills the typing box.
const SUGGESTIONS = [
  "Help me with fractions ➗",
  "Why is the sky blue? 🌤️",
  "Tell me a fun science fact 🔬",
  "Help me write a story ✏️",
];

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const conversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Not named "use..." because React treats those names as hooks
  function pickSuggestion(text: string) {
    setMessage(text);
    inputRef.current?.focus();
  }

  // Creates the conversation on the first message and reuses it after that
  async function getConversationId(childId: string) {
    if (conversationIdRef.current) return conversationIdRef.current;

    const { data, error } = await supabase
    .from("conversations")
    .insert({ child_id: childId })
    .select("id")
    .single();

    if (error) {
      console.error(error);
      return null;
    }

    conversationIdRef.current = data.id;
    return data.id;
  }

  // Saves one message to the transcript
  async function saveMessage(
    conversationId: string | null,
    role: "child" | "assistant",
    content: string 
  ) {
    if (!conversationId) return;

    const { error } = await supabase.from("conversation_messages").insert({
      conversation_id: conversationId,
      role,
      content,
    });
    if (error) console.error(error);
  }

  async function sendMessage(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if(!message.trim() || isLoading) return;

    const userMessage = message.trim();
    const childId = localStorage.getItem("selectedChildId");

    setMessage("");
    setMessages((prev) => [...prev, {role: "user", text: userMessage }]);
    setIsLoading(true);

    const conversationId = childId ? await getConversationId(childId) : null;
    await saveMessage(conversationId, "child", userMessage);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ message: userMessage, history: messages}),
      });

      const data = await response.json();

      if (!response.ok || !data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "bud", text: "Oops, I couldn't think of an answer. Try again! 🌱"},
        ]);
        return;
      }

      await saveMessage(conversationId, "assistant", data.reply);

      setMessages((prev) => [...prev, {role: "bud", text: data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "bud", text: "Oops, something went wrong. Try again! 🌱"},
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
     <>
      <ChildNavbar />

      <main className="ml-sidebar h-screen bg-background p-6 flex justify-center">
        <div className="flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-card border border-border bg-surface shadow-raised">

          {/* Header: Bud's avatar and name */}
          <header className="flex items-center gap-4 border-b border-border px-6 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-2xl">
              🌱
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Bud</h1>
              <p className="text-sm text-muted">Your Think First learning buddy</p>
            </div>
          </header>

          {/* Messages */}
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-6">
            {messages.length === 0 && (
              <div className="m-auto flex max-w-md flex-col items-center text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary-soft text-5xl">
                  🌱
                </div>
                <h2 className="text-2xl font-bold text-foreground">Hi! I&apos;m Bud.</h2>
                <p className="mt-2 text-lg text-muted">
                  Ask me anything. I&apos;ll help you think it through!
                </p>

                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((text) => (
                    <button
                      key={text}
                      type="button"
                      onClick={() => pickSuggestion(text)}
                      className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground transition hover:border-primary hover:bg-primary-soft"
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, index) =>
              msg.role === "user" ? (
                // Child's message: right side, teal
                <div
                  key={index}
                  className="self-end max-w-[75%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-lg text-on-primary whitespace-pre-line"
                >
                  {msg.text}
                </div>
              ) : (
                // Bud's message: left side, with a small avatar
                <div key={index} className="flex max-w-[80%] items-end gap-2 self-start">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-base">
                    🌱
                  </div>
                  <div className="rounded-2xl rounded-bl-md bg-surface-muted px-4 py-3 text-lg text-foreground whitespace-pre-line">
                    {msg.text}
                  </div>
                </div>
              )
            )}

            {/* Typing dots while Bud is thinking */}
            {isLoading && (
              <div className="flex items-end gap-2 self-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-base">
                  🌱
                </div>
                <div className="flex gap-1 rounded-2xl rounded-bl-md bg-surface-muted px-4 py-4">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted [animation-delay:300ms]" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Typing box */}
          <form
            onSubmit={sendMessage}
            className="flex gap-3 border-t border-border bg-surface px-6 py-4"
          >
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your question..."
              maxLength={200}
              className="flex-1 rounded-full border border-border bg-background px-5 py-3 text-lg text-foreground placeholder:text-muted outline-none transition focus:border-primary"
            />
            <button
              type="submit"
              disabled={isLoading || !message.trim()}
              className="rounded-full bg-primary px-6 py-3 font-semibold text-on-primary transition hover:bg-primary-hover disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </main>
    </>  
  );
}
