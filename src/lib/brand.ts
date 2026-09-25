export const brand = {
  name: "Grove",
  tagline: "Push to GitHub. It's live on your Mac.",
  description:
    "A tiny, self-hosted Heroku for Node.js. Grove watches your GitHub repos, builds every push in Docker, and serves it at yourapp.localhost.",
  repoUrl: process.env.NEXT_PUBLIC_REPO_URL ?? "https://github.com/deepvincii/grove",
} as const;
