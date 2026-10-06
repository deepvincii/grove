import Link from "next/link";
import { connection } from "next/server";
import { TriangleAlert } from "lucide-react";
import { AutoRefresh } from "@/components/dashboard/auto-refresh";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { button } from "@/components/dashboard/ui";
import { appUrl, shortSha, timeAgo } from "@/lib/shared/format";
import { getHeartbeat, listApps } from "@/lib/shared/queries";
import { repoLabel } from "@/lib/shared/repos";
import { appStatus } from "@/lib/web/status";
import type { AppSummary } from "@/lib/shared/types";

export const metadata = { title: "Apps" };

function AppRow({ app, appsPort }: { app: AppSummary; appsPort: number | undefined }) {
  const address = appUrl(app.name, appsPort).replace("http://", "");
  const latest = app.latest;
  return (
    <tr className="border-t border-line align-top first:border-t-0">
      <td className="py-4 pr-6">
        <Link href={`/dashboard/apps/${app.name}`} className="font-medium text-ink hover:underline">
          {app.name}
        </Link>
        <p className="mt-1 truncate text-xs text-muted">
          {repoLabel(app.repo)} · {app.branch}
        </p>
      </td>
      <td className="py-4 pr-6">
        <StatusBadge status={appStatus(app.latest, app.current)} />
      </td>
      <td className="hidden py-4 pr-6 md:table-cell">
        {app.current?.status === "live" ? (
          <a href={`http://${address}`} target="_blank" rel="noreferrer" className="font-mono text-sm text-forest hover:underline">
            {address}
          </a>
        ) : (
          <span className="font-mono text-sm text-faint">{address}</span>
        )}
      </td>
      <td className="hidden py-4 lg:table-cell">
        {latest ? (
          <p className="max-w-sm truncate text-sm text-ink">
            <span className="mr-2 font-mono text-xs text-faint">{shortSha(latest.commitSha)}</span>
            {latest.commitMessage ?? "No commit message"}
          </p>
        ) : (
          <p className="text-sm text-faint">No deployments yet</p>
        )}
        {latest && <p className="mt-1 text-xs text-muted">{timeAgo(latest.createdAt)}</p>}
        {app.pollError && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-clay">
            <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{app.pollError}</span>
          </p>
        )}
      </td>
    </tr>
  );
}

export default async function AppsPage() {
  await connection();
  const [apps, heartbeat] = await Promise.all([listApps(), getHeartbeat()]);

  return (
    <>
      <AutoRefresh />
      <h1 className="font-serif text-4xl text-ink">Apps</h1>
      <p className="mt-2 text-muted">Every push to a watched branch builds and goes live on its own.</p>

      {apps.length === 0 ? (
        <div className="mt-10 border-t border-line pt-10">
          <p className="text-lg text-ink">No apps yet.</p>
          <p className="mt-1 max-w-md text-muted">
            Connect a repository and Grove will build it, run it, and keep it up to date with every push.
          </p>
          <Link href="/dashboard/new" className={`${button.primary} mt-6`}>
            Deploy your first app
          </Link>
        </div>
      ) : (
        <table className="mt-8 w-full table-fixed border-y border-line text-left">
          <colgroup>
            <col className="w-[34%] lg:w-[24%]" />
            <col className="w-[22%] lg:w-[14%]" />
            <col className="hidden md:table-column md:w-[30%] lg:w-[24%]" />
            <col className="hidden lg:table-column" />
          </colgroup>
          <thead className="sr-only">
            <tr>
              <th>App</th>
              <th>Status</th>
              <th>Address</th>
              <th>Last deploy</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((app) => (
              <AppRow key={app.id} app={app} appsPort={heartbeat?.appsPort} />
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
