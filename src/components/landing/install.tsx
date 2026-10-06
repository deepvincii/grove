import { brand } from "@/lib/web/brand";
import { CopyButton } from "./copy-button";
import { SectionHeading } from "./section-heading";

const commands = [`git clone ${brand.repoUrl}.git && cd grove`, "npm install", "npm run dev"];

const code = "font-mono text-[0.9em] text-ink";

export function Install() {
  return (
    <section id="install" aria-labelledby="install-title" className="px-4 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-12 border-t border-line py-24 sm:py-28 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <SectionHeading
            id="install-title"
            title="Up and running in three commands"
            description={
              <>
                <span className={code}>npm run dev</span> starts Grove’s own Postgres in Docker, runs the
                migrations, and brings up the dashboard next to the deploy runner.
              </>
            }
          />
          <h3 className="mt-10 text-[15px] font-medium text-ink">You’ll need</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-muted marker:text-faint">
            <li>Node.js 22 or newer</li>
            <li>Docker Desktop, running</li>
            <li>
              The GitHub CLI signed in with <span className={code}>gh auth login</span>, or a{" "}
              <span className={code}>GITHUB_TOKEN</span>
            </li>
          </ul>
        </div>

        <div className="min-w-0 lg:col-span-7">
          <div className="overflow-hidden rounded-lg bg-term">
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
                <span className="mt-3 block text-term-dim"># then open http://localhost:3030</span>
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
