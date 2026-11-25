import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import HeroSection from '../../components/landing/HeroSection';
import ScrollShowcaseSection from '../../components/landing/ScrollShowcaseSection';
import ProblemSolution from '../../components/landing/ProblemSolution';
import PillarsSection from '../../components/landing/PillarsSection';
import VerticalsSection from '../../components/landing/VerticalsSection';
import TestimonialsSection from '../../components/landing/TestimonialsSection';
import PricingSection from '../../components/landing/PricingSection';
import FAQSection from '../../components/landing/FAQSection';
import ClaimHandleSection from '../../components/landing/ClaimHandleSection';

import type { AppView } from '../../App';

interface LandingPageProps {
  onNavigate: (view: AppView) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="bg-background font-body-md text-on-surface antialiased selection:bg-surface-container-highest selection:text-primary min-h-screen">
      {/* Floating Header */}
      <Header onNavigate={onNavigate} />

      {/* Main Content */}
      <main className="w-full pt-20 bg-background min-h-screen">
        <div className="flex flex-col w-full relative overflow-hidden">
          {/* Ambient Warm Glow Background Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-secondary-container/20 via-on-tertiary-container/15 to-transparent blur-[140px] pointer-events-none -z-10" />
          <div className="absolute top-[1600px] right-0 w-[600px] h-[600px] bg-on-tertiary-container/10 blur-[150px] pointer-events-none -z-10" />
          <div className="absolute top-[3200px] left-0 w-[700px] h-[700px] bg-secondary-container/15 blur-[160px] pointer-events-none -z-10" />

          {/* 1. Hero Section */}
          <HeroSection onNavigate={onNavigate} />

          {/* 2. Interactive On-Scroll Showcase (Clienter Style) */}
          <ScrollShowcaseSection onNavigate={onNavigate} />

          {/* 3. The Problem vs Solution */}
          <ProblemSolution />

          {/* 4. Core Features (Bento Grid) */}
          <PillarsSection />

          {/* 5. Who It's For (Verticals) */}
          <VerticalsSection />

          {/* 6. Real Coach Social Proof & Metrics */}
          <TestimonialsSection />

          {/* 7. Simple, Honest Pricing */}
          <PricingSection onNavigate={onNavigate} />

          {/* 8. Frequently Asked Questions (Objection Killer) */}
          <FAQSection />

          {/* 9. Claim Handle Final CTA */}
          <ClaimHandleSection onNavigate={onNavigate} />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
