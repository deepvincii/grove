// Next.js loads .env files on its own; the runner and scripts import this first to do the same.
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // Both files are optional.
  }
}
