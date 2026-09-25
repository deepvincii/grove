import { brand } from "@/lib/brand";
import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-7 shrink-0", className)}>
      <rect width="32" height="32" rx="9" fill="#1e4d36" />
      <path d="M16 25.5V15" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M16 16.5c0-5 3.1-8.3 8.6-8.8.4 5.5-3 8.8-8.6 8.8Z" fill="#fff" />
      <path d="M16 19.5c0-4-2.7-6.6-7-6.9-.3 4.3 2.4 6.9 7 6.9Z" fill="#fff" fillOpacity=".72" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-[17px] font-semibold tracking-tight text-ink",
        className,
      )}
    >
      <LogoMark />
      {brand.name}
    </span>
  );
}
