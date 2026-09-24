"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { profile } from "@/data/profile";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type ResumeId = (typeof profile.resumes)[number]["id"];

/** Switches the embedded PDF preview between the available resumes. */
export function ResumeViewer() {
  const [active, setActive] = useState<ResumeId>(profile.resumes[0].id);
  const current = profile.resumes.find((r) => r.id === active) ?? profile.resumes[0];

  return (
    <div className="mt-10">
      <ul className="grid gap-4 sm:grid-cols-2" role="tablist" aria-label="Choose a resume to preview">
        {profile.resumes.map((r) => {
          const selected = r.id === active;
          return (
            <li key={r.id}>
              <button
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActive(r.id)}
                className={cn(
                  "flex h-full w-full flex-col items-start rounded-md border p-5 text-left transition",
                  selected ? "border-ink bg-paper-2" : "border-rule hover:border-rule-strong",
                )}
              >
                <span className="flex w-full items-center justify-between gap-3">
                  <span className="font-serif text-xl">{r.label}</span>
                  <span
                    className={cn(
                      "font-mono text-[0.62rem] uppercase tracking-[0.14em]",
                      selected ? "text-accent" : "text-muted",
                    )}
                  >
                    {selected ? "Previewing" : "Preview"}
                  </span>
                </span>
                <span className="mt-1 text-sm text-muted">{r.note}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow">
          <span className="mr-3 text-accent">Preview</span>
          {current.label}
        </p>
        <Button href={current.file} size="sm" download>
          <Download size={14} /> Download this version
        </Button>
      </div>
      <div className="mt-3 overflow-hidden rounded-md border border-rule bg-paper-2">
        <iframe
          key={current.id}
          src={`${current.file}#view=FitH&toolbar=0`}
          title={`${profile.name} - ${current.label}`}
          className="h-[80vh] w-full"
        />
      </div>
      <p className="mt-3 text-center text-xs text-muted">
        If the preview does not load in your browser, use the download buttons above.
      </p>
    </div>
  );
}
