"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export default function ParentProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!supabase) {
      setError("Supabase environment variables are missing.");
      setLoading(false);
      return;
    }

    let active = true;

    async function loadProfile() {
      if (!supabase) return;

      const { data, error } = await supabase.auth.getUser();

      if (!active) return;

      if (error) {
        setError(error.message);
        setUser(null);
      } else {
        const currentUser = data.user;
        setUser(currentUser);

        const fullName =
          currentUser?.user_metadata?.full_name ??
          currentUser?.user_metadata?.name ??
          "";

        setName(fullName);
        setEditName(fullName);
        setError("");
      }

      setLoading(false);
    }

    void loadProfile();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
          void loadProfile();
        }
      }
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSave() {
    if (!supabase || !user) return;

    if (!editName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: editName.trim(),
      },
    });

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

  async function handleSignOut() {
    if (!supabase) return;

    setError("");
    setMessage("");

    const { error } = await supabase.auth.signOut();

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
                  <a
                    href="/"
                    className="inline-block rounded-lg bg-blue-700 px-5 py-3 font-medium text-white hover:bg-blue-800"
                  >
                    Return to home
                  </a>
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
                        id="parent-name"
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
