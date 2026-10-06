/**
 * Landing-only mode serves just the marketing page (for example on Vercel).
 * The dashboard needs Docker and Postgres, so it only runs on a local install.
 */
export function isLandingOnly(): boolean {
  const flag = process.env.LANDING_ONLY?.trim().toLowerCase();
  if (flag) return flag === "1" || flag === "true";
  return process.env.VERCEL === "1";
}
