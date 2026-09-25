import { queryOne } from "./db";
import type { DeploymentTrigger } from "./types";

interface EnqueueInput {
  appId: number;
  sha: string;
  message?: string | null;
  author?: string | null;
  trigger: DeploymentTrigger;
}

const AUTOMATIC_TRIGGERS: DeploymentTrigger[] = ["initial", "push", "webhook"];

/**
 * Queues a deployment for the runner. Automatic triggers (polling and webhooks) can both
 * report the same push, so they skip commits that were already queued for the app.
 * Returns the new deployment id, or null when it was a duplicate.
 */
export async function enqueueDeployment(input: EnqueueInput): Promise<number | null> {
  if (AUTOMATIC_TRIGGERS.includes(input.trigger)) {
    const existing = await queryOne(
      `SELECT 1 FROM deployments
        WHERE app_id = $1 AND commit_sha = $2 AND trigger = ANY($3::text[])
        LIMIT 1`,
      [input.appId, input.sha, AUTOMATIC_TRIGGERS],
    );
    if (existing) return null;
  }

  const row = await queryOne<{ id: number }>(
    `INSERT INTO deployments (app_id, commit_sha, commit_message, commit_author, trigger)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [input.appId, input.sha, input.message ?? null, input.author ?? null, input.trigger],
  );
  return row?.id ?? null;
}
