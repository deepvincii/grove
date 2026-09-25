import Link from "next/link";
import { connection } from "next/server";
import { ArrowUpRight, GitBranch, Plus, TriangleAlert } from "lucide-react";
import { AutoRefresh } from "@/components/dashboard/auto-refresh";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { button, card } from "@/components/dashboard/ui";
import { appUrl, shortSha, timeAgo } from "@/lib/format";
import { getHeartbeat, listApps } from "@/lib/queries";
import { repoLabel } from "@/lib/repos";
import { appStatus } from "@/lib/status";
import type { AppSummary } from "@/lib/types";

export const metadata = { title: "Apps" };

function AppCard({ app, appsPort }: { app: AppSummary; appsPort: number | undefined }) {
  const url = appUrl(app.name, appsPort);
  const latest = app.latest;
  return (
    <li className={`${card} group relative flex flex-col p-5 transition-colors hover:border-line-strong`}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-ink">
          <Link href={`/dashboard/apps/${app.name}`} className="after:absolute after:inset-0 after:rounded-2xl">
            {app.name}
          </Link>
        </h2>
        <StatusBadge status={appStatus(app.latest, app.current)} />
      </div>

      {app.current?.status === "live" ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="relative z-10 mt-1 inline-flex w-fit items-center gap-1 font-mono text-xs text-forest hover:underline"
        >
          {url.replace("http://", "")}
          <ArrowUpRight className="size-3" aria-hidden="true" />
        </a>
      ) : (
        <p className="mt-1 font-mono text-xs text-faint">{url.replace("http://", "")}</p>
      )}

      <p className="mt-4 flex items-center gap-1.5 text-sm text-muted">
        <GitBranch className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">
          {repoLabel(app.repo)} · {app.branch}
        </span>
      </p>

      <div className="mt-4 border-t border-line pt-4 text-sm">
        {latest ? (
          <p className="flex items-baseline gap-2">
            <span className="font-mono text-xs text-faint">{shortSha(latest.commitSha)}</span>
            <span className="truncate text-ink">{latest.commitMessage ?? "No commit message"}</span>
            <span className="ml-auto shrink-0 text-xs text-faint">{timeAgo(latest.createdAt)}</span>
          </p>
        ) : (
          <p className="text-faint">No deployments yet</p>
        )}
        {app.pollError && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-clay">
            <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{app.pollError}</span>
          </p>
        )}
      </div>
    </li>
  );
}

export default async function AppsPage() {
  await connection();
  const [apps, heartbeat] = await Promise.all([listApps(), getHeartbeat()]);

  return (
    <>
      <AutoRefresh />
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl tracking-tight text-ink sm:text-5xl">Your apps</h1>
          <p className="mt-2 text-muted">Every push to a watched branch builds and goes live on its own.</p>
        </div>
      </div>

      {apps.length === 0 ? (
        <div className={`${card} flex flex-col items-center px-6 py-16 text-center`}>
          <p className="font-serif text-3xl text-ink">Nothing planted yet</p>
          <p className="mt-2 max-w-sm text-muted">
            Connect a GitHub repository and Grove will build it, run it, and keep it up to date with every push.
          </p>
          <Link href="/dashboard/new" className={`${button.primary} mt-6`}>
            <Plus className="size-4" aria-hidden="true" />
            Deploy your first app
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => (
            <AppCard key={app.id} app={app} appsPort={heartbeat?.appsPort} />
          ))}
        </ul>
      )}
    </>
  );
}
