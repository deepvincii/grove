import { cn } from "@/lib/cn";

export function RunnerStatus({ online, githubUser }: { online: boolean; githubUser: string | null }) {
  return (
    <div
      className="hidden items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 text-xs text-muted md:flex"
      title={online ? "The runner is watching GitHub and deploying" : "Start Grove with npm run dev"}
    >
      <span className={cn("size-2 rounded-full", online ? "bg-leaf" : "bg-clay")} />
      <span className="font-medium text-ink">{online ? "Runner online" : "Runner offline"}</span>
      {online && githubUser && (
        <>
          <span className="text-line-strong">·</span>
          <span>@{githubUser}</span>
        </>
      )}
    </div>
  );
}
