const APP_NAME = /^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$/;
const RESERVED_APP_NAMES = new Set(["grove", "www", "api", "dashboard", "localhost"]);
const REPO = /^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/;
const ENV_KEY = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** Set by Grove itself, or needed by the docker CLI that receives the app's env. */
const RESERVED_ENV_KEYS = new Set(["PORT", "PATH", "HOME", "HOSTNAME"]);

export function appNameError(name: string): string | null {
  if (!APP_NAME.test(name)) {
    return "Use 1–40 lowercase letters, numbers or dashes (it becomes <name>.localhost).";
  }
  if (RESERVED_APP_NAMES.has(name)) return `"${name}" is reserved.`;
  return null;
}

export function suggestAppName(repo: string): string {
  const base = repo.split("/").pop() ?? repo;
  return base
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

/**
 * GitHub repos ("owner/repo" or a github.com URL) become "owner/repo". Repos on other hosts
 * (https://gitlab.com/group/project, bitbucket.org/team/repo, ...) become an https URL.
 */
export function normalizeRepo(input: string): string | null {
  const trimmed = input.trim().replace(/\.git$/, "").replace(/\/+$/, "");
  const github = trimmed.match(/^(?:https?:\/\/)?(?:www\.)?github\.com[/:]([^/]+\/[^/]+)$/i);
  if (github) return REPO.test(github[1]) ? github[1] : null;
  if (REPO.test(trimmed)) return trimmed;

  const other = trimmed.match(/^(?:https:\/\/)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)((?:\/[A-Za-z0-9._~-]+){2,})$/i);
  return other ? `https://${other[1].toLowerCase()}${other[2]}` : null;
}

export function envKeyError(key: string): string | null {
  if (!ENV_KEY.test(key)) return `"${key}" isn't a valid variable name.`;
  if (RESERVED_ENV_KEYS.has(key) || key.startsWith("DOCKER_") || key.startsWith("GROVE_")) {
    return `${key} is managed by Grove.`;
  }
  return null;
}

/**
 * Parses .env style text: KEY=value lines, optional `export`, quotes, and # comments.
 */
export function parseEnvText(text: string): { vars: Record<string, string>; errors: string[] } {
  const vars: Record<string, string> = {};
  const errors: string[] = [];

  text.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    if (!line || line.startsWith("#")) return;
    const match = line.match(/^(?:export\s+)?([^=\s]+)\s*=\s*(.*)$/);
    if (!match) {
      errors.push(`Line ${index + 1}: expected KEY=value`);
      return;
    }
    const [, key, rawValue] = match;
    const keyError = envKeyError(key);
    if (keyError) {
      errors.push(`Line ${index + 1}: ${keyError}`);
      return;
    }
    vars[key] = unquote(rawValue);
  });

  return { vars, errors };
}

function unquote(value: string): string {
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/\\n/g, "\n").replace(/\\"/g, '"');
  }
  if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1);
  }
  const comment = value.search(/\s#/);
  return (comment >= 0 ? value.slice(0, comment) : value).trim();
}

export function formatEnvText(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([key, value]) =>
      /[\s#"'\\]/.test(value) || value === ""
        ? `${key}="${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`
        : `${key}=${value}`,
    )
    .join("\n");
}
