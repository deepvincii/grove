import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = "center",
}: {
  id: string;
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      <p className="text-[13px] font-medium tracking-[0.08em] text-moss uppercase">{eyebrow}</p>
      <h2
        id={id}
        className="mt-4 font-serif text-[40px] leading-[1.04] tracking-[-0.01em] text-balance text-ink sm:text-5xl lg:text-[56px]"
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-5 text-[17px] leading-relaxed text-muted",
            align === "center" ? "text-balance" : "text-pretty",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
