import { profile } from "@/data/profile";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";

export function Skills() {
  return (
    <Section id="skills" index="04" eyebrow="Toolkit" title="What I reach for.">
      <div className="grid gap-px overflow-hidden rounded-md border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
        {profile.skills.map((g, i) => (
          <Reveal key={g.group} delay={0.04 * i} className="bg-paper p-6">
            <p className="eyebrow">{g.group}</p>
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink-2">
              {g.items.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <div>
          <p className="eyebrow">Certifications & coursework</p>
          <ul className="mt-3 divide-y divide-rule text-sm">
            {profile.coursework.map((c) => (
              <li key={c.title} className="flex justify-between gap-6 py-2.5">
                <span className="text-ink-2">{c.title}</span>
                <span className="shrink-0 font-mono text-xs text-muted">{c.provider}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow">Leadership</p>
          <ul className="mt-3 divide-y divide-rule text-sm">
            {profile.leadership.map((l) => (
              <li key={l.title} className="py-2.5">
                <p className="text-ink">{l.title}</p>
                <p className="font-mono text-xs text-muted">{l.org}</p>
                <p className="mt-1 text-muted">{l.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
