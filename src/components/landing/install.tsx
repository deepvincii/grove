import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { brand } from "@/lib/brand";
import { CopyButton } from "./copy-button";
import { SectionHeading } from "./section-heading";

const commands = [`git clone ${brand.repoUrl}.git && cd grove`, "npm install", "npm run dev"];

const requirements: Array<{ id: string; label: ReactNode }> = [
  { id: "node", label: "Node.js 22 or newer" },
  { id: "docker", label: "Docker Desktop, up and running" },
  {
    id: "github",
    label: (
      <>
        GitHub CLI signed in (<code className="font-mono text-[0.9em] text-ink">gh auth login</code>), or
        a <code className="font-mono text-[0.9em] text-ink">GITHUB_TOKEN</code>
      </>
    ),
  },
];

const dashboardUrl = "http://localhost:3030";

export function Install() {
  return (
    <section
      id="install"
      aria-labelledby="install-title"
      className="scroll-mt-24 px-4 pb-20 sm:px-6 sm:pb-28"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 rounded-3xl border border-line bg-card p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-14 lg:p-14">
        <div>
          <SectionHeading
            id="install-title"
            align="left"
            eyebrow="Install"
            title={
              <>
                Up and running in <em>three</em> commands
              </>
            }
            description="Grove is a small Next.js app that you run yourself. Clone it, install, start it, and you are done."
          />
          <h3 className="mt-10 text-sm font-medium text-ink">You will need</h3>
          <ul className="mt-4 space-y-3">
            {requirements.map(({ id, label }) => (
              <li key={id} className="flex gap-3 text-[15px] leading-relaxed text-muted">
                <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-mint text-forest">
                  <Check className="size-3" strokeWidth={2.5} />
                </span>
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0">
          <div className="overflow-hidden rounded-2xl bg-term shadow-[0_18px_40px_-24px_rgb(15_26_20/0.4)]">
            <div className="flex items-center justify-between border-b border-term-line py-2 pr-2 pl-5">
              <span className="font-mono text-xs text-term-dim">~/code</span>
              <CopyButton text={commands.join("\n")} label="Copy install commands" />
            </div>
            <pre className="overflow-x-auto px-5 py-5 font-mono text-[13px] leading-7 text-term-fg sm:leading-8">
              <code>
                {commands.map((command) => (
                  <span key={command} className="block">
                    <span className="text-term-dim select-none">$ </span>
                    {command}
                  </span>
                ))}
                <span className="mt-3 block text-term-dim"># then open {dashboardUrl}</span>
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
