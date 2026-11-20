"use client";

import Link from "next/link";

export default function ChildNavbar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-indigo-700 to-purple-700 text-white shadow-2xl">

      <div className="p-6 border-b border-indigo-500">
        <h1 className="text-4xl font-extrabold">
          ThinkFirst
        </h1>

        <p className="text-indigo-200 mt-2">
          Learn • Explore • Grow
        </p>
      </div>

      <nav className="mt-8 flex flex-col gap-2 px-4">

        <Link
          href="/child"
          className="p-4 rounded-xl hover:bg-white/20 transition"
        >
          🏠 My Home
        </Link>

        <Link
          href="/child/chat"
          className="p-4 rounded-xl hover:bg-white/20 transition"
        >
          🤖 Chat
        </Link>

        <Link
          href="/child/learning"
          className="p-4 rounded-xl hover:bg-white/20 transition"
        >
          📚 Learning
        </Link>

        <Link
          href="/child/progress"
          className="p-4 rounded-xl hover:bg-white/20 transition"
        >
          📈 Progress
        </Link>

        <Link
          href="/child/goals"
          className="p-4 rounded-xl hover:bg-white/20 transition"
        >
          🎯 Goals
        </Link>

        <Link
          href="/child/challenges"
          className="p-4 rounded-xl hover:bg-white/20 transition"
        >
          🏆 Challenges
        </Link>

      </nav>
    </aside>
  );
}