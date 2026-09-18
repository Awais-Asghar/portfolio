import { profile } from "@/data/profile";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { Badge } from "@/components/ui/Badge";

export function Recognition() {
  return (
    <Section id="recognition" index="05" eyebrow="Recognition" title="Papers in progress and honors.">
      <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
        <div>
          <p className="eyebrow">Publications</p>
          <ol className="mt-4 space-y-5">
            {profile.publications.map((p, i) => (
              <Reveal key={p.title} as="li" delay={0.05 * i} className="rounded-md border border-rule p-5">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-serif text-xl font-medium leading-snug">{p.title}</h3>
                  <Badge tone="accent">{p.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted">{p.note}</p>
              </Reveal>
            ))}
          </ol>
        </div>
        <div>
          <p className="eyebrow">Honors & awards</p>
          <ul className="mt-4 divide-y divide-rule border-y border-rule">
            {profile.honors.map((h, i) => (
              <Reveal key={h.title} as="li" delay={0.03 * i} className="grid gap-1 py-4 sm:grid-cols-[90px_1fr]">
                <span className="font-mono text-xs text-muted">{h.year}</span>
                <div>
                  <p className="text-ink">{h.title}</p>
                  <p className="text-sm text-muted">{h.detail}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
