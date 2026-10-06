export function shortSha(sha: string): string {
  return sha.slice(0, 7);
}

export function timeAgo(date: Date, now = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - date.getTime()) / 1000));
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function duration(start: Date | null, end: Date | null, now = Date.now()): string | null {
  if (!start) return null;
  const seconds = Math.max(0, Math.round(((end?.getTime() ?? now) - start.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`;
}

export function appUrl(name: string, appsPort: number | null | undefined): string {
  return !appsPort || appsPort === 80 ? `http://${name}.localhost` : `http://${name}.localhost:${appsPort}`;
}
