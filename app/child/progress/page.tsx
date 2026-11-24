import ChildNavbar from "@/components/ChildNavbar";
// line icons (same icon set as the navbar)
import { BookOpen, Calculator, FlaskConical } from "lucide-react";

// Learning Progress page (/child/progress)
// Teal banner, then one white card with a row per subject
// (same style as the checklist on the Goals page).
// Percentages are placeholders for now (later they come from Supabase).

// one row per subject
// tile = icon square colours, bar = filled part of the bar
const subjects = [
  {
    title: "Math",
    percent: 80,
    Icon: Calculator,
    tile: "bg-amber-300 border-amber-500 text-amber-950",
    bar: "bg-amber-400",
  },
  {
    title: "Science",
    percent: 60,
    Icon: FlaskConical,
    tile: "bg-sky-300 border-sky-500 text-sky-950",
    bar: "bg-sky-400",
  },
  {
    title: "Literature",
    percent: 40,
    Icon: BookOpen,
    tile: "bg-pink-300 border-pink-500 text-pink-950",
    bar: "bg-pink-400",
  },
];

export default function ProgressPage() {
  // average of all subjects, e.g. (80 + 60 + 40) / 3 = 60
  const overall = Math.round(
    subjects.reduce((sum, s) => sum + s.percent, 0) / subjects.length
  );

  return (
    <>
      <ChildNavbar />

      <main className="ml-sidebar min-h-screen bg-background px-10 py-10">
        <div className="mx-auto max-w-4xl">

          {/* ----- TEAL BANNER ----- */}
          <section className="flex flex-wrap items-center gap-6 rounded-3xl border-b-8 border-teal-900 bg-primary px-8 py-6 text-white">
            <div>
              <h1 className="text-4xl font-extrabold">My progress</h1>
              <p className="mt-1 text-lg font-semibold text-teal-100">Look how much you&apos;ve learned!</p>
            </div>

            <span className="ml-auto rounded-full bg-white px-4 py-2 text-lg font-extrabold text-primary">
              {overall}% overall
            </span>
          </section>

          {/* ----- WHITE CARD (same style as the Goals checklist) ----- */}
          <section className="mt-8 rounded-3xl border-2 border-b-8 border-border bg-surface px-8 py-7">
            <h2 className="text-2xl font-extrabold text-foreground">My subjects</h2>

            {/* one row per subject, dashed line between rows */}
            <ul className="mt-4">
              {subjects.map(({ title, percent, Icon, tile, bar }) => (
                <li
                  key={title}
                  className="flex items-center gap-4 border-t-2 border-dashed border-border py-5"
                >
                  {/* coloured icon square, same colour as the home page tile */}
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-b-4 ${tile}`}>
                    <Icon aria-hidden="true" size={26} strokeWidth={2.25} />
                  </span>

                  <div className="flex-1">
                    {/* subject name on the left, percent on the right */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-extrabold text-foreground">{title}</h3>
                      <span className="font-extrabold text-foreground">{percent}%</span>
                    </div>

                    {/* progress bar (same size as the Goals bar).
                        role="progressbar" lets screen readers say "Math, 80%" */}
                    <div
                      role="progressbar"
                      aria-label={title}
                      aria-valuenow={percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="mt-2 h-4 rounded-full bg-surface-muted"
                    >
                      <div className={`h-4 rounded-full ${bar}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

        </div>
      </main>
    </>
  );
}
