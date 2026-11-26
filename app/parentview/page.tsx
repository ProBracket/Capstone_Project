/** Parent view (/parentview) — where parents land after logging in.
 * 1. Profile picker: "Who's learning today?" with the parent's children.
 *    Picking a child goes to the child experience at /child/welcome. A child
 *    with a picture lock enters their pictures first. Supabase remembers
 *    which child is playing on this device (active_child), not the URL.
 * 2. Gear button → PIN screen.
 * 3. Parent Dashboard → Parent Profile, Child Profiles and Conversation Transcripts.
 *
 * The PIN switch is turned OFF every time the picker shows or Settings opens,
 * so a child picking their profile can't get back into the dashboard
 * without the PIN. Supabase enforces this, not just the screens below.
 */
// "use client" makes this run in the browser, which it needs for useState,
// useEffect, and the logged-in session
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getCurrentUser, onSignInOrOut, signOut } from "@/lib/auth";
import { getChildren, gradeLabel, type Child } from "@/lib/children";
import { lockParentArea } from "@/lib/pin";
import { clearActiveChild, getChildrenWithPin, selectChild } from "@/lib/childPin";
import PinScreen from "./PinScreen";
import ChildPinScreen from "./ChildPinScreen";
import ChildProfiles from "./ChildProfiles";
import ChatHistory from "./ChatHistory";
import ParentProfile from "./ParentProfile";

const TERMS_VERSION = "draft-sprint3-v1";
const CONSENT_VERSION = "draft-sprint3-v1";

type Screen =
  | "home" // profile picker
  | "pin"
  | "dashboard"
  | "parent-profile"
  | "child-profiles"
  | "transcripts" | "terms" | "consent"
  | "child-pin"; // a child's picture PIN

