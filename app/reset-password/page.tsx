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
  // same layout and colours as the login page
  return (
    <main className="min-h-screen bg-gray-100 px-4 py-12">
      <div className="mx-auto max-w-md">
        {/* top title */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            ThinkFirst
          </h1>
          <p className="mt-1 text-gray-600">
            Choose a new password
          </p>
        </header>

        {/* white card */}
        <section className="rounded-2xl bg-white p-6 shadow-md sm:p-8">
          {/* still checking the link */}
          {linkStatus === "checking" && (
            <p className="text-gray-600">Checking your reset link...</p>
          )}

          {/* link missing or expired */}
          {linkStatus === "bad" && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Link expired
              </h2>
              <p className="text-gray-600">
                This reset link has expired or was already used. Please ask for a new one.
              </p>
              <Link
                href="/forgot-password"
                className="block w-full rounded-lg bg-blue-700 px-5 py-3 text-center font-medium text-white hover:bg-blue-800"
              >
                Send a new link
              </Link>
            </div>
          )}

          {/* link worked → show the form */}
          {linkStatus === "ok" && (
            <>
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                New password
              </h2>

              {/* red box: only shows when there's an error */}
              {error && (
                <p
                  role="alert"
                  className="mb-5 rounded-lg bg-red-50 p-3 text-red-700"
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
                    className="mb-2 block font-semibold text-gray-800"
                  >
                    New Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                {/* confirm password box */}
                <div>
                  <label
                    htmlFor="confirm"
                    className="mb-2 block font-semibold text-gray-800"
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                {/* button: locked while waiting */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-blue-700 px-5 py-3 font-medium text-white hover:bg-blue-800 disabled:opacity-50"
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