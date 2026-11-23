import Link from "next/link";
import Image from "next/image";
import ChildNavbar from "@/components/ChildNavbar";

// Child dashboard (/child)
// Uses the team's theme colours from app/globals.css
// Stickers live in public/stickers/ (alt="" = decoration only)
export default function ChildDashboard() {
  return (
    <>
      <ChildNavbar />

      {/* ml-sidebar = leave room for the sidebar (same on every child page) */}
      <main className="ml-sidebar min-h-screen bg-background pt-12 px-8 flex justify-center">
        <div className="w-full max-w-6xl">

          {/* ----- WELCOME ----- */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <h1 className="text-6xl font-extrabold text-foreground">
                Welcome Back
              </h1>
              {/* small sparkle sticker next to the title */}
              <Image src="/stickers/star-sparkles.png" alt="" width={56} height={56} />
            </div>

            <p className="text-xl text-muted">
              Ready to continue your learning adventure today?
            </p>
          </div>

          {/* ----- TWO BIG CARDS ----- */}
          <div className="grid md:grid-cols-2 gap-8">

            {/* rounded-card on the Link so the keyboard focus outline is rounded too */}
            <Link href="/child/chat" className="block rounded-card">
              <div className="h-full bg-surface border border-border rounded-card shadow-card hover:shadow-raised hover:-translate-y-1 transition p-10 text-center">

                {/* dino sticker inside a light teal circle */}
                <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-primary-soft">
                      <Image src="/stickers/plant-buddy.png" alt="" width={96} height={96} />
                </div>

                <h2 className="text-3xl font-bold text-foreground mb-3">
                  ThinkFirst AI Chat
                </h2>

                <p className="text-muted">
                  Ask questions and learn with your personal AI assistant.
                </p>

              </div>
            </Link>

            <Link href="/child/learning" className="block rounded-card">
              <div className="h-full bg-surface border border-border rounded-card shadow-card hover:shadow-raised hover:-translate-y-1 transition p-10 text-center">

                <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-primary-soft">
                  <Image src="/stickers/dino-pterodactyl.png" alt="" width={96} height={96} />
                </div>

                <h2 className="text-3xl font-bold text-foreground mb-3">
                  Guided Learning
                </h2>

                <p className="text-muted">
                  Continue learning Math, Science, and Literature.
                </p>

              </div>
            </Link>

          </div>

          {/* ----- THREE STAT CARDS ----- */}
          <div className="grid md:grid-cols-3 gap-6 mt-10">

            <div className="bg-surface border border-border p-8 rounded-card shadow-card text-center">
              <h3 className="text-lg text-muted">
                Lessons Completed
              </h3>

              <p className="text-4xl font-bold text-primary mt-3">
                12
              </p>
            </div>

            <div className="bg-surface border border-border p-8 rounded-card shadow-card text-center">
              <h3 className="text-lg text-muted">
                Current Streak
              </h3>

              <p className="text-4xl font-bold text-warning mt-3">
                <span aria-hidden="true">🔥</span> 5 Days
              </p>
            </div>

            <div className="bg-surface border border-border p-8 rounded-card shadow-card text-center">
              <h3 className="text-lg text-muted">
                Badges Earned
              </h3>

              <p className="text-4xl font-bold text-success mt-3">
                <span aria-hidden="true">🏆</span> 7
              </p>
            </div>

          </div>

        </div>
      </main>
    </>
  );
}
