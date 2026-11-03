/** Create account page (/signup).
 * Parents type their name, email and password and press "Create account".
 * - Account made and logged in → go to the Parent Profile page (/parentview).
 * - Supabase needs the email confirmed first → show a green
 *   "check your email" message.
 * - Something wrong (email used, short password) → show a red message.
 * Same look as the login page.
 */
// "use client" = runs in the browser
// (needed for useState and the form)
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUpWithEmail } from "@/lib/auth";

export default function SignUpPage() {
  // tool to go to another page in code
  const router = useRouter();

  // ----- STATE = the page's memory -----
  // what's typed in each box (starts empty)
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

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
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    // both passwords must match
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    // button → "Creating account..." (locked)
    setLoading(true);

    // ★ CALLS auth.ts ★
    // ask Supabase to make the account
    const { data, error } = await signUpWithEmail(
      fullName,
      email,
      password
    );

    // Supabase answered → button unlocked
    setLoading(false);

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
    <main className="min-h-screen bg-gray-100 px-4 py-12">
      <div className="mx-auto max-w-md">
        {/* top title */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            ThinkFirst
          </h1>
          <p className="mt-1 text-gray-600">
            Create a Parent Account
          </p>
        </header>

        {/* white card */}
        <section className="rounded-2xl bg-white p-6 shadow-md sm:p-8">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            Create account
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

          {/* green box: only shows after success */}
          {message && (
            <p
              role="status"
              className="mb-5 rounded-lg bg-green-50 p-3 text-green-700"
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
                className="mb-2 block font-semibold text-gray-800"
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
                className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

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

            {/* password box */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block font-semibold text-gray-800"
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
                className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            {/* confirm password box */}
            <div>
              <label
                htmlFor="confirm"
                className="mb-2 block font-semibold text-gray-800"
              >
                Confirm Password
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
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          {/* link back to the login page */}
          <p className="mt-6 text-center text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-blue-700 hover:underline"
            >
              Log in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
