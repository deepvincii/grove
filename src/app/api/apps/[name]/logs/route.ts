import { containerLogs } from "@/lib/shared/docker";
import { getAppByName, getDeployment } from "@/lib/shared/queries";

export async function GET(_request: Request, context: RouteContext<"/api/apps/[name]/logs">) {
  const { name } = await context.params;
  const app = await getAppByName(name);
  if (!app) return Response.json({ lines: [], message: "App not found" }, { status: 404 });

  const current = app.currentDeploymentId ? await getDeployment(app.currentDeploymentId) : null;
  if (!current?.containerName || current.status !== "live") {
    return Response.json({ lines: [], message: "No running container yet." });
  }

  try {
    const lines = await containerLogs(current.containerName, 400);
    return Response.json({ lines, message: lines.length === 0 ? "No output yet." : undefined });
  } catch {
    return Response.json({ lines: [], message: "Couldn't read the container's logs. Is Docker running?" });
  }
}
