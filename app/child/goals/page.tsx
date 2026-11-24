import Image from "next/image";
import ChildNavbar from "@/components/ChildNavbar";
// line icon (same icon set as the navbar)
import { Check } from "lucide-react";

// My Goals page (/child/goals) - a simple checklist
// Soft green = done, yellow = in progress (plus the words, so it doesn't rely on colour)
// Goals are placeholders for now (later they come from Supabase).

// the goals (done: true = finished)
const goals = [
  { title: "Complete Math Addition Lesson", done: true },
  { title: "Read One Story Book", done: true },
  { title: "Complete Human Body Module", done: false },
];

export default function GoalsPage() {
  // how many goals are finished, e.g. 2
  const doneCount = goals.filter((goal) => goal.done).length;
  // how full the green bar is, e.g. 2 of 3 = 67
  const percent = Math.round((doneCount / goals.length) * 100);

  return (
    <>
      <ChildNavbar />

      <main className="ml-sidebar min-h-screen bg-background px-10 py-10">
        <div className="mx-auto max-w-4xl">

          {/* ----- TEAL BANNER ----- */}
          <section className="flex flex-wrap items-center gap-6 rounded-3xl border-b-8 border-teal-900 bg-primary px-8 py-6 text-white">
            <Image src="/stickers/dino-trex.png" alt="" width={96} height={96} />

            <div>
              <h1 className="text-4xl font-extrabold">My goals</h1>
              <p className="mt-1 text-lg font-semibold text-teal-100">Little steps add up. Keep going!</p>
            </div>

            <span className="ml-auto rounded-full bg-white px-4 py-2 text-lg font-extrabold text-primary">
              {doneCount} of {goals.length} done
            </span>
          </section>

          {/* ----- CHECKLIST CARD ----- */}
          <section className="mt-8 rounded-3xl border-2 border-b-8 border-border bg-surface px-8 py-7">
            {/* title + "2 of 3" */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-foreground">My checklist</h2>
              <span className="font-extrabold text-emerald-700">
                {doneCount} of {goals.length}
              </span>
            </div>

            {/* green progress bar */}
            <div
              role="progressbar"
              aria-label="Goals done"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="mt-3 h-4 rounded-full bg-surface-muted"
            >
              <div className="h-4 rounded-full bg-emerald-400" style={{ width: `${percent}%` }} />
            </div>

            {/* the list: one row per goal, dashed line between rows */}
            <ul className="mt-4">
              {goals.map((goal) => (
                <li
                  key={goal.title}
                  className="flex items-center gap-4 border-t-2 border-dashed border-border py-4"
                >
                  {/* checkbox: green with a tick if done, empty yellow box if not */}
                  {goal.done ? (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-b-4 border-emerald-500 bg-emerald-400 text-emerald-950">
                      <Check aria-hidden="true" size={22} strokeWidth={3.5} />
                    </span>
                  ) : (
                    <span className="h-9 w-9 shrink-0 rounded-xl border-2 border-b-4 border-amber-400 bg-surface" />
                  )}

                  {/* goal name (greyed out once it's done) */}
                  <span
                    className={
                      goal.done
                        ? "flex-1 text-xl font-extrabold text-muted"
                        : "flex-1 text-xl font-extrabold text-foreground"
                    }
                  >
                    {goal.title}
                  </span>

                  {/* the word too, so it doesn't rely on colour alone */}
                  {goal.done ? (
                    <span className="rounded-full bg-emerald-200 px-3 py-1 text-sm font-bold text-emerald-800">
                      Done
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">
                      In progress
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>

        </div>
      </main>
    </>
  );
}
