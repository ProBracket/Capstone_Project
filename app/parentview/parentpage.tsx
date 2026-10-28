
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Child = {
  id: number;
  name: string;
  grade: number;
  color: string;
};

type Parent = {
  name: string;
  email: string;
};

const sampleChildren: Child[] = [
  {
    id: 1,
    name: "Child 1",
    grade: 6,
    color: "bg-blue-200",
  },
  {
    id: 2,
    name: "Child 2",
    grade: 7,
    color: "bg-purple-200",
  },
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export default function ParentProfile() {
  const [parent, setParent] = useState<Parent>({
    name: "Sample Parent",
    email: "parent@example.com",
  });

  const [children] = useState<Child[]>(sampleChildren);
  const [selectedChild, setSelectedChild] =
    useState<Child | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [demoMode, setDemoMode] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadParent() {
      if (!supabase) {
        setMessage("Supabase is not configured. Showing demo data.");
        setLoading(false);
        return;
      }

      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (!active) return;

      if (authError || !authData.user) {
        setMessage("Not signed in. Showing demo data.");
        setLoading(false);
        return;
      }

      const user = authData.user;

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

      if (!active) return;

      if (profileError) {
        setMessage(
          "Profile could not be loaded. Using account information."
        );
      }

      const fullName =
        profile?.full_name ??
        profile?.name ??
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        "Parent";

      setParent({
        name: fullName,
        email: profile?.email ?? user.email ?? "",
      });

      setDemoMode(false);
      setLoading(false);
    }

    void loadParent();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 px-5 py-10">
      <div className="mx-auto max-w-5xl">

        {/* ThinkFirst Header */}
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-800">
              ThinkFirst
            </h1>
            <p className="text-sm text-gray-500">
              Parent Dashboard
            </p>
          </div>

          <div className="rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900">
            Parent Account
          </div>
        </header>

        {/* Loading and Demo Status */}
        {loading && (
          <p className="mb-6 text-gray-600">
            Loading parent information...
          </p>
        )}

        {!loading && message && (
          <p
            role="status"
            className="mb-6 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800"
          >
            {message}
          </p>
        )}

        {/* Child Profile Selection */}
        {!selectedChild ? (
          <section className="rounded-2xl bg-white p-8 shadow-md">

            <h2 className="mb-2 text-center text-3xl font-bold text-gray-900">
              Who's learning today?
            </h2>

            <p className="mb-10 text-center text-gray-500">
              Choose a child profile to continue learning.
            </p>

            <div className="flex flex-wrap justify-center gap-8">
              {children.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => setSelectedChild(child)}
                  className="group flex w-40 flex-col items-center"
                >
                  <div
                    className={`${child.color} flex h-36 w-36 items-center justify-center rounded-2xl shadow-sm transition-transform group-hover:scale-105`}
                  >
                    <span className="text-6xl" aria-hidden="true">
                      👤
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-semibold text-gray-900">
                    {child.name}
                  </h3>

                  <p className="text-sm text-gray-500">
                    Grade {child.grade}
                  </p>
                </button>
              ))}

              {/* Add Child Placeholder */}
              <div className="flex w-40 flex-col items-center opacity-70">
                <div className="flex h-36 w-36 items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50">
                  <span className="text-5xl text-gray-400">
                    +
                  </span>
                </div>

                <p className="mt-4 font-semibold text-gray-700">
                  Add Child
                </p>

                <p className="text-xs text-gray-500">
                  Coming soon
                </p>
              </div>
            </div>

            <p className="mt-10 text-center text-xs text-gray-400">
              Child profiles are sample data for Sprint 2.
            </p>
          </section>
        ) : (
          /* Selected Child */
          <section className="rounded-2xl bg-white p-8 text-center shadow-md">
            <h2 className="text-2xl font-bold text-gray-900">
              Hello, {selectedChild.name}!
            </h2>

            <p className="mt-3 text-gray-600">
              Grade {selectedChild.grade}
            </p>

            <p className="mt-5 text-gray-500">
              Your learning dashboard will appear here
              when the child dashboard is connected.
            </p>

            <button
              type="button"
              onClick={() => setSelectedChild(null)}
              className="mt-8 rounded-lg bg-blue-700 px-6 py-3 text-white hover:bg-blue-800"
            >
              Back to Profiles
            </button>
          </section>
        )}

        {/* Parent Information */}
        <section className="mt-8 rounded-2xl bg-white p-6 shadow-md">
          <h2 className="mb-5 text-xl font-bold text-gray-900">
            Parent Information
          </h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Parent Name
              </p>
              <p className="mt-1 text-lg text-gray-900">
                {parent.name}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">
                Email Address
              </p>
              <p className="mt-1 break-all text-lg text-gray-900">
                {parent.email}
              </p>
            </div>
          </div>

          {demoMode && !loading && (
            <p className="mt-5 text-xs text-gray-500">
              Displaying sample parent information.
            </p>
          )}
        </section>

        <footer className="mt-8 text-center text-sm text-gray-500">
          ThinkFirst — Don't answer first. Think first.
        </footer>
      </div>
    </main>
  );
}
