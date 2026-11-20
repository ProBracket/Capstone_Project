/** Parent PIN screen, shown before Settings/Dashboard.
 * First visit: the parent creates a 4-digit PIN (typed twice).
 * After that: the parent enters it. The check happens in Supabase (lib/pin),
 * so the PIN is never stored in this code.
 */
"use client";

import { useEffect, useState } from "react";
import { hasParentPin, setParentPin, verifyParentPin } from "@/lib/pin";

type Mode = "checking" | "create" | "enter";

type Props = {
  onUnlocked: () => void; // called once the PIN is created or entered correctly
};

export default function PinScreen({ onUnlocked }: Props) {
  const [mode, setMode] = useState<Mode>("checking"); // which form to show
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState(""); // only used when creating
  const [error, setError] = useState(""); // red banner
  const [submitting, setSubmitting] = useState(false);

  // Runs once: ask Supabase whether this parent already has a PIN
  useEffect(() => {
    let active = true;

    hasParentPin().then(({ data, error }) => {
      if (!active) return;

      if (error) {
        setError(error.message);
      } else {
        setMode(data ? "enter" : "create");
      }
    });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (pin.length !== 4) {
      setError("PIN must be exactly 4 digits.");
      return;
    }

    if (mode === "create" && pin !== confirmPin) {
      setError("The two PINs don't match.");
      return;
    }

    setSubmitting(true);

    if (mode === "create") {
      const { error } = await setParentPin(pin);
      setSubmitting(false);

      if (error) {
        setError(error.message);
        return;
      }

      onUnlocked();
      return;
    }

    const { data, error } = await verifyParentPin(pin);
    setSubmitting(false);

    // error = locked out after 5 wrong tries; data false = wrong PIN
    if (error || !data) {
      setError(error ? error.message : "Incorrect PIN. Please try again.");
      setPin("");
      return;
    }

    onUnlocked();
  }

  return (
    <section className="mx-auto max-w-sm rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-center text-xl font-semibold">
        {mode === "create" ? "Create a Parent PIN" : "Parent Access"}
      </h2>

      <p className="mt-1 text-center text-sm text-slate-500">
        {mode === "checking" && "Checking your account..."}
        {mode === "create" &&
          "Choose a 4-digit PIN. You'll need it to open Settings and the Dashboard."}
        {mode === "enter" && "Enter your four-digit parent PIN."}
      </p>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {mode !== "checking" && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <PinInput
            id="parent-pin"
            label="Parent PIN"
            value={pin}
            onChange={(value) => {
              setPin(value);
              setError("");
            }}
          />

          {mode === "create" && (
            <PinInput
              id="confirm-pin"
              label="Type it again"
              value={confirmPin}
              onChange={(value) => {
                setConfirmPin(value);
                setError("");
              }}
            />
          )}

          {/* Disabled while waiting so it can't be clicked twice */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {submitting
              ? "Checking..."
              : mode === "create"
                ? "Save PIN"
                : "Unlock Parent Dashboard"}
          </button>
        </form>
      )}
    </section>
  );
}

type PinInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
};

/** Hidden 4-digit input that only accepts numbers. */
function PinInput({ id, label, value, onChange }: PinInputProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>

      <input
        id={id}
        type="password"
        inputMode="numeric"
        pattern="[0-9]{4}"
        maxLength={4}
        autoComplete="off"
        required
        value={value}
        // Strip anything that isn't a digit and cap at 4
        onChange={(event) =>
          onChange(event.target.value.replace(/\D/g, "").slice(0, 4))
        }
        placeholder="Enter 4 digits"
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-center text-lg tracking-widest outline-none focus:border-slate-500"
      />
    </div>
  );
}
