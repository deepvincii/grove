"use client";

import { useActionState } from "react";
import { deleteApp, saveSettings, type FormState } from "@/app/dashboard/actions";
import { cn } from "@/lib/cn";
import type { App } from "@/lib/types";
import { SubmitButton } from "./submit-button";
import { button, card, input, label } from "./ui";

export function SettingsForm({ app }: { app: App }) {
  const [state, formAction] = useActionState<FormState, FormData>(saveSettings, {});

  return (
    <form action={formAction} className={`${card} p-6`}>
      <input type="hidden" name="name" value={app.name} />
      <h2 className="text-base font-semibold text-ink">Deploys</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="branch" className={label}>
            Branch
          </label>
          <input id="branch" name="branch" defaultValue={app.branch} spellCheck={false} className={cn(input, "font-mono")} />
        </div>
        <label className="flex items-start gap-3 self-end rounded-xl border border-line p-3.5">
          <input type="checkbox" name="autoDeploy" defaultChecked={app.autoDeploy} className="mt-0.5 size-4 accent-forest" />
          <span className="text-sm">
            <span className="block font-medium text-ink">Deploy on every push</span>
            <span className="text-muted">Watch {app.branch} on GitHub.</span>
          </span>
        </label>
        {[
          { id: "buildCommand", title: "Build command", value: app.buildCommand, hint: "npm run build" },
          { id: "startCommand", title: "Start command", value: app.startCommand, hint: "npm start" },
          { id: "releaseCommand", title: "Release command", value: app.releaseCommand, hint: "npm run migrate" },
        ].map((field) => (
          <div key={field.id}>
            <label htmlFor={field.id} className={label}>
              {field.title}
            </label>
            <input
              id={field.id}
              name={field.id}
              defaultValue={field.value ?? ""}
              placeholder={field.hint}
              spellCheck={false}
              className={cn(input, "font-mono text-[13px]")}
            />
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p role="status" className={cn("text-sm", state.error ? "text-clay" : "text-forest")}>
          {state.error ?? state.success ?? ""}
        </p>
        <SubmitButton className={button.primary} pendingLabel="Saving…">
          Save settings
        </SubmitButton>
      </div>
    </form>
  );
}

export function DeleteAppForm({ appName }: { appName: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(deleteApp, {});

  return (
    <form action={formAction} className={`${card} border-clay/25 p-6`}>
      <input type="hidden" name="name" value={appName} />
      <h2 className="text-base font-semibold text-clay">Delete this app</h2>
      <p className="mt-1 text-sm text-muted">
        Stops its container and removes its images, deploy history and database. This can&apos;t be undone.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          name="confirm"
          placeholder={`Type ${appName} to confirm`}
          aria-label={`Type ${appName} to confirm`}
          autoComplete="off"
          spellCheck={false}
          className={cn(input, "max-w-xs font-mono")}
        />
        <SubmitButton className={button.danger} pendingLabel="Deleting…">
          Delete app
        </SubmitButton>
      </div>
      {state.error && <p className="mt-3 text-sm text-clay">{state.error}</p>}
    </form>
  );
}
