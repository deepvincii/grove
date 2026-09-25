import Link from "next/link";
import { connection } from "next/server";
import { Plus } from "lucide-react";
import { Logo } from "@/components/logo";
import { RunnerStatus } from "@/components/dashboard/runner-status";
import { button } from "@/components/dashboard/ui";
import { getHeartbeat, isRunnerOnline } from "@/lib/queries";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  await connection();
  const heartbeat = await getHeartbeat().catch(() => null);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5 sm:px-8">
          <Link href="/" aria-label="Grove home" className="rounded-lg focus-visible:outline-2 focus-visible:outline-forest">
            <Logo />
          </Link>
          <nav className="hidden text-sm sm:block">
            <Link href="/dashboard" className="rounded-full px-3 py-1.5 font-medium text-ink hover:bg-sunken">
              Apps
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <RunnerStatus online={isRunnerOnline(heartbeat)} githubUser={heartbeat?.githubUser ?? null} />
            <Link href="/dashboard/new" className={button.primary}>
              <Plus className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">New app</span>
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">{children}</main>
    </div>
  );
}
