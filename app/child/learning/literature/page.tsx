import Link from "next/link";
import ChildNavbar from "@/components/ChildNavbar";
// line icons (same icon set as the navbar)
import { ArrowLeft, BookOpen } from "lucide-react";

// Literature page (/child/learning/literature)
// Same chunky style as the home page, in the Literature colour.
// Lessons are not built yet, so the page shows a "coming soon" message.
// When the team adds lessons, the lesson list goes where that message is.

export default function LiteraturePage() {
  return (
    <>
      <ChildNavbar />

      <main className="ml-64 min-h-screen p-8 bg-purple-50">
        <h1 className="text-4xl font-bold text-purple-700 mb-4">
           Literature
        </h1>

          <div className="mt-4 rounded-3xl border-2 border-dashed border-border bg-surface px-8 py-12 text-center">
            <p className="text-xl font-extrabold text-foreground">Lessons are coming soon</p>
            <p className="mt-2 text-muted">
              Want to learn about literature now? Ask Bud a question.
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
