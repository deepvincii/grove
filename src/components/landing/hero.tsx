import type { CSSProperties } from "react";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/cn";
import { ButtonLink, CtaIcon, type Cta } from "./button-link";
import { DeployCard } from "./deploy-card";
import { GithubMark } from "./github-mark";
import { Landscape } from "./landscape";
import styles from "./landing.module.css";

const delay = (seconds: number) => ({ "--delay": `${seconds}s` }) as CSSProperties;

export function Hero({ cta }: { cta: Cta }) {
  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-svh flex-col overflow-hidden bg-linear-to-b from-mint to-paper to-60%"
    >
      <Landscape className="absolute inset-x-0 bottom-0 -z-10 h-[56%] w-full sm:h-[62%]" />

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-4 pt-28 text-center sm:px-6 sm:pt-[clamp(7rem,15vh,9rem)]">
        <p
          className={cn(
            styles.rise,
            "inline-flex items-center gap-2 rounded-full border border-line bg-card/70 px-3.5 py-1.5 text-[13px] text-muted",
          )}
          style={delay(0)}
        >
          <span className="size-1.5 rounded-full bg-leaf" />
          A tiny, self-hosted Heroku
        </p>

        <h1
          id="hero-title"
          className={cn(
            styles.rise,
            "mt-6 font-serif text-[44px] leading-[1.02] tracking-[-0.015em] text-balance text-ink sm:text-7xl lg:text-[clamp(4.25rem,9.8vh,5.5rem)] lg:leading-[0.98]",
          )}
          style={delay(0.06)}
        >
          <span className="block">Push to GitHub.</span>
          <span className="block">
            <em className="whitespace-nowrap text-forest">It’s live</em> on your Mac.
          </span>
        </h1>

        <p
          className={cn(
            styles.rise,
            "mt-6 max-w-[560px] text-[17px] leading-relaxed text-pretty text-ink/70 sm:text-lg",
          )}
          style={delay(0.12)}
        >
          Grove watches your Node.js repos, builds every push in Docker, and serves it at{" "}
          <span className="font-mono text-[0.9em] text-ink">yourapp.localhost</span>. No cloud bill, no
          YAML.
        </p>

        <div
          className={cn(
            styles.rise,
            "mt-8 flex w-full max-w-72 flex-col gap-3 sm:mt-9 sm:w-auto sm:max-w-none sm:flex-row",
          )}
          style={delay(0.18)}
        >
          <ButtonLink href={cta.href}>
            {cta.label}
            <CtaIcon href={cta.href} className="size-4" />
          </ButtonLink>
          <ButtonLink href={brand.repoUrl} variant="secondary">
            <GithubMark />
            View on GitHub
          </ButtonLink>
        </div>

        <div
          className={cn(
            styles.rise,
            "mt-auto w-full pt-28 pb-8 sm:pt-[clamp(2.5rem,7vh,4rem)] sm:pb-[clamp(1.5rem,5vh,3.5rem)]",
          )}
          style={delay(0.3)}
        >
          <DeployCard className="mx-auto max-w-[640px]" delay={0.6} />
        </div>
      </div>
    </section>
  );
}
