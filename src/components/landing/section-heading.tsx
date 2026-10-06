import type { ReactNode } from "react";

export function SectionHeading({
  id,
  title,
  description,
}: {
  id: string;
  title: ReactNode;
  description?: ReactNode;
}) {
  return (
    <div className="max-w-2xl">
      <h2
        id={id}
        className="font-serif text-[32px] leading-[1.15] tracking-[-0.015em] text-balance text-ink sm:text-[42px]"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-[17px] leading-relaxed text-pretty text-muted">{description}</p>
      ) : null}
    </div>
  );
}
