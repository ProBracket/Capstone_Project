import Image from "next/image";
import ChildNavbar from "@/components/ChildNavbar";

// My Goals page (/child/goals)
// Uses the team's theme colours from app/globals.css
// Green (success) = done, amber (warning) = in progress
// Stickers live in public/stickers/ (alt="" = decoration only)
export default function GoalsPage() {
  return (
    <>
      <ChildNavbar />

      {/* ml-sidebar = leave room for the sidebar (same on every child page) */}
      <main className="ml-sidebar min-h-screen bg-background pt-12 px-8 flex justify-center">
        <div className="w-full max-w-5xl">

          {/* white card */}
          <div className="bg-surface border border-border rounded-card shadow-card p-12">

            {/* title with a dino sticker beside it */}
            <div className="flex items-center justify-center gap-4 mb-10">
              <Image src="/stickers/dino-trex.png" alt="" width={80} height={80} />
              <h1 className="text-5xl font-extrabold text-foreground">
                My Goals
              </h1>
            </div>

            {/* a real list, so screen readers say "list, 3 items" */}
            <ul className="space-y-4">

              {/* done goal */}
              <li className="flex items-center justify-between gap-4 bg-success-soft p-5 rounded-control">
                <span className="text-lg font-medium text-foreground">
                  Complete Math Addition Lesson
                </span>
                {/* the word "Done" so it doesn't rely on colour alone */}
                <span className="rounded-full bg-surface px-3 py-1 text-sm font-semibold text-success">
                  Done
                </span>
              </li>

              {/* done goal */}
              <li className="flex items-center justify-between gap-4 bg-success-soft p-5 rounded-control">
                <span className="text-lg font-medium text-foreground">
                  Read One Story Book
                </span>
                <span className="rounded-full bg-surface px-3 py-1 text-sm font-semibold text-success">
                  Done
                </span>
              </li>

              {/* in-progress goal */}
              <li className="flex items-center justify-between gap-4 bg-warning-soft p-5 rounded-control">
                <span className="text-lg font-medium text-foreground">
                  Complete Human Body Module
                </span>
                <span className="rounded-full bg-surface px-3 py-1 text-sm font-semibold text-warning">
                  In progress
                </span>
              </li>

            </ul>

          </div>

        </div>
      </main>
    </>
  );
}
