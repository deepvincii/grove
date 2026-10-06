import type { ReactNode } from "react";
import { cn } from "@/lib/web/cn";
import { SectionHeading } from "./section-heading";
import {
  DeploysVignette,
  LayersVignette,
  LogsVignette,
  PostgresVignette,
  RollbackVignette,
  SecretsVignette,
} from "./vignettes";

const code = "font-mono text-[0.9em] text-ink";

const rows: Array<{ title: string; body: ReactNode; art: ReactNode }> = [
  {
    title: "Deploys on every push",
    body: (
      <>
        Pick a repo and a branch once. Each new commit is built and started next to the version
        that’s running, and traffic moves over only after the new container answers on{" "}
        <span className={code}>/</span>. If a build fails, the old version keeps serving.
      </>
    ),
    art: <DeploysVignette />,
  },
  {
    title: "Rollbacks in one click",
    body: (
      <>
        Every deploy stays in the list. Press Roll back on an earlier one and Grove starts it again
        from the image it already built. Images from the last five deploys are kept, so there’s
        nothing to rebuild.
      </>
    ),
    art: <RollbackVignette />,
  },
];

const extras: Array<{ title: string; body: ReactNode; art: ReactNode }> = [
  {
    title: "Builds in Docker, no Dockerfile needed",
    body: (
      <>
        Grove uses your Dockerfile if the repo has one. If not, it writes a two-stage one for
        Node.js: <span className={code}>npm ci</span>, <span className={code}>npm run build</span>,
        then a slim runtime image.
      </>
    ),
    art: <LayersVignette />,
  },
  {
    title: "Live build logs",
    body: "Build output streams into the dashboard while it runs, and the Logs tab keeps the last 400 lines from your app.",
    art: <LogsVignette />,
  },
  {
    title: "Env vars and secrets",
    body: "Set them per app. Builds get them as BuildKit secrets, so they never end up in an image layer, and secret values are masked in build logs.",
    art: <SecretsVignette />,
  },
  {
    title: "One-click Postgres",
    body: (
      <>
        Add a database and Grove creates a role and a database for the app on its own Postgres 17,
        then sets <span className={code}>DATABASE_URL</span> for you.
      </>
    ),
    art: <PostgresVignette />,
  },
];

export function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className="px-4 py-24 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          id="features-title"
          title="What Grove takes care of"
          description="It runs on your Mac with Docker Desktop. There’s no cloud account to set up and no bill at the end of the month."
        />

        <div className="mt-16 space-y-16 lg:space-y-24">
          {rows.map((row, i) => (
            <div key={row.title} className="grid items-center gap-8 lg:grid-cols-12 lg:gap-16">
              <div
                className={cn(
                  "overflow-hidden rounded-lg border border-line lg:col-span-7",
                  i % 2 === 1 && "lg:order-last",
                )}
              >
                {row.art}
              </div>
              <div className="lg:col-span-5">
                <h3 className="font-serif text-[26px] leading-snug tracking-[-0.01em] text-ink">{row.title}</h3>
                <p className="mt-4 max-w-md text-[17px] leading-relaxed text-muted">{row.body}</p>
              </div>
            </div>
          ))}
        </div>

        <ul className="mt-20 grid gap-x-16 gap-y-12 border-t border-line pt-14 md:grid-cols-2 lg:mt-28">
          {extras.map((item) => (
            <li key={item.title} className="flex gap-5">
              {item.art}
              <div>
                <h3 className="text-base font-medium text-ink">{item.title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
