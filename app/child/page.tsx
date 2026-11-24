import Link from "next/link";
import Image from "next/image";
import ChildNavbar from "@/components/ChildNavbar";
// line icons (same icon set as Gael's navbar)
import {
  BookOpen,
  Calculator,
  Flame,
  FlaskConical,
  Sprout,
  Star,
  Trophy,
} from "lucide-react";

// Child home page (/child) - bright, game-like style
// "Chunky" buttons = a thick darker border on the bottom (border-b-4),
// so they look like real buttons you can press.
// Hover = float up with a shadow (same as the learning page cards).
// Click = sink down a little.
// Numbers are placeholders for now (later they come from Supabase).

// the three subjects, each with its own bright colour
// (dark text on light colours so it is easy to read - accessibility)
const subjects = [
  {
    href: "/child/learning/math",
    title: "Math",
    text: "Numbers and fractions",
    Icon: Calculator,
    colour: "bg-amber-300 border-amber-500 text-amber-950",
  },
  {
    href: "/child/learning/science",
    title: "Science",
    text: "Plants, animals, space",
    Icon: FlaskConical,
    colour: "bg-sky-300 border-sky-500 text-sky-950",
  },
  {
    href: "/child/learning/literature",
    title: "Literature",
    text: "Reading and stories",
    Icon: BookOpen,
    colour: "bg-pink-300 border-pink-500 text-pink-950",
  },
];

export default function ChildHome() {
  return (
    <>
      <ChildNavbar />

      {/* ml-sidebar = leave room for the sidebar (same on every child page) */}
      <main className="ml-sidebar min-h-screen bg-background px-10 py-10">
        <div className="mx-auto max-w-5xl">

          {/* ----- TOP ROW: greeting on the left, stats on the right ----- */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold text-foreground">Hi there!</h1>
              <p className="mt-1 text-lg text-muted">Ready to learn something new?</p>
            </div>

            {/* little stat "pills": streak, badges, stars */}
            <div className="flex gap-3">
              <span className="flex items-center gap-2 rounded-full border-2 border-border bg-surface px-4 py-2 text-lg font-extrabold text-orange-600">
                <Flame aria-hidden="true" size={22} strokeWidth={2.5} />
                5
                <span className="sr-only">day streak</span>
              </span>
              <span className="flex items-center gap-2 rounded-full border-2 border-border bg-surface px-4 py-2 text-lg font-extrabold text-amber-600">
                <Trophy aria-hidden="true" size={22} strokeWidth={2.5} />
                7
                <span className="sr-only">badges</span>
              </span>
              <span className="flex items-center gap-2 rounded-full border-2 border-border bg-surface px-4 py-2 text-lg font-extrabold text-primary">
                <Star aria-hidden="true" size={22} strokeWidth={2.5} />
                12
                <span className="sr-only">lessons done</span>
              </span>
            </div>
          </div>

          {/* ----- BIG CONTINUE CARD (the main thing to do) ----- */}
          <section className="mt-8 flex flex-wrap items-center gap-8 rounded-3xl border-b-8 border-teal-900 bg-primary p-8 text-white">
            <Image src="/stickers/books.png" alt="" width={120} height={120} />

            <div className="min-w-60 flex-1">
              <p className="font-bold text-teal-100">Math, lesson 3 of 5</p>
              <h2 className="mt-1 text-3xl font-extrabold">Adding fractions</h2>

              {/* progress bar */}
              <div
                className="mt-4 h-4 rounded-full bg-teal-900"
                role="progressbar"
                aria-valuenow={60}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Lesson progress"
              >
                <div className="h-4 w-3/5 rounded-full bg-amber-300" />
              </div>
            </div>

            {/* chunky white button */}
            <Link
              href="/child/learning/math"
              className="rounded-2xl border-b-4 border-teal-200 bg-white px-8 py-4 text-lg font-extrabold text-teal-700 transition hover:-translate-y-1 hover:shadow-raised active:translate-y-1 active:border-b-0"
            >
              Keep going
            </Link>
          </section>

          {/* ----- SUBJECTS: one bright chunky tile each ----- */}
          <h2 className="mt-10 text-2xl font-extrabold text-foreground">Pick a subject</h2>

          <ul className="mt-4 grid gap-5 md:grid-cols-3">
            {subjects.map(({ href, title, text, Icon, colour }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`block rounded-3xl border-b-8 p-6 transition hover:-translate-y-1 hover:shadow-raised active:translate-y-1 active:border-b-4 ${colour}`}
                >
                  <Icon aria-hidden="true" size={44} strokeWidth={2.25} />
                  <h3 className="mt-4 text-2xl font-extrabold">{title}</h3>
                  <p className="font-semibold opacity-80">{text}</p>
                </Link>
              </li>
            ))}
          </ul>

          {/* ----- ASK BUD ----- */}
          <Link
            href="/child/chat"
            className="mt-10 flex items-center gap-5 rounded-3xl border-2 border-b-8 border-border bg-surface p-6 transition hover:-translate-y-1 hover:shadow-raised active:translate-y-1 active:border-b-4"
          >
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-on-primary">
              <Sprout aria-hidden="true" size={34} strokeWidth={2.25} />
            </span>
            <span>
              <span className="block text-2xl font-extrabold text-foreground">Ask Bud</span>
              <span className="block text-lg text-muted">Stuck? Bud helps you think it through.</span>
            </span>
          </Link>

        </div>
      </main>
    </>
  );
}
