import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowUpRight, Database, GitBranch, RefreshCw, RotateCcw, TriangleAlert } from "lucide-react";
import { addDatabase, deployLatest, redeploy } from "@/app/dashboard/actions";
import { AutoRefresh } from "@/components/dashboard/auto-refresh";
import { EnvForm } from "@/components/dashboard/env-form";
import { RuntimeLogs } from "@/components/dashboard/runtime-logs";
import { DeleteAppForm, SettingsForm } from "@/components/dashboard/settings-form";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { SubmitButton } from "@/components/dashboard/submit-button";
import { button, card } from "@/components/dashboard/ui";
import { addonEnv } from "@/lib/addons";
import { cn } from "@/lib/cn";
import { appUrl, duration, shortSha, timeAgo } from "@/lib/format";
import { getAppByName, getDeployment, getEnvVars, getHeartbeat, listDeployments } from "@/lib/queries";
import { commitWebUrl, repoLabel, repoWebUrl } from "@/lib/repos";
import { TRIGGER_LABELS, appStatus } from "@/lib/status";
import type { App, Deployment } from "@/lib/types";
import { formatEnvText } from "@/lib/validation";

const TABS = [
  { id: "deployments", label: "Deployments" },
  { id: "environment", label: "Environment" },
  { id: "logs", label: "Logs" },
  { id: "settings", label: "Settings" },
] as const;

type Tab = (typeof TABS)[number]["id"];

export async function generateMetadata(props: PageProps<"/dashboard/apps/[name]">) {
  const { name } = await props.params;
  return { title: name };
}

function DeploymentRow({ app, deployment }: { app: App; deployment: Deployment }) {
  const isCurrent = deployment.id === app.currentDeploymentId;
  const took = duration(deployment.startedAt, deployment.finishedAt);
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 sm:flex-nowrap">
      <div className="w-24 shrink-0">
        <StatusBadge status={deployment.status} />
      </div>
      <div className="min-w-0 flex-1">
        <Link
          href={`/dashboard/apps/${app.name}/deployments/${deployment.id}`}
          className="block truncate font-medium text-ink hover:underline"
        >
          {deployment.commitMessage ?? `Deployment #${deployment.id}`}
        </Link>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
          <a href={commitWebUrl(app.repo, deployment.commitSha)} target="_blank" rel="noreferrer" className="font-mono hover:text-ink">
            {shortSha(deployment.commitSha)}
          </a>
          <span>·</span>
          <span>{TRIGGER_LABELS[deployment.trigger]}</span>
          {deployment.commitAuthor && (
            <>
              <span>·</span>
              <span>{deployment.commitAuthor}</span>
            </>
          )}
          <span>·</span>
          <span>{timeAgo(deployment.createdAt)}</span>
          {took && (
            <>
              <span>·</span>
              <span>{took}</span>
            </>
          )}
        </p>
      </div>
      <div className="shrink-0">
        {isCurrent ? (
          <span className="rounded-full bg-mint px-2.5 py-1 text-xs font-medium text-forest">Serving now</span>
        ) : deployment.status === "superseded" || deployment.status === "failed" ? (
          <form action={redeploy}>
            <input type="hidden" name="deploymentId" value={deployment.id} />
            <SubmitButton className={button.ghost}>
              {deployment.status === "failed" ? (
                <RefreshCw className="size-3.5" aria-hidden="true" />
              ) : (
                <RotateCcw className="size-3.5" aria-hidden="true" />
              )}
              {deployment.status === "failed" ? "Retry" : "Roll back"}
            </SubmitButton>
          </form>
        ) : null}
      </div>
    </li>
  );
}

