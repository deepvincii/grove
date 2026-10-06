import { query } from "@/lib/shared/db";
import type { LogKind } from "@/lib/shared/types";

const ANSI_ESCAPES = /\u001b\[[0-9;?]*[ -/]*[@-~]/g;

/** Buffers log lines for a deployment and writes them to Postgres in small, ordered batches. */
export class DeployLog {
  private pending: Array<{ kind: LogKind; line: string }> = [];
  private timer: NodeJS.Timeout | null = null;
  private writes: Promise<void> = Promise.resolve();
  private readonly secrets: string[];

  constructor(
    private readonly deploymentId: number,
    secrets: Array<string | null | undefined> = [],
  ) {
    this.secrets = secrets.filter((secret): secret is string => Boolean(secret && secret.length >= 6));
  }

  step(line: string): void {
    this.push("step", line);
    console.log(`[deploy #${this.deploymentId}] ${line}`);
  }

  out(line: string): void {
    this.push("build", line);
  }

  error(line: string): void {
    this.push("error", line);
    console.error(`[deploy #${this.deploymentId}] ${line}`);
  }

  flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const batch = this.pending.splice(0);
    if (batch.length > 0) {
      this.writes = this.writes
        .then(async () => {
          await query(
            `INSERT INTO deployment_logs (deployment_id, kind, line)
             SELECT $1, t.kind, t.line
               FROM unnest($2::text[], $3::text[]) WITH ORDINALITY AS t(kind, line, n)
              ORDER BY t.n`,
            [this.deploymentId, batch.map((entry) => entry.kind), batch.map((entry) => entry.line)],
          );
        })
        .catch((error: Error) => console.error("couldn't write deploy logs:", error.message));
    }
    return this.writes;
  }

  private push(kind: LogKind, raw: string): void {
    let line = raw.replace(ANSI_ESCAPES, "").trimEnd();
    if (!line && kind === "build") return;
    for (const secret of this.secrets) line = line.replaceAll(secret, "••••••");
    this.pending.push({ kind, line: line.slice(0, 4000) });

    if (this.pending.length >= 200) void this.flush();
    else if (!this.timer) this.timer = setTimeout(() => void this.flush(), 250);
  }
}
