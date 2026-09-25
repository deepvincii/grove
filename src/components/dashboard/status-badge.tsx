import { cn } from "@/lib/cn";
import type { DeploymentStatus } from "@/lib/types";

type BadgeStatus = DeploymentStatus | "idle";

const STYLES: Record<BadgeStatus, { label: string; className: string; dot: string; pulse?: boolean }> = {
  live: { label: "Live", className: "bg-mint text-forest", dot: "bg-leaf" },
  queued: { label: "Queued", className: "bg-sunken text-muted", dot: "bg-faint" },
  cloning: { label: "Fetching", className: "bg-amber-soft text-amber", dot: "bg-amber", pulse: true },
  building: { label: "Building", className: "bg-amber-soft text-amber", dot: "bg-amber", pulse: true },
  releasing: { label: "Releasing", className: "bg-amber-soft text-amber", dot: "bg-amber", pulse: true },
  starting: { label: "Starting", className: "bg-amber-soft text-amber", dot: "bg-amber", pulse: true },
  failed: { label: "Failed", className: "bg-clay-soft text-clay", dot: "bg-clay" },
  superseded: { label: "Replaced", className: "border border-line text-faint", dot: "bg-line-strong" },
  cancelled: { label: "Skipped", className: "border border-line text-faint", dot: "bg-line-strong" },
  idle: { label: "Not deployed", className: "bg-sunken text-muted", dot: "bg-faint" },
};

export function StatusBadge({ status, className }: { status: BadgeStatus; className?: string }) {
  const style = STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        style.className,
        className,
      )}
    >
      <span className="relative flex size-1.5">
        {style.pulse && <span className={cn("absolute inset-0 animate-ping rounded-full opacity-60", style.dot)} />}
        <span className={cn("relative size-1.5 rounded-full", style.dot)} />
      </span>
      {style.label}
    </span>
  );
}
