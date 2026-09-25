"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { DeploymentStatus, LogKind } from "@/lib/types";

interface Line {
  id: number;
  kind: LogKind;
  line: string;
}

const FINISHED: DeploymentStatus[] = ["live", "failed", "superseded", "cancelled"];

/** Streams a deployment's build log by polling for lines newer than the last one seen. */
export function LogViewer({ deploymentId, initialStatus }: { deploymentId: number; initialStatus: DeploymentStatus }) {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>([]);
  const [status, setStatus] = useState(initialStatus);
  const statusRef = useRef(initialStatus);
  const lastId = useRef(0);
  const scroller = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let quietPollsAfterFinish = 0;

    async function poll() {
      try {
        const response = await fetch(`/api/deployments/${deploymentId}/logs?after=${lastId.current}`, { cache: "no-store" });
        if (response.ok && !cancelled) {
          const data = (await response.json()) as { status: DeploymentStatus; lines: Line[] };
          if (data.lines.length > 0) {
            lastId.current = data.lines[data.lines.length - 1].id;
            setLines((previous) => [...previous, ...data.lines]);
          }
          if (statusRef.current !== data.status) {
            statusRef.current = data.status;
            setStatus(data.status);
            router.refresh();
          }
          // Once the deployment is over, a couple of quiet polls catch any final lines.
          if (FINISHED.includes(data.status) && data.lines.length === 0 && ++quietPollsAfterFinish >= 3) return;
        }
      } catch {
        // Keep polling; the dev server may be restarting.
      }
      if (!cancelled) timer = setTimeout(poll, 800);
    }

    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [deploymentId, router]);

  useEffect(() => {
    const element = scroller.current;
    if (element && stickToBottom.current) element.scrollTop = element.scrollHeight;
  }, [lines]);

  return (
    <div className="overflow-hidden rounded-2xl border border-term-line bg-term">
      <div className="flex items-center justify-between border-b border-term-line px-4 py-2.5 text-xs text-term-dim">
        <span className="font-mono">build log</span>
        <span>{FINISHED.includes(status) ? `${lines.length} lines` : "streaming…"}</span>
      </div>
      <div
        ref={scroller}
        onScroll={(event) => {
          const element = event.currentTarget;
          stickToBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 40;
        }}
        className="h-[min(62vh,640px)] overflow-y-auto px-4 py-3 font-mono text-[12.5px] leading-relaxed"
      >
        {lines.length === 0 && <p className="text-term-dim">Waiting for the runner to pick this up…</p>}
        {lines.map((line) => (
          <p
            key={line.id}
            className={cn(
              "break-words whitespace-pre-wrap",
              line.kind === "step" && "mt-2 font-semibold text-[#9ee0b4] first:mt-0",
              line.kind === "error" && "mt-2 font-semibold text-[#ff9f8a]",
              line.kind === "build" && "text-term-fg/85",
            )}
          >
            {line.kind === "step" ? "› " : line.kind === "error" ? "✕ " : ""}
            {line.line}
          </p>
        ))}
      </div>
    </div>
  );
}
