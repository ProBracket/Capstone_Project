/** Parent view (/parentview) — where parents land after logging in.
 * 1. Profile picker: "Who's learning today?" with the parent's children.
 *    Picking a child goes to the child experience at /child/welcome?childId=<id>.
 * 2. Gear button → PIN screen.
 * 3. Parent Dashboard → Parent Profile and Child Profiles.
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
import type { User } from "@supabase/supabase-js";
import { getCurrentUser, onSignInOrOut, signOut } from "@/lib/auth";
import { getChildren, gradeLabel, type Child } from "@/lib/children";
import { lockParentArea } from "@/lib/pin";
import PinScreen from "./PinScreen";
import ChildProfiles from "./ChildProfiles";
import ParentProfile from "./ParentProfile";

type Screen =
  | "home" // profile picker
  | "pin"
  | "dashboard"
  | "parent-profile"
  | "child-profiles";

export default function ParentView() {
  const [user, setUser] = useState<User | null>(null); // null = not signed in
  const [profiles, setProfiles] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true); // true until the first user check finishes
  const [error, setError] = useState(""); // red banner
  const [screen, setScreen] = useState<Screen>("home");
  // Who's loaded right now, so a repeat sign-in event for the same parent is ignored
  const userIdRef = useRef<string | null>(null);

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
      void lockParentArea();

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
    setScreen("home");
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
    }
    // onSignInOrOut reloads the page state after a successful sign out
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">ThinkFirst</h1>
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
          <section className="rounded-lg border border-slate-200 bg-white p-6 text-center">
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
              <section className="rounded-lg border border-slate-200 bg-white p-6">
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
                    <Link
                      key={child.id}
                      href={`/child/welcome?childId=${child.id}`}
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
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {screen === "pin" && (
              <PinScreen onUnlocked={() => setScreen("dashboard")} />
            )}

            {/* Parent Dashboard */}
            {screen === "dashboard" && (
              <section className="rounded-lg border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-semibold">Parent Dashboard</h2>

                <p className="mt-1 mb-6 text-sm text-slate-500">
                  Manage your ThinkFirst family settings.
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setScreen("parent-profile")}
                    className="rounded-md border border-slate-200 p-4 text-left hover:bg-slate-50"
                  >
                    <h3 className="font-medium">Parent Profile</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      View and edit your account information.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScreen("child-profiles")}
                    className="rounded-md border border-slate-200 p-4 text-left hover:bg-slate-50"
                  >
                    <h3 className="font-medium">Child Profiles</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      View your children and add a new child.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    className="rounded-md border border-slate-200 p-4 text-left hover:bg-slate-50"
                  >
                    <h3 className="font-medium text-red-700">Log Out</h3>
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

            {screen === "child-profiles" && (
              <ChildProfiles
                profiles={profiles}
                onAdded={(child) => setProfiles((prev) => [...prev, child])}
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
