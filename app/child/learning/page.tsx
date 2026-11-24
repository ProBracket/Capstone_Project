import Link from "next/link";
import Image from "next/image";
import ChildNavbar from "@/components/ChildNavbar";

// Choose a Subject page (/child/learning)
// Uses the team's theme colours from app/globals.css
// Clean line icons (same style as the sidebar), no emojis
// Each subject box has its own colour (same as the home page tiles)

// the three subjects
// icon = the drawing for a simple line icon
const subjects = [
  {
    href: "/child/learning/math",
    title: "Math",
    text: "Numbers, Addition, Multiplication and more.",
    // yellow, same as the Math tile on the home page
    colour: "bg-amber-300 border-amber-500 text-amber-950",
    // calculator: plus, minus, equals
    icon: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM7.5 8.5h4M9.5 6.5v4M13.5 8.5h3M7.5 15.5h4M13.5 14h3M13.5 17h3",
  },
  {
    href: "/child/learning/science",
    title: "Science",
    text: "Discover plants, animals, and space.",
    // blue, same as the Science tile on the home page
    colour: "bg-sky-300 border-sky-500 text-sky-950",
    // science flask
    icon: "M9 3h6M10 3v6l-5.4 9.4A2 2 0 0 0 6.3 21.5h11.4a2 2 0 0 0 1.7-3.1L14 9V3M7.5 15h9",
  },
  {
    href: "/child/learning/literature",
    title: "Literature",
    text: "Reading, grammar and storytelling.",
    // pink, same as the Literature tile on the home page
    colour: "bg-pink-300 border-pink-500 text-pink-950",
    // open book
    icon: "M2 5h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2zM22 5h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z",
  },
];

export default function LearningPage() {
  return (
    <>
      <ChildNavbar />

      {/* ml-sidebar = leave room for the sidebar (same on every child page) */}
      <main className="ml-sidebar min-h-screen bg-background pt-12 px-8 flex justify-center">
        <div className="w-full max-w-6xl">

          {/* white card */}
          <div className="bg-surface border border-border rounded-card shadow-card p-12">

            {/* title with a stack-of-books sticker beside it */}
            <div className="flex items-center justify-center gap-4 mb-12">
              <Image src="/stickers/books.png" alt="" width={80} height={80} />
              <h1 className="text-5xl font-extrabold text-foreground">
                Choose a Subject
              </h1>
            </div>

            {/* ----- SUBJECT CARDS ----- */}
            <ul className="grid md:grid-cols-3 gap-8">
              {subjects.map((subject) => (
                <li key={subject.href}>
                  {/* rounded-3xl on the Link so the focus outline is rounded */}
                  <Link href={subject.href} className="block h-full rounded-3xl">
                    {/* chunky coloured box: thick bottom edge, floats on hover */}
                    <div className={`h-full rounded-3xl border-b-8 p-10 text-center transition hover:-translate-y-1 hover:shadow-raised ${subject.colour}`}>

                      {/* line icon inside a white see-through circle */}
                      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white/50">
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="h-10 w-10"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d={subject.icon} />
                        </svg>
                      </div>

                      <h2 className="text-3xl font-extrabold">
                        {subject.title}
                      </h2>

                      <p className="mt-2 font-semibold opacity-80">
                        {subject.text}
                      </p>

                    </div>
                  </Link>
                </li>
              ))}
            </ul>

          </div>

        </div>
      </main>
    </>
  );
}