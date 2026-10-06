const base =
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:pointer-events-none disabled:opacity-50";

// Buttons are either solid or transparent: no gradients, no tinted borders, no shadows.
export const button = {
  primary: `${base} h-9 px-4 bg-forest text-white hover:bg-forest-deep`,
  secondary: `${base} h-9 px-4 border border-line-strong text-ink hover:border-ink`,
  ghost: `${base} h-8 px-2 text-muted hover:text-ink`,
  danger: `${base} h-9 px-4 bg-clay text-white hover:bg-[#963826]`,
} as const;

export const input =
  "w-full rounded-md border border-line-strong bg-card px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-ink focus:outline-none";

export const label = "mb-1.5 block text-sm font-medium text-ink";

export const card = "rounded-lg border border-line bg-card";
