import { cn } from "@/lib/web/cn";
import styles from "./commit-branch.module.css";

type Point = [number, number];

// Each commit is a node on the branch; its row of text lines up with it on the left.
const NODES: Point[] = [
  [486, 96],
  [450, 196],
  [412, 296],
  [370, 396],
];
const BRANCH: Point[] = [[568, -40], [528, 24], ...NODES, [384, 452]];

const COMMITS = [
  { hash: "3e1a9c0", message: "First deploy", tilt: -10, fill: "#7aa27a" },
  { hash: "9c21824", message: "Add share links", tilt: 8, fill: "#5f8f64" },
  { hash: "7f3b2d1", message: "Add PDF export", tilt: -4, fill: "#4d7d57" },
  { hash: "c8f915f", message: "Fix invoice totals", tilt: 12, fill: "#3f7a55" },
];

const LEAF = "M0 0C14-15 44-17 64-2C47 12 16 13 0 0Z";
const RIB = "M5 0Q32-4 58-2";
const BARK = "#5f5243";

/** A smooth curve through the points (Catmull-Rom as cubic Béziers). */
function smooth(points: Point[]): string {
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[Math.max(i - 1, 0)];
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const [x3, y3] = points[Math.min(i + 2, points.length - 1)];
    const c1 = [x1 + (x2 - x0) / 6, y1 + (y2 - y0) / 6].map(Math.round);
    const c2 = [x2 - (x3 - x1) / 6, y2 - (y3 - y1) / 6].map(Math.round);
    d += `C${c1.join(" ")} ${c2.join(" ")} ${x2} ${y2}`;
  }
  return d;
}

function Leaf({ node: [x, y], tilt, fill, className }: { node: Point; tilt: number; fill: string; className?: string }) {
  return (
    <g transform={`translate(${x + 18} ${y + 6}) rotate(${tilt}) scale(1.25)`}>
      <g className={className}>
        <path d={LEAF} fill={fill} />
        <path d={RIB} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={1.5} strokeLinecap="round" />
      </g>
    </g>
  );
}

/**
 * The hero illustration: `git log` drawn as a branch. The newest commit goes through a deploy
 * (push, building, live) while the one before it is marked replaced.
 */
export function CommitBranch({ className }: { className?: string }) {
  const newest = NODES.length - 1;
  return (
    <svg viewBox="0 0 580 470" aria-hidden="true" focusable="false" className={cn("block h-auto w-full", styles.branch, className)}>
      <text x={506} y={34} textAnchor="end" fontSize={15} className="fill-faint font-mono">
        main
      </text>
      <path d={smooth(BRANCH)} fill="none" stroke={BARK} strokeWidth={9} strokeLinecap="round" />

      {COMMITS.map((commit, i) => {
        const [x, y] = NODES[i];
        return (
          <g key={commit.hash}>
            <line x1={x} y1={y} x2={x + 19} y2={y + 6} stroke={BARK} strokeWidth={3.5} strokeLinecap="round" />
            <Leaf
              node={NODES[i]}
              tilt={commit.tilt}
              fill={commit.fill}
              className={i === newest ? styles.newestLeaf : cn(styles.sway, styles[`sway${i}`])}
            />
            <line x1={292} y1={y} x2={x - 18} y2={y} className="stroke-line-strong" strokeWidth={1.5} strokeDasharray="2 6" strokeLinecap="round" />
            <text y={y + 6} fontSize={18}>
              <tspan x={0} fontSize={16} className="fill-faint font-mono">
                {commit.hash}
              </tspan>
              <tspan x={90} className="fill-ink font-sans">
                {commit.message}
              </tspan>
            </text>
          </g>
        );
      })}

      {NODES.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={8.5}
          fill="#f7f7f2"
          stroke={BARK}
          strokeWidth={3.5}
          className={i === newest ? styles.newestNode : undefined}
        />
      ))}
      <circle cx={NODES[newest][0]} cy={NODES[newest][1]} r={8.5} fill="none" stroke="#3f7a55" strokeWidth={2} className={styles.ring} />

      {/* The commit before the newest: live until the new one takes over. */}
      <g fontSize={14} className="font-mono">
        <text x={90} y={NODES[2][1] + 32} className={styles.prevLive}>
          <tspan className="fill-leaf">●</tspan>
          <tspan className="fill-muted"> live</tspan>
        </text>
        <text x={90} y={NODES[2][1] + 32} className={cn(styles.prevReplaced, "fill-faint")}>
          replaced
        </text>
      </g>

      {/* The newest commit's deploy. */}
      <g fontSize={14} className="font-mono">
        <text x={90} y={NODES[newest][1] + 32} className={cn(styles.push, "fill-ink")}>
          $ git push<tspan className={styles.caret}>▍</tspan>
        </text>
        <text x={90} y={NODES[newest][1] + 32} className={styles.building}>
          <tspan className="fill-amber">●</tspan>
          <tspan className="fill-muted"> building…</tspan>
        </text>
        <text x={90} y={NODES[newest][1] + 32} className={styles.live}>
          <tspan className="fill-leaf">●</tspan>
          <tspan className="fill-forest"> live at docpipeline.localhost</tspan>
        </text>
      </g>
    </svg>
  );
}
