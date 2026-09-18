import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { featuredProjects, projects } from "@/data/projects";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";

export function FeaturedProjects() {
  const [first, second, ...rest] = featuredProjects;
  return (
    <Section
      id="work"
      index="01"
      eyebrow="Selected work"
      title="Eight projects that show the range."
      intro="Hardware, vision, LLM apps and research, each taken from an idea to something that runs."
      aside={
        <Link href="/projects" className="link-underline inline-flex items-center gap-2 text-sm">
          All {projects.length} projects <ArrowRight size={14} />
        </Link>
      }
    >
      <div className="grid gap-x-8 gap-y-14 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <ProjectCard project={first} size="lg" priority />
        </Reveal>
        <Reveal delay={0.08}>
          <ProjectCard project={second} />
        </Reveal>
        {rest.map((p, i) => (
          <Reveal key={p.slug} delay={0.05 * (i % 3)}>
            <ProjectCard project={p} />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
