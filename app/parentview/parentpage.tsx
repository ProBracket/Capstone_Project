

"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type Child = {
  id: string;
  name: string;
  date_of_birth: string;
  grade: number;
};

type Screen =
  | "login"
  | "signup"
  | "home"
  | "pin"
  | "dashboard"
  | "parent-profile"
  | "child-profiles"
  | "conversation-history"
  | "terms"
  | "consent";

type Conversation = {
  id: string;
  child_id: string;
  started_at: string;
  ended_at: string | null;
  summary: string | null;
};

type ConversationMessage = {
  id: number;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
};

type PinMode = "checking" | "create" | "enter" | "unavailable";
type PolicyReturn = "signup" | "dashboard";

const TERMS_VERSION = "draft-sprint3-v1";
const CONSENT_VERSION = "draft-sprint3-v1";
const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

const card = "rounded-2xl border border-[#E5E2DB] bg-white p-6 shadow-sm";
const field = "mt-1 block w-full rounded-lg border border-[#E5E2DB] bg-white px-3 py-2 text-[#1F2937] focus:border-[#0F766E] focus:outline-none";
const primary = "rounded-lg bg-[#0F766E] px-5 py-2.5 font-medium text-white hover:bg-[#115E59] disabled:cursor-not-allowed disabled:opacity-50";
const secondary = "rounded-lg border border-[#E5E2DB] bg-white px-4 py-2 font-medium hover:bg-[#F1EFEA] disabled:opacity-50";
const tile = "rounded-xl border border-[#E5E2DB] bg-white p-4 text-left transition-colors hover:border-[#0F766E] hover:bg-[#F1EFEA]";

