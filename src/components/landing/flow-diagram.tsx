import type { ReactNode } from "react";
import { cn } from "@/lib/web/cn";
import styles from "./flow.module.css";

const W = 150;
const H = 116;

function Frame({ children }: { children?: ReactNode }) {
  return (
    <>
      <rect
        x={0.75}
        y={0.75}
        width={W - 1.5}
        height={H - 1.5}
        rx={6}
        className="fill-card stroke-ink"
        strokeWidth={1.5}
      />
      {children}
    </>
  );
}

function TitleBar({ title }: { title: string }) {
  return (
    <>
      <path d={`M1.5 24H${W - 1.5}`} className="stroke-line-strong" strokeWidth={1.5} />
      <text x={10} y={16} fontSize={9} className="fill-faint font-mono">
        {title}
      </text>
    </>
  );
}

function PushGlyph() {
  return (
    <Frame>
      <TitleBar title="~/docpipeline" />
      <text x={12} y={50} fontSize={12} className="fill-moss font-mono">
        $
      </text>
      <text x={26.4} y={50} fontSize={12} className={cn(styles.command, "fill-ink font-mono")}>
        git push
      </text>
      <g className={styles.cover}>
        <rect x={26} y={39} width={60} height={15} className="fill-card" />
        <rect x={26.5} y={40} width={6.5} height={13} className={cn(styles.caret, "fill-moss")} />
      </g>
      <g className={styles.output}>
        <text x={12} y={74} fontSize={9.5} className="fill-faint font-mono">
          a1c9e2f..7f3b2d1
        </text>
        <text x={12} y={89} fontSize={9.5} className="fill-faint font-mono">
          main -&gt; main
        </text>
      </g>
    </Frame>
  );
}

const layers = [
  { y: 88, label: "node:24", fill: "fill-mint", text: "fill-ink", className: styles.layer1 },
  { y: 66, label: "npm ci", fill: "fill-sage", text: "fill-ink", className: styles.layer2 },
  { y: 44, label: "npm run build", fill: "fill-forest", text: "fill-card", className: styles.layer3 },
];

function BuildGlyph() {
  return (
    <Frame>
      <TitleBar title="docker build" />
      {layers.map((layer) => (
        <g key={layer.label} className={layer.className}>
          <rect
            x={16}
            y={layer.y}
            width={118}
            height={18}
            rx={2}
            className={cn(layer.fill, "stroke-ink")}
            strokeWidth={1.5}
          />
          <text x={24} y={layer.y + 12.5} fontSize={9} className={cn(layer.text, "font-mono")}>
            {layer.label}
          </text>
        </g>
      ))}
    </Frame>
  );
}

function ContainerGlyph() {
  const ribs = Array.from({ length: 9 }, (_, i) => `M${20 + i * 14} 36V78`).join("");
  return (
    <g className={styles.container}>
      <text x={5} y={16} fontSize={9.5} className="fill-ink font-mono">
        docpipeline
      </text>
      <rect x={4.75} y={26.75} width={140.5} height={60.5} rx={3} className={cn(styles.body, "stroke-ink")} strokeWidth={1.5} />
      <path d={ribs} className="stroke-ink" strokeOpacity={0.3} strokeWidth={1.5} />
      <circle cx={9} cy={103} r={3.5} className={styles.runDot} />
      <text x={18} y={106.5} fontSize={9.5} className={cn(styles.waiting, "fill-faint font-mono")}>
        waiting
      </text>
      <text x={18} y={106.5} fontSize={9.5} className={cn(styles.starting, "fill-faint font-mono")}>
        starting
      </text>
      <text x={18} y={106.5} fontSize={9.5} className={cn(styles.running, "font-mono")}>
        running
      </text>
    </g>
  );
}

function BrowserGlyph() {
  return (
    <Frame>
      <rect x={8} y={8} width={134} height={18} rx={3} className="fill-sunken" />
      <circle cx={17} cy={17} r={3} className={styles.urlDot} />
      <text x={25} y={20.2} fontSize={9} className={cn(styles.urlText, "font-mono")}>
        docpipeline.localhost
      </text>
      <g className={styles.page}>
        <rect x={12} y={38} width={62} height={8} rx={1.5} className="fill-ink" />
        <rect x={12} y={55} width={122} height={4} rx={1} className="fill-line-strong" />
        <rect x={12} y={64} width={98} height={4} rx={1} className="fill-line-strong" />
        <rect x={12} y={73} width={110} height={4} rx={1} className="fill-line-strong" />
        <rect x={12} y={89} width={42} height={14} rx={2} className="fill-forest" />
      </g>
    </Frame>
  );
}

const stages = [
  {
    title: "You push",
    body: "Grove sees the new commit within five seconds.",
    Glyph: PushGlyph,
  },
  {
    title: "Docker builds it",
    body: "With your Dockerfile, or one Grove writes for Node.js.",
    Glyph: BuildGlyph,
  },
  {
    title: "A new container starts",
    body: "The old one keeps serving until this one answers.",
    Glyph: ContainerGlyph,
  },
  {
    title: "It’s live",
    body: "docpipeline.localhost now serves the new commit.",
    Glyph: BrowserGlyph,
  },
];

const pulses = [styles.pulse1, styles.pulse2, styles.pulse3];
const columns = [50, 300, 550, 800];

function Connector({ d, index }: { d: string; index: number }) {
  return (
    <>
      <path d={d} fill="none" className="stroke-line-strong" strokeWidth={1.5} strokeDasharray="4 5" />
      <path d={d} pathLength={1} className={cn(styles.pulse, pulses[index])} />
    </>
  );
}

export function FlowDiagram() {
  return (
    <div className={styles.flow}>
      <svg viewBox="0 0 1000 124" aria-hidden="true" className="hidden w-full lg:block">
        {columns.slice(0, -1).map((x, i) => (
          <Connector key={x} d={`M${x + W} 62H${columns[i + 1]}`} index={i} />
        ))}
        {stages.map(({ title, Glyph }, i) => (
          <g key={title} transform={`translate(${columns[i]} 4)`}>
            <Glyph />
          </g>
        ))}
      </svg>
      <ol className="mt-8 hidden grid-cols-4 gap-8 text-center lg:grid">
        {stages.map(({ title, body }) => (
          <li key={title}>
            <p className="font-medium text-ink">{title}</p>
            <p className="mx-auto mt-1.5 max-w-[15rem] text-[15px] leading-relaxed text-muted">{body}</p>
          </li>
        ))}
      </ol>

      <ol className="lg:hidden">
        {stages.map(({ title, body, Glyph }, i) => (
          <li key={title}>
            <div className="flex items-center gap-5">
              <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="w-[150px] shrink-0">
                <Glyph />
              </svg>
              <div className="min-w-0">
                <p className="font-medium text-ink">{title}</p>
                <p className="mt-1 text-[15px] leading-relaxed text-muted">{body}</p>
              </div>
            </div>
            {i < stages.length - 1 ? (
              <svg viewBox="0 0 12 44" aria-hidden="true" className="ml-[69px] h-11 w-3">
                <Connector d="M6 4V40" index={i} />
              </svg>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
