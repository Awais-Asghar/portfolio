import { profile } from "@/data/profile";

export function Marquee() {
  const items = [...profile.marquee, ...profile.marquee];
  return (
    <div className="mt-16 overflow-hidden border-y border-rule py-4 md:mt-24" aria-hidden>
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap font-mono text-[0.72rem] uppercase tracking-[0.18em] text-muted motion-reduce:animate-none">
        {items.map((t, i) => (
          <span key={i} className="flex items-center gap-10">
            {t}
            <span className="h-1 w-1 rounded-full bg-accent" />
          </span>
        ))}
      </div>
    </div>
  );
}
