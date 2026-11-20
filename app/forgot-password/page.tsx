/** Forgot password page (/forgot-password).
 * The parent types their email and presses "Send reset link".
 * Supabase emails them a link that opens /reset-password.
 * We always show the same message, so nobody can find out
 * which emails have accounts.
 */
// "use client" = runs in the browser
// (needed for useState and the form)
"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordReset } from "@/lib/auth";

export default function ForgotPasswordPage() {
  // ----- STATE = the page's memory -----
  // what's typed in the email box
  const [email, setEmail] = useState("");

  // red message ("" = no box shown)
  const [error, setError] = useState("");

  // green message ("" = no box shown)
  const [message, setMessage] = useState("");

  // waiting for Supabase?
  const [loading, setLoading] = useState(false);

  // ----- MAIN LOGIC -----
  // runs when you click "Send reset link" or press Enter
  async function handleSend(e: React.FormEvent<HTMLFormElement>) {
    // stop the page from reloading
    e.preventDefault();

    // clear old messages
    setError("");
    setMessage("");

    // email box filled in?
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    // button → "Sending..." (locked)
    setLoading(true);

    // ★ CALLS auth.ts ★
    // ask Supabase to send the reset email
    const { error } = await sendPasswordReset(email);

    // Supabase answered → button unlocked
    setLoading(false);

    // something went wrong on Supabase's side
    // (for example, too many requests)
    if (error) {
      setError("Couldn't send the email. Please try again in a few minutes.");
      return;
    }

    // same message whether the account exists or not
    setMessage(
      "If an account exists for this email, we've sent a link to reset your password. Check your inbox."
    );
  }

  // ----- WHAT THE USER SEES -----
  // same layout and colours as the login page
  return (
    <main className="min-h-screen bg-gray-100 px-4 py-12">
      <div className="mx-auto max-w-md">
        {/* link back to the login page */}
        <Link
          href="/login"
          className="mb-6 inline-block font-medium text-blue-700 hover:underline"
        >
          ← Back to log in
        </Link>

        {/* top title */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            ThinkFirst
          </h1>
          <p className="mt-1 text-gray-600">
            Reset your password
          </p>
        </header>

        {/* white card */}
        <section className="rounded-2xl bg-white p-6 shadow-md sm:p-8">
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            Forgot password?
          </h2>
          <p className="mb-6 text-gray-600">
            Enter the email you signed up with and we&apos;ll send you a link to make a new password.
          </p>

          {/* red box: only shows when there's an error */}
          {error && (
            <p
              role="alert"
              className="mb-5 rounded-lg bg-red-50 p-3 text-red-700"
            >
              {error}
            </p>
          )}

          {/* green box: only shows after the email is sent */}
          {message && (
            <p
              role="status"
              className="mb-5 rounded-lg bg-green-50 p-3 text-green-700"
            >
              {message}
            </p>
          )}

          {/* form: runs handleSend on click or Enter */}
          <form onSubmit={handleSend} className="space-y-5">
            {/* email box */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block font-semibold text-gray-800"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            {/* button: locked while waiting */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-700 px-5 py-3 font-medium text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
