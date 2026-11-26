"use client";

import { useState } from "react";
import type { Child } from "@/lib/children";
import { verifyChildPin } from "@/lib/childPin";
import { PIN_LENGTH, PIN_PICTURES } from "@/lib/pinPictures";

type Props = {
    child: Child;
    onUnlocked: () => void;
    onAskGrownUp: () => void;
    onBack: () => void;
};

export default function ChildPinScreen({ child, onUnlocked, onAskGrownUp, onBack }: Props) {
    const [picks, setPicks] = useState<string[]>([]);
    const [checking, setChecking] = useState(false);
    const [message, setMessage] = useState("");
    const [shake, setShake] =useState(false);

    async function handleTap(id: string) {
        if (checking || picks.length >= PIN_LENGTH) return;

        const next = [...picks, id];
        setPicks(next);
        setMessage("");
        if(next.length < PIN_LENGTH) return;

        setChecking(true);
        const { data, error } = await verifyChildPin(child.id, next);
        setChecking(false);

        if (data === true) {
            onUnlocked();
            return;
        }

        setPicks([]);
        if(error) {
            setMessage(error.message);
            return;
        }
        setMessage("Hmm, not quite. Try again!");
        setShake(true);
    }

    return(
        <section className="mx-auto max-w-sm rounded-lg border border-slate-200 bg-white p-6 text-center">
            <span
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl font-medium text-slate-600"
                aria-hidden="true"
                >
                    {child.name.charAt(0).toUpperCase()}
                </span>
                <h2 className="mt-3 text-xl font-semibold">Hi {child.name}!</h2>
                <p className="mt-1 text-sm text-slate-500">Tap your {PIN_LENGTH} secret pictures.</p>

                <div
                    className={`mt-4 flex justify-center gap-2 ${shake ? "animate-shake" : ""}`}
                    onAnimationEnd={() => setShake(false)}
                    aria-label={`${picks.length} of ${PIN_LENGTH} picked`}
                    >
                        {Array.from({ length: PIN_LENGTH }, (_, i) => (
                            <span
                                key={i}
                                className={`h-4 w-4 rounded-full ${i < picks.length ? "bg-slate-900" : "bg-slate-300"}`}
                                />
                        ))}
                    </div>

                    {message && <p role="alert" className="mt-3 text-sm text-slate-700">{message}</p>}

                    <div className="mx-auto mt-4 grid max-w-xs grid-cols-3 gap-2">
                        {PIN_PICTURES.map((picture) => (
                            <button
                                key={picture.id}
                                type="button"
                                onClick={() => handleTap(picture.id)}
                                disabled={checking}
                                aria-label={picture.label}
                                className="rounded-md border border-slate-200 bg-white py-3 text-4xl hover:bg-slate-100 active:scale-95 disabled:opacity-50"
                                >
                                    {picture.emoji}
                                </button>
                        ))}
                    </div>

                    <div className="mt-6 flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={onAskGrownUp}
                            className="text-sm font-medium text-slate-700 underline hover:text-slate-900"
                            >
                                Forgot? Ask a grown-up
                            </button>
                            <button
                                type="button"
                                onClick={onBack}
                                className="mx-auto rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
                                >
                                    Back
                                </button>
                    </div>
        </section>
    );
}