"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/web/cn";

function copyWithSelection(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

export function CopyButton({ text, label, className }: { text: string; label: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  function copy() {
    if (!navigator.clipboard) {
      setCopied(copyWithSelection(text));
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => setCopied(true),
      () => setCopied(copyWithSelection(text)),
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={label}
        className={cn(
          "inline-flex h-7 min-w-16 items-center justify-center rounded-md border border-term-line px-2.5 font-mono text-xs transition-colors hover:border-term-dim hover:text-term-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-term-dim",
          copied ? "text-term-fg" : "text-term-dim",
          className,
        )}
      >
        <span aria-hidden="true">{copied ? "Copied" : "Copy"}</span>
      </button>
      <span role="status" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </>
  );
}
