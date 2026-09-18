import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
  tone = "neutral",
}: {
  children: ReactNode;
  className?: string;
  tone?: "neutral" | "accent" | "outline";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[0.68rem] uppercase tracking-[0.12em]",
        tone === "neutral" && "bg-paper-2 text-ink-2",
        tone === "accent" && "bg-accent-soft text-accent",
        tone === "outline" && "border border-rule text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
