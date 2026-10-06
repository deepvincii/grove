import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function docker(
  args: string[],
  options: { env?: NodeJS.ProcessEnv; timeoutMs?: number } = {},
): Promise<string> {
  const { stdout } = await execFileAsync("docker", args, {
    env: options.env ?? process.env,
    timeout: options.timeoutMs ?? 120_000,
    maxBuffer: 32 * 1024 * 1024,
  });
  return stdout;
}

interface ContainerState {
  running: boolean;
  restarting: boolean;
  exitCode: number;
  restartCount: number;
}

export async function inspectContainer(name: string): Promise<ContainerState | null> {
  try {
    const out = await docker([
      "inspect",
      "--format",
      "{{.State.Running}} {{.State.Restarting}} {{.State.ExitCode}} {{.RestartCount}}",
      name,
    ]);
    const [running, restarting, exitCode, restartCount] = out.trim().split(" ");
    return {
      running: running === "true",
      restarting: restarting === "true",
      exitCode: Number(exitCode),
      restartCount: Number(restartCount),
    };
  } catch {
    return null;
  }
}

/** Recent stdout + stderr of a container, merged in the order the lines were written. */
export async function containerLogs(name: string, tail = 300): Promise<string[]> {
  const { stdout, stderr } = await execFileAsync(
    "docker",
    ["logs", "--timestamps", "--tail", String(tail), name],
    { maxBuffer: 32 * 1024 * 1024, timeout: 15_000 },
  );
  const out = stdout.split("\n").filter(Boolean);
  const err = stderr.split("\n").filter(Boolean);

  // Each stream is already in order; merge them by the timestamp docker prefixed.
  const merged: string[] = [];
  let i = 0;
  let j = 0;
  while (i < out.length || j < err.length) {
    if (j >= err.length || (i < out.length && timestampKey(out[i]) <= timestampKey(err[j]))) {
      merged.push(out[i++]);
    } else {
      merged.push(err[j++]);
    }
  }
  return merged.slice(-tail).map(stripTimestamp);
}

/** RFC 3339 timestamps trim trailing zeros, so pad the fraction to compare them as strings. */
function timestampKey(line: string): string {
  const stamp = line.slice(0, line.indexOf(" "));
  const match = stamp.match(/^(.*:\d\d)(?:\.(\d+))?(Z|[+-]\d\d:\d\d)$/);
  return match ? `${match[1]}.${(match[2] ?? "").padEnd(9, "0")}${match[3]}` : stamp;
}

function stripTimestamp(line: string): string {
  const space = line.indexOf(" ");
  return space > 0 ? line.slice(space + 1) : line;
}

export async function listContainers(label: string): Promise<string[]> {
  const out = await docker(["ps", "-a", "--filter", `label=${label}`, "--format", "{{.Names}}"]);
  return out.split("\n").filter(Boolean);
}

export async function removeContainer(name: string, graceSeconds = 10): Promise<void> {
  await docker(["stop", "--time", String(graceSeconds), name]).catch(() => undefined);
  await docker(["rm", "--force", name]).catch(() => undefined);
}

export async function imageExists(image: string): Promise<boolean> {
  try {
    await docker(["image", "inspect", "--format", "{{.Id}}", image]);
    return true;
  } catch {
    return false;
  }
}

export async function removeImage(image: string): Promise<void> {
  await docker(["image", "rm", image]).catch(() => undefined);
}

/** Stops and removes every container and image that belongs to an app. */
export async function removeAppResources(appName: string): Promise<void> {
  const containers = await listContainers(`grove.app=${appName}`).catch(() => []);
  await Promise.all(containers.map((name) => removeContainer(name, 5)));
  const images = await docker(["images", `grove/${appName}`, "--format", "{{.Repository}}:{{.Tag}}"]).catch(() => "");
  for (const image of images.split("\n").filter(Boolean)) await removeImage(image);
}
