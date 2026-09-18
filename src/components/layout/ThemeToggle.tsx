"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

function subscribe(onChange: () => void) {
  const obs = new MutationObserver(onChange);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}
const getTheme = (): Theme =>
  document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
const getServerTheme = (): Theme => "light";
const mountedSubscribe = () => () => {};

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);
  const mounted = useSyncExternalStore(mountedSubscribe, () => true, () => false);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mounted && theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-rule text-ink-2 transition hover:border-rule-strong hover:text-ink ${className}`}
    >
      {mounted && theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
