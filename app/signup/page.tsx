/** Create account page (/signup).
 * Parents type their name, email and password and press "Create account".
 * - Account made and logged in → go to the Parent Profile page (/parentview).
 * - Supabase needs the email confirmed first → show a green
 *   "check your email" message.
 * - Something wrong (email used, short password) → show a red message.
 * Same look as the login page (chunky box, colour circles).
 */
// "use client" = runs in the browser
// (needed for useState and the form)
"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUpWithEmail } from "@/lib/auth";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
// line icons (same icon set as the rest of the app)
import { ArrowLeft, Sprout } from "lucide-react";

export default function SignUpPage() {
  // tool to go to another page in code
  const router = useRouter();

  // ----- STATE = the page's memory -----
  // what's typed in each box (starts empty)
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [token, setToken] = useState("");
  const turnstileRef = useRef<TurnstileInstance>(null);
   
  // red message ("" = no box shown)
  const [error, setError] = useState("");

  // green message ("" = no box shown)
  const [message, setMessage] = useState("");

  // waiting for Supabase?
  // false = clickable, true = locked
  const [loading, setLoading] = useState(false);

  // ----- MAIN LOGIC -----
  // runs when you click "Create account"
  // or press Enter
  async function handleSignUp(
    e: React.FormEvent<HTMLFormElement>
  ) {
    // stop the page from reloading
    e.preventDefault();

    // clear old messages
    setError("");
    setMessage("");

    // all boxes filled in?
    if (!fullName.trim() || !email.trim() || !password) {
      setError("Please fill in all the boxes.");
      return;
    }

    // Supabase needs at least 6 characters
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    // both passwords must match
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (/[a-z]/.test(password) === false || /[A-Z]/.test(password) === false || /[0-9]/.test(password) === false) {
      setError("Password must contain an uppercase letter, a lowercase letter, and a number.");
      return;
    }

    // Security Check for Turnstile, if it is done.
    if (!token) {
      setError("Please complete the security check.");
      return;
    }

    // button → "Creating account..." (locked)
    setLoading(true);

    // ★ CALLS auth.ts ★
    // ask Supabase to make the account
    const { data, error } = await signUpWithEmail(
      fullName,
      email,
      password,
      token
    );

    // Supabase answered → button unlocked
    setLoading(false);

    // tokens only work once then get a fresh one for the next try
    turnstileRef.current?.reset();
    setToken("");

    // Supabase said no (bad email, etc.)
    if (error) {
      setError(error.message);
      return;
    }

    // email already has an account
    // (Supabase gives back a user with
    // no identities instead of an error)
    if (data.user && data.user.identities?.length === 0) {
      setError("An account with this email already exists.");
      return;
    }

    // logged in straight away
    // → go to Parent Profile
    if (data.session) {
      router.push("/parentview");
      return;
    }

    // email confirmation is turned on in
    // Supabase → they must click the link first
    setMessage(
      "Account created! Check your email to confirm it, then log in."
    );
  }

  // ----- WHAT THE USER SEES -----
  // same layout and colours as the login page
  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-12">
      {/* soft coloured circles in the background corners (decoration only) */}
      <div aria-hidden="true" className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-amber-200" />
      <div aria-hidden="true" className="absolute -right-20 top-1/3 h-56 w-56 rounded-full bg-sky-200" />
      <div aria-hidden="true" className="absolute -bottom-28 left-1/4 h-80 w-80 rounded-full bg-pink-200" />

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
          {/* friendly greeting for new parents */}
          <p className="mt-3 text-lg font-semibold text-foreground">Welcome to ThinkFirst!</p>
          <p className="mt-1 text-muted">Create a parent account to start your child&apos;s learning.</p>
        </header>

        {/* Chunky game-style edge: thick border on the bottom (border-b-8) */}
        <section className="rounded-3xl border-2 border-b-8 border-border bg-surface p-6 sm:p-8">
          <h1 className="mb-6 text-2xl font-bold text-foreground">
            Create account
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

          {/* green box: only shows after success */}
          {message && (
            <p
              role="status"
              className="mb-5 rounded-control bg-success-soft p-3 text-success"
            >
              {message}
            </p>
          )}

          {/* form: runs handleSignUp on click or Enter */}
          <form onSubmit={handleSignUp} className="space-y-5">
            {/* full name box */}
            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block font-semibold text-foreground"
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={100}
                className="w-full rounded-2xl border-2 border-border bg-surface p-3 text-foreground focus:border-primary focus:outline-none"
              />
            </div>

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

            {/* password box */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block font-semibold text-foreground"
              >
                Password
              </label>
              <input
                id="password"
                // hides the characters as you type
                type="password"
                // tells the browser this is a NEW password
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
                Confirm Password
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

            <Turnstile
              ref={turnstileRef} 
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={(token) => setToken(token)}
              onExpire={() => setToken("")}
              onError={() => setToken("")}
              />

            {/* chunky teal button: locked while waiting, sinks when clicked */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl border-b-4 border-teal-900 bg-primary px-5 py-3 font-extrabold text-on-primary hover:bg-primary-hover active:translate-y-1 active:border-b-0 disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          {/* link back to the login page */}
          <p className="mt-6 text-center text-muted">
            Already have an account?{" "}
            <Link
              href="/login"
              className="rounded-control font-semibold text-primary hover:underline"
            >
              Log in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
