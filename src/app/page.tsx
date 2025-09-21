import HeaderNavigation from "@/components/sections/header-navigation";
import HeroSection from "@/components/sections/hero-section";
import MissionStatement from "@/components/sections/mission-statement";
import CtaSection from "@/components/sections/cta-section";
import Footer from "@/components/sections/footer";
import Parallax3DBackground from "@/components/backgrounds/parallax-3d-background";
import DocumentExtractionBackground from "@/components/backgrounds/document-extraction-background";
import { RevealOnScroll } from "@/components/ui/reveal-on-scroll";
import DocumentScannerSection from "@/components/sections/document-scanner";
import { EfficiencyStats } from "@/components/sections/efficiency-stats";
import AnalysisSplit from "@/components/sections/analysis-split";

export default function HomePage() {
  return (
    <main className="relative min-h-screen">
      <Parallax3DBackground />
      <DocumentExtractionBackground />
      <div className="relative z-20">
        <HeaderNavigation />
        <RevealOnScroll>
          <HeroSection />
        </RevealOnScroll>
        <RevealOnScroll delay={0.05}>
          <MissionStatement />
        </RevealOnScroll>
        <RevealOnScroll delay={0.415}>
          <AnalysisSplit />
        </RevealOnScroll>
        <RevealOnScroll delay={0.425}>
          <DocumentScannerSection />
        </RevealOnScroll>
        <RevealOnScroll delay={0.445}>
          <EfficiencyStats />
        </RevealOnScroll>
        <RevealOnScroll delay={0.45}>
          <CtaSection />
        </RevealOnScroll>
        <Footer />
      </div>
    </main>
  );
}