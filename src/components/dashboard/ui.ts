const base =
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:pointer-events-none disabled:opacity-50";

export const button = {
  primary: `${base} h-9 px-4 bg-forest text-white hover:bg-forest-deep`,
  secondary: `${base} h-9 px-4 border border-line-strong bg-card text-ink hover:bg-sunken`,
  ghost: `${base} h-8 px-3 text-muted hover:bg-sunken hover:text-ink`,
  danger: `${base} h-9 px-4 border border-clay/30 bg-card text-clay hover:bg-clay-soft`,
} as const;

export const input =
  "w-full rounded-xl border border-line-strong bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15";

export const label = "mb-1.5 block text-sm font-medium text-ink";

export const card = "rounded-2xl border border-line bg-card";
