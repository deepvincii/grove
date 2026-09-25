import { ArrowUpRight, GitBranch, GitCommitHorizontal, Globe, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { GithubMark } from "./github-mark";
import { SectionHeading } from "./section-heading";

const steps: Array<{ icon: LucideIcon; title: string; body: string; preview: ReactNode }> = [
  {
    icon: GitBranch,
    title: "Connect a repo",
    body: "Pick a GitHub repo and a branch in the local dashboard. That is the only setup.",
    preview: (
      <>
        <GithubMark className="text-ink" />
        <span className="truncate text-ink">you/docpipeline</span>
        <span className="ml-auto rounded-full bg-mint px-2 py-0.5 font-sans text-[11px] font-medium text-forest">
          Connected
        </span>
      </>
    ),
  },
  {
    icon: GitCommitHorizontal,
    title: "git push",
    body: "Push like you always do. Grove spots the new commit and builds it in Docker.",
    preview: (
      <>
        <span className="text-moss">$</span>
        <span className="truncate text-ink">git push origin main</span>
      </>
    ),
  },
  {
    icon: Globe,
    title: "It’s live at app.localhost",
    body: "Your app keeps running as an always-on container at its own pretty URL.",
    preview: (
      <>
        <span className="size-1.5 shrink-0 rounded-full bg-leaf" />
        <span className="truncate text-ink">docpipeline.localhost</span>
        <ArrowUpRight className="ml-auto size-4 shrink-0 text-faint" />
      </>
    ),
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="px-4 pt-24 pb-12 sm:px-6 sm:pt-32 sm:pb-16"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          id="how-it-works-title"
          eyebrow="How it works"
          title={
            <>
              Ship the way you <em>already</em> work
            </>
          }
          description="No pipelines to write and no servers to rent. Connect a repo once, then keep pushing."
        />

        <ol className="mt-14 grid gap-4 md:grid-cols-3 lg:gap-5">
          {steps.map(({ icon: Icon, title, body, preview }, index) => (
            <li key={title} className="flex flex-col rounded-2xl border border-line bg-card p-6 lg:p-7">
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-mint text-forest">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <span aria-hidden="true" className="font-mono text-xs text-faint">
                  0{index + 1}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="mt-6 text-lg font-medium tracking-tight text-ink">{title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{body}</p>
              </div>
              <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-line bg-paper px-3.5 py-3 font-mono text-[13px]">
                {preview}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
