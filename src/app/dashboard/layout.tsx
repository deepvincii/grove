import Link from "next/link";
import { connection } from "next/server";
import { Logo } from "@/components/logo";
import { RunnerStatus } from "@/components/dashboard/runner-status";
import { button } from "@/components/dashboard/ui";
import { getHeartbeat, isRunnerOnline } from "@/lib/shared/queries";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  await connection();
  const heartbeat = await getHeartbeat().catch(() => null);

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-5 sm:px-8">
          <Link href="/" aria-label="Grove home" className="rounded-md focus-visible:outline-2 focus-visible:outline-ink">
            <Logo />
          </Link>
          <nav className="hidden text-sm sm:block">
            <Link href="/dashboard" className="font-medium text-ink hover:underline">
              Apps
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-5">
            <RunnerStatus online={isRunnerOnline(heartbeat)} githubUser={heartbeat?.githubUser ?? null} />
            <Link href="/dashboard/new" className={button.primary}>
              New app
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">{children}</main>
    </div>
  );
}
