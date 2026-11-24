/** Child Profiles section of the Parent Dashboard.
 * Lists the parent's children and has the form to add a new one.
 * Only reachable after the PIN, because Supabase refuses new children
 * while the parent area is locked.
 */
"use client";

import { useState } from "react";
import { addChild, getAge, gradeLabel, type Child } from "@/lib/children";

// 0 = Kindergarten, then grades 1–12
const GRADES = Array.from({ length: 13 }, (_, grade) => grade);

type Props = {
  profiles: Child[];
  onAdded: (child: Child) => void; // tells the page so the picker updates too
  onBack: () => void;
};

export default function ChildProfiles({ profiles, onAdded, onBack }: Props) {
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState(""); // "YYYY-MM-DD" from the date input
  const [grade, setGrade] = useState(""); // "" until a grade is picked
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(""); // red banner
  const [message, setMessage] = useState(""); // green banner

  // Today as "YYYY-MM-DD" so the date picker can't choose a future birthday
  const today = new Date().toLocaleDateString("en-CA");

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

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-semibold">Child Profiles</h2>

      {profiles.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">
          No child profiles yet. Add your first child below.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {profiles.map((child) => (
            <div
              key={child.id}
              className="rounded-md border border-slate-200 px-4 py-3"
            >
              <p className="font-medium">{child.name}</p>
              <p className="text-sm text-slate-500">
                Age {getAge(child.date_of_birth)} · {gradeLabel(child.grade)}
              </p>
            </div>
          ))}
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
