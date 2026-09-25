import {
  Container,
  Database,
  GitBranch,
  KeyRound,
  RotateCcw,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import { SectionHeading } from "./section-heading";

const features: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: GitBranch,
    title: "Auto-deploy on every push",
    body: "Grove checks your branch through the GitHub API and ships each new commit on its own.",
  },
  {
    icon: Container,
    title: "Docker builds, no Dockerfile",
    body: "Bring your own Dockerfile, or let Grove generate one for any Node.js app.",
  },
  {
    icon: ScrollText,
    title: "Live build logs",
    body: "Follow every build step as it streams in, so a failed deploy is never a mystery.",
  },
  {
    icon: KeyRound,
    title: "Environment variables",
    body: "Keep config and secrets per app. They are injected when the container starts.",
  },
  {
    icon: Database,
    title: "One-click Postgres",
    body: "Give any app its own Postgres database with a single click. No setup required.",
  },
  {
    icon: RotateCcw,
    title: "Instant rollbacks",
    body: "Push broke something? Redeploy any previous commit in one click.",
  },
];

export function Features() {
  return (
    <section
      id="features"
      aria-labelledby="features-title"
      className="scroll-mt-8 px-4 pt-20 pb-24 sm:px-6 sm:pt-24 sm:pb-32"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          id="features-title"
          eyebrow="Features"
          title={
            <>
              The good parts of Heroku, <em>on your machine</em>
            </>
          }
          description="Everything a side project needs to ship, running on the Mac you already own. No cloud bill."
        />

        <ul className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <li key={title} className="bg-card p-7 lg:p-8">
              <span className="grid size-10 place-items-center rounded-xl bg-mint text-forest">
                <Icon className="size-5" strokeWidth={1.75} />
              </span>
              <h3 className="mt-6 text-[17px] font-medium tracking-tight text-ink">{title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
