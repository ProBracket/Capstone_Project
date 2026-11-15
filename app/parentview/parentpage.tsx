
"use client";

/**
 * ThinkFirst Parent View (one-file screen implementation).
 * Route: app/parentview/page.tsx imports this default export.
 * Backend: imports ONLY the shared Supabase client from lib/supabase.ts.
 *
 * IMPORTANT: Row Level Security (RLS), guardian relationships, PIN RPCs,
 * and an auditable consent register must be enforced in Supabase, not here.
 */

import { useEffect, useRef, useState, type FormEvent } from "react";
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
  | "terms"
  | "consent";

type PinMode = "checking" | "create" | "enter" | "unavailable";
type PolicyReturn = "signup" | "dashboard";

// Draft identifiers. Replace with approved document versions before release.
const TERMS_VERSION = "draft-sprint3-v1";
const CONSENT_VERSION = "draft-sprint3-v1";

// Gael must confirm this is the provider configured in Supabase.
const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

const card = "rounded-xl border border-slate-200 bg-white p-6 shadow-sm";
const field = "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-600 focus:outline-none";
const primary = "rounded-lg bg-blue-700 px-5 py-2.5 font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50";
const secondary = "rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium hover:bg-slate-50 disabled:opacity-50";
const tile = "rounded-lg border border-slate-200 p-4 text-left hover:bg-slate-50";

