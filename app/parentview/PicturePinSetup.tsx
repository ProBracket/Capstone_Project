"use client";

import { useState } from "react";
import { PIN_LENGTH, PIN_PICTURES } from "@/lib/pinPictures";

type Props = {
    childName: string;
    saving: boolean;
    onDone: (picks: string[]) => void;
    onCancel: () => void;
};

export default function PicturePinSetup({childName, saving, onDone, onCancel }: Props) {
    const [firstRound, setFirstRound] = useState<string[] | null>(null);
    const [picks, setPicks] = useState<string[]>([]);
    const [hint, setHint] = useState("");

    function handleTap(id: string) {
        if (saving || picks.length >= PIN_LENGTH) return;

        const next = [...picks, id];
        setPicks(next);
        setHint("");
        if (next.length < PIN_LENGTH) return;

        if (!firstRound) {
            setFirstRound(next);
            setPicks([]);
            return;
        }

        if (next.join("-") === firstRound.join("-")) {
            onDone(next);
        } else {
            setFirstRound(null);
            setPicks([]);
            setHint("Those didn't match. Let's start over.");
        }
    }

    return (
        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-4">
            <p className="font-medium">
                {firstRound
                ? "Now tap the same 3 pictures again."
            : `Let ${childName} tap ${PIN_LENGTH} pictures, in order.` }
            </p>

            {hint && <p role="alert" className="mt-1 text-sm text-red-700">{hint}</p>}

            <div className="mt-3 flex gap-2" aria-label={`${picks.length} of ${PIN_LENGTH} picked`}>
                {Array.from({ length: PIN_LENGTH }, (_, i) => (
                    <span
                        key={i}
                        className={`h-3 w-3 rounded-full ${i < picks.length ? "bg-slate-900" : "bg-slate-300"}`}
                        />
                ))}
            </div>

            <div className="mt-4 grid max-w-xs grid-cols-3 gap-2">
                {PIN_PICTURES.map((picture) => (
                    <button
                        key={picture.id}
                        type="button"
                        onClick={() => handleTap(picture.id)}
                        disabled={saving}
                        aria-label={picture.label}
                        className="rounded-md border border-slate-200 bg-white py-3 text-4xl hover:bg-slate-100 disabled:opacity-50"
                        >
                            {picture.emoji}
                        </button>
                    ))}
            </div>

            <div className="mt-4 flex gap-2">
                <button
                    type="button"
                    onClick={() => setPicks((current) => current.slice(0, -1))}
                    disabled={saving || picks.length === 0}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
                    >
                        Undo
                    </button>
                    
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={saving}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    {saving && <span className="self-center text-sm text-slate-500"> Saving...</span>}
            </div>
        </div>
    );
}