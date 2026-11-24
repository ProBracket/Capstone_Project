/** Login page (/login).
 * Parents type their email and password and press "Log in".
 * - If the account exists in Supabase → go to the Parent Profile page (/parentview).
 * - If not (or the password is wrong) → show "Incorrect email or password"
 *   and stay on this page.
 */
// "use client" makes this run in the browser, which it needs for useState
// and for handling the form
"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signInWithEmail, signInWithGoogle } from "@/lib/auth";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
// line icons (same icon set as the rest of the app)
import { ArrowLeft, Sprout } from "lucide-react";

export default function LoginPage() {
  const router = useRouter(); // lets us move to another page in code

  const [email, setEmail] = useState(""); // what's typed in the email box
  const [password, setPassword] = useState(""); // what's typed in the password box
  const [error, setError] = useState(""); // red message under the title
  const [loading, setLoading] = useState(false); // true while we wait for Supabase
  const [token, setToken] = useState("");
  const turnstileRef = useRef<TurnstileInstance>(null);

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

    if (!token) {
      setError("Please complete the security check.");
      return;
    }

    setLoading(true);

    // Ask Supabase to check the email and password
    const { error } = await signInWithEmail(email, password, token);

    setLoading(false);
    
    turnstileRef.current?.reset();
    setToken("");

    if (error) {
      // security check expired or failed
      if (error.code === "captcha_failed") {
        setError("Security check failed. Please try again.");
        return;
      }
      
      // Account doesn't exist or password is wrong → stay here and show the message.
      // We use the same message for both so nobody can guess which emails have accounts.
      setError("Incorrect email or password");
      return;
    }


    // Success → go to the Parent Profile page
    router.push("/parentview");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-12">
      {/* soft coloured circles in the background corners (decoration only) */}
      <div aria-hidden="true" className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-amber-200" />
      <div aria-hidden="true" className="absolute -right-20 top-1/3 h-56 w-56 rounded-full bg-sky-200" />
      <div aria-hidden="true" className="absolute -bottom-28 left-1/4 h-80 w-80 rounded-full bg-pink-200" />

      {/* small "back" link in the top-left corner, like most web apps */}
      <Link
        href="/"
        className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-control bg-surface/80 px-3 py-2 text-sm font-semibold text-foreground hover:bg-surface"
      >
        <ArrowLeft aria-hidden="true" size={16} strokeWidth={2.25} />
        Home
      </Link>

      <div className="relative mx-auto max-w-md">
        {/* logo: also goes to the homepage when clicked */}
        <header className="mb-8 flex flex-col items-center text-center">
          <Link href="/" className="flex items-center gap-2.5 rounded-control">
            <span className="flex h-10 w-10 items-center justify-center rounded-control bg-primary text-on-primary">
              <Sprout aria-hidden="true" size={22} strokeWidth={2.25} />
            </span>
            <span className="text-2xl font-semibold text-foreground">ThinkFirst</span>
          </Link>
          {/* friendly greeting for parents */}
          <p className="mt-3 text-lg font-semibold text-foreground">Welcome back!</p>
          <p className="mt-1 text-muted">Log in to see how your child is learning today.</p>
        </header>

        {/* "relative" so the stickers can sit on the box corners.
            Chunky game-style edge: thick border on the bottom (border-b-8) */}
        <section className="relative rounded-3xl border-2 border-b-8 border-border bg-surface p-6 sm:p-8">
          {/* the "float" animation: moves up 10px and back down.
              motion-safe: = only plays if the user hasn't turned off animations */}
          <style>{`@keyframes tf-float { 0%, 100% { translate: 0 0; } 50% { translate: 0 -10px; } }`}</style>

          {/* cute stickers on the box corners (decoration only, hidden on small phones).
              Login stickers: public/login-stickers/login-*.png */}
          <Image
            src="/login-stickers/login-pencil.png"
            alt=""
            width={96}
            height={96}
            className="absolute -right-12 -top-12 z-10 hidden sm:block motion-safe:animate-[tf-float_3s_ease-in-out_infinite]"
          />
          <Image
            src="/login-stickers/login-bulb.png"
            alt=""
            width={84}
            height={84}
            className="absolute -left-14 top-1/3 z-10 hidden -rotate-12 sm:block motion-safe:animate-[tf-float_3s_ease-in-out_infinite] [animation-delay:1s]"
          />
          <Image
            src="/login-stickers/login-apple.png"
            alt=""
            width={88}
            height={88}
            className="absolute -bottom-8 -right-8 z-10 hidden rotate-12 sm:block motion-safe:animate-[tf-float_3s_ease-in-out_infinite] [animation-delay:2s]"
          />
          <h1 className="mb-6 text-2xl font-bold text-foreground">
            Log in
          </h1>

          {/* Red error box — only shows when there's an error */}
          {error && (
            <p
              role="alert"
              className="mb-5 rounded-control bg-danger-soft p-3 text-danger"
            >
              {error}
            </p>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
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

            <div>
              <label
                htmlFor="password"
                className="mb-2 block font-semibold text-foreground"
              >
                Password
              </label>
              <input
                id="password"
                type="password" // hides the characters as you type
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border-2 border-border bg-surface p-3 text-foreground focus:border-primary focus:outline-none"
              />
              {/* goes to the Forgot password page (app/forgot-password/page.tsx) */}
              <div className="mt-2 text-right">
                <Link
                  href="/forgot-password"
                  className="rounded-control text-sm font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Turnstile 
              ref={turnstileRef}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={(token) => setToken(token)}
              onExpire={() => setToken("")}
              onError={() => setToken("")}
              />

            {/* Disabled while loading so it can't be clicked twice */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl border-b-4 border-teal-900 bg-primary px-5 py-3 font-extrabold text-on-primary hover:bg-primary-hover active:translate-y-1 active:border-b-0 disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
            <button type="button" onClick={() => signInWithGoogle()}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-b-4 border-border bg-surface px-5 py-3 font-bold text-foreground hover:bg-surface-muted active:translate-y-1 active:border-b-2">
              <Image src="/google-logo.svg" alt="" width={20} height={20} className="h-5 w-5" />Continue with Google
            </button>
          </form>
          
          {/* goes to the Create account page (app/signup/page.tsx) */}
          <p className="mt-6 text-center text-muted">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="rounded-control font-semibold text-primary hover:underline">
              Create account
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}