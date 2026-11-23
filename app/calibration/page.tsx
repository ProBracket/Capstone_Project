
"use client";

import { useState } from "react";
import Link from "next/link";

const tips = [
  {
    icon: "✏️",
    title: "Try your best",
    description: "Give each question an honest attempt.",
  },
  {
    icon: "💡",
    title: "Think it through",
    description: "Take your time and use what you know.",
  },
  {
    icon: "🌟",
    title: "Keep learning",
    description: "It's okay not to know every answer.",
  },
];

export default function CalibrationPage() {
  const [grade, setGrade] = useState("");

  return (
    <main className="min-h-screen bg-[#F8F7F4] px-4 py-10 text-[#1F2937]">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-2xl font-bold text-[#0F766E]">
              ThinkFirst
            </p>

            <p className="mt-1 text-sm text-[#6B7280]">
              Learning starts with thinking.
            </p>
          </div>

          <Link
            href="/child/dashboard"
            className="rounded-lg border border-[#E5E2DB] bg-white px-4 py-2.5 font-medium hover:bg-[#F1EFEA]"
          >
            Back to Dashboard
          </Link>
        </header>

        {/* Introduction */}
        <section className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#CCFBF1] text-5xl">
            🧠
          </div>

          <p className="text-sm font-bold uppercase tracking-widest text-[#0F766E]">
            Your learning journey
          </p>

          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
            Let&apos;s find your starting point!
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[#6B7280]">
            Everyone learns differently. This quick check-in
            will help ThinkFirst understand what you&apos;re ready
            to learn next.
          </p>
        </section>

        {/* Main card */}
        <section className="overflow-hidden rounded-2xl border border-[#E5E2DB] bg-white shadow-sm">

          <div className="border-b border-[#E5E2DB] bg-[#CCFBF1] px-6 py-5 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-wide text-[#0F766E]">
              Getting started
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Your Learning Check-In
            </h2>

            <p className="mt-2 text-sm text-[#374151]">
              A few questions to help personalize your learning.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <label
              htmlFor="grade"
              className="block text-base font-semibold"
            >
              What grade are you in?
            </label>

            <p className="mt-2 text-sm text-[#6B7280]">
              Your grade helps us prepare questions that
              match your learning level.
            </p>

            <select
              id="grade"
              value={grade}
              onChange={(event) => setGrade(event.target.value)}
              className="mt-4 w-full rounded-lg border border-[#E5E2DB] bg-white px-4 py-3 outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#CCFBF1]"
            >
              <option value="">Select your grade</option>

              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Grade {i + 1}
                </option>
              ))}
            </select>

            {grade && (
              <div className="mt-5 rounded-xl bg-[#F1EFEA] p-5">
                <p className="font-semibold text-[#0F766E]">
                  Grade {grade} selected!
                </p>

                <p className="mt-2 text-sm text-[#6B7280]">
                  Your grade-level assessment will appear
                  here once the calibration questions
                  are connected.
                </p>
              </div>
            )}

            <div className="mt-8 rounded-xl border border-[#E5E2DB] bg-[#F8F7F4] p-5">
              <h3 className="font-semibold">
                What happens next?
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
                You&apos;ll answer questions designed for your
                grade. ThinkFirst will use your results
                to guide your learning activities.
              </p>
            </div>

            <div className="mt-8 rounded-lg bg-[#0F766E] px-5 py-4 text-center text-sm font-medium text-white">
              Assessment questions are being connected
              by the ThinkFirst team.
            </div>
          </div>
        </section>

        {/* Helpful tips */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {tips.map((tip) => (
            <article
              key={tip.title}
              className="rounded-2xl border border-[#E5E2DB] bg-white p-6 shadow-sm"
            >
              <div className="text-4xl">
                {tip.icon}
              </div>

              <h3 className="mt-4 font-bold">
                {tip.title}
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
                {tip.description}
              </p>
            </article>
          ))}
        </section>

        <footer className="mt-10 text-center text-sm text-[#6B7280]">
          ThinkFirst — Don&apos;t answer first. Think first.
        </footer>
      </div>
    </main>
  );
}