function DatabaseCard({ app }: { app: App }) {
  const vars = Object.keys(addonEnv(app));
  return (
    <section className={`${card} p-6`}>
      <div className="flex items-center gap-2">
        <Database className="size-4 text-forest" aria-hidden="true" />
        <h2 className="text-base font-semibold text-ink">Postgres</h2>
      </div>
      {app.databaseName ? (
        <>
          <p className="mt-2 text-sm text-muted">
            Database <span className="font-mono text-ink">{app.databaseName}</span> on Grove&apos;s Postgres 17. These
            variables are injected automatically; set any of them yourself to override.
          </p>
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {vars.map((key) => (
              <li key={key} className="rounded-md bg-sunken px-2 py-1 font-mono text-xs text-muted">
                {key}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted">
            Give this app its own database. Grove creates it and sets DATABASE_URL, PG* and DB_* variables.
          </p>
          <form action={addDatabase} className="mt-4">
            <input type="hidden" name="name" value={app.name} />
            <SubmitButton className={button.secondary} pendingLabel="Creating database…">
              Add a Postgres database
            </SubmitButton>
          </form>
        </>
      )}
    </section>
  );
}

export default async function AppPage(props: PageProps<"/dashboard/apps/[name]">) {
  await connection();
  const { name } = await props.params;
  const { tab: tabParam } = await props.searchParams;
  const tab: Tab = TABS.some((t) => t.id === tabParam) ? (tabParam as Tab) : "deployments";

  const app = await getAppByName(name);
  if (!app) notFound();

  const [deployments, heartbeat, env] = await Promise.all([
    listDeployments(app.id, 30),
    getHeartbeat(),
    getEnvVars(app.id),
  ]);
  const current =
    deployments.find((d) => d.id === app.currentDeploymentId) ??
    (app.currentDeploymentId ? await getDeployment(app.currentDeploymentId) : null);
  const status = appStatus(deployments[0] ?? null, current);
  const url = appUrl(app.name, heartbeat?.appsPort);

  return (
    <>
      {tab !== "logs" && <AutoRefresh />}
      <Link href="/dashboard" className="text-sm text-muted hover:text-ink">
        ← All apps
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-4xl tracking-tight text-ink sm:text-5xl">{app.name}</h1>
            <StatusBadge status={status} className="mt-2" />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
            {current?.status === "live" ? (
              <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-forest hover:underline">
                {url.replace("http://", "")}
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </a>
            ) : (
              <span className="font-mono text-faint">{url.replace("http://", "")}</span>
            )}
            <a href={repoWebUrl(app.repo, app.branch)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-ink">
              <GitBranch className="size-3.5" aria-hidden="true" />
              {repoLabel(app.repo)} · {app.branch}
            </a>
            <span className="inline-flex items-center gap-1.5">
              <span className={cn("size-1.5 rounded-full", app.autoDeploy ? "bg-leaf" : "bg-faint")} />
              {app.autoDeploy ? "Deploys on push" : "Auto-deploy off"}
            </span>
          </div>
          {app.pollError && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-clay-soft px-3 py-1.5 text-sm text-clay">
              <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
              {app.pollError}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {current?.status === "live" && (
            <a href={url} target="_blank" rel="noreferrer" className={button.secondary}>
              Open app
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          )}
          <form action={deployLatest}>
            <input type="hidden" name="name" value={app.name} />
            <SubmitButton className={button.primary} pendingLabel="Queueing…">
              Deploy latest
            </SubmitButton>
          </form>
        </div>
      </div>

      <nav className="mt-8 flex gap-1 overflow-x-auto border-b border-line" aria-label="App sections">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={t.id === "deployments" ? `/dashboard/apps/${app.name}` : `/dashboard/apps/${app.name}?tab=${t.id}`}
            aria-current={tab === t.id ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 pb-3 text-sm font-medium whitespace-nowrap transition-colors",
              tab === t.id ? "border-forest text-ink" : "border-transparent text-muted hover:text-ink",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        {tab === "deployments" &&
          (deployments.length === 0 ? (
            <p className={`${card} px-6 py-12 text-center text-muted`}>No deployments yet.</p>
          ) : (
            <ul className={`${card} divide-y divide-line`}>
              {deployments.map((deployment) => (
                <DeploymentRow key={deployment.id} app={app} deployment={deployment} />
              ))}
            </ul>
          ))}

        {tab === "environment" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <section className={`${card} p-6`}>
              <h2 className="text-base font-semibold text-ink">Environment variables</h2>
              <p className="mt-1 mb-4 text-sm text-muted">
                One KEY=value per line. Saving restarts the app with the same build, so it takes seconds.
              </p>
              <EnvForm appName={app.name} initial={formatEnvText(env)} />
            </section>
            <DatabaseCard app={app} />
          </div>
        )}

        {tab === "logs" &&
          (current?.status === "live" ? (
            <RuntimeLogs appName={app.name} />
          ) : (
            <p className={`${card} px-6 py-12 text-center text-muted`}>Logs appear once the app is live.</p>
          ))}

        {tab === "settings" && (
          <div className="space-y-6">
            <SettingsForm app={app} />
            <DeleteAppForm appName={app.name} />
          </div>
        )}
      </div>
    </>
  );
}
