import type { Cta } from "@/components/landing/button-link";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Install } from "@/components/landing/install";
import styles from "@/components/landing/landing.module.css";
import { Nav } from "@/components/landing/nav";
import { isLandingOnly } from "@/lib/web/site";

export default function Home() {
  const cta: Cta = isLandingOnly()
    ? { label: "Install locally", href: "#install" }
    : { label: "Open dashboard", href: "/dashboard" };

  return (
    <div className={`relative ${styles.page}`}>
      <Nav cta={cta} />
      <main>
        <Hero cta={cta} />
        <HowItWorks />
        <Features />
        <Install />
      </main>
      <Footer />
    </div>
  );
}
