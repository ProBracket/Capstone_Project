/** Parent Profile section of the Parent Dashboard.
 * Shows the logged-in parent's name and email and lets them edit their name.
 * All Supabase calls go through lib/profile.
 */
"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getFullName, updateFullName } from "@/lib/profile";

type Props = {
  user: User;
  onUserUpdated: (user: User) => void; // keeps the page's copy of the user in sync
  onBack: () => void;
};

export default function ParentProfile({ user, onUserUpdated, onBack }: Props) {
  const [name, setName] = useState(getFullName(user)); // saved name, shown when not editing
  const [editName, setEditName] = useState(name); // what's typed in the input while editing
  const [saving, setSaving] = useState(false); // true while a save is in progress
  const [editing, setEditing] = useState(false); // shows the input instead of the text
  const [error, setError] = useState(""); // red banner
  const [message, setMessage] = useState(""); // green banner

  // Save button: validate, save the new name, then switch back to view mode
  async function handleSave() {
    // Don't allow a blank name (or one that's only spaces)
    if (!editName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const { data, error } = await updateFullName(editName);

    if (error) {
      setError(error.message);
    } else {
      onUserUpdated(data.user);
      setName(editName.trim());
      setEditing(false);
      setMessage("Your profile was updated successfully.");
    }

    setSaving(false);
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Parent Profile</h2>
        <p className="mt-1 text-sm text-slate-500">
          View and manage your account information.
        </p>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
          {message}
        </p>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="parent-name" className="mb-1 block text-sm font-medium">
            Full Name
          </label>

          {/* Edit mode shows an input; view mode shows plain text */}
          {editing ? (
            <input
              id="parent-name"
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={100}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
            />
          ) : (
            <p className="py-2 text-slate-700">
              {name || "No name added yet"}
            </p>
          )}
        </div>

        <div>
          <p className="mb-1 text-sm font-medium">Email Address</p>
          <p className="py-2 text-slate-700">
            {user.email || "No email available"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {editing ? (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              {/* Cancel throws away what was typed and restores the saved name */}
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setEditName(name);
                  setError("");
                }}
                disabled={saving}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                setMessage("");
              }}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Edit Profile
            </button>
          )}

          <button
            type="button"
            onClick={onBack}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </section>
  );
}