function gradeLabel(grade: number) {
  return grade === 0 ? "Kindergarten" : `Grade ${grade}`;
}

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
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

  // Authentication and sign-up form.
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedConsent, setAcceptedConsent] = useState(false);
  const [signupCompleted, setSignupCompleted] = useState(false);

  // CAPTCHA applies to login and sign-up when enabled in Supabase.
  // The site key is public; the matching SECRET belongs only in Supabase.
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaInstance, setCaptchaInstance] = useState(0);

  // Parent PIN and profile forms.
  const [pinMode, setPinMode] = useState<PinMode>("checking");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [parentName, setParentName] = useState("");
  const [childName, setChildName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [grade, setGrade] = useState("");

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

  // One auth listener, rather than duplicate calls on every screen change.
  useEffect(() => {
    let live = true;

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!live) return;
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        setUser(session?.user ?? null);
      }
    });

    void supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!live) return;
      setUser(authError ? null : data.user);
      setInitializing(false);
    }).catch(() => {
      if (!live) return;
      setUser(null);
      setInitializing(false);
    });

    return () => {
      live = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // When the parent changes, clear data from the previous account first.
  // Only the database RLS policies can enforce who can read each child.
  useEffect(() => {
    if (initializing) return;
    let live = true;
    const accountId = user?.id ?? null;
    userIdRef.current = accountId;
    setChildren([]);
    setError("");

    if (!accountId) {
      setScreen("login");
      setParentName("");
      return;
    }

    setParentName(String(user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? ""));
    setScreen("home");

    // Fail closed: if we cannot lock the parent area, do not show child picker.
    void (async () => {
      const lock = await supabase.rpc("lock_parent_area");
      if (!live || userIdRef.current !== accountId) return;
      if (lock.error) {
        setError(`Cannot secure parent area: ${lock.error.message}`);
        setScreen("pin");
        setPinMode("unavailable");
        return;
      }
      const result = await supabase.from("children")
        .select("id,name,date_of_birth,grade")
        .order("created_at", { ascending: true });
      if (!live || userIdRef.current !== accountId) return;
      if (result.error) setError(`Could not load children: ${result.error.message}`);
      else setChildren((result.data ?? []) as Child[]);
    })();

    return () => { live = false; };
    // We intentionally depend on user ID, not user metadata updates.
  }, [user?.id, initializing]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password) return setError("Enter your email and password.");
    if (turnstileSiteKey && !captchaToken) return setError("Complete the CAPTCHA first.");
    setBusy(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
        options: captchaToken ? { captchaToken } : undefined,
      });
      if (authError) {
        setError(authError.message.toLowerCase().includes("captcha")
          ? "CAPTCHA verification failed. Ask Gael to check the provider and site key."
          : "Unable to sign in. Check your email and password.");
        resetCaptcha();
        return;
      }
      setPassword("");
      // SIGNED_IN event loads children and opens the profile picker.
    } catch (e) { setError(errorText(e)); resetCaptcha(); }
    finally { setBusy(false); }
  }

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      return setError("Complete all account fields.");
    }
    if (password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return setError("Use at least 8 characters with uppercase, lowercase, and a number.");
    }
    if (password !== confirmPassword) return setError("Passwords do not match.");
    if (!acceptedTerms || !acceptedConsent) return setError("Review and accept both documents before creating an account.");
    if (turnstileSiteKey && !captchaToken) return setError("Complete the CAPTCHA first.");

    setBusy(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          captchaToken: captchaToken ?? undefined,
          data: {
            full_name: fullName.trim(),
            // Provisional, user-editable metadata ONLY; NOT a secure consent audit record.
            terms_acknowledged_version: TERMS_VERSION,
            parental_consent_acknowledged_version: CONSENT_VERSION,
            acknowledgement_time: new Date().toISOString(),
          },
        },
      });

      if (authError) {
        setError(authError.message.toLowerCase().includes("captcha")
          ? "Supabase requires CAPTCHA. Ask Gael to configure Cloudflare Turnstile for localhost."
          : authError.message);
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
        setUser(data.user); // SIGNED_IN event also updates the session.
      } else {
        setMessage("Account request submitted. Check your email for a confirmation link, then log in.");
      }
    } catch (e) { setError(errorText(e)); resetCaptcha(); }
    finally { setBusy(false); }
  }

  async function goHome() {
    setError("");
    const { error: lockError } = await supabase.rpc("lock_parent_area");
    if (lockError) {
      setError(`Could not lock parent settings: ${lockError.message}`);
      return;
    }
    notify("home");
  }

  async function openSettings() {
    setPin(""); setConfirmPin("");
    setPinMode("checking");
    notify("pin");
    const lock = await supabase.rpc("lock_parent_area");
    if (lock.error) { setError(lock.error.message); setPinMode("unavailable"); return; }
    const result = await supabase.rpc("has_parent_pin");
    if (result.error) { setError(result.error.message); setPinMode("unavailable"); return; }
    setPinMode(result.data ? "enter" : "create");
  }

  async function handlePin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!/^\d{4}$/.test(pin)) return setError("Enter exactly four digits.");
    if (pinMode === "create" && pin !== confirmPin) return setError("PINs do not match.");
    setBusy(true);
    try {
      if (pinMode === "create") {
        const created = await supabase.rpc("set_parent_pin", { new_pin: pin });
        if (created.error) { setError(created.error.message); return; }
      }
      // Verify after both creation and entry; do not unlock from client state alone.
      const verified = await supabase.rpc("verify_parent_pin", { pin });
      if (verified.error || verified.data !== true) {
        setError(verified.error?.message ?? "Incorrect PIN. Please try again.");
        setPin("");
        return;
      }
      setPin(""); setConfirmPin("");
      notify("dashboard");
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }

  async function saveParent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    if (!parentName.trim()) return setError("Please enter a parent name.");
    setBusy(true);
    try {
      const result = await supabase.auth.updateUser({ data: { full_name: parentName.trim() } });
      if (result.error) setError(result.error.message);
      else { setUser(result.data.user); setMessage("Parent profile saved."); }
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }

  async function handleAddChild(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    const name = childName.trim();
    if (!name || name.length > 50) return setError("Use a child nickname up to 50 characters.");
    if (!dateOfBirth || dateOfBirth > todayLocal()) return setError("Enter a valid birth date.");
    if (grade === "" || Number(grade) < 0 || Number(grade) > 12) return setError("Choose a grade.");

    setBusy(true);
    try {
      const result = await supabase.from("children")
        .insert({ name, date_of_birth: dateOfBirth, grade: Number(grade) })
        .select("id,name,date_of_birth,grade").single();
      if (result.error) { setError(result.error.message); return; }
      // Do not assume the client-side list proves ownership; DB must enforce RLS.
      setChildren((previous) => [...previous, result.data as Child]);
      setChildName(""); setDateOfBirth(""); setGrade("");
      setMessage("Child profile added.");
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }

  async function handleLogout() {
    setError(""); setBusy(true);
    try {
      // Sign-out is allowed even if the optional lock RPC fails.
      await supabase.rpc("lock_parent_area");
      const { error: authError } = await supabase.auth.signOut();
      if (authError) { setError(authError.message); return; }
      setUser(null); setChildren([]); setPassword("");
      setAcceptedTerms(false); setAcceptedConsent(false);
      changeAuthScreen("login");
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }

  function openPolicy(policy: "terms" | "consent", back: PolicyReturn) {
    setReturnTo(back);
    if (back === "signup") resetCaptcha();
    notify(policy);
  }

  if (initializing) return <main className="p-8">Loading ThinkFirst...</main>;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">ThinkFirst</h1>
          {user && !["home", "login", "signup", "terms", "consent"].includes(screen) && (
            <button type="button" onClick={() => void goHome()} className={secondary}>Back to Home</button>
          )}
        </header>

        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
        {message && <p role="status" className="mb-4 rounded-lg bg-green-50 p-3 text-green-700">{message}</p>}

        {screen === "login" && !user && (
          <section className={card}>
            <h2 className="mb-4 text-xl font-semibold">Parent Login</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <label className="block">Email<input type="email" autoComplete="email" required className={field} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
              <label className="block">Password<input type="password" autoComplete="current-password" required className={field} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
              {turnstileSiteKey && <Turnstile key={captchaInstance} siteKey={turnstileSiteKey} onSuccess={setCaptchaToken} onExpire={() => setCaptchaToken(null)} onError={() => setCaptchaToken(null)} />}
              <button type="submit" disabled={busy || Boolean(turnstileSiteKey && !captchaToken)} className={primary}>{busy ? "Logging in..." : "Log in"}</button>
            </form>
            <p className="mt-5">New parent? <button type="button" onClick={() => changeAuthScreen("signup")} className="text-blue-700 underline">Create account</button></p>
          </section>
        )}

        {screen === "signup" && !user && (
          <section className={card}>
            <h2 className="mb-4 text-xl font-semibold">Create a Parent Account</h2>
            {signupCompleted ? (
              <div className="space-y-3"><p>Registration submitted. If email confirmation is enabled, confirm your email first.</p><button type="button" className={secondary} onClick={() => changeAuthScreen("login")}>Go to Login</button></div>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                <label className="block">Parent Full Name<input required maxLength={100} autoComplete="name" className={field} value={fullName} onChange={(e) => setFullName(e.target.value)} /></label>
                <label className="block">Email<input type="email" required autoComplete="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
                <label className="block">Password<input type="password" required autoComplete="new-password" className={field} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
                <label className="block">Confirm Password<input type="password" required autoComplete="new-password" className={field} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></label>

                <div className="flex items-start gap-2">
                  <input id="agree-terms" type="checkbox" className="mt-1" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
                  <div><label htmlFor="agree-terms">I agree to the Terms &amp; Conditions.</label> <button type="button" className="text-blue-700 underline" onClick={() => openPolicy("terms", "signup")}>Read Terms</button></div>
                </div>

                <div className="flex items-start gap-2">
                  <input id="agree-consent" type="checkbox" className="mt-1" checked={acceptedConsent} onChange={(e) => setAcceptedConsent(e.target.checked)} />
                  <div><label htmlFor="agree-consent">I have reviewed the Parental Consent information.</label> <button type="button" className="text-blue-700 underline" onClick={() => openPolicy("consent", "signup")}>Read Consent</button></div>
                </div>

                {turnstileSiteKey && <Turnstile key={captchaInstance} siteKey={turnstileSiteKey} onSuccess={setCaptchaToken} onExpire={() => setCaptchaToken(null)} onError={() => setCaptchaToken(null)} />}
                {!turnstileSiteKey && <p className="text-xs text-slate-500">If Supabase requires CAPTCHA, Gael must add NEXT_PUBLIC_TURNSTILE_SITE_KEY and configure the matching secret.</p>}
                <button type="submit" disabled={busy || !acceptedTerms || !acceptedConsent || Boolean(turnstileSiteKey && !captchaToken)} className={primary}>{busy ? "Creating account..." : "Create Account"}</button>
              </form>
            )}
            <button type="button" onClick={() => changeAuthScreen("login")} className="mt-5 text-blue-700 underline">Back to Login</button>
          </section>
        )}

        {screen === "home" && user && (
          <section className={card}>
            <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-semibold">Who&apos;s learning today?</h2><button type="button" className={secondary} onClick={() => void openSettings()}>⚙ Parent Settings</button></div>
            {children.length === 0 && <p className="text-slate-500">No child profiles available. Open Parent Settings to add one.</p>}
            <div className="flex flex-wrap gap-3">
              {children.map((child) => (
                <a key={child.id} className={tile} href={`/child/welcome?childId=${encodeURIComponent(child.id)}`}>
                  <span aria-hidden="true" className="mb-2 block text-2xl">{child.name.charAt(0).toUpperCase()}</span>
                  <strong>{child.name}</strong><p className="text-sm text-slate-500">{gradeLabel(child.grade)}</p>
                </a>
              ))}
            </div>
            <p className="mt-5 text-xs text-slate-500">Child pages require the team&apos;s /child/welcome route and database authorization checks.</p>
          </section>
        )}

        {screen === "pin" && user && (
          <section className={card}>
            <h2 className="mb-3 text-xl font-semibold">Parent Access PIN</h2>
            {pinMode === "checking" && <p>Checking Parent PIN...</p>}
            {pinMode === "unavailable" && <button type="button" className={secondary} onClick={() => void openSettings()}>Try again</button>}
            {(pinMode === "create" || pinMode === "enter") && (
              <form className="space-y-4" onSubmit={handlePin}>
                <p className="text-sm text-slate-600">{pinMode === "create" ? "Create a four-digit PIN to protect parent settings." : "Enter your four-digit parent PIN."}</p>
                <label className="block">Parent PIN<input required type="password" inputMode="numeric" autoComplete="off" maxLength={4} className={field} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} /></label>
                {pinMode === "create" && <label className="block">Confirm PIN<input required type="password" inputMode="numeric" maxLength={4} className={field} value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))} /></label>}
                <button className={primary} disabled={busy} type="submit">{busy ? "Checking..." : pinMode === "create" ? "Create PIN" : "Unlock Dashboard"}</button>
              </form>
            )}
          </section>
        )}

        {screen === "dashboard" && user && (
          <section className={card}>
            <h2 className="mb-2 text-xl font-semibold">Parent Dashboard</h2>
            <p className="mb-5 text-slate-500">Manage your ThinkFirst family settings.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" className={tile} onClick={() => notify("parent-profile")}>Parent Profile</button>
              <button type="button" className={tile} onClick={() => notify("child-profiles")}>Child Profiles</button>
              <button type="button" className={tile} onClick={() => openPolicy("terms", "dashboard")}>Terms &amp; Conditions</button>
              <button type="button" className={tile} onClick={() => openPolicy("consent", "dashboard")}>Parental Consent &amp; Privacy</button>
              <button type="button" disabled={busy} className={`${tile} text-red-700`} onClick={() => void handleLogout()}>Log Out</button>
            </div>
          </section>
        )}

        {screen === "parent-profile" && user && (
          <section className={card}>
            <h2 className="mb-3 text-xl font-semibold">Parent Profile</h2>
            <p className="mb-4">Email: {user.email}</p>
            <form onSubmit={saveParent} className="space-y-4">
              <label className="block">Parent Name<input required maxLength={100} className={field} value={parentName} onChange={(e) => setParentName(e.target.value)} /></label>
              <button type="submit" disabled={busy} className={primary}>{busy ? "Saving..." : "Save Name"}</button>
            </form>
            <button className="mt-5 text-blue-700 underline" type="button" onClick={() => notify("dashboard")}>Back to Dashboard</button>
          </section>
        )}

        {screen === "child-profiles" && user && (
          <section className={card}>
            <h2 className="mb-4 text-xl font-semibold">Child Profiles</h2>
            <ul className="space-y-2">{children.map((child) => <li key={child.id} className="border-b py-2">{child.name} — {gradeLabel(child.grade)}</li>)}</ul>
            <h3 className="mb-3 mt-6 font-semibold">Add Child</h3>
            <form onSubmit={handleAddChild} className="space-y-4">
              <label className="block">Child Nickname<input required maxLength={50} className={field} value={childName} onChange={(e) => setChildName(e.target.value)} /></label>
              <label className="block">Date of Birth (required by current database)<input type="date" required className={field} value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} /></label>
              <label className="block">Grade<select required className={field} value={grade} onChange={(e) => setGrade(e.target.value)}><option value="">Select grade</option>{Array.from({ length: 13 }, (_, i) => <option value={i} key={i}>{gradeLabel(i)}</option>)}</select></label>
              <button type="submit" disabled={busy} className={primary}>{busy ? "Saving..." : "Add Child"}</button>
            </form>
            <p className="mt-3 text-xs text-amber-800">Privacy note: the team checklist calls for age bands rather than birth dates. A database migration is needed to remove the birth-date field.</p>
            <button className="mt-5 text-blue-700 underline" type="button" onClick={() => notify("dashboard")}>Back to Dashboard</button>
          </section>
        )}

        {screen === "terms" && (
          <section className={card}>
            <h2 className="mb-2 text-2xl font-semibold">ThinkFirst Terms &amp; Conditions</h2>
            <p className="mb-5 text-sm text-amber-700">Draft version {TERMS_VERSION} — team/legal review required before public use.</p>
            <div className="space-y-4 text-slate-700">
              <p><strong>1. Educational Purpose.</strong> ThinkFirst supports literacy, mathematics, science, and critical thinking for children ages 8–14.</p>
              <p><strong>2. Parent Responsibility.</strong> Parents or authorized guardians manage their accounts and supervise children using the application.</p>
              <p><strong>3. AI Content.</strong> AI-assisted educational responses may contain errors and should be reviewed.</p>
              <p><strong>4. Appropriate Use.</strong> Users should not submit unnecessary personal or sensitive information or misuse the service.</p>
              <p><strong>5. Privacy.</strong> Read the Parental Consent information for details about child data, learning activities, and microphone features.</p>
              <p><strong>6. Changes.</strong> Terms must be reviewed, versioned, and communicated before they take effect.</p>
            </div>
            <button type="button" className="mt-6 text-blue-700 underline" onClick={() => notify(returnTo)}>Back</button>
          </section>
        )}

        {screen === "consent" && (
          <section className={card}>
            <h2 className="mb-2 text-2xl font-semibold">Parental Consent &amp; Privacy</h2>
            <p className="mb-5 text-sm text-amber-700">Draft version {CONSENT_VERSION} — verify actual data handling before release.</p>
            <div className="space-y-4 text-slate-700">
              <p><strong>1. Parent Data.</strong> Signup asks for parent name, email, and authentication credentials.</p>
              <p><strong>2. Child Profiles.</strong> The current database uses child nicknames, date of birth, and grade. The team should minimize this to age bands where possible.</p>
              <p><strong>3. Learning Data.</strong> Responses, activities, and conversations may be processed for tutoring and progress information.</p>
              <p><strong>4. Microphone.</strong> Voice features need separate guardian authorization AND browser microphone permission. Accepting this consent form does not turn on microphone access.</p>
              <p><strong>5. AI and Voice Providers.</strong> The team must name any providers, disclose whether audio/transcripts are stored, and define retention and deletion timelines.</p>
              <p><strong>6. Access Controls.</strong> Child records must be isolated in Supabase with verified RLS policies and authorized parent/guardian membership.</p>
              <p><strong>7. Parent Choices.</strong> Parents need a means to review, withdraw consent, and request access to or deletion of child information.</p>
            </div>
            <button type="button" className="mt-6 text-blue-700 underline" onClick={() => notify(returnTo)}>Back</button>
          </section>
        )}

        <footer className="mt-8 text-center text-sm text-slate-500">ThinkFirst — Don&apos;t answer first. Think first.</footer>
      </div>
    </main>
  );
}

