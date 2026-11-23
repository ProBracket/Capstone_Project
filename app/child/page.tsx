import Link from "next/link";
import Image from "next/image";
import ChildNavbar from "@/components/ChildNavbar";
// line icons (same icon set as Gael's navbar)
import { Flame, Sprout, Trophy } from "lucide-react";

// Child dashboard (/child)
// Uses the team's theme colours from app/globals.css
// Line icons + the books sticker (public/stickers/books.png), no emojis
export default function ChildDashboard() {
  return (
    <>
      <ChildNavbar />

      {/* ml-sidebar = leave room for the sidebar (same on every child page) */}
      <main className="ml-sidebar min-h-screen bg-background pt-12 px-8 flex justify-center">
        <div className="w-full max-w-6xl">

          {/* ----- WELCOME ----- */}
          <div className="text-center mb-12">
            <h1 className="text-6xl font-extrabold text-foreground mb-4">
              Welcome Back
            </h1>

            <p className="text-xl text-muted">
              Ready to continue your learning adventure today?
            </p>
          </div>

          {/* ----- TWO BIG CARDS ----- */}
          <div className="grid md:grid-cols-2 gap-8">

            {/* rounded-card on the Link so the keyboard focus outline is rounded too */}
            <Link href="/child/chat" className="block rounded-card">
              <div className="h-full bg-surface border border-border rounded-card shadow-card hover:shadow-raised hover:-translate-y-1 transition p-10 text-center">

                {/* sprout logo (same as the navbar) in a light teal circle,
                    same style as the subject cards on the learning page */}
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Sprout aria-hidden="true" className="h-10 w-10" strokeWidth={1.75} />
                </div>

                <h2 className="text-3xl font-bold text-foreground mb-3">
                  ThinkFirst AI Chat
                </h2>

                <p className="text-muted">
                  Ask questions and learn with your personal AI assistant.
                </p>

              </div>
            </Link>

            <Link href="/child/learning" className="block rounded-card">
              <div className="h-full bg-surface border border-border rounded-card shadow-card hover:shadow-raised hover:-translate-y-1 transition p-10 text-center">

                {/* colourful 3-books sticker (same as the learning page title) */}
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary-soft">
                  <Image src="/stickers/books.png" alt="" width={60} height={60} />
                </div>

                <h2 className="text-3xl font-bold text-foreground mb-3">
                  Guided Learning
                </h2>

                <p className="text-muted">
                  Continue learning Math, Science, and Literature.
                </p>

              </div>
            </Link>

          </div>

          {/* ----- THREE STAT CARDS ----- */}
          <div className="grid md:grid-cols-3 gap-6 mt-10">

            <div className="bg-surface border border-border p-8 rounded-card shadow-card text-center">
              <h3 className="text-lg text-muted">
                Lessons Completed
              </h3>

              <p className="text-4xl font-bold text-primary mt-3">
                12
              </p>
            </div>

            <div className="bg-surface border border-border p-8 rounded-card shadow-card text-center">
              <h3 className="text-lg text-muted">
                Current Streak
              </h3>

              {/* flame icon + number, side by side */}
              <p className="flex items-center justify-center gap-2 text-4xl font-bold text-warning mt-3">
                <Flame aria-hidden="true" size={36} strokeWidth={2.25} />
                5 Days
              </p>
            </div>

            <div className="bg-surface border border-border p-8 rounded-card shadow-card text-center">
              <h3 className="text-lg text-muted">
                Badges Earned
              </h3>

              {/* trophy icon + number, side by side */}
              <p className="flex items-center justify-center gap-2 text-4xl font-bold text-success mt-3">
                <Trophy aria-hidden="true" size={36} strokeWidth={2.25} />
                7
              </p>
            </div>

          </div>

        </div>
      </main>
    </>
  );
}
