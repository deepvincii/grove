import { connection } from "next/server";
import { getGitHubToken, listRepos, type RepoSummary } from "@/lib/github";
import { NewAppForm } from "./new-app-form";

export const metadata = { title: "New app" };

export default async function NewAppPage() {
  await connection();
  const { token } = await getGitHubToken();
  let repos: RepoSummary[] = [];
  let repoError: string | null = null;
  if (token) {
    try {
      repos = await listRepos();
    } catch (error) {
      repoError = error instanceof Error ? error.message : "Couldn't load your repositories";
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-serif text-4xl tracking-tight text-ink sm:text-5xl">Deploy a new app</h1>
      <p className="mt-2 text-muted">
        Pick a repository. Grove builds its latest commit now, then redeploys on every push.
      </p>
      <NewAppForm repos={repos} repoError={repoError} signedIn={Boolean(token)} />
    </div>
  );
}
