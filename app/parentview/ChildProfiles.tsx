"use client";

import { useState } from "react";
import { addChild, gradeLabel, type Child } from "@/lib/children";

// 0 = Kindergarten, then grades 1–12
const GRADES = Array.from({ length: 13 }, (_, grade) => grade);

type Props = {
  profiles: Child[];
  onAdded: (child: Child) => void;
  onBack: () => void;
};

export default function ChildProfiles({
  profiles,
  onAdded,
  onBack,
}: Props) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [grade, setGrade] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleAdd(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    const trimmedName = name.trim();

    if (!trimmedName || trimmedName.length > 50) {
      setError("Please enter a name (up to 50 characters).");
      return;
    }

    if (!age || Number(age) < 1 || Number(age) > 18) {
      setError("Please enter a valid age.");
      return;
    }

    if (grade === "") {
      setError("Please choose a grade.");
      return;
    }

    setSaving(true);

    const { data, error } = await addChild(
      trimmedName,
      Number(age),
      Number(grade)
    );

    setSaving(false);

    if (error) {
      setError(
        error.code === "42501"
          ? "Your parent session was locked. Go back home and enter your PIN again."
          : error.message
      );
      return;
    }

    onAdded(data);

    setName("");
    setAge("");
    setGrade("");

    setMessage(`${data.name} was added.`);
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-semibold">
        Child Profiles
      </h2>

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
              <p className="font-medium">
                {child.name}
              </p>

              <p className="text-sm text-slate-500">
                Age {child.age} · {gradeLabel(child.grade)}
              </p>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={handleAdd}
        className="mt-6 space-y-4 border-t border-slate-200 pt-6"
      >
        <h3 className="font-semibold">
          Add a Child
        </h3>

        {error && (
          <p
            role="alert"
            className="rounded-md bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {message && (
          <p
            role="status"
            className="rounded-md bg-green-50 p-3 text-sm text-green-700"
          >
            {message}
          </p>
        )}

        <div>
          <label
            htmlFor="child-name"
            className="mb-1 block text-sm font-medium"
          >
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
            <label
              htmlFor="child-age"
              className="mb-1 block text-sm font-medium"
            >
              Age
            </label>

            <input
              id="child-age"
              type="number"
              min="1"
              max="18"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label
              htmlFor="child-grade"
              className="mb-1 block text-sm font-medium"
            >
              Grade
            </label>

            <select
              id="child-grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500"
            >
              <option value="">
                Choose a grade
              </option>

              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {gradeLabel(g)}
                </option>
              ))}
            </select>
          </div>

        </div>

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