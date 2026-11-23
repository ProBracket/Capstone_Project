import Image from "next/image";
import ChildNavbar from "@/components/ChildNavbar";

// Learning Progress page (/child/progress)
// Uses the team's theme colours from app/globals.css
// Stickers live in public/stickers/ (alt="" = decoration only)
export default function ProgressPage() {
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
              <Image src="/stickers/dino-triceratops.png" alt="" width={80} height={80} />
              <h1 className="text-5xl font-extrabold text-foreground">
                Learning Progress
              </h1>
            </div>

            <ul className="space-y-8">

              {/* ----- MATH ----- */}
              <li>
                <div className="flex justify-between mb-2">
                  <span className="text-lg font-semibold text-foreground">Math</span>
                  <span className="text-lg font-semibold text-primary">80%</span>
                </div>

                {/* grey track + teal fill.
                    role="progressbar" lets screen readers say "Math, 80%" */}
                <div
                  role="progressbar"
                  aria-label="Math"
                  aria-valuenow={80}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="w-full bg-surface-muted rounded-full h-4"
                >
                  <div className="bg-primary h-4 rounded-full w-4/5"></div>
                </div>
              </li>

              {/* ----- SCIENCE ----- */}
              <li>
                <div className="flex justify-between mb-2">
                  <span className="text-lg font-semibold text-foreground">Science</span>
                  <span className="text-lg font-semibold text-primary">60%</span>
                </div>

                <div
                  role="progressbar"
                  aria-label="Science"
                  aria-valuenow={60}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="w-full bg-surface-muted rounded-full h-4"
                >
                  <div className="bg-primary h-4 rounded-full w-3/5"></div>
                </div>
              </li>

              {/* ----- LITERATURE ----- */}
              <li>
                <div className="flex justify-between mb-2">
                  <span className="text-lg font-semibold text-foreground">Literature</span>
                  <span className="text-lg font-semibold text-primary">40%</span>
                </div>

                <div
                  role="progressbar"
                  aria-label="Literature"
                  aria-valuenow={40}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="w-full bg-surface-muted rounded-full h-4"
                >
                  <div className="bg-primary h-4 rounded-full w-2/5"></div>
                </div>
              </li>

            </ul>

          </div>

        </div>
      </main>
    </>
  );
}
