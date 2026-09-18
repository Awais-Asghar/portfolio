"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { categories, type CategoryId } from "@/data/categories";
import type { Project } from "@/data/projects";
import { ProjectCard } from "./ProjectCard";
import { cn } from "@/lib/utils";

const ALL = "all";
const isCategory = (v: string | null): v is CategoryId => !!v && categories.some((c) => c.id === v);

export function ProjectGrid({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const initial = params.get("c");
  const [active, setActive] = useState<CategoryId | typeof ALL>(isCategory(initial) ? initial : ALL);
  const [query, setQuery] = useState(params.get("q") ?? "");
  const q = useDeferredValue(query.trim().toLowerCase());

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of projects) m.set(p.category, (m.get(p.category) ?? 0) + 1);
    return m;
  }, [projects]);

  const visible = useMemo(() => {
    return projects
      .filter((p) => active === ALL || p.category === active)
      .filter((p) => {
        if (!q) return true;
        const hay = [p.title, p.tagline, p.summary, ...p.tags, ...p.tech, p.repo].join(" ").toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => (a.featured ?? 99) - (b.featured ?? 99) || b.year - a.year);
  }, [projects, active, q]);

  function select(id: CategoryId | typeof ALL) {
    setActive(id);
    const next = new URLSearchParams(params.toString());
    if (id === ALL) next.delete("c");
    else next.set("c", id);
    router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
  }

  return (
    <div>
      <div className="flex flex-col gap-5 border-b border-rule pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0" role="tablist" aria-label="Filter by category">
          <div className="flex w-max gap-2">
            <FilterChip active={active === ALL} onClick={() => select(ALL)} count={projects.length}>
              All
            </FilterChip>
            {categories.map((c) => (
              <FilterChip
                key={c.id}
                active={active === c.id}
                onClick={() => select(c.id)}
                count={counts.get(c.id) ?? 0}
                hue={c.hue}
              >
                {c.short}
              </FilterChip>
            ))}
          </div>
        </div>
        <label className="relative block lg:w-72">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, tools, tags"
            className="h-10 w-full rounded-full border border-rule bg-paper pl-9 pr-9 text-sm outline-none transition placeholder:text-muted focus:border-ink"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:text-ink"
            >
              <X size={14} />
            </button>
          )}
        </label>
      </div>

      <p className="mt-5 font-mono text-xs text-muted" aria-live="polite">
        {visible.length} {visible.length === 1 ? "project" : "projects"}
        {active !== ALL && ` in ${categories.find((c) => c.id === active)?.label}`}
        {q && ` matching “${query.trim()}”`}
      </p>

      {visible.length === 0 ? (
        <div className="mt-10 rounded-md border border-dashed border-rule p-10 text-center text-muted">
          Nothing matches. Try another category or clear the search.
        </div>
      ) : (
        <ul className="mt-8 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <li key={p.slug}>
              <ProjectCard project={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  count,
  hue,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  hue?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-sm transition",
        active ? "border-ink bg-ink text-paper" : "border-rule text-ink-2 hover:border-rule-strong hover:text-ink",
      )}
    >
      {hue && <span className="h-2 w-2 rounded-full" style={{ background: active ? "currentColor" : hue }} />}
      {children}
      <span className={cn("font-mono text-[0.68rem]", active ? "text-paper/70" : "text-muted")}>{count}</span>
    </button>
  );
}
