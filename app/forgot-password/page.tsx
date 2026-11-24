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
// line icons (same icon set as the rest of the app)
import { ArrowLeft, Sprout } from "lucide-react";

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
  // same layout and colours as the login and create account pages
  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-12">
      {/* soft coloured circles in the background (decoration only).
          Different spots from login and sign up: yellow top-right, blue left, pink bottom-right */}
      <div aria-hidden="true" className="absolute -top-36 right-[15%] h-64 w-64 rounded-full bg-amber-200" />
      <div aria-hidden="true" className="absolute -left-20 top-1/3 h-56 w-56 rounded-full bg-sky-200" />
      <div aria-hidden="true" className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-pink-200" />

      {/* small "back" link in the top-left corner: goes back to the login page */}
      <Link
        href="/login"
        className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-control bg-surface/80 px-3 py-2 text-sm font-semibold text-foreground hover:bg-surface"
      >
        <ArrowLeft aria-hidden="true" size={16} strokeWidth={2.25} />
        Back to log in
      </Link>

      <div className="relative mx-auto max-w-md">
        {/* logo (just a picture here, not a link) */}
        <header className="mb-8 flex flex-col items-center text-center">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-control bg-primary text-on-primary">
              <Sprout aria-hidden="true" size={22} strokeWidth={2.25} />
            </span>
            <span className="text-2xl font-semibold text-foreground">ThinkFirst</span>
          </div>
          <p className="mt-3 text-lg font-semibold text-foreground">No worries!</p>
          <p className="mt-1 text-muted">We&apos;ll help you get back into your account.</p>
        </header>

        {/* Chunky game-style edge: thick border on the bottom (border-b-8) */}
        <section className="rounded-3xl border-2 border-b-8 border-border bg-surface p-6 sm:p-8">
          <h1 className="mb-2 text-2xl font-bold text-foreground">
            Forgot password?
          </h1>
          <p className="mb-6 text-muted">
            Enter the email you signed up with and we&apos;ll send you a link to make a new password.
          </p>

          {/* red box: only shows when there's an error */}
          {error && (
            <p
              role="alert"
              className="mb-5 rounded-control bg-danger-soft p-3 text-danger"
            >
              {error}
            </p>
          )}

          {/* green box: only shows after the email is sent */}
          {message && (
            <p
              role="status"
              className="mb-5 rounded-control bg-success-soft p-3 text-success"
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
                className="mb-2 block font-semibold text-foreground"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border-2 border-border bg-surface p-3 text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            {/* chunky teal button: locked while waiting, sinks when clicked */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl border-b-4 border-teal-900 bg-primary px-5 py-3 font-extrabold text-on-primary hover:bg-primary-hover active:translate-y-1 active:border-b-0 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
