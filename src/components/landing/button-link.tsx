import { ArrowDown, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Cta = { label: string; href: string };

export function CtaIcon({
  href,
  className,
  strokeWidth,
}: {
  href: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = href.startsWith("#") ? ArrowDown : ArrowRight;
  return <Icon className={className} strokeWidth={strokeWidth} />;
}

const variants = {
  primary: "bg-forest text-white hover:bg-forest-deep",
  secondary: "border border-line-strong bg-card text-ink hover:border-sage hover:bg-sunken",
};

const sizes = {
  sm: "h-9 gap-1.5 px-4 text-sm",
  md: "h-12 gap-2 px-6 text-[15px]",
};

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
  children: ReactNode;
}) {
  const classes = cn(
    "inline-flex shrink-0 items-center justify-center rounded-full font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest",
    variants[variant],
    sizes[size],
    className,
  );

  if (href.startsWith("/")) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  const external = /^https?:\/\//.test(href);
  return (
    <a
      href={href}
      className={classes}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
    >
      {children}
    </a>
  );
}
