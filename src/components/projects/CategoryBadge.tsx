import { categoryById, type CategoryId } from "@/data/categories";
import { cn } from "@/lib/utils";

export function CategoryBadge({
  id,
  className,
  short = false,
}: {
  id: CategoryId;
  className?: string;
  short?: boolean;
}) {
  const c = categoryById[id];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted",
        className,
      )}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: c.hue }} aria-hidden />
      {short ? c.short : c.label}
    </span>
  );
}
