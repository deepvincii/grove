import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowUpRight, Check, RotateCcw } from "lucide-react";
import { redeploy } from "@/app/dashboard/actions";
import { LogViewer } from "@/components/dashboard/log-viewer";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { SubmitButton } from "@/components/dashboard/submit-button";
import { button, card } from "@/components/dashboard/ui";
import { cn } from "@/lib/web/cn";
import { appUrl, duration, shortSha, timeAgo } from "@/lib/shared/format";
import { getAppByName, getDeployment, getHeartbeat } from "@/lib/shared/queries";
import { commitWebUrl } from "@/lib/shared/repos";
import { TRIGGER_LABELS } from "@/lib/web/status";
import { isActive, type DeploymentStatus } from "@/lib/shared/types";

export async function generateMetadata(props: PageProps<"/dashboard/apps/[name]/deployments/[id]">) {
  const { name, id } = await props.params;
  return { title: `${name} #${id}` };
}

const STEPS: Array<{ label: string; statuses: DeploymentStatus[] }> = [
  { label: "Queued", statuses: ["queued"] },
  { label: "Fetch", statuses: ["cloning"] },
  { label: "Build", statuses: ["building"] },
  { label: "Release", statuses: ["releasing"] },
  { label: "Start", statuses: ["starting"] },
  { label: "Live", statuses: ["live", "superseded"] },
];

function Progress({ status, hasRelease }: { status: DeploymentStatus; hasRelease: boolean }) {
  const steps = STEPS.filter((step) => hasRelease || step.label !== "Release");
  const reached = steps.findIndex((step) => step.statuses.includes(status));
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
      {steps.map((step, index) => {
        const done = reached > index || status === "live" || status === "superseded";
        const currentStep = reached === index && isActive(status);
        return (
          <li key={step.label} className="flex items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center gap-1.5",
                done && "text-ink",
                currentStep && "font-medium text-amber",
                !done && !currentStep && "text-faint",
              )}
            >
              {done && <Check className="size-3.5 text-forest" aria-hidden="true" />}
              {currentStep && <span className="size-2 animate-pulse rounded-full bg-amber" />}
              {step.label}
            </span>
            {index < steps.length - 1 && <span className="text-line-strong">/</span>}
          </li>
        );
      })}
    </ol>
  );
}

export default async function DeploymentPage(props: PageProps<"/dashboard/apps/[name]/deployments/[id]">) {
  await connection();
  const { name, id } = await props.params;
  const [app, deployment, heartbeat] = await Promise.all([
    getAppByName(name),
    getDeployment(Number(id)),
    getHeartbeat(),
  ]);
  if (!app || !deployment || deployment.appId !== app.id) notFound();

  const took = duration(deployment.startedAt, deployment.finishedAt);
  const url = appUrl(app.name, heartbeat?.appsPort);

  return (
    <>
      <Link href={`/dashboard/apps/${app.name}`} className="text-sm text-muted hover:text-ink">
        ← {app.name}
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-4xl tracking-tight text-ink">Deployment #{deployment.id}</h1>
            <StatusBadge status={deployment.status} className="mt-1" />
          </div>
          <p className="mt-2 max-w-2xl truncate text-ink">{deployment.commitMessage ?? "No commit message"}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted">
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
                <span>took {took}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {deployment.status === "live" && (
            <a href={url} target="_blank" rel="noreferrer" className={button.primary}>
              Open app
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          )}
          {!isActive(deployment.status) && deployment.status !== "live" && (
            <form action={redeploy}>
              <input type="hidden" name="deploymentId" value={deployment.id} />
              <SubmitButton className={button.secondary} pendingLabel="Queueing…">
                <RotateCcw className="size-4" aria-hidden="true" />
                {deployment.status === "superseded" ? "Roll back to this" : "Redeploy this commit"}
              </SubmitButton>
            </form>
          )}
        </div>
      </div>

      <div className={`${card} mt-6 flex flex-wrap items-center justify-between gap-3 px-5 py-4`}>
        <Progress status={deployment.status} hasRelease={Boolean(app.releaseCommand)} />
        {deployment.error && <p className="text-sm text-clay">{deployment.error}</p>}
      </div>

      <div className="mt-6">
        <LogViewer deploymentId={deployment.id} initialStatus={deployment.status} />
      </div>
    </>
  );
}
