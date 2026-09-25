import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "@/lib/config";
import { query } from "@/lib/db";
import { enqueueDeployment } from "@/lib/deployments";

interface PushEvent {
  ref?: string;
  after?: string;
  deleted?: boolean;
  repository?: { full_name?: string };
  head_commit?: { message?: string; author?: { username?: string; name?: string } } | null;
}

function validSignature(secret: string, body: string, header: string | null): boolean {
  if (!header?.startsWith("sha256=")) return false;
  const expected = Buffer.from(`sha256=${createHmac("sha256", secret).update(body).digest("hex")}`);
  const received = Buffer.from(header);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/**
 * Optional instant deploys. Polling already catches every push; point a GitHub webhook
 * (content type application/json) here through a tunnel and set GITHUB_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const secret = config.webhookSecret;
  if (!secret) {
    return Response.json({ error: "Webhooks are off. Set GITHUB_WEBHOOK_SECRET to enable them." }, { status: 404 });
  }

  const body = await request.text();
  if (!validSignature(secret, body, request.headers.get("x-hub-signature-256"))) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = request.headers.get("x-github-event");
  if (event === "ping") return Response.json({ ok: true });
  if (event !== "push") return Response.json({ ignored: event }, { status: 202 });

  const push = JSON.parse(body) as PushEvent;
  const repo = push.repository?.full_name;
  const sha = push.after;
  if (!repo || !sha || push.deleted || /^0+$/.test(sha) || !push.ref?.startsWith("refs/heads/")) {
    return Response.json({ ignored: "not a branch update" }, { status: 202 });
  }

  const branch = push.ref.slice("refs/heads/".length);
  const apps = await query<{ id: number }>(
    "SELECT id FROM apps WHERE lower(repo) = lower($1) AND branch = $2 AND auto_deploy",
    [repo, branch],
  );

  const queued: number[] = [];
  for (const app of apps) {
    await query("UPDATE apps SET last_seen_sha = $2 WHERE id = $1", [app.id, sha]);
    const id = await enqueueDeployment({
      appId: app.id,
      sha,
      message: push.head_commit?.message?.split("\n")[0],
      author: push.head_commit?.author?.username ?? push.head_commit?.author?.name,
      trigger: "webhook",
    });
    if (id) queued.push(id);
  }
  return Response.json({ queued }, { status: 202 });
}
