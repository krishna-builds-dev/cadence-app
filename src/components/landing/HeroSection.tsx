import { useAuth } from '../../context/AuthContext';

interface HeroSectionProps {
  onNavigate: (view: 'landing' | 'signup' | 'dashboard') => void;
}

export default function HeroSection({ onNavigate }: HeroSectionProps) {
  const { isAuthenticated } = useAuth();

  const handleHeroCTA = () => {
    onNavigate(isAuthenticated ? 'dashboard' : 'signup');
  };

  const scrollToDemo = () => {
    const el = document.getElementById('how-it-works');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin pt-10 pb-8 md:pt-16 md:pb-12 flex flex-col items-center text-center">
      {/* Version Pill */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-low/80 backdrop-blur-md border border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.3)] mb-6 group transition-all hover:border-white/20">
        <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
        <span className="font-body-sm text-body-sm font-medium text-on-surface flex items-center gap-1 transition-colors">
          The Operating System for 1-on-1 Coaches, Mentors &amp; Advisors
        </span>
      </div>

      {/* Main Editorial Hero Title */}
      <h1 className="font-headline-lg lg:font-display-xl text-headline-lg lg:text-display-xl text-primary max-w-5xl tracking-tight leading-[1.08] mb-4">
        Run your entire 1-on-1 coaching business.{' '}
        <span className="italic font-headline-lg lg:font-display-xl font-normal text-secondary-fixed">
          Without the chaos.
        </span>
      </h1>

      {/* Subtitle */}
      <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-8 font-light leading-relaxed">
        Stop duct-taping Google Sheets, WhatsApp, Calendly, and manual invoices together. Manage your client check-ins,
        automated monthly retainers, action plans, and calls in one professional dashboard.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto mb-10">
        <button
          onClick={handleHeroCTA}
          className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-primary text-on-primary font-headline-sm text-[15px] font-semibold flex items-center justify-center gap-2 shadow-[0_0_28px_rgba(255,255,255,0.28)] hover:shadow-[0_0_36px_rgba(255,255,255,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>{isAuthenticated ? 'Go to Dashboard' : 'Get Your Private Coach Link'}</span>
          <span className="material-symbols-outlined text-[18px]">
            {isAuthenticated ? 'dashboard' : 'arrow_outward'}
          </span>
        </button>
        {/* <button
          onClick={scrollToDemo}
          className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-surface-container border border-white/10 text-on-surface font-headline-sm text-xs font-semibold flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors cursor-pointer"
        >
          <span>See Live Workflow</span>
          <span className="material-symbols-outlined text-[16px] text-secondary">arrow_downward</span>
        </button> */}
      </div>

      {/* Social Proof */}
      <div className="mt-4 flex flex-col items-center gap-4">
        <span className="font-label-md text-label-md uppercase tracking-widest text-outline text-xs">
          Built for modern independent 1-on-1 advisors, coaches, and consultants
        </span>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-60 hover:opacity-100 transition-opacity duration-300">
          <img
            src="/logos/stripe.svg"
            alt="Stripe"
            className="h-6 md:h-7 w-auto object-contain hover:scale-105 transition-transform"
          />
          <img
            src="/logos/linear.svg"
            alt="Linear"
            className="h-5 md:h-6 w-auto object-contain hover:scale-105 transition-transform"
          />
          <img
            src="/logos/agora.svg"
            alt="Agora"
            className="h-5 md:h-6 w-auto object-contain hover:scale-105 transition-transform"
          />
          <img
            src="/logos/notion.svg"
            alt="Notion"
            className="h-5 md:h-6 w-auto object-contain hover:scale-105 transition-transform"
          />
          <img
            src="/logos/vercel.svg"
            alt="Vercel"
            className="h-4 md:h-5 w-auto object-contain hover:scale-105 transition-transform"
          />
        </div>
      </div>
    </section>
  );
}
