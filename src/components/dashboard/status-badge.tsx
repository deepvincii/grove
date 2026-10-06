import { cn } from "@/lib/web/cn";
import type { DeploymentStatus } from "@/lib/shared/types";

type BadgeStatus = DeploymentStatus | "idle";

const STYLES: Record<BadgeStatus, { label: string; text: string; dot: string; pulse?: boolean }> = {
  live: { label: "Live", text: "text-ink", dot: "bg-leaf" },
  queued: { label: "Queued", text: "text-muted", dot: "bg-faint" },
  cloning: { label: "Fetching", text: "text-amber", dot: "bg-amber", pulse: true },
  building: { label: "Building", text: "text-amber", dot: "bg-amber", pulse: true },
  releasing: { label: "Releasing", text: "text-amber", dot: "bg-amber", pulse: true },
  starting: { label: "Starting", text: "text-amber", dot: "bg-amber", pulse: true },
  failed: { label: "Failed", text: "text-clay", dot: "bg-clay" },
  superseded: { label: "Replaced", text: "text-faint", dot: "bg-line-strong" },
  cancelled: { label: "Skipped", text: "text-faint", dot: "bg-line-strong" },
  idle: { label: "Not deployed", text: "text-muted", dot: "bg-line-strong" },
};

/** A colored dot and a word; no pill background. */
export function StatusBadge({ status, className }: { status: BadgeStatus; className?: string }) {
  const style = STYLES[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium whitespace-nowrap", style.text, className)}>
      <span className={cn("size-2 rounded-full", style.dot, style.pulse && "animate-pulse")} />
      {style.label}
    </span>
  );
}
