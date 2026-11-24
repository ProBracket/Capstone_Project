"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChartLine,
  House,
  MessageCircle,
  Sprout,
  Target,
  Trophy,
  Users,
} from "lucide-react";

const LINKS = [
  { href: "/child", label: "My Home", Icon: House, exact: true },
  { href: "/child/chat", label: "Chat with Bud", Icon: MessageCircle },
  { href: "/child/learning", label: "Learning", Icon: BookOpen },
  { href: "/child/progress", label: "Progress", Icon: ChartLine },
  { href: "/child/goals", label: "Goals", Icon: Target },
  { href: "/child/challenges", label: "Challenges", Icon: Trophy },
];

export default function ChildNavbar() {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  function switchLearner() {
    localStorage.removeItem("selectedChildId");
  }

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-sidebar flex-col border-r border-border bg-surface">

      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-control bg-primary text-on-primary">
          <Sprout size={20} strokeWidth={2.25} />
        </div>

        <span className="text-lg font-semibold tracking-tight text-foreground">
          ThinkFirst
        </span>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {LINKS.map(({ href, label, Icon, exact }) => {
          const active = isActive(href, exact);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "flex items-center gap-3 rounded-control bg-primary-soft px-3 py-2.5 text-[15px] font-medium text-primary"
                  : "flex items-center gap-3 rounded-control px-3 py-2.5 text-[15px] font-medium text-muted transition hover:bg-surface-muted hover:text-foreground"
              }
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.25 : 1.75}
              />

              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-border p-3">
        <Link
          href="/parentview"
          onClick={switchLearner}
          className="flex items-center gap-3 rounded-control px-3 py-2.5 text-[15px] font-medium text-muted transition hover:bg-surface-muted hover:text-foreground"
        >
          <Users size={20} strokeWidth={1.75} />
          Switch learner
        </Link>
      </div>
    </aside>
  );
}