function gradeLabel(grade: number) {
  return grade === 0 ? "Kindergarten" : `Grade ${grade}`;
}

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function errorText(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

export default function ParentView() {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [screen, setScreen] = useState<Screen>("login");
  const [returnTo, setReturnTo] = useState<PolicyReturn>("signup");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const userIdRef = useRef<string | null>(null);

  // Authentication
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedConsent, setAcceptedConsent] = useState(false);
  const [signupCompleted, setSignupCompleted] = useState(false);

  // CAPTCHA
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaInstance, setCaptchaInstance] = useState(0);

  // Parent PIN and profiles
  const [pinMode, setPinMode] = useState<PinMode>("checking");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [parentName, setParentName] = useState("");
  const [childName, setChildName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [grade, setGrade] = useState("");

  // TF-15: Conversation history
  const [historyChildId, setHistoryChildId] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationMessages, setConversationMessages] =
    useState<ConversationMessage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  function notify(next: Screen) {
    setError("");
    setMessage("");
    setScreen(next);
  }

  function resetCaptcha() {
    setCaptchaToken(null);
    setCaptchaInstance((n) => n + 1);
  }

  function changeAuthScreen(next: "login" | "signup") {
    resetCaptcha();
    notify(next);
  }

  const syncUser = useCallback((next: User | null) => {
    const accountId = next?.id ?? null;
    if (userIdRef.current !== accountId) {
      userIdRef.current = accountId;
      setChildren([]);
      setHistoryChildId("");
      setError("");
      setParentName(String(next?.user_metadata?.full_name ?? next?.user_metadata?.name ?? ""));
      setScreen(accountId ? "home" : "login");
    }
    setUser(next);
  }, []);

  // Supabase authentication listener
  useEffect(() => {
    let live = true;

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!live) return;

        if (
          event === "SIGNED_IN" ||
          event === "SIGNED_OUT" ||
          event === "USER_UPDATED"
        ) {
          syncUser(session?.user ?? null);
        }
      }
    );

    void supabase.auth.getUser()
      .then(({ data, error: authError }) => {
        if (!live) return;
        syncUser(authError ? null : data.user);
        setInitializing(false);
      })
      .catch(() => {
        if (!live) return;
        syncUser(null);
        setInitializing(false);
      });

    return () => {
      live = false;
      listener.subscription.unsubscribe();
    };
  }, [syncUser]);

  // Load parent's child profiles
  useEffect(() => {
    if (initializing) return;

    let live = true;
    const accountId = user?.id ?? null;

    if (!accountId) return;

    void (async () => {
      const lock = await supabase.rpc("lock_parent_area");

      if (!live || userIdRef.current !== accountId) return;

      if (lock.error) {
        setError(`Cannot secure parent area: ${lock.error.message}`);
        setScreen("pin");
        setPinMode("unavailable");
        return;
      }

      const result = await supabase
        .from("children")
        .select("id,name,date_of_birth,grade")
        .order("created_at", { ascending: true });

      if (!live || userIdRef.current !== accountId) return;

      if (result.error) {
        setError(`Could not load children: ${result.error.message}`);
      } else {
        setChildren((result.data ?? []) as Child[]);
      }
    })();

    return () => {
      live = false;
    };
  }, [user?.id, initializing]);

  // TF-15: Load actual conversations from Supabase
  useEffect(() => {
    let active = true;

    if (screen !== "conversation-history" || !user?.id ||
        !children.some((child) => child.id === historyChildId)) return;

    void (async () => {
      try {
        // UI-side check; Supabase RLS is the security boundary.
        const unlocked = await supabase.rpc("parent_area_unlocked");

        if (!active) return;

        if (unlocked.error || unlocked.data !== true) {
          setHistoryError(
            "Parent access is locked. Return home and enter your PIN again."
          );
          return;
        }

        const sessionsResult = await supabase
          .from("conversations")
          .select("id,child_id,started_at,ended_at,summary")
          .eq("child_id", historyChildId)
          .order("started_at", { ascending: false })
          .limit(50);

        if (!active) return;
        if (sessionsResult.error) throw sessionsResult.error;

        const sessions =
          (sessionsResult.data ?? []) as Conversation[];

        if (sessions.length === 0) {
          setConversations([]);
          return;
        }

        const messagesResult = await supabase
          .from("conversation_messages")
          .select("id,conversation_id,role,content,created_at")
          .in(
            "conversation_id",
            sessions.map((session) => session.id)
          )
          .order("created_at", { ascending: true })
          .limit(500);

        if (!active) return;
        if (messagesResult.error) throw messagesResult.error;

        setConversations(sessions);
        setConversationMessages(
          (messagesResult.data ?? []) as ConversationMessage[]
        );
      } catch (failure) {
        if (active) setHistoryError(errorText(failure));
      } finally {
        if (active) setHistoryLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [screen, historyChildId, user?.id, children]);

  // Parent login
  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      return setError("Enter your email and password.");
    }

    if (turnstileSiteKey && !captchaToken) {
      return setError("Complete the CAPTCHA first.");
    }

    setBusy(true);

    try {
      const { error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
          options: captchaToken
            ? { captchaToken }
            : undefined,
        });

      if (authError) {
        setError(
          authError.message.toLowerCase().includes("captcha")
            ? "CAPTCHA verification failed. Check the provider configuration."
            : "Unable to sign in. Check your email and password."
        );
        resetCaptcha();
        return;
      }

      setPassword("");
    } catch (e) {
      setError(errorText(e));
      resetCaptcha();
    } finally {
      setBusy(false);
    }
  }

  // Parent signup
  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (
      !fullName.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      return setError("Complete all account fields.");
    }

    if (
      password.length < 8 ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      return setError(
        "Use at least 8 characters with uppercase, lowercase, and a number."
      );
    }

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    if (!acceptedTerms || !acceptedConsent) {
      return setError(
        "Review and accept both documents before creating an account."
      );
    }

    if (turnstileSiteKey && !captchaToken) {
      return setError("Complete the CAPTCHA first.");
    }

    setBusy(true);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          captchaToken: captchaToken ?? undefined,
          data: {
            full_name: fullName.trim(),
            terms_acknowledged_version: TERMS_VERSION,
            parental_consent_acknowledged_version:
              CONSENT_VERSION,
            acknowledgement_time: new Date().toISOString(),
          },
        },
      });

      if (authError) {
        setError(authError.message);
        resetCaptcha();
        return;
      }

      if (data.user?.identities?.length === 0) {
        setError("An account with this email already exists.");
        resetCaptcha();
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setSignupCompleted(true);

      if (data.session && data.user) {
        syncUser(data.user);
      } else {
        setMessage(
          "Check your email for a confirmation link, then log in."
        );
      }
    } catch (e) {
      setError(errorText(e));
      resetCaptcha();
    } finally {
      setBusy(false);
    }
  }

  // Lock parent area when returning home
  async function goHome() {
    setError("");

    const { error: lockError } =
      await supabase.rpc("lock_parent_area");

    if (lockError) {
      setError(
        `Could not lock parent settings: ${lockError.message}`
      );
      return;
    }

    setHistoryChildId("");
    notify("home");
  }

  // Open protected parent settings
  async function openSettings() {
    setPin("");
    setConfirmPin("");
    setPinMode("checking");
    notify("pin");

    const lock = await supabase.rpc("lock_parent_area");

    if (lock.error) {
      setError(lock.error.message);
      setPinMode("unavailable");
      return;
    }

    const result = await supabase.rpc("has_parent_pin");

    if (result.error) {
      setError(result.error.message);
      setPinMode("unavailable");
      return;
    }

    setPinMode(result.data ? "enter" : "create");
  }

  // Verify parent PIN through Supabase
  async function handlePin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!/^\d{4}$/.test(pin)) {
      return setError("Enter exactly four digits.");
    }

    if (pinMode === "create" && pin !== confirmPin) {
      return setError("PINs do not match.");
    }

    setBusy(true);

    try {
      if (pinMode === "create") {
        const created = await supabase.rpc(
          "set_parent_pin",
          { new_pin: pin }
        );

        if (created.error) {
          setError(created.error.message);
          return;
        }
      }

      const verified = await supabase.rpc(
        "verify_parent_pin",
        { pin }
      );

      if (verified.error || verified.data !== true) {
        setError(
          verified.error?.message ??
            "Incorrect PIN. Please try again."
        );
        setPin("");
        return;
      }

      setPin("");
      setConfirmPin("");
      notify("dashboard");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  // Save parent name
  async function saveParent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!parentName.trim()) {
      return setError("Please enter a parent name.");
    }

    setBusy(true);

    try {
      const result = await supabase.auth.updateUser({
        data: { full_name: parentName.trim() },
      });

      if (result.error) {
        setError(result.error.message);
      } else {
        syncUser(result.data.user);
        setMessage("Parent profile saved.");
      }
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  // Add child profile
  async function handleAddChild(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const name = childName.trim();

    if (!name || name.length > 50) {
      return setError("Use a child nickname up to 50 characters.");
    }

    if (!dateOfBirth || dateOfBirth > todayLocal()) {
      return setError("Enter a valid birth date.");
    }

    if (
      grade === "" ||
      Number(grade) < 0 ||
      Number(grade) > 12
    ) {
      return setError("Choose a grade.");
    }

    setBusy(true);

    try {
      const result = await supabase
        .from("children")
        .insert({
          name,
          date_of_birth: dateOfBirth,
          grade: Number(grade),
        })
        .select("id,name,date_of_birth,grade")
        .single();

      if (result.error) {
        setError(result.error.message);
        return;
      }

      setChildren((previous) => [
        ...previous,
        result.data as Child,
      ]);

      setChildName("");
      setDateOfBirth("");
      setGrade("");
      setMessage("Child profile added.");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  // Logout
  async function handleLogout() {
    setError("");
    setBusy(true);

    try {
      await supabase.rpc("lock_parent_area");

      const { error: authError } =
        await supabase.auth.signOut();

      if (authError) {
        setError(authError.message);
        return;
      }

      syncUser(null);
      setChildren([]);
      setHistoryChildId("");
      setPassword("");
      setAcceptedTerms(false);
      setAcceptedConsent(false);
      changeAuthScreen("login");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  function openConversationHistory() {
    setHistoryChildId("");
    notify("conversation-history");
  }

  function openPolicy(
    policy: "terms" | "consent",
    back: PolicyReturn
  ) {
    setReturnTo(back);

    if (back === "signup") resetCaptcha();

    notify(policy);
  }

  if (initializing) {
    return (
      <main className="min-h-screen bg-[#F8F7F4] p-8 text-[#1F2937]">
        Loading ThinkFirst...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F7F4] px-4 py-8 text-[#1F2937]">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#0F766E]">
              ThinkFirst
            </h1>
            <p className="mt-1 text-sm text-[#6B7280]">
              A learning companion that asks before it answers.
            </p>
          </div>

          {user &&
            ![
              "home",
              "login",
              "signup",
              "terms",
              "consent",
            ].includes(screen) && (
              <button
                type="button"
                onClick={() => void goHome()}
                className={secondary}
              >
                Back to Home
              </button>
            )}
        </header>

        {error && (
          <p
            role="alert"
            className="mb-5 rounded-lg bg-red-50 p-4 text-red-700"
          >
            {error}
          </p>
        )}

        {message && (
          <p
            role="status"
            className="mb-5 rounded-lg bg-green-50 p-4 text-green-700"
          >
            {message}
          </p>
        )}

        {/* PARENT LOGIN */}
        {screen === "login" && !user && (
          <section className={card}>
            <h2 className="mb-2 text-2xl font-bold">
              Welcome back!
            </h2>
            <p className="mb-6 text-[#6B7280]">
              Log in to manage your family&apos;s learning.
            </p>

            <form onSubmit={handleLogin} className="space-y-5">
              <label className="block">
                Email
                <input
                  type="email"
                  autoComplete="email"
                  required
                  className={field}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              <label className="block">
                Password
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  className={field}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>

              {turnstileSiteKey && (
                <Turnstile
                  key={captchaInstance}
                  siteKey={turnstileSiteKey}
                  onSuccess={setCaptchaToken}
                  onExpire={() => setCaptchaToken(null)}
                  onError={() => setCaptchaToken(null)}
                />
              )}

              <button
                type="submit"
                disabled={
                  busy ||
                  Boolean(turnstileSiteKey && !captchaToken)
                }
                className={primary}
              >
                {busy ? "Logging in..." : "Log in"}
              </button>
            </form>

            <p className="mt-6 text-sm">
              New parent?{" "}
              <button
                type="button"
                onClick={() => changeAuthScreen("signup")}
                className="font-semibold text-[#0F766E] underline"
              >
                Create account
              </button>
            </p>
          </section>
        )}

        {/* PARENT SIGNUP */}
        {screen === "signup" && !user && (
          <section className={card}>
            <h2 className="mb-2 text-2xl font-bold">
              Create a Parent Account
            </h2>
            <p className="mb-6 text-[#6B7280]">
              Get started with ThinkFirst.
            </p>

            {signupCompleted ? (
              <div className="space-y-4">
                <p>
                  Registration submitted. If email confirmation
                  is enabled, confirm your email first.
                </p>
                <button
                  type="button"
                  className={secondary}
                  onClick={() => changeAuthScreen("login")}
                >
                  Go to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-5">
                <label className="block">
                  Parent Full Name
                  <input
                    required
                    maxLength={100}
                    autoComplete="name"
                    className={field}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </label>

                <label className="block">
                  Email
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    className={field}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>

                <label className="block">
                  Password
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    className={field}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>

                <label className="block">
                  Confirm Password
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    className={field}
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                  />
                </label>

                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) =>
                      setAcceptedTerms(e.target.checked)
                    }
                    className="mt-1"
                  />
                  <span>
                    I agree to the Terms &amp; Conditions.{" "}
                    <button
                      type="button"
                      className="text-[#0F766E] underline"
                      onClick={() =>
                        openPolicy("terms", "signup")
                      }
                    >
                      Read Terms
                    </button>
                  </span>
                </label>

                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={acceptedConsent}
                    onChange={(e) =>
                      setAcceptedConsent(e.target.checked)
                    }
                    className="mt-1"
                  />
                  <span>
                    I have reviewed the Parental Consent information.{" "}
                    <button
                      type="button"
                      className="text-[#0F766E] underline"
                      onClick={() =>
                        openPolicy("consent", "signup")
                      }
                    >
                      Read Consent
                    </button>
                  </span>
                </label>

                {turnstileSiteKey && (
                  <Turnstile
                    key={captchaInstance}
                    siteKey={turnstileSiteKey}
                    onSuccess={setCaptchaToken}
                    onExpire={() => setCaptchaToken(null)}
                    onError={() => setCaptchaToken(null)}
                  />
                )}

                {!turnstileSiteKey && (
                  <p className="text-xs text-[#6B7280]">
                    If Supabase requires CAPTCHA, the Turnstile
                    site key must be configured.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={
                    busy ||
                    !acceptedTerms ||
                    !acceptedConsent ||
                    Boolean(turnstileSiteKey && !captchaToken)
                  }
                  className={primary}
                >
                  {busy ? "Creating account..." : "Create Account"}
                </button>
              </form>
            )}

            <button
              type="button"
              className="mt-6 text-[#0F766E] underline"
              onClick={() => changeAuthScreen("login")}
            >
              Back to Login
            </button>
          </section>
        )}

        {/* CHILD PROFILE PICKER */}
        {screen === "home" && user && (
          <section className={card}>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">
                  Who&apos;s learning today?
                </h2>
                <p className="mt-2 text-[#6B7280]">
                  Select a child profile to continue.
                </p>
              </div>

              <button
                type="button"
                className={secondary}
                onClick={() => void openSettings()}
              >
                ⚙ Parent Settings
              </button>
            </div>

            {children.length === 0 && (
              <p className="rounded-lg bg-[#F1EFEA] p-5 text-[#6B7280]">
                No child profiles available. Open Parent Settings
                to add one.
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {children.map((child) => (
                <a
                  key={child.id}
                  className={tile}
                  href={`/child/welcome?childId=${encodeURIComponent(
                    child.id
                  )}`}
                >
                  <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#CCFBF1] text-2xl font-bold text-[#0F766E]">
                    {child.name.charAt(0).toUpperCase()}
                  </span>
                  <strong className="text-lg">{child.name}</strong>
                  <p className="mt-1 text-sm text-[#6B7280]">
                    {gradeLabel(child.grade)}
                  </p>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* PARENT PIN */}
        {screen === "pin" && user && (
          <section className={`${card} mx-auto max-w-lg`}>
            <div className="mb-4 text-center text-4xl">
              🔐
            </div>
            <h2 className="text-center text-2xl font-bold">
              Parent Access PIN
            </h2>

            {pinMode === "checking" && (
              <p className="mt-4 text-center">
                Checking Parent PIN...
              </p>
            )}

            {pinMode === "unavailable" && (
              <button
                type="button"
                className={`${secondary} mt-5`}
                onClick={() => void openSettings()}
              >
                Try again
              </button>
            )}

            {(pinMode === "create" || pinMode === "enter") && (
              <form onSubmit={handlePin} className="mt-6 space-y-5">
                <p className="text-sm text-[#6B7280]">
                  {pinMode === "create"
                    ? "Create a four-digit PIN to protect parent settings."
                    : "Enter your four-digit parent PIN."}
                </p>

                <label className="block">
                  Parent PIN
                  <input
                    required
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={4}
                    className={field}
                    value={pin}
                    onChange={(e) =>
                      setPin(
                        e.target.value.replace(/\D/g, "").slice(0, 4)
                      )
                    }
                  />
                </label>

                {pinMode === "create" && (
                  <label className="block">
                    Confirm PIN
                    <input
                      required
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      className={field}
                      value={confirmPin}
                      onChange={(e) =>
                        setConfirmPin(
                          e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 4)
                        )
                      }
                    />
                  </label>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className={`${primary} w-full`}
                >
                  {busy
                    ? "Checking..."
                    : pinMode === "create"
                      ? "Create PIN"
                      : "Unlock Dashboard"}
                </button>
              </form>
            )}
          </section>
        )}

        {/* PARENT DASHBOARD */}
        {screen === "dashboard" && user && (
          <section className={card + " border-teal-200!"}>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#0F766E]">
              Parent Area
            </p>
            <h2 className="mt-2 text-3xl font-bold text-teal-900">
              Parent Dashboard
            </h2>
            <p className="mb-8 mt-2 text-slate-700">
              Manage your family&apos;s learning experience.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                className={tile + " bg-amber-100! hover:bg-amber-200!"}
                onClick={() => notify("parent-profile")}
              >
                <span className="mb-3 block text-3xl">👤</span>
                <span className="block font-semibold">
                  Parent Profile
                </span>
                <span className="mt-1 block text-sm text-slate-700">
                  Manage your account information.
                </span>
              </button>

              <button
                type="button"
                className={tile + " bg-sky-100! hover:bg-sky-200!"}
                onClick={() => notify("child-profiles")}
              >
                <span className="mb-3 block text-3xl">👨‍👩‍👧</span>
                <span className="block font-semibold">
                  Child Profiles
                </span>
                <span className="mt-1 block text-sm text-slate-700">
                  View and add your children.
                </span>
              </button>

              <button
                type="button"
                className={tile + " bg-pink-100! hover:bg-pink-200!"}
                onClick={openConversationHistory}
              >
                <span className="mb-3 block text-3xl">💬</span>
                <span className="block font-semibold text-[#0F766E]">
                  AI Conversation History
                </span>
                <span className="mt-1 block text-sm text-slate-700">
                  Review your child&apos;s AI conversations.
                </span>
              </button>

              <button
                type="button"
                className={tile + " bg-teal-100! hover:bg-teal-200!"}
                onClick={() =>
                  openPolicy("consent", "dashboard")
                }
              >
                <span className="mb-3 block text-3xl">🛡️</span>
                <span className="block font-semibold">
                  Parental Consent &amp; Privacy
                </span>
                <span className="mt-1 block text-sm text-slate-700">
                  Review privacy and consent information.
                </span>
              </button>

              <button
                type="button"
                className={tile + " bg-teal-100! hover:bg-teal-200!"}
                onClick={() =>
                  openPolicy("terms", "dashboard")
                }
              >
                <span className="mb-3 block text-3xl">📋</span>
                <span className="block font-semibold">
                  Terms &amp; Conditions
                </span>
                <span className="mt-1 block text-sm text-slate-700">
                  Read the application terms.
                </span>
              </button>

              <button
                type="button"
                disabled={busy}
                className={`${tile} text-red-700`}
                onClick={() => void handleLogout()}
              >
                <span className="mb-3 block text-3xl">🚪</span>
                <span className="block font-semibold">
                  Log Out
                </span>
                <span className="mt-1 block text-sm text-slate-700">
                  Sign out of your parent account.
                </span>
              </button>
            </div>
          </section>
        )}

        {/* TF-15: CONVERSATION HISTORY */}
        {screen === "conversation-history" && user && (
          <section className={card}>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#0F766E]">
              Parent Area · TF-15
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              AI Conversation History
            </h2>

            <p className="mt-3 text-[#6B7280]">
              Choose a child to review their ThinkFirst conversations.
            </p>

            {children.length === 0 ? (
              <div className="mt-6 rounded-xl border border-[#E5E2DB] bg-[#F8F7F4] p-5">
                No child profiles found. Add a child from the Parent
                Dashboard first.
              </div>
            ) : (
              <div className="mt-6">
                <label
                  htmlFor="history-child"
                  className="block font-semibold"
                >
                  Child profile
                </label>

                <select
                  id="history-child"
                  className={field}
                  value={historyChildId}
                  onChange={(e) => {
                    setConversations([]);
                    setConversationMessages([]);
                    setHistoryError("");
                    setHistoryLoading(Boolean(e.target.value));
                    setHistoryChildId(e.target.value);
                  }}
                >
                  <option value="">Select a child</option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.name} — {gradeLabel(child.grade)}
                    </option>
                  ))}
                </select>

                {children.some((child) => child.id === historyChildId) && (
                  <div className="mt-5 space-y-4">
                    {historyLoading && (
                      <p
                        role="status"
                        className="rounded-xl bg-[#F1EFEA] p-5"
                      >
                        Loading conversation history...
                      </p>
                    )}

                    {historyError && (
                      <p
                        role="alert"
                        className="rounded-xl bg-red-50 p-5 text-red-700"
                      >
                        Could not load conversations: {historyError}
                      </p>
                    )}

                    {!historyLoading &&
                      !historyError &&
                      conversations.length === 0 && (
                        <p className="rounded-xl border border-[#E5E2DB] bg-[#F8F7F4] p-5 text-[#6B7280]">
                          No saved conversations for this child yet.
                        </p>
                      )}

                    {!historyLoading &&
                      !historyError &&
                      conversations.map((conversation) => {
                        const messages = conversationMessages.filter(
                          (item) =>
                            item.conversation_id === conversation.id
                        );

                        return (
                          <article
                            key={conversation.id}
                            className="rounded-xl border border-[#E5E2DB] bg-white p-5"
                          >
                            <h3 className="font-semibold text-[#0F766E]">
                              {new Date(
                                conversation.started_at
                              ).toLocaleString()}
                            </h3>

                            {conversation.summary && (
                              <p className="mt-2 text-sm text-[#6B7280]">
                                {conversation.summary}
                              </p>
                            )}

                            <div className="mt-4 space-y-3">
                              {messages.length === 0 && (
                                <p className="text-sm text-[#6B7280]">
                                  No messages saved in this conversation.
                                </p>
                              )}

                              {messages.map((item) => (
                                <div
                                  key={item.id}
                                  className={`rounded-lg p-4 ${
                                    item.role === "assistant" ||
                                    item.role === "ai"
                                      ? "bg-[#F1EFEA]"
                                      : "bg-[#CCFBF1]"
                                  }`}
                                >
                                  <p className="mb-1 text-xs font-semibold uppercase text-[#0F766E]">
                                    {item.role === "assistant" ||
                                    item.role === "ai"
                                      ? "ThinkFirst AI"
                                      : item.role === "user" ||
                                          item.role === "child"
                                        ? "Child"
                                        : item.role}
                                  </p>

                                  <p className="whitespace-pre-wrap wrap-break-word text-sm text-[#1F2937]">
                                    {item.content}
                                  </p>

                                  <p className="mt-2 text-xs text-[#6B7280]">
                                    {new Date(
                                      item.created_at
                                    ).toLocaleString()}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </article>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              className={`${secondary} mt-6`}
              onClick={() => notify("dashboard")}
            >
              Back to Dashboard
            </button>
          </section>
        )}

        {/* PARENT PROFILE */}
        {screen === "parent-profile" && user && (
          <section className={card}>
            <h2 className="mb-3 text-2xl font-bold">
              Parent Profile
            </h2>

            <p className="mb-5 text-[#6B7280]">
              Email: {user.email}
            </p>

            <form onSubmit={saveParent} className="space-y-5">
              <label className="block">
                Parent Name
                <input
                  required
                  maxLength={100}
                  className={field}
                  value={parentName}
                  onChange={(e) =>
                    setParentName(e.target.value)
                  }
                />
              </label>

              <button
                type="submit"
                disabled={busy}
                className={primary}
              >
                {busy ? "Saving..." : "Save Name"}
              </button>
            </form>

            <button
              type="button"
              className="mt-6 text-[#0F766E] underline"
              onClick={() => notify("dashboard")}
            >
              Back to Dashboard
            </button>
          </section>
        )}

        {/* CHILD PROFILES */}
        {screen === "child-profiles" && user && (
          <section className={card}>
            <h2 className="mb-5 text-2xl font-bold">
              Child Profiles
            </h2>

            <div className="space-y-3">
              {children.map((child) => (
                <div
                  key={child.id}
                  className="flex items-center gap-4 rounded-xl border border-[#E5E2DB] p-4"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#CCFBF1] font-bold text-[#0F766E]">
                    {child.name.charAt(0).toUpperCase()}
                  </span>

                  <div>
                    <p className="font-semibold">{child.name}</p>
                    <p className="text-sm text-[#6B7280]">
                      {gradeLabel(child.grade)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="mb-4 mt-8 text-xl font-semibold">
              Add Child
            </h3>

            <form
              onSubmit={handleAddChild}
              className="space-y-5"
            >
              <label className="block">
                Child Nickname
                <input
                  required
                  maxLength={50}
                  className={field}
                  value={childName}
                  onChange={(e) =>
                    setChildName(e.target.value)
                  }
                />
              </label>

              <label className="block">
                Date of Birth
                <input
                  type="date"
                  required
                  className={field}
                  value={dateOfBirth}
                  onChange={(e) =>
                    setDateOfBirth(e.target.value)
                  }
                />
              </label>

              <label className="block">
                Grade
                <select
                  required
                  className={field}
                  value={grade}
                  onChange={(e) =>
                    setGrade(e.target.value)
                  }
                >
                  <option value="">Select grade</option>

                  {Array.from({ length: 13 }, (_, i) => (
                    <option key={i} value={i}>
                      {gradeLabel(i)}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                disabled={busy}
                className={primary}
              >
                {busy ? "Saving..." : "Add Child"}
              </button>
            </form>

            <p className="mt-4 text-xs text-amber-800">
              Privacy note: The current database requires birth dates.
              The team should review data minimization before release.
            </p>

            <button
              type="button"
              className="mt-6 text-[#0F766E] underline"
              onClick={() => notify("dashboard")}
            >
              Back to Dashboard
            </button>
          </section>
        )}

        {/* TERMS & CONDITIONS */}
        {screen === "terms" && (
          <section className={card}>
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
              onClick={() => notify(returnTo)}
            >
              Back
            </button>
          </section>
        )}

        {/* PARENTAL CONSENT */}
        {screen === "consent" && (
          <section className={card}>
            <h2 className="mb-2 text-2xl font-bold">
              Parental Consent &amp; Privacy
            </h2>

            <p className="mb-6 text-sm text-amber-700">
              Draft version {CONSENT_VERSION} — verify actual data
              handling before release.
            </p>

            <div className="space-y-4 leading-relaxed text-[#374151]">
              <p>
                <strong>1. Parent Data.</strong>{" "}
                Signup asks for parent name, email, and authentication
                credentials.
              </p>

              <p>
                <strong>2. Child Profiles.</strong>{" "}
                The current database uses child nicknames, date of
                birth, and grade. The team should minimize this
                information where possible.
              </p>

              <p>
                <strong>3. Learning Data.</strong>{" "}
                Responses, activities, and conversations may be
                processed for tutoring and progress information.
              </p>

              <p>
                <strong>4. Microphone.</strong>{" "}
                Voice features need separate guardian authorization
                and browser microphone permission. Accepting this
                form does not turn on microphone access.
              </p>

              <p>
                <strong>5. AI and Voice Providers.</strong>{" "}
                The team must name any providers, disclose whether
                transcripts or audio are stored, and define retention
                and deletion timelines.
              </p>

              <p>
                <strong>6. Access Controls.</strong>{" "}
                Child records must be isolated in Supabase with
                verified RLS policies and authorized guardian
                membership.
              </p>

              <p>
                <strong>7. Parent Choices.</strong>{" "}
                Parents need a means to review, withdraw consent,
                and request access to or deletion of child
                information.
              </p>
            </div>

            <button
              type="button"
              className="mt-7 text-[#0F766E] underline"
              onClick={() => notify(returnTo)}
            >
              Back
            </button>
          </section>
        )}

        <footer className="mt-10 text-center text-sm text-[#6B7280]">
          ThinkFirst — Don&apos;t answer first. Think first.
        </footer>
      </div>
    </main>
  );
}
