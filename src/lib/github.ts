import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type TokenSource = "env" | "gh" | "none";

let ghTokenCache: { token: string | null; at: number } | null = null;

/** Uses GITHUB_TOKEN when set, otherwise borrows the GitHub CLI's login (`gh auth token`). */
export async function getGitHubToken(): Promise<{ token: string | null; source: TokenSource }> {
  const fromEnv = process.env.GITHUB_TOKEN?.trim();
  if (fromEnv) return { token: fromEnv, source: "env" };

  if (!ghTokenCache || Date.now() - ghTokenCache.at > 5 * 60_000) {
    try {
      const { stdout } = await execFileAsync("gh", ["auth", "token"], { timeout: 5000 });
      ghTokenCache = { token: stdout.trim() || null, at: Date.now() };
    } catch {
      ghTokenCache = { token: null, at: Date.now() };
    }
  }
  return ghTokenCache.token
    ? { token: ghTokenCache.token, source: "gh" }
    : { token: null, source: "none" };
}

export class GitHubError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAt: Date | null = null,
  ) {
    super(message);
  }
}

async function request(
  path: string,
  { accept = "application/vnd.github+json", etag }: { accept?: string; etag?: string | null } = {},
): Promise<Response> {
  const { token } = await getGitHubToken();
  const headers: Record<string, string> = {
    Accept: accept,
    "User-Agent": "grove-local",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (etag) headers["If-None-Match"] = etag;

  const response = await fetch(`https://api.github.com${path}`, {
    headers,
    signal: AbortSignal.timeout(15_000),
  });
  if (response.ok || response.status === 304) return response;

  const rateLimited =
    response.status === 429 ||
    (response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0");
  if (rateLimited) {
    const reset = Number(response.headers.get("x-ratelimit-reset"));
    const retryAt = Number.isFinite(reset) && reset > 0 ? new Date(reset * 1000) : null;
    throw new GitHubError("GitHub API rate limit reached", response.status, retryAt);
  }
  if (response.status === 404) {
    throw new GitHubError(
      token ? "Repository or branch not found (or your token can't see it)" : "Repository or branch not found. Private repos need a GitHub token.",
      404,
    );
  }
  if (response.status === 422) throw new GitHubError("Branch or commit not found", 422);
  if (response.status === 401) throw new GitHubError("GitHub rejected the token", 401);
  throw new GitHubError(`GitHub API error ${response.status}`, response.status);
}

export interface RepoSummary {
  fullName: string;
  private: boolean;
  defaultBranch: string;
  description: string | null;
  language: string | null;
  pushedAt: string | null;
}

interface ApiRepo {
  full_name: string;
  private: boolean;
  default_branch: string;
  description: string | null;
  language: string | null;
  pushed_at: string | null;
}

function toRepoSummary(repo: ApiRepo): RepoSummary {
  return {
    fullName: repo.full_name,
    private: repo.private,
    defaultBranch: repo.default_branch,
    description: repo.description,
    language: repo.language,
    pushedAt: repo.pushed_at,
  };
}

export async function getViewerLogin(): Promise<string | null> {
  const { token } = await getGitHubToken();
  if (!token) return null;
  const response = await request("/user");
  const user = (await response.json()) as { login: string };
  return user.login;
}

export async function listRepos(): Promise<RepoSummary[]> {
  const response = await request(
    "/user/repos?per_page=100&sort=pushed&affiliation=owner,collaborator,organization_member",
  );
  return ((await response.json()) as ApiRepo[]).map(toRepoSummary);
}

export async function getRepo(fullName: string): Promise<RepoSummary> {
  const response = await request(`/repos/${fullName}`);
  return toRepoSummary((await response.json()) as ApiRepo);
}

export type BranchHead =
  | { kind: "unchanged" }
  | { kind: "head"; sha: string; etag: string | null };

/**
 * Cheap polling: asks only for the SHA and sends the previous ETag, so an unchanged
 * branch costs a 304 that doesn't count against the rate limit.
 */
export async function getBranchHead(repo: string, branch: string, etag: string | null): Promise<BranchHead> {
  const response = await request(`/repos/${repo}/commits/${encodeURIComponent(branch)}`, {
    accept: "application/vnd.github.sha",
    etag,
  });
  if (response.status === 304) return { kind: "unchanged" };
  const sha = (await response.text()).trim();
  return { kind: "head", sha, etag: response.headers.get("etag") };
}

export interface CommitInfo {
  sha: string;
  message: string | null;
  author: string | null;
}

export async function getCommit(repo: string, ref: string): Promise<CommitInfo> {
  const response = await request(`/repos/${repo}/commits/${encodeURIComponent(ref)}`);
  const commit = (await response.json()) as {
    sha: string;
    commit: { message: string; author: { name: string } | null };
    author: { login: string } | null;
  };
  return {
    sha: commit.sha,
    message: commit.commit.message.split("\n")[0],
    author: commit.author?.login ?? commit.commit.author?.name ?? null,
  };
}
