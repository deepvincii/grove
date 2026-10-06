import { ArrowUpRight } from "lucide-react";
import type { CSSProperties } from "react";
import { brand } from "@/lib/web/brand";
import { cn } from "@/lib/web/cn";
import { ButtonLink, CtaIcon, focusRing, type Cta } from "./button-link";
import { CommitBranch } from "./commit-branch";
import { Landscape } from "./landscape";
import styles from "./landing.module.css";

const delay = (seconds: number) => ({ "--delay": `${seconds}s` }) as CSSProperties;

export function Hero({ cta }: { cta: Cta }) {
  return (
    <section id="top" aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-[#eef2ea]">
      <Landscape className="absolute inset-x-0 bottom-0 -z-10 h-[46%] w-full sm:h-[50%]" />

      <div className="mx-auto grid min-h-svh max-w-6xl grid-rows-[auto_1fr] px-4 pt-28 pb-8 sm:px-6 sm:pt-[clamp(8rem,17vh,10rem)] lg:grid-cols-12 lg:grid-rows-1 lg:gap-x-12 lg:pb-[clamp(2rem,6vh,4rem)]">
        <div className="lg:col-span-7">
          <h1
            id="hero-title"
            className={cn(
              styles.rise,
              "font-serif text-[40px] leading-[1.1] tracking-[-0.02em] text-ink sm:text-[56px] lg:text-[clamp(3.25rem,7.2vh,4rem)]",
            )}
            style={delay(0)}
          >
            <span className="block">Push to GitHub.</span>
            It’s live on
            <br className="sm:hidden" /> your Mac.
          </h1>

          <p
            className={cn(styles.rise, "mt-6 max-w-[33rem] text-[17px] leading-relaxed text-ink/75 sm:text-lg")}
            style={delay(0.08)}
          >
            Grove is a small, self-hosted Heroku for Node.js apps. It checks GitHub every five seconds,
            builds new commits in Docker, and serves them at{" "}
            <span className="font-mono text-[0.92em] text-ink">yourapp.localhost</span>.
          </p>

          <div
            className={cn(styles.rise, "mt-8 flex flex-wrap items-center gap-x-7 gap-y-4")}
            style={delay(0.16)}
          >
            <ButtonLink href={cta.href}>
              {cta.label}
              <CtaIcon href={cta.href} className="size-4" />
            </ButtonLink>
            <a
              href={brand.repoUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "inline-flex items-center gap-1 rounded-sm text-[15px] font-medium text-ink underline-offset-[6px] hover:underline",
                focusRing,
              )}
            >
              View on GitHub
              <ArrowUpRight className="size-4" strokeWidth={2} />
            </a>
          </div>

          <p className={cn(styles.rise, "mt-6 text-sm text-pretty text-muted")} style={delay(0.2)}>
            Needs Node.js 22+, Docker Desktop and the GitHub CLI.
          </p>
        </div>

        <div
          className={cn(styles.rise, "mt-14 hidden w-full max-w-lg justify-self-center sm:block lg:col-span-5 lg:mt-0 lg:w-[calc(100%+3rem)] lg:max-w-none lg:self-start")}
          style={delay(0.3)}
        >
          <CommitBranch />
        </div>

      </div>
    </section>
  );
}
