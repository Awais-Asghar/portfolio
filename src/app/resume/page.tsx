import type { Metadata } from "next";
import { Download } from "lucide-react";
import { profile } from "@/data/profile";
import { Button } from "@/components/ui/Button";
import { ResumeViewer } from "@/components/home/ResumeViewer";

export const metadata: Metadata = {
  title: "Resume",
  description: `Download ${profile.name}'s resume: AI engineering and hardware / electrical engineering versions.`,
  alternates: { canonical: "/resume" },
};

export default function ResumePage() {
  return (
    <div className="container-x pt-14 md:pt-20">
      <header className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div className="max-w-2xl">
          <p className="eyebrow">
            <span className="mr-3 text-accent">Resume</span>Two versions, one person
          </p>
          <h1 className="mt-4 font-serif text-[2.6rem] font-medium leading-[1.02] md:text-[3.6rem]">
            Pick the version that fits the role.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            The AI Engineer resume leads with machine learning, vision and LLM work. The Hardware resume leads with
            FPGA, RTL and embedded systems. Both cover the same education and honors.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {profile.resumes.map((r, i) => (
            <Button key={r.id} href={r.file} variant={i === 0 ? "primary" : "secondary"} download>
              <Download size={15} /> {r.label}
            </Button>
          ))}
        </div>
      </header>

      <ResumeViewer />
    </div>
  );
}
