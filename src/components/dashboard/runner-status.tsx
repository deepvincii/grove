import { cn } from "@/lib/web/cn";

export function RunnerStatus({ online, githubUser }: { online: boolean; githubUser: string | null }) {
  return (
    <p
      className="hidden items-center gap-2 text-sm text-muted md:flex"
      title={online ? "The runner is watching your repos and deploying" : "Start Grove with npm run dev"}
    >
      <span className={cn("size-2 rounded-full", online ? "bg-leaf" : "bg-clay")} />
      {online ? "Runner online" : "Runner offline"}
      {online && githubUser && <span className="text-faint">as @{githubUser}</span>}
    </p>
  );
}
