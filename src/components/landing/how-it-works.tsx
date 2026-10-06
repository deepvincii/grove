import { FlowDiagram } from "./flow-diagram";
import { SectionHeading } from "./section-heading";

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-it-works-title" className="px-4 pt-24 pb-20 sm:px-6 sm:pt-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          id="how-it-works-title"
          title="What happens after git push"
          description="Grove asks GitHub for the head of your branch every five seconds. When it moves, the rest runs on its own."
        />
        <div className="mt-14 border-t border-line pt-12">
          <FlowDiagram />
        </div>
      </div>
    </section>
  );
}
