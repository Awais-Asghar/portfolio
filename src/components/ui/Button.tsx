import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-[background-color,color,border-color,transform] duration-200 active:translate-y-px disabled:pointer-events-none disabled:opacity-50";
const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-accent hover:text-accent-ink",
  secondary: "border border-rule-strong text-ink hover:border-ink",
  ghost: "text-ink-2 hover:text-ink hover:bg-paper-2",
};
const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-sm",
  sm: "h-9 px-4 text-[0.8rem]",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

type ButtonProps = CommonProps & ComponentProps<"button"> & { href?: undefined };
type LinkProps = CommonProps & { href: string; external?: boolean; download?: boolean };

export function Button(props: ButtonProps | LinkProps) {
  const { variant = "primary", size = "md", className, children } = props;
  const cls = cn(base, variants[variant], sizes[size], className);

  if ("href" in props && props.href) {
    const { href, external, download } = props;
    if (external || href.startsWith("http") || href.startsWith("mailto:") || download) {
      return (
        <a
          href={href}
          className={cls}
          download={download}
          target={external || href.startsWith("http") ? "_blank" : undefined}
          rel={external || href.startsWith("http") ? "noreferrer" : undefined}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }

  const { variant: _variant, size: _size, className: _className, children: _children, ...rest } = props;
  void _variant;
  void _size;
  void _className;
  void _children;
  return (
    <button className={cls} {...(rest as ComponentProps<"button">)}>
      {children}
    </button>
  );
}
