export type DeploymentStatus =
  | "queued"
  | "cloning"
  | "building"
  | "releasing"
  | "starting"
  | "live"
  | "failed"
  | "superseded"
  | "cancelled";

export type DeploymentTrigger = "initial" | "push" | "webhook" | "manual" | "redeploy" | "config";

export type LogKind = "step" | "build" | "error";

export const ACTIVE_STATUSES: readonly DeploymentStatus[] = [
  "queued",
  "cloning",
  "building",
  "releasing",
  "starting",
];

export function isActive(status: DeploymentStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

export interface App {
  id: number;
  name: string;
  repo: string;
  branch: string;
  autoDeploy: boolean;
  buildCommand: string | null;
  startCommand: string | null;
  releaseCommand: string | null;
  databaseName: string | null;
  databasePassword: string | null;
  lastSeenSha: string | null;
  githubEtag: string | null;
  pollError: string | null;
  currentDeploymentId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Deployment {
  id: number;
  appId: number;
  commitSha: string;
  commitMessage: string | null;
  commitAuthor: string | null;
  trigger: DeploymentTrigger;
  status: DeploymentStatus;
  image: string | null;
  containerName: string | null;
  hostPort: number | null;
  error: string | null;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
}

export interface AppSummary extends App {
  latest: Deployment | null;
  current: Deployment | null;
}

export interface LogLine {
  id: number;
  kind: LogKind;
  line: string;
  createdAt: Date;
}

export interface Heartbeat {
  seenAt: Date;
  appsPort: number;
  pollIntervalMs: number;
  githubUser: string | null;
}
