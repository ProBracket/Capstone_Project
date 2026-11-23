import Image from "next/image";
import ChildNavbar from "@/components/ChildNavbar";
// line icons (same icon set as the navbar)
import { Check, Target } from "lucide-react";

// My Goals page (/child/goals)
// Same chunky style as the home page, with the T-rex sticker in a teal banner
// (same teal as the "Keep going" card on the home page).
// Green = done, amber = in progress (plus the words, so it doesn't rely on colour)
// Goals are placeholders for now (later they come from Supabase).

// done: true = finished, false = still working on it
const goals = [
  { title: "Complete Math Addition Lesson", done: true },
  { title: "Read One Story Book", done: true },
  { title: "Complete Human Body Module", done: false },
];

export default function GoalsPage() {
  // count finished goals, e.g. 2
  const doneCount = goals.filter((goal) => goal.done).length;

  return (
    <>
      <ChildNavbar />

      {/* ml-sidebar = leave room for the sidebar (same on every child page) */}
      <main className="ml-sidebar min-h-screen bg-background px-10 py-10">
        <div className="mx-auto max-w-4xl">

          {/* ----- COLOURFUL BANNER: T-rex sticker + title + how many are done ----- */}
          <section className="flex flex-wrap items-center gap-6 rounded-3xl border-b-8 border-teal-900 bg-primary px-8 py-6 text-white">
            <Image src="/stickers/dino-trex.png" alt="" width={96} height={96} />

            <div>
              <h1 className="text-4xl font-extrabold">My goals</h1>
              <p className="mt-1 text-lg font-semibold text-teal-100">Little steps add up. Keep going!</p>
            </div>

            {/* ml-auto pushes this to the right side */}
            <span className="ml-auto rounded-full bg-white px-4 py-2 text-lg font-extrabold text-primary">
              {doneCount} of {goals.length} done
            </span>
          </section>

          {/* ----- ONE CHUNKY CARD PER GOAL ----- */}
          <ul className="mt-8 flex flex-col gap-4">
            {goals.map((goal) => (
              <li
                key={goal.title}
                className={
                  goal.done
                    ? "flex items-center gap-5 rounded-3xl border-2 border-b-8 border-green-300 bg-success-soft p-5"
                    : "flex items-center gap-5 rounded-3xl border-2 border-b-8 border-amber-300 bg-warning-soft p-5"
                }
              >
                {/* round badge: check if done, target if in progress */}
                {goal.done ? (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-b-4 border-green-700 bg-green-500 text-white">
                    <Check aria-hidden="true" size={26} strokeWidth={3} />
                  </span>
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-b-4 border-amber-600 bg-amber-400 text-amber-950">
                    <Target aria-hidden="true" size={26} strokeWidth={2.5} />
                  </span>
                )}

                {/* goal name */}
                <h2 className="flex-1 text-xl font-extrabold text-foreground">{goal.title}</h2>

                {/* the word "Done" / "In progress" so it doesn't rely on colour alone */}
                {goal.done ? (
                  <span className="rounded-full bg-surface px-3 py-1 text-sm font-bold text-success">
                    Done
                  </span>
                ) : (
                  <span className="rounded-full bg-surface px-3 py-1 text-sm font-bold text-warning">
                    In progress
                  </span>
                )}
              </li>
            ))}
          </ul>

        </div>
      </main>
    </>
  );
}
