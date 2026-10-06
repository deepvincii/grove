import { ArrowDown, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/web/cn";

export type Cta = { label: string; href: string };

export function CtaIcon({ href, className }: { href: string; className?: string }) {
  const Icon = href.startsWith("#") ? ArrowDown : ArrowRight;
  return <Icon className={className} strokeWidth={2} />;
}

export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest";

const sizes = {
  sm: "h-9 gap-1.5 px-3.5 text-sm",
  md: "h-11 gap-2 px-5 text-[15px]",
};

export function ButtonLink({
  href,
  size = "md",
  className,
  children,
}: {
  href: string;
  size?: keyof typeof sizes;
  className?: string;
  children: ReactNode;
}) {
  const classes = cn(
    "inline-flex shrink-0 items-center justify-center rounded-md bg-forest font-medium whitespace-nowrap text-white transition-colors hover:bg-forest-deep",
    focusRing,
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
