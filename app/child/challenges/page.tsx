import Image from "next/image";
import ChildNavbar from "@/components/ChildNavbar";

// Daily Challenge page (/child/challenges)
// Uses the team's theme colours from app/globals.css
// Stickers live in public/stickers/ (alt="" = decoration only)
export default function ChallengesPage() {
  return (
    <>
      <ChildNavbar />

      {/* ml-sidebar = leave room for the sidebar (same on every child page) */}
      <main className="ml-sidebar min-h-screen bg-background pt-12 px-8 flex justify-center">
        <div className="w-full max-w-5xl">

          {/* white card ("relative" so the corner sparkle can sit inside it) */}
          <div className="relative bg-surface border border-border rounded-card shadow-card p-12 text-center">

            {/* small sparkle sticker in the top-right corner */}
            <Image
              src="/stickers/star-sparkles.png"
              alt=""
              width={64}
              height={64}
              className="absolute top-6 right-6"
            />

            {/* main sticker inside a light teal circle */}
            <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-primary-soft">
              <Image src="/stickers/star-shooting.png" alt="" width={112} height={112} />
            </div>

            <h1 className="text-5xl font-extrabold text-foreground mb-4">
              Daily Challenge
            </h1>

            <p className="text-xl text-muted mb-8">
              Complete 5 Math problems today and earn 20 XP.
            </p>

            {/* teal button, darker on hover */}
            <button
              type="button"
              className="bg-primary hover:bg-primary-hover text-on-primary px-8 py-4 rounded-control font-bold shadow-card transition-colors"
            >
              Start Challenge
            </button>

          </div>

        </div>
      </main>
    </>
  );
}
