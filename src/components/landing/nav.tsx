import { Logo } from "@/components/logo";
import { brand } from "@/lib/brand";
import { ButtonLink, CtaIcon, type Cta } from "./button-link";
import { GithubMark } from "./github-mark";

const links = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Install", href: "#install" },
];

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest";

export function Nav({ cta }: { cta: Cta }) {
  return (
    <header className="fixed inset-x-0 top-3 z-50 px-3 sm:top-5 sm:px-6">
      <nav
        aria-label="Main"
        className="mx-auto grid h-14 max-w-5xl grid-cols-[1fr_auto] items-center gap-4 rounded-full border border-line bg-card/85 pr-2 pl-4 shadow-[0_1px_2px_rgb(19_36_27/0.04),0_10px_30px_-18px_rgb(19_36_27/0.25)] backdrop-blur-md md:grid-cols-[1fr_auto_1fr] md:pl-5"
      >
        <a
          href="#top"
          aria-label={`${brand.name}, back to top`}
          className={`justify-self-start rounded-lg ${focusRing}`}
        >
          <Logo />
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className={`rounded-full px-3.5 py-2 text-sm text-muted transition-colors hover:bg-sunken hover:text-ink ${focusRing}`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1.5 justify-self-end">
          <a
            href={brand.repoUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`${brand.name} on GitHub`}
            className={`hidden size-9 place-items-center rounded-full text-muted transition-colors hover:bg-sunken hover:text-ink sm:grid ${focusRing}`}
          >
            <GithubMark className="size-[18px]" />
          </a>
          <ButtonLink href={cta.href} size="sm">
            {cta.label}
            <CtaIcon href={cta.href} className="size-3.5" strokeWidth={2.25} />
          </ButtonLink>
        </div>
      </nav>
    </header>
  );
}
