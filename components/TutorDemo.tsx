"use client";

import { useEffect, useRef, useState } from "react";
import { getBudReply, getOpeningReply, TUTOR_NAME, type TutorState } from "@/lib/tutor";

type DemoMessage = { from: "child" | "bud"; text: string};

//Bud's First Message
const opening = getOpeningReply();

export default function TutorDemo() {
    const [message, setMessages] = useState<DemoMessage[]>([
        {from: "bud", text: opening.message },
    ]);
    const [tutorState, setTutorState] = useState<TutorState>(opening.state);
    const [draft, setDraft] = useState("")
    const listRef = useRef<HTMLDivElement>(null);

    // Keeping the newest message in view
    useEffect(() => {
        const list = listRef.current;
        if (list) list.scrollTop = list.scrollHeight;
    }, [message]);

    function handleSend(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const text = draft.trim();
        if (!text) return;

        const reply = getBudReply(tutorState, text);
        setMessages([
            ...message,
            {from: "child", text },
            {from: "bud", text: reply.message },
        ]);
        setTutorState(reply.state);
        setDraft("");
    }
    function handleRestart() {
        setMessages([{ from: "bud", text: opening.message }]);
        setTutorState(opening.state);
        setDraft("");
    }

    return (
        <div
            className="rounded-card border border-border bg-surface p-5 shadow-raised"
            aria-label={`Try talking to {TUTOR_NAME}`}>
                <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Try it: talk to {TUTOR_NAME}
                    </p>
                    <button
                    type="button"
                    onClick={handleRestart}
                    className="text-xs font-semibold text-muted hover:text-foreground">Start over</button>
                </div>

                <div ref={listRef}
                aria-live="polite"
                className="mt-4 flex max-h-80 flex-col gap-3 overflow-y-auto text-sm">{message.map((m, i) => (
                    <p 
                    key={i}
                    className={
                        m.from === "child"
                            ? "max-w-[85%] self-end rounded-card bg-primary px-4 py-2 text-on-primary"
                            : "max-w-[85%] whitespace-pre-line rounded-card bg-surface-muted px-4 py-2 text-foreground"
                    }>{m.text}</p>
                ))}
                </div>

                <form onSubmit={handleSend} className="mt-4 flex gap-2">
                    <input 
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        disabled={tutorState.finished}
                        maxLength={200}
                        placeholder={tutorState.finished ? "All Done! Press Start over" : "Type your answer..."}
                        aria-label="Your answer"
                        className="min-w-0 flex-1 rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
                        />
                        <button
                        type="submit"
                        disabled={tutorState.finished || !draft.trim()}
                        className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-50"
                        >
                            Send
                        </button>
                </form>
            </div>
    );
}