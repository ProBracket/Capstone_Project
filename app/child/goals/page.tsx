import Image from "next/image";
import ChildNavbar from "@/components/ChildNavbar";
// line icons (same icon set as the navbar)
import { Check, Target } from "lucide-react";

// My Goals page (/child/goals)
// Teal banner with the T-rex, then one chunky card per goal.
// Goals are placeholders for now (later they come from Supabase).

// the goals (done: true = finished)
const goals = [
  { title: "Complete Math Addition Lesson", done: true },
  { title: "Read One Story Book", done: true },
  { title: "Complete Human Body Module", done: false },
];

// how a card looks when it's done vs still in progress
// (colours from the home page: blue like the Science tile, yellow like the Math tile)
const looks = {
  done: {
    card: "border-sky-300 bg-sky-100",
    badge: "border-sky-400 text-sky-700",
    Icon: Check,
    label: "Done",
    labelColour: "text-sky-700",
  },
  inProgress: {
    card: "border-amber-300 bg-amber-100",
    badge: "border-amber-400 text-amber-700",
    Icon: Target,
    label: "In progress",
    labelColour: "text-amber-700",
  },
};

export default function GoalsPage() {
  // how many goals are finished, e.g. 2
  const doneCount = goals.filter((goal) => goal.done).length;

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

          {/* ----- GOAL CARDS ----- */}
          <ul className="mt-8 flex flex-col gap-4">
            {goals.map((goal) => {
              // pick the right look for this goal
              const look = goal.done ? looks.done : looks.inProgress;

              return (
                <li
                  key={goal.title}
                  className={`flex items-center gap-5 rounded-3xl border-2 border-b-8 p-5 ${look.card}`}
                >
                  {/* round badge: white circle, coloured outline + line icon
                      (outline style so it doesn't look like an emoji) */}
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-b-4 bg-surface ${look.badge}`}>
                    <look.Icon aria-hidden="true" size={24} strokeWidth={2.5} />
                  </span>

                  <h2 className="flex-1 text-xl font-extrabold text-foreground">{goal.title}</h2>

                  {/* the word too, so it doesn't rely on colour alone */}
                  <span className={`rounded-full bg-surface px-3 py-1 text-sm font-bold ${look.labelColour}`}>
                    {look.label}
                  </span>
                </li>
              );
            })}
          </ul>

        </div>
      </main>
    </>
  );
}
