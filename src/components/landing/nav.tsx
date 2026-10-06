import { Logo } from "@/components/logo";
import { brand } from "@/lib/web/brand";
import { cn } from "@/lib/web/cn";
import { ButtonLink, focusRing, type Cta } from "./button-link";

const links = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Install", href: "#install" },
  { label: "GitHub", href: brand.repoUrl },
];

export function Nav({ cta }: { cta: Cta }) {
  return (
    <header className="absolute inset-x-0 top-0 z-10">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:h-20 sm:px-6"
      >
        <a href="#top" aria-label={`${brand.name}, back to top`} className={cn("rounded-sm", focusRing)}>
          <Logo />
        </a>
        <div className="flex items-center gap-8">
          <ul className="hidden items-center gap-7 text-sm md:flex">
            {links.map((link) => {
              const external = link.href.startsWith("http");
              return (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noreferrer" : undefined}
                    className={cn(
                      "rounded-sm text-ink/70 underline-offset-[6px] transition-colors hover:text-ink hover:underline",
                      focusRing,
                    )}
                  >
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>
          <ButtonLink href={cta.href} size="sm">
            {cta.label}
          </ButtonLink>
        </div>
      </nav>
    </header>
  );
}
