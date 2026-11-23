import Link from "next/link";
import ChildNavbar from "@/components/ChildNavbar";
// line icons (same icon set as the navbar)
import { ArrowLeft, FlaskConical } from "lucide-react";

// Science page (/child/learning/science)
// Same chunky style as the home page, in the Science colour.
// Lessons are not built yet, so the page shows a "coming soon" message.
// When the team adds lessons, the lesson list goes where that message is.

export default function SciencePage() {
  return (
    <>
      <ChildNavbar />

      {/* ml-sidebar = leave room for the sidebar (same on every child page) */}
      <main className="ml-sidebar min-h-screen bg-background px-10 py-8">
        <div className="mx-auto max-w-4xl">

          {/* back to the "Choose a Subject" page */}
          <Link
            href="/child/learning"
            className="inline-flex items-center gap-2 rounded-control font-semibold text-muted hover:text-foreground"
          >
            <ArrowLeft aria-hidden="true" size={18} strokeWidth={2.25} />
            All subjects
          </Link>

          {/* ----- BIG SUBJECT BANNER ----- */}
          <section className="mt-4 flex flex-wrap items-center gap-6 rounded-3xl border-b-8 border-sky-500 bg-sky-300 px-8 py-7 text-sky-950">
            <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/50">
              <FlaskConical aria-hidden="true" size={44} strokeWidth={2.25} />
            </span>

            <div>
              <h1 className="text-4xl font-extrabold">Science</h1>
              <p className="font-semibold opacity-80">Plants, animals and space</p>
            </div>
          </section>

          {/* ----- LESSONS (coming soon) ----- */}
          <h2 className="mt-8 text-2xl font-extrabold text-foreground">Lessons</h2>

          <div className="mt-4 rounded-3xl border-2 border-dashed border-border bg-surface px-8 py-12 text-center">
            <p className="text-xl font-extrabold text-foreground">Lessons are coming soon</p>
            <p className="mt-2 text-muted">
              Want to learn about science now? Ask Bud a question.
            </p>

            {/* chunky teal button, floats on hover */}
            <Link
              href="/child/chat"
              className="mt-6 inline-block rounded-2xl border-b-4 border-teal-900 bg-primary px-6 py-3 font-extrabold text-on-primary transition hover:-translate-y-1 hover:shadow-raised active:translate-y-1 active:border-b-0"
            >
              Ask Bud
            </Link>
          </div>

        </div>
      </main>
    </>
  );
}
