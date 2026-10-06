import { Logo } from "@/components/logo";
import { brand } from "@/lib/web/brand";
import { cn } from "@/lib/web/cn";
import { focusRing } from "./button-link";
import { Landscape } from "./landscape";

const linkClass = cn("rounded-sm text-muted underline-offset-4 hover:text-ink hover:underline", focusRing);

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <Logo />
          <p className="text-sm text-muted">Runs on your machine. Your code never leaves it.</p>
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
      <Landscape variant="ridge" className="aspect-[40/7] min-h-32 w-full" />
    </footer>
  );
}
