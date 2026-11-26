/** Child Profiles section of the Parent Dashboard.
 * Lists the parent's children and has the form to add a new one.
 * Only reachable after the PIN, because Supabase refuses new children
 * while the parent area is locked.
 */
"use client";

import { useEffect, useState } from "react";
import {
  addChild,
  getAge,
  gradeLabel,
  setVoiceEnabled,
  type Child,
} from "@/lib/children";
import { getChildrenWithPin, removeChildPin, setChildPin } from "@/lib/childPin";
import { pictureById } from "@/lib/pinPictures";
import PicturePinSetup from "./PicturePinSetup";

// 0 = Kindergarten, then grades 1–12
const GRADES = Array.from({ length: 13 }, (_, grade) => grade);

type Props = {
  profiles: Child[];
  onAdded: (child: Child) => void; // tells the page so the picker updates too
  // Tells the page that a child was changed (e.g. microphone switched on),
  // so the page can swap in the new version. Same idea as onAdded.
  onUpdated: (child: Child) => void;
  onBack: () => void;
};

export default function ChildProfiles({
  profiles,
  onAdded,
  onUpdated,
  onBack,
}: Props) {
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState(""); // "YYYY-MM-DD" from the date input
  const [grade, setGrade] = useState(""); // "" until a grade is picked
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(""); // red banner
  const [message, setMessage] = useState(""); // green banner

  // --- Microphone switch state (separate from the Add Child form above) ---
  // The id of the child whose switch is saving right now, or null when nothing is saving.
  // Used to disable that one switch so it can't be clicked twice mid-save.
  const [voiceSavingId, setVoiceSavingId] = useState<string | null>(null);
  // Red banner above the list if a switch fails to save. Kept separate from `error`
  // so switch problems don't appear inside the "Add a Child" form.
  const [voiceError, setVoiceError] = useState("");

  // Today as "YYYY-MM-DD" so the date picker can't choose a future birthday
  const today = new Date().toLocaleDateString("en-CA");

  // --- Picture locks ---
  const [lockedIds, setLockedIds] = useState<string[]>([]); // children who have a lock
  const [pinChild, setPinChild] = useState<Child | null>(null); // whose setup is open
  const [pinSaving, setPinSaving] = useState(false);
  const [lockError, setLockError] = useState("");
  const [lockMessage, setLockMessage] = useState("");

  useEffect(() => {
    getChildrenWithPin().then(({ data, error }) => {
      if (error) setLockError("Couldn't load picture locks.");
      else setLockedIds(data);
    });
  }, []);

  function openPinSetup(child: Child) {
    setLockError("");
    setLockMessage("");
    setPinChild(child);
  }

  async function handlePinDone(picks: string[]) {
    if (!pinChild) return;
    const child = pinChild;

    setPinSaving(true);
    const { error } = await setChildPin(child.id, picks);
    setPinSaving(false);
    setPinChild(null);

    if (error) {
      setLockError(error.message);
      return;
    }

    setLockedIds((ids) => (ids.includes(child.id) ? ids : [...ids, child.id]));
    const emojis = picks.map((id) => pictureById(id)?.emoji).join(" ");
    setLockMessage(`Picture lock is on for ${child.name}: ${emojis}`);
  }

  async function handleRemovePin(child: Child) {
    setLockError("");
    setLockMessage("");

    const { error } = await removeChildPin(child.id);
    if (error) {
      setLockError(error.message);
      return;
    }

    setLockedIds((ids) => ids.filter((id) => id !== child.id));
    setLockMessage(`Picture lock is off for ${child.name}.`);
  }

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    // The database has no checks on these, so validate here
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > 50) {
      setError("Please enter a name (up to 50 characters).");
      return;
    }
    if (!dateOfBirth || dateOfBirth > today) {
      setError("Please enter a valid date of birth.");
      return;
    }
    if (grade === "") {
      setError("Please choose a grade.");
      return;
    }

    setSaving(true);
    const { data, error } = await addChild(trimmedName, dateOfBirth, Number(grade));
    setSaving(false);

    if (error) {
      // 42501 = blocked by row-level security, i.e. the PIN switch is OFF
      // (for example, another tab went back to the profile picker)
      setError(
        error.code === "42501"
          ? "Your parent session was locked. Go back home and enter your PIN again."
          : error.message
      );
      return;
    }

    onAdded(data);
    setName("");
    setDateOfBirth("");
    setGrade("");
    setMessage(`${data.name} was added.`);
  }

  /** Runs when the parent clicks a child's microphone switch.
   * Saves the opposite of the current setting, then updates the screen.
   */
  async function handleVoiceToggle(child: Child) {
    setVoiceError(""); // clear any old error from a previous click
    setVoiceSavingId(child.id); // disable this child's switch while saving

    // `!` flips true ↔ false: if the mic is on, turn it off, and vice versa
    const { data, error } = await setVoiceEnabled(child.id, !child.voice_enabled);

    setVoiceSavingId(null); // saving finished (successfully or not), re-enable the switch

    if (error) {
      // When the PIN switch is OFF, the database quietly refuses to update the row.
      // That shows up as one of two codes:
      //   "42501"    = blocked by row-level security
      //   "PGRST116" = we asked for exactly one updated row (.single()) but got none,
      //                because the security rule hid the row from the update
      // Either way it means the parent session is locked, so show a helpful message.
      setVoiceError(
        error.code === "42501" || error.code === "PGRST116"
          ? "Your parent session was locked. Go back home and enter your PIN again."
          : error.message
      );
      return; // stop here: nothing was saved, so the switch stays as it was
    }

    // Saved! Send the updated child (straight from the database) up to the page.
    // The page replaces the old version in its list, and the switch redraws in its new position.
    onUpdated(data);
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-semibold">Child Profiles</h2>

      {profiles.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">
          No child profiles yet. Add your first child below.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {/* Shown only when a microphone switch failed to save */}
          {voiceError && (
            <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {voiceError}
            </p>
          )}

          {/* Picture lock banners */}
          {lockError && (
            <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {lockError}
            </p>
          )}
          {lockMessage && (
            <p role="status" className="rounded-md bg-green-50 p-3 text-sm text-green-700">
              {lockMessage}
            </p>
          )}

          {profiles.map((child) => {
            const locked = lockedIds.includes(child.id);
            return (
              <div key={child.id} className="rounded-md border border-slate-200 px-4 py-3">
                {/* flex + justify-between: child's info on the left, controls on the right */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">
                      {child.name} {locked && <span aria-label="Picture lock on">🔒</span>}
                    </p>
                    <p className="text-sm text-slate-500">
                      Age {getAge(child.date_of_birth)} · {gradeLabel(child.grade)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Microphone switch. Wrapping the checkbox in a <label> makes the
                        text clickable too, and lets screen readers announce what it's for. */}
                    <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        // Shows the value saved in the database (ticked = mic allowed)
                        checked={child.voice_enabled}
                        // Clicking saves the opposite value (see handleVoiceToggle above)
                        onChange={() => handleVoiceToggle(child)}
                        // Can't be clicked again while this child's switch is saving
                        disabled={voiceSavingId === child.id}
                        className="h-4 w-4"
                      />
                      🎤 Microphone
                    </label>

                    {/* Picture lock buttons (hidden while this child's setup is open) */}
                    {pinChild?.id !== child.id && (
                      <>
                        <button
                          type="button"
                          onClick={() => openPinSetup(child)}
                          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
                        >
                          {locked ? "Change pictures" : "Add picture lock"}
                        </button>
                        {locked && (
                          <button
                            type="button"
                            onClick={() => handleRemovePin(child)}
                            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
                          >
                            Turn off lock
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {pinChild?.id === child.id && (
                  <PicturePinSetup
                    childName={child.name}
                    saving={pinSaving}
                    onDone={handlePinDone}
                    onCancel={() => setPinChild(null)}
                  />
                )}
              </div>
            );
          })}

          {/* Explains to the parent what the switch does (informed consent) */}
          <p className="text-xs text-slate-500">
            🎤 Microphone lets your child talk to their tutor instead of typing.
            Only the text of what they say is saved, never the recording.
          </p>
        </div>
      )}

      {/* Add Child form */}
      <form
        onSubmit={handleAdd}
        className="mt-6 space-y-4 border-t border-slate-200 pt-6"
      >
        <h3 className="font-semibold">Add a Child</h3>

        {error && (
          <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {message && (
          <p role="status" className="rounded-md bg-green-50 p-3 text-sm text-green-700">
            {message}
          </p>
        )}

        <div>
          <label htmlFor="child-name" className="mb-1 block text-sm font-medium">
            Name
          </label>
          <input
            id="child-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="child-dob" className="mb-1 block text-sm font-medium">
              Date of Birth
            </label>
            <input
              id="child-dob"
              type="date"
              value={dateOfBirth}
              max={today}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label htmlFor="child-grade" className="mb-1 block text-sm font-medium">
              Grade
            </label>
            <select
              id="child-grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500"
            >
              <option value="">Choose a grade</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {gradeLabel(g)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Disabled while saving so it can't be clicked twice */}
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {saving ? "Adding..." : "Add Child"}
        </button>
      </form>

      <button
        type="button"
        onClick={onBack}
        className="mt-6 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
      >
        Back to Dashboard
      </button>
    </section>
  );
}
