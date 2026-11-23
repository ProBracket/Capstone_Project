"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

// Child sidebar (used on every /child page)
// Same style as the homepage Navbar.tsx: theme colours from app/globals.css,
// current page highlighted in teal, grey links that darken on hover.

// the pages in the sidebar
// icon = the drawing for a simple line icon (no emojis)
const links = [
  {
    href: "/child",
    label: "My Home",
    icon: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  },
  {
    href: "/child/chat",
    label: "Chat",
    icon: "M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z",
  },
  {
    href: "/child/learning",
    label: "Learning",
    icon: "M4 5a2 2 0 0 1 2-2h14v18H6a2 2 0 0 1-2-2zM4 17a2 2 0 0 1 2-2h14M9 7h7",
  },
  {
    href: "/child/progress",
    label: "Progress",
    icon: "M3 3v18h18M7 15l4-4 3 3 5-6",
  },
  {
    href: "/child/goals",
    label: "Goals",
    icon: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  },
  {
    href: "/child/challenges",
    label: "Challenges",
    icon: "M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3",
  },
];

// draws one line icon in the link's current colour (teal when active, grey otherwise)
function Icon({ path }: { path: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
}

export default function ChildNavbar() {
  // the page we're on right now, e.g. "/child/goals"
  const pathname = usePathname();

  return (
    // w-sidebar matches ml-sidebar on every child page
    <aside className="fixed left-0 top-0 flex h-screen w-sidebar flex-col border-r border-border bg-surface">

      {/* ----- LOGO ----- */}
      <div className="flex items-center gap-3 border-b border-border p-6">
        <Image src="/stickers/plant-buddy.png" alt="" width={44} height={44} />
        <div>
          <p className="text-2xl font-extrabold text-foreground">ThinkFirst</p>
          <p className="whitespace-nowrap text-xs text-muted">Learn • Explore • Grow</p>
        </div>
      </div>

      {/* ----- PAGE LINKS ----- */}
      <nav aria-label="Child pages" className="flex-1 px-4 py-6">
        <ul className="flex flex-col gap-1">
          {links.map((link) => {
            // "My Home" only when exactly /child,
            // others also stay highlighted on their sub-pages (e.g. /child/learning/math)
            const active =
              link.href === "/child"
                ? pathname === "/child"
                : pathname.startsWith(link.href);

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  // tells screen readers "current page"
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-control px-4 py-3 text-base font-medium transition-colors ${
                    active
                      ? "bg-primary-soft text-primary"
                      : "text-muted hover:bg-surface-muted hover:text-foreground"
                  }`}
                >
                  <Icon path={link.icon} />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ----- BACK TO PARENT AREA (bottom) ----- */}
      <div className="border-t border-border p-4">
        <Link
          href="/parentview"
          className="flex items-center gap-3 rounded-control px-4 py-3 text-sm font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          <Icon path="M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4" />
          Parent area
        </Link>
      </div>
    </aside>
  );
}
