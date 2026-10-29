
"use client";

import { useState } from "react";

// DEMO ONLY: This PIN is not secure authentication.
// Gael will need to replace it with server-side PIN verification.
const DEMO_PARENT_PIN = "1234";

type Screen =
  | "home"
  | "pin"
  | "dashboard"
  | "parent-profile"
  | "child-profiles"
  | "placeholder";

type PlaceholderName =
  | "Dashboard Summary"
  | "Consent"
  | "Permissions"
  | "Subscription"
  | "Logout";

const placeholderSections: PlaceholderName[] = [
  "Dashboard Summary",
  "Consent",
  "Permissions",
  "Subscription",
  "Logout",
];

export default function ParentProfile() {
  const [screen, setScreen] = useState<Screen>("home");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [placeholder, setPlaceholder] =
    useState<PlaceholderName>("Dashboard Summary");

  // For Sprint 2, no child accounts are configured yet.
  // Connect this to the team's Supabase child-profile table later.
  const children: { id: string; name: string }[] = [];

  function openPinScreen() {
    setPin("");
    setPinError("");
    setScreen("pin");
  }

  function verifyPin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pin === DEMO_PARENT_PIN) {
      setPin("");
      setPinError("");
      setScreen("dashboard");
    } else {
      setPinError("Incorrect PIN. Please try again.");
      setPin("");
    }
  }

  function openPlaceholder(name: PlaceholderName) {
    setPlaceholder(name);
    setScreen("placeholder");
  }

  function returnHome() {
    setPin("");
    setPinError("");
    setScreen("home");
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">
            ThinkFirst
          </h1>

          {screen === "home" ? (
            <button
              type="button"
              onClick={openPinScreen}
              aria-label="Open parent settings"
              title="Parent settings"
              className="rounded-full bg-white p-3 shadow-sm transition hover:bg-blue-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.86 1.86-.06-.06A1.7 1.7 0 0 0 16 18.4a1.7 1.7 0 0 0-1 .8l-.04.1h-2.64l-.04-.1a1.7 1.7 0 0 0-1-.8 1.7 1.7 0 0 0-1.88.34l-.06.06-1.86-1.86.06-.06A1.7 1.7 0 0 0 7.88 15a1.7 1.7 0 0 0-.8-1l-.1-.04v-2.64l.1-.04a1.7 1.7 0 0 0 .8-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06 1.86-1.86.06.06A1.7 1.7 0 0 0 11.28 6a1.7 1.7 0 0 0 1-.8l.04-.1h2.64l.04.1a1.7 1.7 0 0 0 1 .8 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.86 1.86-.06.06A1.7 1.7 0 0 0 19.4 9.4a1.7 1.7 0 0 0 .8 1l.1.04v2.64l-.1.04a1.7 1.7 0 0 0-.8 1Z" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={returnHome}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Back to Home
            </button>
          )}
        </header>

        {/* Home screen */}
        {screen === "home" && (
          <section className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl bg-white p-8 text-center shadow-sm">
            <h2 className="text-3xl font-bold">
              Who&apos;s learning today?
            </h2>

            <p className="mt-6 text-slate-500">
              No child profiles available yet.
            </p>
          </section>
        )}

        {/* Parent PIN screen */}
        {screen === "pin" && (
          <section className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm">
            <h2 className="text-center text-2xl font-bold">
              Parent Access
            </h2>

            <p className="mt-3 text-center text-slate-500">
              Enter your four-digit parent PIN.
            </p>

            <form onSubmit={verifyPin} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="parent-pin"
                  className="mb-2 block text-sm font-semibold"
                >
                  Parent PIN
                </label>

                <input
                  id="parent-pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  autoComplete="off"
                  required
                  value={pin}
                  onChange={(event) => {
                    setPin(
                      event.target.value.replace(/\D/g, "").slice(0, 4)
                    );
                    setPinError("");
                  }}
                  placeholder="Enter 4 digits"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-center text-xl tracking-widest outline-none focus:border-blue-600"
                />
              </div>

              {pinError && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                >
                  {pinError}
                </p>
              )}

              <button
                type="submit"
                className="w-full rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
              >
                Unlock Parent Dashboard
              </button>

              <p className="text-center text-xs text-slate-500">
                Sprint 2 demo PIN: 1234
              </p>
            </form>
          </section>
        )}

        {/* Parent Dashboard */}
        {screen === "dashboard" && (
          <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-2 text-3xl font-bold">
              Parent Dashboard
            </h2>

            <p className="mb-8 text-slate-500">
              Manage your ThinkFirst family settings.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setScreen("parent-profile")}
                className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-left hover:bg-blue-100"
              >
                <h3 className="text-lg font-bold text-blue-900">
                  Parent Profile
                </h3>
                <p className="mt-2 text-sm text-blue-700">
                  Open parent account settings.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setScreen("child-profiles")}
                className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-left hover:bg-blue-100"
              >
                <h3 className="text-lg font-bold text-blue-900">
                  Child Profiles
                </h3>
                <p className="mt-2 text-sm text-blue-700">
                  View your children's profiles.
                </p>
              </button>

              {placeholderSections.map((name) => (
                <button
                  type="button"
                  key={name}
                  onClick={() => openPlaceholder(name)}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-left hover:bg-slate-100"
                >
                  <h3 className="text-lg font-bold text-slate-600">
                    {name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Coming Soon
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Parent Profile section */}
        {screen === "parent-profile" && (
          <section className="rounded-2xl bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold">
              Parent Profile
            </h2>

            <p className="mt-4 text-slate-500">
              Parent account settings will be available here.
            </p>

            <button
              type="button"
              onClick={() => setScreen("dashboard")}
              className="mt-8 rounded-lg bg-blue-700 px-5 py-3 text-white hover:bg-blue-800"
            >
              Back to Dashboard
            </button>
          </section>
        )}

        {/* Child Profiles section */}
        {screen === "child-profiles" && (
          <section className="rounded-2xl bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold">
              Child Profiles
            </h2>

            {children.length === 0 ? (
              <p className="mt-4 text-slate-500">
                No child profiles available yet.
              </p>
            ) : (
              <div className="mt-6 space-y-3">
                {children.map((child) => (
                  <div
                    key={child.id}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    {child.name}
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setScreen("dashboard")}
              className="mt-8 rounded-lg bg-blue-700 px-5 py-3 text-white hover:bg-blue-800"
            >
              Back to Dashboard
            </button>
          </section>
        )}

        {/* Placeholder sections */}
        {screen === "placeholder" && (
          <section className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <h2 className="text-2xl font-bold">
              {placeholder}
            </h2>

            <p className="mt-4 text-slate-500">
              Coming Soon
            </p>

            <button
              type="button"
              onClick={() => setScreen("dashboard")}
              className="mt-8 rounded-lg bg-blue-700 px-5 py-3 text-white hover:bg-blue-800"
            >
              Back to Dashboard
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
