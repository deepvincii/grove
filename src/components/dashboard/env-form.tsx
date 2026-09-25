"use client";

import { useActionState } from "react";
import { saveEnv, type FormState } from "@/app/dashboard/actions";
import { cn } from "@/lib/cn";
import { SubmitButton } from "./submit-button";
import { button, input } from "./ui";

export function EnvForm({ appName, initial }: { appName: string; initial: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(saveEnv, {});

  return (
    <form action={formAction}>
      <input type="hidden" name="name" value={appName} />
      <textarea
        name="env"
        defaultValue={initial}
        rows={Math.min(18, Math.max(8, initial.split("\n").length + 2))}
        placeholder={"NODE_ENV=production\nJWT_SECRET=change-me"}
        spellCheck={false}
        aria-label="Environment variables"
        className={cn(input, "font-mono text-[13px] leading-relaxed")}
      />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p
          role="status"
          className={cn("text-sm whitespace-pre-line", state.error ? "text-clay" : "text-forest")}
        >
          {state.error ?? state.success ?? ""}
        </p>
        <SubmitButton className={button.primary} pendingLabel="Saving…">
          Save and restart
        </SubmitButton>
      </div>
    </form>
  );
}
