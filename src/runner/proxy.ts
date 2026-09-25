import http from "node:http";
import net from "node:net";
import { config } from "@/lib/config";
import { query } from "@/lib/db";
import { statusPage } from "./pages";

type Target = { kind: "dashboard" } | { kind: "app"; name: string } | { kind: "unknown" };

let liveApps = new Map<string, number>();
let knownApps = new Set<string>();
let listeningPort = 80;

export function appsPort(): number {
  return listeningPort;
}

/** Reloads which host port each app's live container is published on. */
export async function refreshRoutes(): Promise<void> {
  const rows = await query<{ name: string; port: number | null }>(
    `SELECT a.name, d.host_port AS port
       FROM apps a
       LEFT JOIN deployments d ON d.id = a.current_deployment_id AND d.status = 'live'`,
  );
  liveApps = new Map(rows.flatMap((row) => (row.port ? [[row.name, row.port] as const] : [])));
  knownApps = new Set(rows.map((row) => row.name));
}

function resolve(host: string | undefined): Target {
  const hostname = (host ?? "").replace(/:\d+$/, "").toLowerCase();
  if (["localhost", "127.0.0.1", "[::1]", "grove.localhost"].includes(hostname)) return { kind: "dashboard" };
  const match = hostname.match(/^([a-z0-9-]+)\.localhost$/);
  return match ? { kind: "app", name: match[1] } : { kind: "unknown" };
}

function upstreamPort(target: Target): number | null {
  if (target.kind === "dashboard") return config.dashboardPort;
  if (target.kind === "app") return liveApps.get(target.name) ?? null;
  return null;
}

function dashboardUrl(path = ""): string {
  return `http://localhost:${config.dashboardPort}${path}`;
}

function sendPage(res: http.ServerResponse, status: number, title: string, message: string, link?: { href: string; label: string }) {
  res.writeHead(status, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
  res.end(statusPage({ status, title, message, link }));
}

function sendUnavailable(res: http.ServerResponse, target: Target): void {
  if (target.kind === "app" && knownApps.has(target.name)) {
    sendPage(res, 503, `${target.name} isn't live yet`, "Its first deployment hasn't finished, or the last one failed. The dashboard has the build logs.", {
      href: dashboardUrl(`/dashboard/apps/${target.name}`),
      label: "Open in dashboard",
    });
  } else if (target.kind === "app") {
    sendPage(res, 404, `No app called ${target.name}`, "Create it in the Grove dashboard and it will be served at this address.", {
      href: dashboardUrl("/dashboard/new"),
      label: "Create an app",
    });
  } else {
    sendPage(res, 404, "Unknown address", "Grove serves apps at http://<app>.localhost.", {
      href: dashboardUrl("/dashboard"),
      label: "Open the dashboard",
    });
  }
}

function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
  const target = resolve(req.headers.host);
  const port = upstreamPort(target);
  if (!port) {
    sendUnavailable(res, target);
    return;
  }

  const upstream = http.request(
    {
      host: "127.0.0.1",
      port,
      method: req.method,
      path: req.url,
      headers: {
        ...req.headers,
        "x-forwarded-for": req.socket.remoteAddress ?? "127.0.0.1",
        "x-forwarded-host": req.headers.host ?? "",
        "x-forwarded-proto": "http",
      },
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    },
  );
  upstream.on("error", () => {
    if (res.headersSent) {
      res.destroy();
    } else if (target.kind === "dashboard") {
      sendPage(res, 502, "The dashboard isn't running", "Start Grove with `npm run dev`.");
    } else {
      sendPage(res, 502, `${target.kind === "app" ? target.name : "The app"} isn't responding`, "The container is up but refused the connection. Check its runtime logs.", {
        href: dashboardUrl(target.kind === "app" ? `/dashboard/apps/${target.name}?tab=logs` : "/dashboard"),
        label: "View logs",
      });
    }
  });
  req.pipe(upstream);
}

// WebSockets (and Next.js hot reload for the dashboard) arrive as HTTP upgrades; tunnel them raw.
function handleUpgrade(req: http.IncomingMessage, socket: net.Socket, head: Buffer): void {
  const port = upstreamPort(resolve(req.headers.host));
  if (!port) {
    socket.destroy();
    return;
  }
  const upstream = net.connect(port, "127.0.0.1", () => {
    let raw = `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`;
    for (let i = 0; i < req.rawHeaders.length; i += 2) raw += `${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}\r\n`;
    upstream.write(`${raw}\r\n`);
    if (head.length > 0) upstream.write(head);
    socket.pipe(upstream).pipe(socket);
  });
  upstream.on("error", () => socket.destroy());
  socket.on("error", () => upstream.destroy());
}

function isLoopback(address: string | undefined): boolean {
  return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}

function listen(server: http.Server, port: number, host: string): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const onError = (error: Error) => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      resolvePromise();
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, host);
  });
}

/**
 * Serves http://<app>.localhost. macOS only lets unprivileged processes bind port 80 on the
 * wildcard address, so the server listens there and drops anything that isn't loopback.
 */
export async function startProxy(): Promise<number> {
  const server = http.createServer(handleRequest);
  server.on("upgrade", handleUpgrade);
  server.on("connection", (socket) => {
    if (!isLoopback(socket.remoteAddress)) socket.destroy();
  });

  await refreshRoutes();
  setInterval(() => void refreshRoutes().catch(() => undefined), 2000);

  for (const port of config.appsPorts) {
    for (const host of ["::", "0.0.0.0"]) {
      try {
        await listen(server, port, host);
        listeningPort = port;
        return port;
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code === "EAFNOSUPPORT" || code === "EADDRNOTAVAIL") continue;
        if (code === "EACCES" || code === "EADDRINUSE") break;
        throw error;
      }
    }
  }
  throw new Error(`Couldn't listen on any of these ports: ${config.appsPorts.join(", ")}. Set APPS_PORT to a free port.`);
}
