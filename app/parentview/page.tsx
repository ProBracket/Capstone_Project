/** Parent profile page (/parentview).
 * Shows the logged-in parent's name and email, lets them edit their name,
 * and sign out. All Supabase calls go through lib/auth and lib/profile.
 */
// "use client" makes this run in the browser, which it needs for useState,
// useEffect, and the logged-in session
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { getCurrentUser, onSignInOrOut, signOut } from "@/lib/auth";
import { getFullName, updateFullName } from "@/lib/profile";

export default function ParentProfile() {
  const [user, setUser] = useState<User | null>(null); // null = not signed in
  const [name, setName] = useState(""); // saved name, shown when not editing
  const [editName, setEditName] = useState(""); // what's typed in the input while editing
  const [loading, setLoading] = useState(true); // true until the first user check finishes
  const [saving, setSaving] = useState(false); // true while a save is in progress
  const [editing, setEditing] = useState(false); // shows the input instead of the text
  const [error, setError] = useState(""); // red banner
  const [message, setMessage] = useState(""); // green banner

  // Runs once when the page opens: load the user, then reload whenever they sign in or out
  useEffect(() => {
    // Set to false on cleanup so a slow request can't update the page after it's closed
    let active = true;

    async function loadProfile() {
      const { data, error } = await getCurrentUser();

      if (!active) return;

      if (error) {
        setError(error.message);
        setUser(null);
      } else {
        setUser(data.user);

        // Fill both so the input starts with the current name when editing begins
        const fullName = getFullName(data.user);
        setName(fullName);
        setEditName(fullName);
        setError("");
      }

      setLoading(false);
    }

    void loadProfile();

    const unsubscribe = onSignInOrOut(() => void loadProfile());

    // Cleanup: runs when the page closes
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Save button: validate, save the new name, then switch back to view mode
  async function handleSave() {
    if (!user) return;

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
      setUser(data.user);
      setName(editName.trim());
      setEditing(false);
      setMessage("Your profile was updated successfully.");
    }

    setSaving(false);
  }

  // Sign Out button: end the session and clear the profile from the page
  async function handleSignOut() {
    setError("");
    setMessage("");

    const { error } = await signOut();

    if (error) {
      setError(error.message);
    } else {
      setUser(null);
      setName("");
      setEditName("");
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            ThinkFirst
          </h1>
          <p className="mt-1 text-gray-600">
            Parent Dashboard
          </p>
        </header>

        <section className="rounded-2xl bg-white p-6 shadow-md sm:p-8">
          <div className="mb-6 border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Parent Profile
            </h2>
            <p className="mt-2 text-gray-600">
              View and manage your account information.
            </p>
          </div>

          {/* Three states: loading → not signed in → profile */}
          {loading ? (
            <p className="text-gray-600">
              Loading your profile...
            </p>
          ) : (
            <>
              {error && (
                <p
                  role="alert"
                  className="mb-5 rounded-lg bg-red-50 p-3 text-red-700"
                >
                  {error}
                </p>
              )}

              {message && (
                <p
                  role="status"
                  className="mb-5 rounded-lg bg-green-50 p-3 text-green-700"
                >
                  {message}
                </p>
              )}

              {!user ? (
                <div className="space-y-3">
                  <p className="text-gray-700">
                    Please sign in to view your parent profile.
                  </p>
                  <Link
                    href="/"
                    className="inline-block rounded-lg bg-blue-700 px-5 py-3 font-medium text-white hover:bg-blue-800"
                  >
                    Return to home
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="parent-name"
                      className="mb-2 block font-semibold text-gray-800"
                    >
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
                        className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 focus:border-blue-600 focus:outline-none"
                      />
                    ) : (
                      <p
                        className="rounded-lg bg-gray-50 p-3 text-gray-900"
                      >
                        {name || "No name added yet"}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="mb-2 font-semibold text-gray-800">
                      Email Address
                    </p>
                    <p className="rounded-lg bg-gray-50 p-3 text-gray-900">
                      {user.email || "No email available"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    {editing ? (
                      <>
                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={saving}
                          className="rounded-lg bg-blue-700 px-5 py-3 font-medium text-white hover:bg-blue-800 disabled:opacity-50"
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
                          className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-800 hover:bg-gray-100"
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
                        className="rounded-lg bg-blue-700 px-5 py-3 font-medium text-white hover:bg-blue-800"
                      >
                        Edit Profile
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-800 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        <p className="mt-6 text-center text-sm text-gray-500">
          ThinkFirst — Helping students think first.
        </p>
      </div>
    </main>
  );
}
