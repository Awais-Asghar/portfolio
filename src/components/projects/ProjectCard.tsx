import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Lock } from "lucide-react";
import type { Project } from "@/data/projects";
import { CategoryBadge } from "./CategoryBadge";
import { cn } from "@/lib/utils";

interface Props {
  project: Project;
  size?: "md" | "lg";
  priority?: boolean;
  className?: string;
}

export function ProjectCard({ project: p, size = "md", priority = false, className }: Props) {
  const lg = size === "lg";
  return (
    <article className={cn("group flex flex-col", className)}>
      <Link
        href={`/projects/${p.slug}`}
        className="relative block overflow-hidden rounded-md border border-rule bg-paper-2"
        aria-label={p.title}
      >
        <Image
          src={`/thumbnails/${p.slug}.svg`}
          alt=""
          width={1600}
          height={1000}
          priority={priority}
          unoptimized
          className="aspect-[16/10] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025]"
        />
        {p.isPrivate && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#141416]/85 px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[#faf8f3]">
            <Lock size={10} /> Private repo
          </span>
        )}
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <CategoryBadge id={p.category} short />
            <span className="font-mono text-[0.68rem] text-muted">{p.period ?? p.year}</span>
          </div>
          <h3
            className={cn(
              "mt-2 font-serif font-medium leading-tight text-ink",
              lg ? "text-[1.75rem] md:text-[2.1rem]" : "text-[1.3rem]",
            )}
          >
            <Link
              href={`/projects/${p.slug}`}
              className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-300 group-hover:bg-[length:100%_1px]"
            >
              {p.title}
            </Link>
          </h3>
          <p className={cn("mt-2 text-muted", lg ? "text-base leading-relaxed" : "text-sm leading-relaxed")}>
            {p.tagline}
          </p>
        </div>
        <Link
          href={`/projects/${p.slug}`}
          aria-label={`Open ${p.title}`}
          className="mt-1 hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rule text-ink-2 transition group-hover:border-ink group-hover:bg-ink group-hover:text-paper sm:inline-flex"
        >
          <ArrowUpRight size={16} />
        </Link>
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[0.7rem] text-muted">
        {p.tech.slice(0, lg ? 6 : 4).map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </article>
  );
}
