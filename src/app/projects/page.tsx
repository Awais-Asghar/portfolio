import type { Metadata } from "next";
import { Suspense } from "react";
import { projects } from "@/data/projects";
import { categories } from "@/data/categories";
import { ProjectGrid } from "@/components/projects/ProjectGrid";

export const metadata: Metadata = {
  title: "Projects",
  description: `${projects.length} projects across ${categories.length} disciplines: AI, computer vision, LLMs, FPGA, embedded systems, robotics, web and HPC.`,
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  return (
    <div className="container-x pb-10 pt-14 md:pt-20">
      <header className="mb-10 max-w-3xl md:mb-14">
        <p className="eyebrow">
          <span className="mr-3 text-accent">Work</span>
          {projects.length} projects · {categories.length} categories
        </p>
        <h1 className="mt-4 font-serif text-[2.6rem] font-medium leading-[1.02] md:text-[3.6rem]">
          Everything I have built, in one place.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
          Filter by discipline or search across tools and tags. Each project links to its repository and renders the
          README so you can read the full story.
        </p>
      </header>
      <Suspense fallback={<div className="h-24" />}>
        <ProjectGrid projects={projects} />
      </Suspense>
    </div>
  );
}
