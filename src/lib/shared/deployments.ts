import { queryOne } from "./db";
import type { DeploymentTrigger } from "./types";

interface EnqueueInput {
  appId: number;
  sha: string;
  message?: string | null;
  author?: string | null;
  trigger: DeploymentTrigger;
}

/** Queues a deployment for the runner and returns its id. */
export async function enqueueDeployment(input: EnqueueInput): Promise<number> {
  const row = await queryOne<{ id: number }>(
    `INSERT INTO deployments (app_id, commit_sha, commit_message, commit_author, trigger)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [input.appId, input.sha, input.message ?? null, input.author ?? null, input.trigger],
  );
  if (!row) throw new Error("Couldn't queue the deployment");
  return row.id;
}
