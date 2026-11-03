"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ChatPage() {
  const [message, setMessage] = useState("");

const [messages, setMessages] = useState<
  { role: string; text: string }[]
>([]);

const [isLoading, setIsLoading] = useState(false);

  async function sendMessage() {
  if (!message.trim()) return;

  const userMessage = message;

  const childId =
  localStorage.getItem("selectedChildId");

  const { error } = await supabase
  .from("chat_messages")
  .insert({
    child_id: childId,
    role: "user",
    message: userMessage,
  });

if (error) console.error(error);

  setMessage("");

  setMessages((prev) => [
    ...prev,
    {
      role: "user",
      text: userMessage,
    },
  ]);

  setIsLoading(true);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: userMessage,
        history: messages,
      }),
    });

    const data = await response.json();

   const { error: budError } = await supabase
  .from("chat_messages")
  .insert({
    child_id: childId,
    role: "bud",
    message: data.reply,
  });

if (budError) console.error(budError);

    setMessages((prev) => [
      ...prev,
      {
        role: "bud",
        text: data.reply,
      },
    ]);
  } finally {
    setIsLoading(false);
  }
}

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "20px",
      }}
    >
      <h1>Chat with Bud 🌱</h1>

      <div
        style={{
          minHeight: "400px",
          border: "1px solid gray",
          padding: "15px",
          marginBottom: "20px",
          overflowY: "auto",
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              marginBottom: "15px",
            }}
          >
            <strong>
              {msg.role === "user"
                ? "You"
                : "Bud"}
              :
            </strong>{" "}
            {msg.text}
          </div>
        ))}
      </div>
      {isLoading && (
  <div>
    <strong>Bud:</strong> Bud is thinking... 🌱
  </div>
)}

      <input
        type="text"
        value={message}
        onChange={(e) =>
          setMessage(e.target.value)
        }
      onKeyDown={(e) => {
        if (e.key === "Enter") {
           sendMessage();
      }
    }}
  placeholder="Ask me anything"
  style={{
    width: "70%",
    height: "40px",
    fontSize: "16px",
    marginRight: "10px",
  }}
/>

      <button
        onClick={sendMessage}
        style={{
          height: "44px",
          padding: "0 20px",
        }}
      >
        Send
      </button>
    </div>
  );
}