"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";

const links = [
  { href: "/", label: "Home"},
  { href: "/how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
  { href: "/safety", label: "Safety" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className ="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3">
        <Link href="/" className="text-lg font-semibold text-foreground">ThinkFirst
        </Link>

        <ul className="order-last flex w-full gap-1 overflow-x-auto md:order-none md:w-auto md:flex-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <li key={link.href}>
                <Link 
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`block whitespace-nowrap rounded-control px-3 py-2 text-sm font-medium transition-colors ${
                    active 
                      ? "bg-primary-soft text-primary" 
                      : "text-muted hover:bg-surface-muted hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link
            href="/login"
            className="rounded-control px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
            >
              Log in
            </Link>
            <Link 
            href="/signup"
            className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover"
            >
              Sign up
            </Link>
        </div>
      </nav>
    </header>
  );
}