"use client";

import { useEffect } from "react";
import { profile } from "@/data/profile";

/** Tab titles for the home page sections reached through nav links like /#about. */
const SECTION_TITLES: Record<string, string> = {
  work: "Selected work",
  about: "About",
  experience: "Experience",
  skills: "Toolkit",
  recognition: "Recognition",
  contact: "Contact",
};

function titleFor(hash: string) {
  const label = SECTION_TITLES[hash.replace(/^#/, "")];
  return label ? `${label} - ${profile.name}` : profile.seoTitle;
}

/**
 * Sets the tab title from the URL hash on the home page ("About - Awais Asghar").
 * Next updates the URL for same-page hash links with pushState, which fires no
 * hashchange event, so link clicks are read directly. The title only follows links,
 * never scroll position, so crawlers loading "/" always see the main title.
 */
export function SectionTitle() {
  useEffect(() => {
    const sync = () => {
      if (window.location.pathname === "/") document.title = titleFor(window.location.hash);
    };
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank") return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== "/") return;
      document.title = titleFor(url.hash);
    };

    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}
