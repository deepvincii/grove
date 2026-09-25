import net from "node:net";

export function isPortFree(port: number, host = "127.0.0.1"): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.listen(port, host, () => server.close(() => resolve(true)));
  });
}

/** Picks a random free port for a container, skipping ports other deployments hold. */
export async function findFreePort(exclude: Set<number>): Promise<number> {
  for (let attempt = 0; attempt < 100; attempt++) {
    const port = 42000 + Math.floor(Math.random() * 8000);
    if (!exclude.has(port) && (await isPortFree(port))) return port;
  }
  throw new Error("Couldn't find a free port for the container");
}
