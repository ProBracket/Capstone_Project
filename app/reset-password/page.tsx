/** Reset password page (/reset-password).
 * The parent lands here from the link in the reset email.
 * Supabase reads the link and signs them in for this one step,
 * then they type a new password and press "Save new password".
 * - Saved → go to the Parent Profile page (/parentview).
 * - Link missing or expired → tell them to ask for a new one.
 */
// "use client" = runs in the browser
// (needed for useState, useEffect and the form)
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUser, updatePassword } from "@/lib/auth";
// line icons (same icon set as the rest of the app)
import { Sprout } from "lucide-react";

export default function ResetPasswordPage() {
  // tool to go to another page in code
  const router = useRouter();

  // ----- STATE = the page's memory -----
  // what's typed in each box (starts empty)
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // red message ("" = no box shown)
  const [error, setError] = useState("");

  // waiting for Supabase?
  const [loading, setLoading] = useState(false);

  // did the reset link work?
  // "checking" → "ok" (show the form) or "bad" (link expired)
  const [linkStatus, setLinkStatus] = useState("checking");

  // ----- RUNS ONCE WHEN THE PAGE OPENS -----
  // Supabase reads the link in the address bar and signs the
  // parent in. We check that worked before showing the form.
  useEffect(() => {
    getCurrentUser().then(({ data }) => {
      setLinkStatus(data.user ? "ok" : "bad");
    });
  }, []);

  // ----- MAIN LOGIC -----
  // runs when you click "Save new password" or press Enter
  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    // stop the page from reloading
    e.preventDefault();

    // clear old message
    setError("");

    // both boxes filled in?
    if (!password || !confirm) {
      setError("Please fill in both boxes.");
      return;
    }

    // Supabase needs at least 6 characters
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    // both passwords must match
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    // button → "Saving..." (locked)
    setLoading(true);

    // ★ CALLS auth.ts ★
    // ask Supabase to save the new password
    const { error } = await updatePassword(password);

    // Supabase answered → button unlocked
    setLoading(false);

    // Supabase said no (for example, same as the old password)
    if (error) {
      setError(error.message);
      return;
    }

    // saved → the parent is logged in, go to Parent Profile
    router.push("/parentview");
  }

  // ----- WHAT THE USER SEES -----
  // same layout and colours as the login, sign up and forgot password pages
  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-12">
      {/* soft coloured circles in the background (decoration only).
          Different spots from the other pages: pink top-left, yellow right, blue bottom */}
      <div aria-hidden="true" className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-pink-200" />
      <div aria-hidden="true" className="absolute -right-20 top-1/2 h-56 w-56 rounded-full bg-amber-200" />
      <div aria-hidden="true" className="absolute -bottom-32 left-[55%] h-80 w-80 rounded-full bg-sky-200" />

      <div className="relative mx-auto max-w-md">
        {/* logo (just a picture here, not a link) */}
        <header className="mb-8 flex flex-col items-center text-center">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-control bg-primary text-on-primary">
              <Sprout aria-hidden="true" size={22} strokeWidth={2.25} />
            </span>
            <span className="text-2xl font-semibold text-foreground">ThinkFirst</span>
          </div>
          <p className="mt-3 text-lg font-semibold text-foreground">Almost there!</p>
          <p className="mt-1 text-muted">Choose a new password for your account.</p>
        </header>

        {/* Chunky game-style edge: thick border on the bottom (border-b-8) */}
        <section className="rounded-3xl border-2 border-b-8 border-border bg-surface p-6 sm:p-8">
          {/* still checking the link */}
          {linkStatus === "checking" && (
            <p className="text-muted">Checking your reset link...</p>
          )}

          {/* link missing or expired */}
          {linkStatus === "bad" && (
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-foreground">
                Link expired
              </h1>
              <p className="text-muted">
                This reset link has expired or was already used. Please ask for a new one.
              </p>
              <Link
                href="/forgot-password"
                className="block w-full rounded-2xl border-b-4 border-teal-900 bg-primary px-5 py-3 font-extrabold text-on-primary hover:bg-primary-hover active:translate-y-1 active:border-b-0 text-center"
              >
                Send a new link
              </Link>
            </div>
          )}

          {/* link worked → show the form */}
          {linkStatus === "ok" && (
            <>
              <h1 className="mb-6 text-2xl font-bold text-foreground">
                New password
              </h1>

              {/* red box: only shows when there's an error */}
              {error && (
                <p
                  role="alert"
                  className="mb-5 rounded-control bg-danger-soft p-3 text-danger"
                >
                  {error}
                </p>
              )}

              {/* form: runs handleSave on click or Enter */}
              <form onSubmit={handleSave} className="space-y-5">
                {/* new password box */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block font-semibold text-foreground"
                  >
                    New Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border-2 border-border bg-surface p-3 text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                {/* confirm password box */}
                <div>
                  <label
                    htmlFor="confirm"
                    className="mb-2 block font-semibold text-foreground"
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full rounded-2xl border-2 border-border bg-surface p-3 text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                {/* chunky teal button: locked while waiting, sinks when clicked */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl border-b-4 border-teal-900 bg-primary px-5 py-3 font-extrabold text-on-primary hover:bg-primary-hover active:translate-y-1 active:border-b-0 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save new password"}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
