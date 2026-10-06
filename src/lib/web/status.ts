import { isActive, type Deployment, type DeploymentStatus } from "../shared/types";

/** What an app's badge should say: an in-flight deploy wins, then whether something is live. */
export function appStatus(latest: Deployment | null, current: Deployment | null): DeploymentStatus | "idle" {
  if (latest && isActive(latest.status)) return latest.status;
  if (current?.status === "live") return "live";
  if (latest?.status === "failed") return "failed";
  return "idle";
}

export const TRIGGER_LABELS: Record<Deployment["trigger"], string> = {
  initial: "First deploy",
  push: "git push",
  manual: "Manual deploy",
  redeploy: "Rollback",
  config: "Config change",
};
