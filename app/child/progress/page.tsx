import ChildNavbar from "@/components/ChildNavbar";
// line icons (same icon set as the navbar)
import { BookOpen, Calculator, FlaskConical } from "lucide-react";

// Learning Progress page (/child/progress)
// Same chunky style as the home page: each subject in its own colour.
// Percentages are placeholders for now (later they come from Supabase).

// one row per subject
// tile = icon square colours, bar = filled part, track = empty part
const subjects = [
  {
    title: "Math",
    percent: 80,
    Icon: Calculator,
    tile: "bg-amber-300 border-amber-500 text-amber-950",
    bar: "bg-amber-400",
    track: "bg-amber-100",
  },
  {
    title: "Science",
    percent: 60,
    Icon: FlaskConical,
    tile: "bg-sky-300 border-sky-500 text-sky-950",
    bar: "bg-sky-400",
    track: "bg-sky-100",
  },
  {
    title: "Literature",
    percent: 40,
    Icon: BookOpen,
    tile: "bg-pink-300 border-pink-500 text-pink-950",
    bar: "bg-pink-400",
    track: "bg-pink-100",
  },
];

export default function ProgressPage() {
  return (
    <>
      <ChildNavbar />

      {/* ml-sidebar = leave room for the sidebar (same on every child page) */}
      <main className="ml-sidebar min-h-screen bg-background px-10 py-10">
        <div className="mx-auto max-w-4xl">

          {/* ----- TITLE (left aligned, like the home page) ----- */}
          <h1 className="text-4xl font-extrabold text-foreground">My progress</h1>
          <p className="mt-1 text-lg text-muted">See how far you have come in each subject.</p>

          {/* ----- ONE CHUNKY CARD PER SUBJECT ----- */}
          <ul className="mt-8 flex flex-col gap-4">
            {subjects.map(({ title, percent, Icon, tile, bar, track }) => (
              <li
                key={title}
                className="flex items-center gap-5 rounded-3xl border-2 border-b-8 border-border bg-surface p-5"
              >
                {/* coloured icon square, same colour as the home page tile */}
                <span
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-b-4 ${tile}`}
                >
                  <Icon aria-hidden="true" size={32} strokeWidth={2.25} />
                </span>

                <div className="flex-1">
                  {/* subject name on the left, percent on the right */}
                  <div className="flex items-baseline justify-between">
                    <h2 className="text-xl font-extrabold text-foreground">{title}</h2>
                    <span className="text-xl font-extrabold text-foreground">{percent}%</span>
                  </div>

                  {/* progress bar.
                      role="progressbar" lets screen readers say "Math, 80%" */}
                  <div
                    role="progressbar"
                    aria-label={title}
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className={`mt-3 h-5 w-full rounded-full ${track}`}
                  >
                    {/* width comes from the percent, e.g. 80% */}
                    <div
                      className={`h-5 rounded-full ${bar}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>

        </div>
      </main>
    </>
  );
}
