import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getBranchHead, getCommit, getRepo, type BranchHead, type CommitInfo } from "./github";

const execFileAsync = promisify(execFile);

/**
 * Apps store GitHub repos as "owner/name" and repos on any other host as an https URL
 * (for example https://gitlab.com/group/project). Other hosts must be public.
 */
type RepoSource = { kind: "github"; fullName: string } | { kind: "git"; url: string; host: string };

export function parseRepo(repo: string): RepoSource {
  if (repo.startsWith("https://")) return { kind: "git", url: repo, host: new URL(repo).host };
  return { kind: "github", fullName: repo };
}

export function cloneUrl(repo: string): string {
  const source = parseRepo(repo);
  return source.kind === "github" ? `https://github.com/${source.fullName}.git` : `${source.url}.git`;
}

/** Short name for the UI: "owner/name" on GitHub, "host/path" elsewhere. */
export function repoLabel(repo: string): string {
  const source = parseRepo(repo);
  return source.kind === "github" ? source.fullName : source.url.replace("https://", "");
}

export function repoWebUrl(repo: string, branch?: string): string {
  const source = parseRepo(repo);
  if (source.kind === "github") {
    return branch ? `https://github.com/${source.fullName}/tree/${branch}` : `https://github.com/${source.fullName}`;
  }
  if (!branch) return source.url;
  if (source.host.includes("gitlab")) return `${source.url}/-/tree/${branch}`;
  if (source.host === "bitbucket.org") return `${source.url}/src/${branch}`;
  return source.url;
}

export function commitWebUrl(repo: string, sha: string): string {
  const source = parseRepo(repo);
  if (source.kind === "github") return `https://github.com/${source.fullName}/commit/${sha}`;
  if (source.host.includes("gitlab")) return `${source.url}/-/commit/${sha}`;
  if (source.host === "bitbucket.org") return `${source.url}/commits/${sha}`;
  return source.url;
}

async function git(args: string[]): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", args, {
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
      timeout: 20_000,
    });
    return stdout;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/could not read Username|Authentication failed|not found|403|401/i.test(message)) {
      throw new Error("Couldn't read the repository. Outside GitHub, Grove can only deploy public repositories.");
    }
    throw new Error(`git ${args[0]} failed: ${message.split("\n").find((line) => line.startsWith("fatal:")) ?? message}`);
  }
}

async function remoteHead(url: string, branch: string): Promise<string> {
  const out = await git(["ls-remote", "--heads", `${url}.git`, `refs/heads/${branch}`]);
  const sha = out.split(/\s+/)[0];
  if (!sha) throw new Error(`Branch ${branch} not found`);
  return sha;
}

export async function defaultBranch(repo: string): Promise<string> {
  const source = parseRepo(repo);
  if (source.kind === "github") return (await getRepo(source.fullName)).defaultBranch;
  const out = await git(["ls-remote", "--symref", `${source.url}.git`, "HEAD"]);
  const match = out.match(/^ref: refs\/heads\/(\S+)\s+HEAD/m);
  if (!match) throw new Error("Couldn't find the repository's default branch");
  return match[1];
}

/** The branch head for polling. GitHub uses the API with ETags; other hosts use `git ls-remote`. */
export async function branchHead(repo: string, branch: string, etag: string | null): Promise<BranchHead> {
  const source = parseRepo(repo);
  if (source.kind === "github") return getBranchHead(source.fullName, branch, etag);
  return { kind: "head", sha: await remoteHead(source.url, branch), etag: null };
}

/** Latest commit on a branch. Outside GitHub the message and author are filled in after the fetch. */
export async function latestCommit(repo: string, branch: string): Promise<CommitInfo> {
  const source = parseRepo(repo);
  if (source.kind === "github") return getCommit(source.fullName, branch);
  return { sha: await remoteHead(source.url, branch), message: null, author: null };
}

export async function commitInfo(repo: string, sha: string): Promise<CommitInfo | null> {
  const source = parseRepo(repo);
  return source.kind === "github" ? getCommit(source.fullName, sha).catch(() => null) : null;
}
