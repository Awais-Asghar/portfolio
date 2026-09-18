import { profile } from "@/data/profile";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { Badge } from "@/components/ui/Badge";

export function About() {
  return (
    <Section id="about" index="02" eyebrow="About" title="From a notebook to real hardware.">
      <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <Reveal>
          <div className="space-y-5 text-[1.05rem] leading-relaxed text-ink-2">
            {profile.about.map((p, i) => (
              <p key={i} className={i === 0 ? "first-letter:float-left first-letter:mr-3 first-letter:font-serif first-letter:text-[3.6rem] first-letter:leading-[0.85] first-letter:text-ink" : ""}>
                {p}
              </p>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <aside className="rounded-md border border-rule bg-paper-2 p-6">
            <p className="eyebrow">Open to</p>
            <ul className="mt-3 space-y-2 text-sm">
              {profile.openTo.map((o) => (
                <li key={o} className="flex gap-2">
                  <span className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {o}
                </li>
              ))}
            </ul>
            <p className="eyebrow mt-7">Interests</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.interests.map((i) => (
                <Badge key={i} tone="outline">
                  {i}
                </Badge>
              ))}
            </div>
            <p className="eyebrow mt-7">Education</p>
            {profile.education.map((e) => (
              <div key={e.school} className="mt-3 text-sm">
                <p className="font-medium text-ink">{e.degree}</p>
                <p className="text-muted">{e.school}</p>
                <p className="font-mono text-xs text-muted">{e.period}</p>
                <ul className="mt-2 space-y-1 text-muted">
                  {e.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </div>
            ))}
          </aside>
        </Reveal>
      </div>
    </Section>
  );
}
