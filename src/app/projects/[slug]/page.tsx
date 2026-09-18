import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, GitFork, Lock } from "lucide-react";
import { GithubIcon } from "@/components/ui/icons";
import { projects, projectBySlug, githubUrl } from "@/data/projects";
import { categoryById } from "@/data/categories";
import { fetchReadme } from "@/lib/github";
import { CategoryBadge } from "@/components/projects/CategoryBadge";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ReadmeRenderer } from "@/components/projects/ReadmeRenderer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const revalidate = 86400;
export const dynamicParams = false;

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = projectBySlug(slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.tagline,
    alternates: { canonical: `/projects/${p.slug}` },
    openGraph: { title: p.title, description: p.tagline, type: "article" },
  };
}

export default async function ProjectPage({ params }: Params) {
  const { slug } = await params;
  const p = projectBySlug(slug);
  if (!p) notFound();

  const cat = categoryById[p.category];
  const readme = p.isPrivate ? null : await fetchReadme(p.repo);
  const related = projects.filter((x) => x.category === p.category && x.slug !== p.slug).slice(0, 3);

  return (
    <article className="pb-10 pt-10 md:pt-16">
      <div className="container-x">
        <nav className="flex items-center gap-2 font-mono text-xs text-muted" aria-label="Breadcrumb">
          <Link href="/projects" className="inline-flex items-center gap-1 hover:text-ink">
            <ArrowLeft size={12} /> Work
          </Link>
          <span>/</span>
          <Link href={`/projects?c=${p.category}`} className="hover:text-ink">
            {cat.label}
          </Link>
        </nav>

        <header className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <CategoryBadge id={p.category} />
              <span className="font-mono text-[0.68rem] text-muted">{p.period ?? p.year}</span>
              {p.featured && <Badge tone="accent">Featured</Badge>}
              {p.isPrivate && (
                <Badge tone="outline">
                  <Lock size={10} /> Private repo
                </Badge>
              )}
              {p.fork && (
                <Badge tone="outline">
                  <GitFork size={10} /> Fork
                </Badge>
              )}
            </div>
            <h1 className="mt-4 font-serif text-[2.4rem] font-medium leading-[1.02] md:text-[3.4rem]">{p.title}</h1>
            <p className="mt-4 max-w-2xl text-xl leading-relaxed text-ink-2">{p.tagline}</p>
            <p className="mt-5 max-w-2xl text-[1.02rem] leading-relaxed text-muted">{p.summary}</p>
            {p.fork && <p className="mt-3 text-sm text-muted">{p.fork.note}</p>}

            <div className="mt-7 flex flex-wrap gap-3">
              {!p.isPrivate && (
                <Button href={githubUrl(p)} external>
                  <GithubIcon size={15} /> Source on GitHub
                </Button>
              )}
              {p.live && (
                <Button href={p.live} variant={p.isPrivate ? "primary" : "secondary"} external>
                  Live site <ArrowUpRight size={15} />
                </Button>
              )}
              {p.isPrivate && !p.live && (
                <Button href="/#contact" variant="secondary">
                  Ask for a walkthrough
                </Button>
              )}
            </div>
          </div>

          <aside className="space-y-8 lg:pt-2">
            {p.metrics && p.metrics.length > 0 && (
              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-rule bg-rule sm:grid-cols-3 lg:grid-cols-2">
                {p.metrics.map((m) => (
                  <div key={m.label} className="bg-paper p-4">
                    <dd className="font-serif text-[1.9rem] font-medium leading-none">{m.value}</dd>
                    <dt className="mt-2 font-mono text-[0.66rem] uppercase tracking-[0.12em] text-muted">{m.label}</dt>
                  </div>
                ))}
              </dl>
            )}
            <div>
              <p className="eyebrow">Stack</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {p.tech.map((t) => (
                  <li key={t}>
                    <Badge>{t}</Badge>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow">Tags</p>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
                {p.tags.map((t) => (
                  <li key={t}>#{t.replace(/\s+/g, "-").toLowerCase()}</li>
                ))}
              </ul>
            </div>
          </aside>
        </header>

        <div className="mt-12 overflow-hidden rounded-md border border-rule bg-paper-2">
          <Image
            src={`/thumbnails/${p.slug}.svg`}
            alt={`${p.title} thumbnail`}
            width={1600}
            height={1000}
            priority
            unoptimized
            className="aspect-[16/10] w-full object-cover"
          />
        </div>
      </div>

      <div className="container-x mt-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="min-w-0">
            {readme ? (
              <>
                <p className="eyebrow mb-6 border-b border-rule pb-3">README · rendered from GitHub</p>
                <ReadmeRenderer markdown={readme} />
              </>
            ) : (
              <div className="rounded-md border border-dashed border-rule p-8 text-muted">
                {p.isPrivate ? (
                  <>
                    <p className="text-ink">This repository is private.</p>
                    <p className="mt-2 text-sm">
                      The write-up above covers what can be shared publicly. Happy to walk through the code and results
                      on a call, just <Link href="/#contact" className="link-underline text-ink">get in touch</Link>.
                    </p>
                  </>
                ) : (
                  <p className="text-sm">
                    The README could not be loaded right now. Read it directly on{" "}
                    <a href={githubUrl(p)} target="_blank" rel="noreferrer" className="link-underline text-ink">
                      GitHub
                    </a>
                    .
                  </p>
                )}
              </div>
            )}
          </div>
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-md border border-rule p-5 text-sm">
                <p className="eyebrow">Repository</p>
                {p.isPrivate ? (
                  <p className="mt-2 text-muted">Private, available on request.</p>
                ) : (
                  <a href={githubUrl(p)} target="_blank" rel="noreferrer" className="link-underline mt-2 block break-all">
                    Awais-Asghar/{p.repo}
                  </a>
                )}
                {p.live && (
                  <>
                    <p className="eyebrow mt-4">Live</p>
                    <a href={p.live} target="_blank" rel="noreferrer" className="link-underline mt-2 block break-all">
                      {p.live.replace(/^https?:\/\//, "")}
                    </a>
                  </>
                )}
                <p className="eyebrow mt-4">Category</p>
                <p className="mt-2 text-ink-2">{cat.label}</p>
                <p className="mt-1 text-muted">{cat.blurb}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {related.length > 0 && (
        <section className="container-x mt-24">
          <div className="flex items-end justify-between border-t border-rule pt-6">
            <div>
              <p className="eyebrow">More in {cat.short}</p>
              <h2 className="mt-2 font-serif text-2xl font-medium md:text-3xl">Related projects</h2>
            </div>
            <Link href={`/projects?c=${p.category}`} className="link-underline text-sm">
              See all
            </Link>
          </div>
          <ul className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <li key={r.slug}>
                <ProjectCard project={r} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
