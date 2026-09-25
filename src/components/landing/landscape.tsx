import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./landing.module.css";

const WIDTH = 2400;
const HEIGHT = 720;
const OVERSCAN = 120;

type Fn = (x: number) => number;
type Bump = [center: number, width: number, height: number];
type Wave = [amplitude: number, period: number, phase: number];
type Span = [from: number, to: number, gap: number];

const { round } = Math;

function join(values: number[]): string {
  return values.reduce<string>((out, value, i) => out + (i > 0 && value >= 0 ? " " : "") + value, "");
}

function terrain(base: number, bumps: Bump[], waves: Wave[] = []): Fn {
  return (x) =>
    base -
    bumps.reduce((y, [c, w, h]) => y + h * Math.exp(-(((x - c) / w) ** 2)), 0) +
    waves.reduce((y, [a, p, phase]) => y + a * Math.sin((x / p) * Math.PI * 2 + phase), 0);
}

function silhouette(fn: Fn, step = 40): string {
  const points: Array<[number, number]> = [];
  for (let x = -OVERSCAN; x <= WIDTH + OVERSCAN; x += step) points.push([x, fn(x)]);

  let [px, py] = [points[0][0], round(points[0][1])];
  let d = `M${join([px, py])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[Math.max(i - 1, 0)];
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const [x3, y3] = points[Math.min(i + 2, points.length - 1)];
    const [ex, ey] = [x2, round(y2)];
    d += `c${join([
      round(x1 + (x2 - x0) / 6) - px,
      round(y1 + (y2 - y0) / 6) - py,
      round(x2 - (x3 - x1) / 6) - px,
      round(y2 - (y3 - y1) / 6) - py,
      ex - px,
      ey - py,
    ])}`;
    [px, py] = [ex, ey];
  }
  return `${d}V${HEIGHT}H${-OVERSCAN}Z`;
}

function seeded(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pine(x: number, y: number, h: number, w: number): string {
  const half = Math.max(1, round(w / 2));
  const height = round(h);
  const [a, b, c] = [round(w * 0.14), round(h * 0.36), round(h * 0.8)];
  return (
    `M${join([round(x), round(y) - height])}` +
    `c${join([a, b, half, c, half, height])}h${-2 * half}` +
    `c${join([0, c - height, half - a, b - height, half, -height])}z`
  );
}

function circle(cx: number, cy: number, radius: number): string {
  const r = Math.max(1, round(radius));
  return `M${join([round(cx) - r, round(cy)])}a${r} ${r} 0 1 1 ${2 * r} 0a${r} ${r} 0 1 1${-2 * r} 0z`;
}

function broadleaf(x: number, y: number, h: number): string {
  const r = h * 0.34;
  return (
    circle(x, y - h * 0.62, r) +
    circle(x - r * 0.78, y - h * 0.4, r * 0.76) +
    circle(x + r * 0.82, y - h * 0.44, r * 0.7)
  );
}

function forest(
  ground: Fn,
  options: { seed: number; spans: Span[]; height: [number, number]; sink: number; broadleaf?: number },
): string {
  const rand = seeded(options.seed);
  const [min, max] = options.height;
  let d = "";
  for (const [from, to, gap] of options.spans) {
    for (let x = from + rand() * gap; x < to; x += gap * (0.35 + rand() * 1.1)) {
      const h = min + (max - min) * rand() ** 1.4;
      const y = ground(x) + options.sink;
      d +=
        rand() < (options.broadleaf ?? 0)
          ? broadleaf(x, y, h * 0.8)
          : pine(x, y, h, h * (0.3 + rand() * 0.12));
    }
  }
  return d;
}

const farRange = terrain(330, [
  [240, 230, 150],
  [640, 190, 120],
  [930, 260, 96],
  [1320, 240, 110],
  [1700, 170, 168],
  [2020, 250, 196],
  [2380, 200, 120],
]);

const nearRange = terrain(372, [
  [90, 220, 118],
  [480, 260, 132],
  [1040, 210, 70],
  [1480, 280, 84],
  [1880, 230, 122],
  [2300, 260, 148],
]);

const farHills = terrain(372, [[1200, 520, -14]], [
  [12, 820, 0.4],
  [7, 360, 2.1],
]);

const midHill = terrain(
  428,
  [
    [330, 420, 44],
    [1200, 520, -18],
    [2080, 440, 52],
  ],
  [[7, 540, 1.2]],
);

const nearHill = terrain(
  532,
  [
    [520, 460, 78],
    [1200, 460, -16],
    [1880, 400, 60],
  ],
  [[6, 480, 0.3]],
);

const foreground = terrain(
  648,
  [
    [280, 360, 118],
    [1200, 560, -20],
    [2140, 380, 104],
  ],
  [[5, 420, 2.4]],
);

const layers = {
  far: silhouette(farRange, 20),
  near: silhouette(nearRange, 20),
  farHills: silhouette(farHills),
  farHillTrees: forest(farHills, {
    seed: 7,
    spans: [
      [120, 760, 30],
      [760, 1560, 34],
      [1560, 2300, 30],
    ],
    height: [12, 26],
    sink: 6,
    broadleaf: 0.3,
  }),
  midHill: silhouette(midHill),
  midHillTrees: forest(midHill, {
    seed: 21,
    spans: [
      [-60, 860, 20],
      [860, 1540, 58],
      [1540, 2460, 20],
    ],
    height: [22, 52],
    sink: 10,
    broadleaf: 0.22,
  }),
  nearHill: silhouette(nearHill),
  nearHillTrees: forest(nearHill, {
    seed: 3,
    spans: [
      [300, 700, 34],
      [1740, 2000, 34],
    ],
    height: [34, 70],
    sink: 12,
    broadleaf: 0.5,
  }),
  foreground: silhouette(foreground),
  foregroundTrees: forest(foreground, {
    seed: 11,
    spans: [
      [60, 470, 44],
      [1960, 2360, 44],
    ],
    height: [70, 150],
    sink: 16,
  }),
  mistHigh: silhouette(terrain(338, [], [[8, 600, 0.8]])),
  mistMid: silhouette(terrain(404, [], [[7, 520, 2.2]])),
  mistLow: silhouette(terrain(470, [[1200, 520, -12]], [[6, 460, 0.1]])),
};

function Layer({ index, children }: { index: number; children: ReactNode }) {
  return (
    <g className={styles.layer} style={{ "--i": index } as CSSProperties}>
      {children}
    </g>
  );
}

export function Landscape({
  className,
  variant = "full",
}: {
  className?: string;
  variant?: "full" | "ridge";
}) {
  const ridge = variant === "ridge";
  const top = ridge ? 300 : 0;

  return (
    <svg
      viewBox={`0 ${top} ${WIDTH} ${HEIGHT - top}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
      className={cn("block", className)}
    >
      {ridge ? null : (
        <>
          <Layer index={0}>
            <circle cx="1850" cy="112" r="104" fill="#fff" fillOpacity="0.14" />
            <circle cx="1850" cy="112" r="78" fill="#fff" fillOpacity="0.22" />
            <circle cx="1850" cy="112" r="54" fill="#fcfcf5" />
          </Layer>
          <Layer index={1}>
            <path d={layers.far} fill="#dfe7da" />
          </Layer>
          <Layer index={2}>
            <path d={layers.near} fill="#cfdbc9" />
            <path d={layers.mistHigh} fill="#fff" fillOpacity="0.5" />
          </Layer>
          <Layer index={3}>
            <path d={layers.farHillTrees} fill="#b8cbb1" />
            <path d={layers.farHills} fill="#b8cbb1" />
            <path d={layers.mistMid} fill="#fff" fillOpacity="0.38" />
          </Layer>
        </>
      )}
      <Layer index={4}>
        <path d={layers.midHillTrees} fill="#9cb996" />
        <path d={layers.midHill} fill="#9cb996" />
        <path d={layers.mistLow} fill="#fff" fillOpacity="0.3" />
      </Layer>
      <Layer index={5}>
        <path d={layers.nearHillTrees} fill="#7fa37c" />
        <path d={layers.nearHill} fill="#7fa37c" />
      </Layer>
      <Layer index={6}>
        <path d={layers.foregroundTrees} fill="#517f5b" />
        <path d={layers.foreground} fill="#628f68" />
      </Layer>
    </svg>
  );
}
