"use client";

import { useActionState, useMemo, useState } from "react";
import { Check, ChevronRight, Lock, Search } from "lucide-react";
import { SubmitButton } from "@/components/dashboard/submit-button";
import { button, card, input, label } from "@/components/dashboard/ui";
import { cn } from "@/lib/cn";
import { timeAgo } from "@/lib/format";
import type { RepoSummary } from "@/lib/github";
import { normalizeRepo, suggestAppName } from "@/lib/validation";
import { createApp, type FormState } from "../actions";

export function NewAppForm({
  repos,
  repoError,
  signedIn,
}: {
  repos: RepoSummary[];
  repoError: string | null;
  signedIn: boolean;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(createApp, {});
  const [filter, setFilter] = useState("");
  const [repo, setRepo] = useState("");
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [branch, setBranch] = useState("");

  const visibleRepos = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    return repos.filter((r) => r.fullName.toLowerCase().includes(needle)).slice(0, 50);
  }, [repos, filter]);

  function chooseRepo(value: string, defaultBranch?: string) {
    setRepo(value);
    const normalized = normalizeRepo(value);
    if (!nameTouched && normalized) setName(suggestAppName(normalized));
    if (defaultBranch) setBranch(defaultBranch);
  }

  return (
    <form action={formAction} className="mt-8 space-y-6">
      <section className={`${card} p-6`}>
        <h2 className="text-base font-semibold text-ink">Repository</h2>
        {signedIn && repos.length > 0 && (
          <div className="mt-4">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-faint" aria-hidden="true" />
              <input
                type="search"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Search your repositories"
                aria-label="Search your repositories"
                className={cn(input, "pl-10")}
              />
            </div>
            <ul className="mt-3 max-h-72 divide-y divide-line overflow-y-auto rounded-xl border border-line">
              {visibleRepos.map((r) => {
                const selected = normalizeRepo(repo) === r.fullName;
                return (
                  <li key={r.fullName}>
                    <button
                      type="button"
                      onClick={() => chooseRepo(r.fullName, r.defaultBranch)}
                      aria-pressed={selected}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors",
                        selected ? "bg-mint" : "hover:bg-sunken",
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 font-medium text-ink">
                          <span className="truncate">{r.fullName}</span>
                          {r.private && <Lock className="size-3.5 shrink-0 text-faint" aria-label="Private" />}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted" suppressHydrationWarning>
                          {[r.language, r.pushedAt && `pushed ${timeAgo(new Date(r.pushedAt))}`].filter(Boolean).join(" · ") ||
                            "No activity yet"}
                        </span>
                      </span>
                      {selected ? (
                        <Check className="size-4 shrink-0 text-forest" aria-hidden="true" />
                      ) : (
                        <ChevronRight className="size-4 shrink-0 text-faint" aria-hidden="true" />
                      )}
                    </button>
                  </li>
                );
              })}
              {visibleRepos.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">No matching repositories</li>}
            </ul>
          </div>
        )}
        {!signedIn && (
          <p className="mt-2 text-sm text-muted">
            Grove isn&apos;t signed in to GitHub, so only public repositories work. Run{" "}
            <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-xs">gh auth login</code> or set{" "}
            <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-xs">GITHUB_TOKEN</code> to use private ones.
          </p>
        )}
        {repoError && <p className="mt-2 text-sm text-clay">{repoError}</p>}

        <label htmlFor="repo" className={cn(label, "mt-5")}>
          {signedIn && repos.length > 0 ? "Or enter any repository" : "Repository"}
        </label>
        <input
          id="repo"
          name="repo"
          value={repo}
          onChange={(event) => chooseRepo(event.target.value)}
          placeholder="owner/name, or any public Git URL (GitLab, Bitbucket…)"
          autoComplete="off"
          spellCheck={false}
          className={cn(input, "font-mono")}
          required
        />
      </section>

      <section className={`${card} grid gap-5 p-6 sm:grid-cols-2`}>
        <div>
          <label htmlFor="name" className={label}>
            App name
          </label>
          <input
            id="name"
            name="name"
            value={name}
            onChange={(event) => {
              setNameTouched(true);
              setName(event.target.value.toLowerCase());
            }}
            placeholder="my-app"
            autoComplete="off"
            spellCheck={false}
            className={cn(input, "font-mono")}
            required
          />
          <p className="mt-1.5 truncate font-mono text-xs text-muted">http://{name || "my-app"}.localhost</p>
        </div>
        <div>
          <label htmlFor="branch" className={label}>
            Branch
          </label>
          <input
            id="branch"
            name="branch"
            value={branch}
            onChange={(event) => setBranch(event.target.value)}
            placeholder="Default branch"
            autoComplete="off"
            spellCheck={false}
            className={cn(input, "font-mono")}
          />
          <p className="mt-1.5 text-xs text-muted">Pushes to this branch deploy automatically.</p>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-line p-4 sm:col-span-1">
          <input type="checkbox" name="autoDeploy" defaultChecked className="mt-0.5 size-4 accent-forest" />
          <span className="text-sm">
            <span className="block font-medium text-ink">Deploy on every push</span>
            <span className="text-muted">Grove checks GitHub every few seconds.</span>
          </span>
        </label>
        <label className="flex items-start gap-3 rounded-xl border border-line p-4 sm:col-span-1">
          <input type="checkbox" name="postgres" className="mt-0.5 size-4 accent-forest" />
          <span className="text-sm">
            <span className="block font-medium text-ink">Add a Postgres database</span>
            <span className="text-muted">Sets DATABASE_URL and friends for you.</span>
          </span>
        </label>
      </section>

      <section className={`${card} p-6`}>
        <label htmlFor="env" className="text-base font-semibold text-ink">
          Environment variables
        </label>
        <p className="mt-1 text-sm text-muted">Paste a .env file or write KEY=value lines. PORT is set for you.</p>
        <textarea
          id="env"
          name="env"
          rows={5}
          placeholder={"NODE_ENV=production\nJWT_SECRET=change-me"}
          spellCheck={false}
          className={cn(input, "mt-3 font-mono text-[13px] leading-relaxed")}
        />

        <details className="group mt-5">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-ink">
            <ChevronRight className="size-4 transition-transform group-open:rotate-90" aria-hidden="true" />
            Build and start commands
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              { id: "buildCommand", title: "Build command", hint: "npm run build" },
              { id: "startCommand", title: "Start command", hint: "npm start" },
              { id: "releaseCommand", title: "Release command", hint: "npm run migrate" },
            ].map((field) => (
              <div key={field.id}>
                <label htmlFor={field.id} className={label}>
                  {field.title}
                </label>
                <input
                  id={field.id}
                  name={field.id}
                  placeholder={field.hint}
                  spellCheck={false}
                  className={cn(input, "font-mono text-[13px]")}
                />
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            Leave empty to use your package.json scripts. The release command runs before each release, which is
            handy for database migrations.
          </p>
        </details>
      </section>

      {state.error && (
        <p role="alert" className="rounded-xl border border-clay/25 bg-clay-soft px-4 py-3 text-sm whitespace-pre-line text-clay">
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <SubmitButton className={button.primary} pendingLabel="Creating…">
          Deploy {name || "app"}
        </SubmitButton>
      </div>
    </form>
  );
}