export default function ParentView() {
  // tool to go to another page in code
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null); // null = not signed in
  const [profiles, setProfiles] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true); // true until the first user check finishes
  const [error, setError] = useState(""); // red banner
  const [screen, setScreen] = useState<Screen>("home");
  // Who's loaded right now, so a repeat sign-in event for the same parent is ignored
  const userIdRef = useRef<string | null>(null);
  const [lockedIds, setLockedIds] = useState<string[]>([]); // children with a picture lock
  const [pinChild, setPinChild] = useState<Child | null>(null); // who is typing their pictures

  // Which profiles show 🔒. Reloaded whenever the picker shows, since the
  // parent may have just changed a lock in Child Profiles.
  // Declared above the useEffect below, because that effect calls it.
  async function refreshLocks() {
    const { data } = await getChildrenWithPin();
    setLockedIds(data);
  }

  // Runs once when the page opens: load the user and their children,
  // then reload whenever they sign in or out
  useEffect(() => {
    // Set to false on cleanup so a slow request can't update the page after it's closed
    let active = true;

    async function loadParent() {
      const { data, error } = await getCurrentUser();

      if (!active) return;

      const nextUser = error ? null : data.user;

      // Same parent as before (Supabase can repeat SIGNED_IN, e.g. when the
      // tab regains focus): keep them on whatever screen they're on
      if (nextUser && nextUser.id === userIdRef.current) {
        setUser(nextUser);
        return;
      }

      userIdRef.current = nextUser?.id ?? null;
      setUser(nextUser);
      setScreen("home");

      if (!nextUser) {
        setProfiles([]);
        setLoading(false);
        return;
      }

      // The picker is showing, so make sure the parent area is locked
      // and no child is marked as playing on this device
      void lockParentArea();
      void clearActiveChild();
      void refreshLocks();

      const { data: children, error: childrenError } = await getChildren();

      if (!active) return;

      if (childrenError) {
        setError(childrenError.message);
      } else {
        setProfiles(children ?? []);
        setError("");
      }

      setLoading(false);
    }

    void loadParent();

    const unsubscribe = onSignInOrOut(() => void loadParent());

    // Cleanup: runs when the page closes
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Back to the picker: lock the parent area so a child can't get back in
  function goHome() {
    void lockParentArea();
    void clearActiveChild();
    void refreshLocks();
    setScreen("home");
  }

  // Tapping a profile on the picker: locked profiles ask for their pictures,
  // the others are marked as playing in Supabase and go straight in
  async function pickChild(child: Child) {
    setError("");

    if (lockedIds.includes(child.id)) {
      setPinChild(child);
      setScreen("child-pin");
      return;
    }

    const { error } = await selectChild(child.id);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/child/welcome");
  }

  // Gear button: lock first, then ask for the PIN.
  // Waits for the lock so it can't land after the PIN unlocks.
  async function openSettings() {
    await lockParentArea();
    setScreen("pin");
  }

  async function handleSignOut() {
    await lockParentArea();

    const { error } = await signOut();

    if (error) {
      setError(error.message);
      return;
    }

    // Signed out → back to the website homepage.
    // replace (not push) so the Back button doesn't return to /parentview
    router.replace("/");
  }

  return (
    <main className="min-h-screen bg-[#F8F7F4] px-4 py-8 text-[#1F2937]">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0F766E]">ThinkFirst</h1>
          </div>

          {user &&
            (screen === "home" ? (
              <button
                type="button"
                onClick={() => void openSettings()}
                aria-label="Open parent settings"
                title="Parent settings"
                className="rounded-md border border-slate-300 bg-white p-2 hover:bg-slate-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
                  <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.86 1.86-.06-.06A1.7 1.7 0 0 0 16 18.4a1.7 1.7 0 0 0-1 .8l-.04.1h-2.64l-.04-.1a1.7 1.7 0 0 0-1-.8 1.7 1.7 0 0 0-1.88.34l-.06.06-1.86-1.86.06-.06A1.7 1.7 0 0 0 7.88 15a1.7 1.7 0 0 0-.8-1l-.1-.04v-2.64l.1-.04a1.7 1.7 0 0 0 .8-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06 1.86-1.86.06.06A1.7 1.7 0 0 0 11.28 6a1.7 1.7 0 0 0 1-.8l.04-.1h2.64l.04.1a1.7 1.7 0 0 0 1 .8 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.86 1.86-.06.06A1.7 1.7 0 0 0 19.4 9.4a1.7 1.7 0 0 0 .8 1l.1.04v2.64l-.1.04a1.7 1.7 0 0 0-.8 1Z" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={goHome}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Back to Home
              </button>
            ))}
        </header>

        {error && (
          <p role="alert" className="mb-6 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {/* Three states: loading → not signed in → parent screens */}
        {loading ? (
          <p className="text-slate-600">Loading...</p>
        ) : !user ? (
          <section className="rounded-2xl border border-[#E5E2DB] bg-white p-6 shadow-sm text-center">
            <p className="text-slate-700">
              Please log in to see your children&apos;s profiles.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Log in
            </Link>
          </section>
        ) : (
          <>
            {/* Profile picker */}
            {screen === "home" && (
              <section className="rounded-2xl border border-[#E5E2DB] bg-white p-6 shadow-sm">
                <h2 className="text-center text-xl font-semibold">
                  Who&apos;s learning today?
                </h2>

                <p className="mt-1 mb-6 text-center text-sm text-slate-500">
                  {profiles.length === 0
                    ? "No child profiles yet. Add your first child to get started."
                    : "Choose a child profile to continue learning."}
                </p>

                <div className="flex flex-wrap justify-center gap-4">
                  {profiles.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => pickChild(child)}
                      className="flex w-32 flex-col items-center rounded-md border border-slate-200 p-4 hover:bg-slate-50"
                    >
                      {/* First letter of the name as a simple avatar */}
                      <span
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg font-medium text-slate-600"
                        aria-hidden="true"
                      >
                        {child.name.charAt(0).toUpperCase()}
                      </span>

                      <h3 className="mt-3 font-medium">{child.name}</h3>

                      <p className="text-sm text-slate-500">
                        {gradeLabel(child.grade)}
                      </p>

                      {lockedIds.includes(child.id) && (
                        <span className="mt-1 text-xs text-slate-500">🔒 Locked</span>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {screen === "pin" && (
              <PinScreen onUnlocked={() => setScreen("dashboard")} />
            )}

            {screen === "child-pin" && pinChild && (
              <ChildPinScreen
                child={pinChild}
                onUnlocked={() => router.push("/child/welcome")}
                onAskGrownUp={openSettings}
                onBack={goHome}
              />
            )}

            {/* Parent Dashboard */}
            {screen === "dashboard" && (
              <section className="rounded-2xl border border-[#E5E2DB] bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold">Parent Dashboard</h2>

                <p className="mt-1 mb-6 text-sm text-slate-500">
                  Manage your ThinkFirst family settings.
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setScreen("parent-profile")}
                    className="rounded-xl border border-[#E5E2DB] p-5 text-left bg-amber-100 hover:bg-amber-200"
                  >
                    <span aria-hidden="true" className="mb-3 block text-3xl">👤</span><h3 className="font-medium">Parent Profile</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      View and edit your account information.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScreen("child-profiles")}
                    className="rounded-xl border border-[#E5E2DB] p-5 text-left bg-sky-100 hover:bg-sky-200"
                  >
                    <span aria-hidden="true" className="mb-3 block text-3xl">👨‍👩‍👧</span><h3 className="font-medium">Child Profiles</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      View your children and add a new child.
                    </p>
                  </button>

                  <button
                     type="button"
                      onClick={() => setScreen("transcripts")}
                     className="rounded-xl border border-[#E5E2DB] p-5 text-left bg-pink-100 hover:bg-pink-200"
                  >
                    <span aria-hidden="true" className="mb-3 block text-3xl">💬</span><h3 className="font-medium">Conversation Transcripts</h3>

                    <p className="mt-1 text-sm text-slate-500">
                       View conversations between your children and Bud.
                    </p>
                  </button>

                  <button
  type="button"
  onClick={() => setScreen("consent")}
  className="rounded-xl border border-teal-200 bg-teal-100 p-5 text-left hover:bg-teal-200"
>
  <span aria-hidden="true" className="mb-3 block text-3xl">🛡️</span><h3 className="font-semibold">Parental Consent &amp; Privacy</h3>
  <p className="mt-1 text-sm">Review what data ThinkFirst stores.</p>
</button>

<button
  type="button"
  onClick={() => setScreen("terms")}
  className="rounded-xl border border-teal-200 bg-teal-100 p-5 text-left hover:bg-teal-200"
>
  <span aria-hidden="true" className="mb-3 block text-3xl">📋</span><h3 className="font-semibold">Terms &amp; Conditions</h3>
  <p className="mt-1 text-sm">Read the application terms.</p>
</button>
<button
                    type="button"
                    onClick={() => void handleSignOut()}
                    className="rounded-md border border-slate-200 p-4 text-left hover:bg-slate-50"
                  >
                    <span aria-hidden="true" className="mb-3 block text-3xl">🚪</span><h3 className="font-medium text-red-700">Log Out</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Sign out of your parent account.
                    </p>
                  </button>
                </div>
              </section>
            )}

            {screen === "parent-profile" && (
              <ParentProfile
                user={user}
                onUserUpdated={setUser}
                onBack={() => setScreen("dashboard")}
              />
            )}

            {/* TERMS & CONDITIONS */}
        {screen === "terms" && (
          <section className="rounded-2xl border border-[#E5E2DB] bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-2xl font-bold">
              ThinkFirst Terms &amp; Conditions
            </h2>

            <p className="mb-6 text-sm text-amber-700">
              Draft version {TERMS_VERSION} — team review required
              before public use.
            </p>

            <div className="space-y-4 leading-relaxed text-[#374151]">
              <p>
                <strong>1. Educational Purpose.</strong>{" "}
                ThinkFirst supports literacy, mathematics, science,
                and critical thinking for children ages 8–14.
              </p>

              <p>
                <strong>2. Parent Responsibility.</strong>{" "}
                Parents or authorized guardians manage their accounts
                and supervise children using the application.
              </p>

              <p>
                <strong>3. AI Content.</strong>{" "}
                AI-assisted educational responses may contain errors
                and should be reviewed.
              </p>

              <p>
                <strong>4. Appropriate Use.</strong>{" "}
                Users should not submit unnecessary personal or
                sensitive information or misuse the service.
              </p>

              <p>
                <strong>5. Privacy.</strong>{" "}
                Read the Parental Consent information for details
                about child data, learning activities, and microphone
                features.
              </p>

              <p>
                <strong>6. Changes.</strong>{" "}
                Terms must be reviewed, versioned, and communicated
                before they take effect.
              </p>
            </div>

            <button
              type="button"
              className="mt-7 text-[#0F766E] underline"
              onClick={() => setScreen("dashboard")}
            >
              Back
            </button>
          </section>
        )}

        {/* PARENTAL CONSENT */}
        {screen === "consent" && (
          <section className="rounded-2xl border border-[#E5E2DB] bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-2xl font-bold">
              Parental Consent &amp; Privacy
            </h2>

            <p className="mb-6 text-sm text-amber-700">
              Draft version {CONSENT_VERSION} — verify actual data
              handling before release.
            </p>

            <div className="space-y-4 leading-relaxed text-[#374151]">
              <p>
                <strong>1. Parent Account Data.</strong>{" "}
ThinkFirst uses Supabase Authentication to manage
parent names, email addresses and account credentials.
</p>

<p>
<strong>2. Child Profile Data.</strong>{" "}
The main database stores child names, dates of birth,
school grades and profile settings.
</p>

<p>
<strong>3. Learning Data.</strong>{" "}
The separate AI database stores calibrated learning
levels for mathematics, science and literature
to personalize learning activities.
</p>

<p>
<strong>4. AI Conversation Data.</strong>{" "}
Bud is designed to store conversation records,
messages and timestamps in the separate AI
Supabase database.
</p>

<p>
<strong>5. External AI Processing.</strong>{" "}
ThinkFirst uses OpenAI to generate educational
responses and lessons. Chat messages and conversation
history may be sent to OpenAI for processing.
Children should not enter sensitive personal information.
</p>

<p>
<strong>6. Privacy and Access.</strong>{" "}
ThinkFirst is designed to restrict family information
to authorized guardians. Database permissions and
transcript access controls require verification.
</p>

<p>
<strong>7. Prototype Limitations.</strong>{" "}
Data retention, deletion procedures and consent
withdrawal processes have not been fully established.
This application is an educational prototype.
</p></div>

            <button
              type="button"
              className="mt-7 text-[#0F766E] underline"
              onClick={() => setScreen("dashboard")}
            >
              Back
            </button>
          </section>
        )}

        
{/* Conversation Transcripts: the parent picks a child, then a
                conversation, and reads it (ChatHistory.tsx). */}
            {screen === "transcripts" && (
              <ChatHistory
                profiles={profiles}
                onBack={() => setScreen("dashboard")}
              />
            )}

            {screen === "child-profiles" && (
              <ChildProfiles
                profiles={profiles}
                onAdded={(child) => setProfiles((prev) => [...prev, child])}
                // A child was changed (e.g. microphone switched): go through the list
                // and swap in the new version where the id matches; keep everyone else as-is.
                onUpdated={(updated) =>
                  setProfiles((prev) =>
                    prev.map((child) => (child.id === updated.id ? updated : child))
                  )
                }
                onBack={() => setScreen("dashboard")}
              />
            )}
          </>
        )}

        <footer className="mt-8 text-center text-sm text-slate-500">
          ThinkFirst — Don&apos;t answer first. Think first.
        </footer>
      </div>
    </main>
  );
}



