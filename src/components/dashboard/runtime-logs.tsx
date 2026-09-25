"use client";

import { useEffect, useRef, useState } from "react";

/** Tails the live container's stdout and stderr. */
export function RuntimeLogs({ appName }: { appName: string }) {
  const [lines, setLines] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>("Loading…");
  const scroller = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      try {
        const response = await fetch(`/api/apps/${appName}/logs`, { cache: "no-store" });
        const data = (await response.json()) as { lines: string[]; message?: string };
        if (!cancelled) {
          setLines(data.lines);
          setMessage(data.message ?? null);
        }
      } catch {
        if (!cancelled) setMessage("Couldn't load logs");
      }
      if (!cancelled) timer = setTimeout(poll, 2000);
    }

    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [appName]);

  useEffect(() => {
    const element = scroller.current;
    if (element && stickToBottom.current) element.scrollTop = element.scrollHeight;
  }, [lines]);

  return (
    <div className="overflow-hidden rounded-2xl border border-term-line bg-term">
      <div className="flex items-center justify-between border-b border-term-line px-4 py-2.5 text-xs text-term-dim">
        <span className="font-mono">{appName} · stdout + stderr</span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 animate-pulse rounded-full bg-leaf" />
          following
        </span>
      </div>
      <div
        ref={scroller}
        onScroll={(event) => {
          const element = event.currentTarget;
          stickToBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 40;
        }}
        className="h-[min(62vh,620px)] overflow-y-auto px-4 py-3 font-mono text-[12.5px] leading-relaxed text-term-fg/85"
      >
        {message && lines.length === 0 && <p className="text-term-dim">{message}</p>}
        {lines.map((line, index) => (
          <p key={index} className="break-words whitespace-pre-wrap">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
