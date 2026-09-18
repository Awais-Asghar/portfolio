"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

const links = [
  { href: "/projects", label: "Work" },
  { href: "/#about", label: "About" },
  { href: "/#experience", label: "Experience" },
  { href: "/resume", label: "Resume" },
  { href: "/#contact", label: "Contact" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-colors duration-300",
        scrolled ? "border-rule bg-paper/85 backdrop-blur-md" : "border-transparent bg-paper",
      )}
    >
      <div className="container-x flex h-16 items-center justify-between">
        <Link href="/" className="font-serif text-[1.35rem] leading-none tracking-tight">
          Awais Asghar<span className="text-accent">.</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {links.map((l) => {
            const active = l.href === "/projects" && pathname.startsWith("/projects");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "text-sm text-ink-2 transition hover:text-ink",
                  active && "text-ink underline decoration-accent decoration-2 underline-offset-8",
                )}
              >
                {l.label}
              </Link>
            );
          })}
          <ThemeToggle />
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rule text-ink-2"
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="container-x border-t border-rule bg-paper pb-5 pt-3 md:hidden"
        >
          <ul className="flex flex-col">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="block border-b border-rule py-3 font-serif text-2xl"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
