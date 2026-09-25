import { Box, GitBranch, Globe } from "lucide-react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import styles from "./deploy-card.module.css";

const pill = "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap";

export function DeployCard({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <div
      role="img"
      aria-label="Example deploy: after git push origin main, docpipeline goes from queued to building to live at docpipeline.localhost."
      className={cn(
        styles.card,
        "overflow-hidden rounded-2xl border border-line bg-card text-left shadow-[0_1px_2px_rgb(19_36_27/0.05),0_18px_40px_-20px_rgb(19_36_27/0.3)]",
        className,
      )}
      style={{ "--loop-delay": `${delay}s` } as CSSProperties}
    >
      <div className="flex h-11 items-center border-b border-line px-4 font-mono text-[13px] sm:h-12 sm:px-5 sm:text-sm">
        <span className="text-moss">$</span>
        <span className="ml-2 inline-flex items-center text-ink">
          <span className={styles.typed}>git push origin main</span>
          <span className={styles.caret} />
        </span>
        <span className="ml-auto hidden text-xs text-faint sm:block">~/code/docpipeline</span>
      </div>

      <div className="px-4 pt-4 pb-3.5 sm:px-5 sm:pt-5 sm:pb-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-mint text-forest">
            <Box className="size-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-medium text-ink sm:text-base">docpipeline</span>
              <span className="inline-flex h-5 items-center gap-1 rounded-md border border-line bg-sunken px-1.5 font-mono text-[11px] text-muted">
                <GitBranch className="size-3" />
                main
              </span>
            </div>
            <div className={cn(styles.stack, "mt-0.5 text-[13px] text-muted sm:text-sm")}>
              <p className={cn(styles.idle, "truncate")}>Waiting for a push to main</p>
              <p className={cn(styles.commit, "truncate")}>
                <span className="font-mono text-faint">7f3b2d1</span> Add PDF export
              </p>
            </div>
          </div>
          <div className={cn(styles.stack, "items-center justify-items-end")}>
            <span className={cn(styles.idle, pill, "bg-sunken text-muted")}>
              <span className="size-1.5 rounded-full bg-sage" />
              Watching
            </span>
            <span className={cn(styles.queued, pill, "bg-sunken text-muted")}>
              <span className="size-1.5 rounded-full border border-faint" />
              Queued
            </span>
            <span className={cn(styles.building, pill, "bg-amber-soft text-amber")}>
              <span className={styles.spinner} />
              Building
            </span>
            <span className={cn(styles.live, pill, "bg-mint text-forest")}>
              <span className="relative size-1.5">
                <span className={cn(styles.ping, "absolute inset-0 rounded-full bg-leaf")} />
                <span className="absolute inset-0 rounded-full bg-leaf" />
              </span>
              Live
            </span>
          </div>
        </div>

        <div className="mt-4 h-1 overflow-hidden rounded-full bg-sunken">
          <div className={cn(styles.progress, "h-full rounded-full")} />
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 font-mono text-xs sm:text-[13px]">
          <span className={cn(styles.url, "inline-flex min-w-0 items-center gap-1.5")}>
            <Globe className="size-3.5 shrink-0" />
            <span className="truncate">docpipeline.localhost</span>
          </span>
          <span className="hidden shrink-0 text-faint sm:block">
            <span className={cn(styles.stack, "justify-items-end")}>
              <span className={styles.queued}>Commit detected</span>
              <span className={styles.clone}>Cloning 7f3b2d1</span>
              <span className={styles.build}>npm run build</span>
              <span className={styles.start}>Starting container</span>
              <span className={styles.live}>Ready in 38s</span>
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
