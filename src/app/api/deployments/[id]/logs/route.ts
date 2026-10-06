import { getDeployment, getLogsAfter } from "@/lib/shared/queries";

export async function GET(request: Request, context: RouteContext<"/api/deployments/[id]/logs">) {
  const { id } = await context.params;
  const deployment = await getDeployment(Number(id));
  if (!deployment) return Response.json({ error: "Deployment not found" }, { status: 404 });

  const after = Number(new URL(request.url).searchParams.get("after") ?? 0) || 0;
  const lines = await getLogsAfter(deployment.id, after);
  return Response.json({
    status: deployment.status,
    lines: lines.map(({ id: lineId, kind, line }) => ({ id: lineId, kind, line })),
  });
}
