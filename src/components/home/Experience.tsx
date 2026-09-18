import { profile } from "@/data/profile";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { Badge } from "@/components/ui/Badge";

export function Experience() {
  return (
    <Section
      id="experience"
      index="03"
      eyebrow="Experience"
      title="Research labs, a chip design centre, and a classroom."
    >
      <ol className="divide-y divide-rule border-y border-rule">
        {profile.experience.map((e, i) => (
          <Reveal key={e.role + e.org} as="li" delay={0.04 * i} className="grid gap-4 py-8 md:grid-cols-[180px_1fr] md:gap-10">
            <div className="font-mono text-xs uppercase tracking-[0.14em] text-muted">
              <p>{e.period}</p>
              <p className="mt-1 normal-case tracking-normal">{e.location}</p>
            </div>
            <div>
              <h3 className="font-serif text-2xl font-medium leading-tight">{e.role}</h3>
              <p className="mt-1 text-ink-2">
                {e.org}
                {e.supervisor && <span className="text-muted"> · with {e.supervisor}</span>}
              </p>
              <ul className="mt-4 max-w-2xl space-y-2 text-[0.95rem] leading-relaxed text-ink-2">
                {e.bullets.map((b) => (
                  <li key={b} className="flex gap-3">
                    <span className="mt-[0.6em] h-px w-4 shrink-0 bg-rule-strong" />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                {e.tags.map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
