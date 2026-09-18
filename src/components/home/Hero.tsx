"use client";

import Image from "next/image";
import { ArrowDown, ArrowUpRight, MessageCircle } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { profile } from "@/data/profile";
import { projects } from "@/data/projects";
import { categories } from "@/data/categories";
import { Button } from "@/components/ui/Button";

export function Hero() {
  const reduce = useReducedMotion();
  const anim = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <section className="container-x pt-14 md:pt-24">
      <div className="grid gap-12 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
        <div>
          <motion.p {...anim(0)} className="eyebrow">
            <span className="mr-3 text-accent">●</span>
            Portfolio · {new Date().getFullYear()} · Electrical Engineer, NUST
          </motion.p>
          <motion.h1
            {...anim(1)}
            className="mt-6 font-serif text-[2.9rem] font-medium leading-[0.98] tracking-[-0.02em] sm:text-[3.8rem] lg:text-[4.6rem]"
          >
            Electrical engineer building{" "}
            <span className="italic text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>
              AI at the edge
            </span>
            .
          </motion.h1>
          <motion.p {...anim(2)} className="mt-7 max-w-xl text-lg leading-relaxed text-ink-2">
            {profile.tagline}
          </motion.p>
          <motion.div {...anim(3)} className="mt-9 flex flex-wrap items-center gap-3">
            <Button href="/projects">
              View work <ArrowDown size={15} />
            </Button>
            <Button href={profile.resumes[0].file} variant="secondary" download>
              Download resume
            </Button>
            <Button
              variant="ghost"
              onClick={() => window.dispatchEvent(new CustomEvent("open-chat"))}
            >
              <MessageCircle size={15} /> Ask me anything
            </Button>
          </motion.div>
          <motion.dl {...anim(4)} className="mt-12 grid max-w-xl grid-cols-3 gap-6 border-t border-rule pt-6">
            <Stat value={String(projects.length)} label="projects shipped" />
            <Stat value={String(categories.length)} label="disciplines" />
            <Stat value="3.63" label="CGPA at NUST" />
          </motion.dl>
        </div>

        <motion.div {...anim(2)} className="relative mx-auto w-full max-w-sm lg:max-w-none">
          <div className="relative overflow-hidden rounded-md border border-rule bg-paper-2 shadow-card">
            <Image
              src={profile.avatar}
              alt={`Portrait of ${profile.name}`}
              width={800}
              height={800}
              priority
              className="aspect-[4/5] w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-[#141416]/70 to-transparent p-4 text-[#faf8f3]">
              <div>
                <p className="font-serif text-xl leading-none">{profile.name}</p>
                <p className="mt-1 font-mono text-[0.68rem] uppercase tracking-[0.14em] opacity-80">
                  {profile.location}
                </p>
              </div>
              <a
                href={profile.links.github}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-[#faf8f3]/40 px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.14em] transition hover:bg-[#faf8f3] hover:text-[#141416]"
              >
                GitHub <ArrowUpRight size={12} />
              </a>
            </div>
          </div>
          <p className="mt-3 flex items-center justify-between font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted">
            <span>Now: open to AI / ML roles and research</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> Available
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="font-serif text-3xl font-medium leading-none md:text-4xl">{value}</dd>
      <dd className="mt-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted">{label}</dd>
    </div>
  );
}
