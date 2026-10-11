"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { profile } from "@/data/profile";
import { cn } from "@/lib/utils";

/** Seconds per item: both rows move at the same, readable speed regardless of length. */
const SECONDS_PER_ITEM = 4;

interface RowProps {
  items: readonly string[];
  reverse?: boolean;
  dotClass: string;
  paused: boolean;
}

function Row({ items, reverse = false, dotClass, paused }: RowProps) {
  // Two copies so translating by -50% loops seamlessly. Each item carries its own
  // trailing padding (no flex gap), which keeps the halfway point exact.
  const loop = [...items, ...items];
  return (
    <div className="overflow-hidden">
      <div
        className={cn(
          "flex w-max whitespace-nowrap font-mono text-[0.72rem] uppercase tracking-[0.18em] text-muted",
          reverse ? "animate-marquee-reverse" : "animate-marquee",
          "group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:animate-none",
          paused && "[animation-play-state:paused]",
        )}
        style={{ animationDuration: `${items.length * SECONDS_PER_ITEM}s` }}
      >
        {loop.map((t, i) => (
          <span key={i} className="flex items-center gap-10 pr-10">
            {t}
            <span className={cn("h-1 w-1 rounded-full", dotClass)} />
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Two-row skills ticker. Row 1 (AI / ML / DL) runs left, row 2 (hardware) runs right.
 * Opposite directions keep the two skill sets visibly separate. To stay readable and meet
 * WCAG 2.2.2 it moves slowly, pauses on hover or focus, has a pause button, and stays
 * still for people who prefer reduced motion.
 */
export function Marquee() {
  const [paused, setPaused] = useState(false);
  return (
    <div className="group relative mt-16 border-y border-rule md:mt-24">
      <div
        aria-hidden
        className="space-y-4 py-4 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
      >
        <Row items={profile.marquee.ai} dotClass="bg-accent" paused={paused} />
        <Row items={profile.marquee.hardware} reverse dotClass="bg-teal" paused={paused} />
      </div>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        aria-label={paused ? "Play the skills ticker" : "Pause the skills ticker"}
        className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-rule-strong bg-paper text-ink-2 shadow-sm transition hover:border-ink hover:text-ink motion-reduce:hidden md:right-4"
      >
        {paused ? <Play size={11} /> : <Pause size={11} />}
      </button>
    </div>
  );
}
