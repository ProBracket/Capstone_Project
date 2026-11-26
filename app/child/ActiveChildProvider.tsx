/** Asks Supabase which child is playing on this device, once, when a
 * /child page opens. If nobody is, goes back to the profile picker.
 * Pages read the id with useActiveChildId() instead of the URL or
 * localStorage, so it can't be faked by editing either one.
 */
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getActiveChild } from "@/lib/childPin";
import { setActiveChildId } from "@/lib/activeChild";

const ActiveChildContext = createContext<string | null>(null);

/** The id of the child who is playing. Only works inside /child pages. */
export function useActiveChildId() {
  const childId = useContext(ActiveChildContext);
  if (!childId) {
    throw new Error("useActiveChildId only works inside the /child pages");
  }
  return childId;
}

export default function ActiveChildProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [childId, setChildId] = useState<string | null>(null);

  useEffect(() => {
    // Set to true on cleanup so a slow answer can't update a closed page
    let cancelled = false;

    getActiveChild().then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data) {
        // Nobody picked (old link, address bar, logged out): back to the picker.
        // replace (not push) so Back doesn't return here.
        router.replace("/parentview");
        return;
      }
      // Also save it where older code reads it (lib/activeChild.ts: the chat,
      // LessonView), so those pages always get the child Supabase says is playing
      setActiveChildId(data);
      setChildId(data);
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Still checking, or on the way back to the picker
  if (!childId) {
    return <p className="p-8 text-center text-sm text-slate-500">Loading...</p>;
  }

  return (
    <ActiveChildContext.Provider value={childId}>{children}</ActiveChildContext.Provider>
  );
}
