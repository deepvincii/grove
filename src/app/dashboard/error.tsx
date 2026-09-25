"use client";

import { button } from "@/components/dashboard/ui";

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  const databaseDown = /ECONNREFUSED|connect|database/i.test(error.message);
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <h1 className="font-serif text-4xl text-ink">
        {databaseDown ? "Grove can't reach its database" : "Something went wrong"}
      </h1>
      <p className="mt-3 text-muted">
        {databaseDown
          ? "Postgres runs in Docker. Make sure Docker Desktop is open, then start Grove with npm run dev."
          : error.message}
      </p>
      <button type="button" onClick={reset} className={`${button.primary} mt-8`}>
        Try again
      </button>
    </div>
  );
}
