import http from "node:http";
import net from "node:net";
import { config } from "@/lib/shared/config";
import { query } from "@/lib/shared/db";
import { statusPage } from "./pages";

/** App name → host port of its live container, or null while it has none. */
let routes = new Map<string, number | null>();
let listeningPort = 80;

export function appsPort(): number {
  return listeningPort;
}

export async function refreshRoutes(): Promise<void> {
  const rows = await query<{ name: string; port: number | null }>(
    `SELECT a.name, d.host_port AS port
       FROM apps a
       LEFT JOIN deployments d ON d.id = a.current_deployment_id AND d.status = 'live'`,
  );
  routes = new Map(rows.map((row) => [row.name, row.port]));
}

/** localhost and grove.localhost are the dashboard, <name>.localhost is an app. */
function resolve(host: string | undefined): { app?: string; port: number | null } {
  const hostname = (host ?? "").replace(/:\d+$/, "").toLowerCase();
  if (["localhost", "grove.localhost", "127.0.0.1", "[::1]"].includes(hostname)) return { port: config.dashboardPort };
  const app = hostname.match(/^([a-z0-9-]+)\.localhost$/)?.[1];
  return { app, port: (app && routes.get(app)) || null };
}

function sendPage(res: http.ServerResponse, status: number, title: string, message: string, path = "/dashboard") {
  const link = { href: `http://localhost:${config.dashboardPort}${path}`, label: "Open the dashboard" };
  res.writeHead(status, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
  res.end(statusPage({ status, title, message, link }));
}

function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
  const { app, port } = resolve(req.headers.host);
  if (!port) {
    if (app && routes.has(app)) {
      sendPage(res, 503, `${app} isn't live yet`, "Its first deployment hasn't finished, or the last one failed.", `/dashboard/apps/${app}`);
    } else {
      sendPage(res, 404, "Unknown address", "Grove serves apps at http://<app>.localhost.");
    }
    return;
  }

  const upstream = http.request(
    {
      host: "127.0.0.1",
      port,
      method: req.method,
      path: req.url,
      headers: { ...req.headers, "x-forwarded-host": req.headers.host ?? "", "x-forwarded-proto": "http" },
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    },
  );
  upstream.on("error", () => {
    if (res.headersSent) res.destroy();
    else sendPage(res, 502, `${app ?? "The dashboard"} isn't responding`, "Its container is up but refused the connection.");
  });
  req.pipe(upstream);
}

// WebSockets arrive as HTTP upgrades, so replay the handshake and tunnel the socket.
function handleUpgrade(req: http.IncomingMessage, socket: net.Socket, head: Buffer): void {
  const { port } = resolve(req.headers.host);
  if (!port) return void socket.destroy();

  const upstream = net.connect(port, "127.0.0.1", () => {
    let handshake = `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`;
    for (let i = 0; i < req.rawHeaders.length; i += 2) handshake += `${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}\r\n`;
    upstream.write(`${handshake}\r\n`);
    upstream.write(head);
    socket.pipe(upstream).pipe(socket);
  });
  upstream.on("error", () => socket.destroy());
  socket.on("error", () => upstream.destroy());
}

function listen(server: http.Server, port: number): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(port, "::", () => {
      server.off("error", reject);
      resolvePromise();
    });
  });
}

/**
 * Serves http://<app>.localhost on port 80, or the next configured port when that is taken.
 * macOS only lets unprivileged processes bind port 80 on all interfaces, so the server does
 * that and drops any connection that isn't from this machine.
 */
export async function startProxy(): Promise<number> {
  const server = http.createServer(handleRequest);
  server.on("upgrade", handleUpgrade);
  server.on("connection", (socket) => {
    if (!["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(socket.remoteAddress ?? "")) socket.destroy();
  });

  await refreshRoutes();
  setInterval(() => void refreshRoutes().catch(() => undefined), 2000);

  for (const port of config.appsPorts) {
    try {
      await listen(server, port);
      listeningPort = port;
      return port;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "EACCES" && code !== "EADDRINUSE") throw error;
    }
  }
  throw new Error(`Couldn't listen on any of these ports: ${config.appsPorts.join(", ")}. Set APPS_PORT to a free port.`);
}
