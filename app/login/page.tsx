/** Login page (/login).
 * Parents type their email and password and press "Log in".
 * - If the account exists in Supabase → go to the Parent Profile page (/parentview).
 * - If not (or the password is wrong) → show "Incorrect email or password"
 *   and stay on this page.
 * No sign-up and no email verification here.
 */
// "use client" makes this run in the browser, which it needs for useState
// and for handling the form
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmail } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter(); // lets us move to another page in code

  const [email, setEmail] = useState(""); // what's typed in the email box
  const [password, setPassword] = useState(""); // what's typed in the password box
  const [error, setError] = useState(""); // red message under the title
  const [loading, setLoading] = useState(false); // true while we wait for Supabase

  // Runs when the form is submitted (button click or pressing Enter)
  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    // Stop the browser from reloading the page (the default form behaviour)
    e.preventDefault();

    setError("");

    // Make sure both boxes are filled in before asking Supabase
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    // Ask Supabase to check the email and password
    const { error } = await signInWithEmail(email, password);

    setLoading(false);

    if (error) {
      // Account doesn't exist or password is wrong → stay here and show the message.
      // We use the same message for both so nobody can guess which emails have accounts.
      setError("Incorrect email or password");
      return;
    }

    // Success → go to the Parent Profile page
    router.push("/parentview");
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-12">
      <div className="mx-auto max-w-md">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            ThinkFirst
          </h1>
          <p className="mt-1 text-gray-600">
            Parent Login
          </p>
        </header>

        <section className="rounded-2xl bg-white p-6 shadow-md sm:p-8">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            Log in
          </h2>

          {/* Red error box — only shows when there's an error */}
          {error && (
            <p
              role="alert"
              className="mb-5 rounded-lg bg-red-50 p-3 text-red-700"
            >
              {error}
            </p>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
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

            <div>
              <label
                htmlFor="password"
                className="mb-2 block font-semibold text-gray-800"
              >
                Password
              </label>
              <input
                id="password"
                type="password" // hides the characters as you type
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            {/* Disabled while loading so it can't be clicked twice */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-700 px-5 py-3 font-medium text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
