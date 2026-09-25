import { Logo } from "@/components/logo";
import { brand } from "@/lib/brand";
import { Landscape } from "./landscape";

const linkClass =
  "rounded text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-12 pb-10 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-muted">A tiny, self-hosted Heroku for Node.js.</p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex gap-6 text-sm">
            <li>
              <a href={brand.repoUrl} target="_blank" rel="noreferrer" className={linkClass}>
                GitHub
              </a>
            </li>
            <li>
              <a href="#install" className={linkClass}>
                Install
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <p className="mx-auto max-w-6xl px-4 text-xs text-muted sm:px-6">
        Runs on your machine. Your code never leaves it.
      </p>
      <Landscape variant="ridge" className="mt-6 aspect-[40/7] min-h-36 w-full" />
    </footer>
  );
}
