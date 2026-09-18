import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  id?: string;
  index?: string;
  eyebrow?: string;
  title?: ReactNode;
  intro?: ReactNode;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Editorial section: numbered eyebrow, serif title, optional intro, hairline rule. */
export function Section({ id, index, eyebrow, title, intro, aside, className, children }: SectionProps) {
  return (
    <section id={id} className={cn("scroll-mt-20 py-20 md:py-28", className)}>
      <div className="container-x">
        {(eyebrow || title) && (
          <header className="mb-10 border-t border-rule pt-6 md:mb-14">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                {eyebrow && (
                  <p className="eyebrow">
                    {index && <span className="mr-3 text-accent">{index}</span>}
                    {eyebrow}
                  </p>
                )}
                {title && (
                  <h2 className="mt-3 font-serif text-[2rem] font-medium leading-[1.05] md:text-[2.75rem]">
                    {title}
                  </h2>
                )}
                {intro && <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">{intro}</p>}
              </div>
              {aside && <div className="shrink-0">{aside}</div>}
            </div>
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
