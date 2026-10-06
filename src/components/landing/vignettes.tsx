import { cn } from "@/lib/web/cn";
import styles from "./vignettes.module.css";

const commits = [
  { x: 112, hash: "3e1a9c0", message: "first deploy" },
  { x: 200, hash: "8b27d41", message: "fix totals" },
  { x: 288, hash: "c04f6e2", message: "faster list" },
  { x: 376, hash: "7f3b2d1", message: "pdf export" },
];

function DeployTag({ x, label, className, dot, node }: { x: number; label: string; className: string; dot: string; node: string }) {
  return (
    <g className={className}>
      <path d={`M${x} 97V131`} className="stroke-line-strong" strokeWidth={1.5} />
      <rect x={x - 39} y={70.75} width={78} height={26.5} rx={4} className="fill-card stroke-line-strong" strokeWidth={1.5} />
      <circle cx={x - 26} cy={84} r={3.5} className={dot} />
      <text x={x - 17} y={88} fontSize={11.5} className="fill-ink">
        {label}
      </text>
      <circle cx={x} cy={138} r={6.5} className={node} strokeWidth={1.5} />
    </g>
  );
}

export function DeploysVignette() {
  return (
    <svg viewBox="0 40 440 176" aria-hidden="true" className="block w-full">
      <rect width={440} height={240} className="fill-card" />
      <g className={styles.deployScene}>
        <text x={24} y={142} fontSize={11} className="fill-muted font-mono">
          main
        </text>
        <path d="M68 138H420" className="stroke-ink" strokeWidth={1.5} />
        {commits.map((commit) => (
          <g key={commit.hash}>
            <circle cx={commit.x} cy={138} r={6.5} className="fill-card stroke-ink" strokeWidth={1.5} />
            <text x={commit.x} y={166} textAnchor="middle" fontSize={10.5} className="fill-faint font-mono">
              {commit.hash}
            </text>
            <text x={commit.x} y={183} textAnchor="middle" fontSize={11.5} className="fill-muted">
              {commit.message}
            </text>
          </g>
        ))}
        <rect x={156} y={122} width={300} height={74} className={cn(styles.deployWipe, "fill-card")} />
        <DeployTag
          x={200}
          label="building"
          className={styles.deployBuilding}
          dot={cn(styles.blink, "fill-amber")}
          node="fill-amber-soft stroke-amber"
        />
        <DeployTag x={112} label="live" className={styles.deployLive} dot="fill-leaf" node="fill-leaf stroke-ink" />
      </g>
    </svg>
  );
}

const releases = [
  { version: "v18", hash: "7f3b2d1", message: "Add PDF export" },
  { version: "v17", hash: "c04f6e2", message: "Speed up invoice list" },
  { version: "v16", hash: "8b27d41", message: "Fix totals rounding" },
  { version: "v15", hash: "3e1a9c0", message: "First deploy" },
];

export function RollbackVignette() {
  return (
    <svg viewBox="0 16 440 208" aria-hidden="true" className="block w-full">
      <rect width={440} height={240} className="fill-card" />
      <g className={styles.rbScene}>
        <path d="M44 72H416M44 120H416M44 168H416" className="stroke-line" strokeWidth={1} />
        {releases.map((release, i) => {
          const y = 48 + i * 48;
          return (
            <g key={release.version}>
              <circle cx={50} cy={y} r={4.5} className="fill-line-strong" />
              <text x={66} y={y + 4.5} fontSize={12.5} fontWeight={500} className="fill-ink">
                {release.version}
              </text>
              <text x={102} y={y + 4} fontSize={11} className="fill-faint font-mono">
                {release.hash}
              </text>
              <text x={168} y={y + 4.5} fontSize={12} className="fill-muted">
                {release.message}
              </text>
            </g>
          );
        })}
        <text x={416} y={52.5} textAnchor="end" fontSize={12} className={cn(styles.rbReplaced, "fill-faint")}>
          replaced
        </text>
        <path d="M37 52C20 76 20 120 37 142" pathLength={1} className={styles.rbArrow} />
        <path d="M29.5 139.5L37 142.5L38.5 134.5" className={cn(styles.rbArrowHead, "stroke-forest")} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <g className={styles.rbButton}>
          <rect x={332.75} y={131.75} width={83.5} height={24.5} rx={5} className="fill-card stroke-line-strong" strokeWidth={1.5} />
          <text x={374.5} y={148} textAnchor="middle" fontSize={11.5} className="fill-ink">
            Roll back
          </text>
        </g>
        <g className={styles.rbMarker}>
          <circle cx={50} cy={48} r={4.5} className="fill-leaf" />
          <text x={416} y={52.5} textAnchor="end" fontSize={12} fontWeight={500} className="fill-forest">
            live
          </text>
        </g>
        <path
          d="M0 0V15L4 11.4L6.9 17.6L9.5 16.4L6.7 10.4H11.8Z"
          className={cn(styles.rbCursor, "fill-ink stroke-card")}
          strokeWidth={1}
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

function Slab({ y, top, side, className }: { y: number; top: string; side: string; className: string }) {
  return (
    <g className={className} strokeWidth={1.5} strokeLinejoin="round">
      <path d={`M10 ${y + 11}L32 ${y + 22}V${y + 27}L10 ${y + 16}Z`} className={cn(side, "stroke-ink")} />
      <path d={`M32 ${y + 22}L54 ${y + 11}V${y + 16}L32 ${y + 27}Z`} className={cn(side, "stroke-ink")} />
      <path d={`M32 ${y}L54 ${y + 11}L32 ${y + 22}L10 ${y + 11}Z`} className={cn(top, "stroke-ink")} />
    </g>
  );
}

export function LayersVignette() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="size-16 shrink-0">
      <Slab y={33} top="fill-mint" side="fill-[#c9d8c4]" className={styles.slab1} />
      <Slab y={23} top="fill-sage" side="fill-[#8ea886]" className={styles.slab2} />
      <Slab y={13} top="fill-moss" side="fill-forest" className={styles.slab3} />
    </svg>
  );
}

const logLines = [26, 18, 32, 22, 14, 30, 20, 34, 16];

export function LogsVignette() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="size-16 shrink-0">
      <rect x={5.75} y={8.75} width={52.5} height={46.5} rx={4} className="fill-card stroke-ink" strokeWidth={1.5} />
      <svg x={12} y={15} width={40} height={34} viewBox="0 0 40 34">
        <g className={styles.logLines}>
          {logLines.map((width, i) => (
            <rect
              key={i}
              x={0}
              y={3 + i * 7}
              width={width}
              height={3}
              rx={1.5}
              className={i === logLines.length - 1 ? "fill-leaf" : i % 3 === 1 ? "fill-faint" : "fill-line-strong"}
            />
          ))}
        </g>
      </svg>
    </svg>
  );
}

const keyWidths = [16, 20, 12];

export function SecretsVignette() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="size-16 shrink-0">
      {keyWidths.map((width, i) => (
        <rect key={i} x={6} y={17 + i * 12} width={width} height={6} rx={1.5} className="fill-ink" />
      ))}
      <path d="M32 20H56.5M32 44H56.5" className={styles.dots} />
      <rect x={30} y={29} width={27} height={6} rx={1.5} className={cn(styles.secretValue, "fill-moss")} />
      <path d="M32 32H56.5" className={cn(styles.dots, styles.secretDots)} />
    </svg>
  );
}

export function PostgresVignette() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="size-16 shrink-0">
      <path d="M15 14V43A17 5.5 0 0 0 49 43V14" className="fill-card stroke-ink" strokeWidth={1.5} />
      <path d="M15 27A17 5.5 0 0 0 49 27" fill="none" className="stroke-ink" strokeOpacity={0.35} strokeWidth={1.5} />
      <ellipse cx={32} cy={14} rx={17} ry={5.5} className="fill-mint stroke-ink" strokeWidth={1.5} />
      <g className={styles.pgCounter}>
        <text x={19.25} y={40.5} fontSize={8.5} className="fill-ink font-mono">
          1,20
        </text>
        <svg x={39.65} y={32.5} width={5.2} height={10.5} viewBox="0 0 5.2 10.5">
          <g className={styles.pgDigits}>
            {[4, 5, 6, 7, 8, 9].map((digit, i) => (
              <text key={digit} x={0} y={8 + i * 10.5} fontSize={8.5} className="fill-ink font-mono">
                {digit}
              </text>
            ))}
          </g>
        </svg>
      </g>
    </svg>
  );
}
