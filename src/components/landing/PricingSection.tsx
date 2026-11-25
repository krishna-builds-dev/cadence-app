import type { AppView } from '../../App';
import { useAuth } from '../../context/AuthContext';

interface PricingSectionProps {
  onNavigate: (view: AppView) => void;
}

export default function PricingSection({ onNavigate }: PricingSectionProps) {
  const { isAuthenticated, user } = useAuth();

  const handleSelectPackage = (pkgId: 'starter' | 'pro' | 'studio') => {
    try {
      sessionStorage.setItem('cadence_selected_coach_plan', pkgId);
    } catch {}

    // Only after login can coaches select and pay for packages
    if (isAuthenticated && user?.role === 'coach') {
      onNavigate('dashboard');
    } else {
      onNavigate('signup');
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin py-24" id="pricing">
      <div className="flex flex-col items-center text-center mb-16">
        <span className="font-label-md text-label-md uppercase tracking-wider text-secondary mb-2">
          Simple, Honest Pricing
        </span>
        <h2 className="font-headline-lg text-headline-lg text-primary max-w-3xl">
          One saved client pays for Cadence for the entire year.
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-xl mt-3">
          No hidden fees or percentage cuts from your earnings. You keep 100% of what your clients pay you.
        </p>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter items-stretch">
        {/* Tier 1: Starter */}
        <div className="p-8 rounded-3xl bg-surface-container-lowest flex flex-col justify-between shadow-xl border border-surface-container-highest/30">
          <div>
            <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
              Starter
            </span>
            <div className="flex items-baseline gap-2 mt-4 mb-2">
              <span className="font-headline-lg text-[44px] text-primary font-light">$49</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">/month</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">
              For independent coaches launching or organizing their 1-on-1 client practice.
            </p>
            <div className="space-y-3 font-body-sm text-body-sm text-on-surface-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-sm">check</span>
                <span>Up to 15 Active Clients</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-sm">check</span>
                <span>Automated Stripe Monthly Retainers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-sm">check</span>
                <span>Dedicated Coach Link (cadence.app/you)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-sm">check</span>
                <span>Weekly Check-ins &amp; Action Plan Log</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-sm">check</span>
                <span>Direct Client Messaging</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => handleSelectPackage('starter')}
            className="mt-8 w-full py-3 rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-container-highest hover:text-primary transition-all border border-surface-container-highest/50 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Start 14-Day Free Trial</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>

        {/* Tier 2: Pro Coach (Most Popular) */}
        <div className="p-8 md:p-10 rounded-3xl bg-surface-container flex flex-col justify-between shadow-2xl relative overflow-hidden ring-1 ring-primary/20 border border-secondary/30">
          <div className="absolute top-0 right-0 p-3 bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase tracking-wider rounded-bl-xl font-bold">
            Most Popular
          </div>
          <div>
            <span className="font-label-md text-label-md uppercase tracking-wider text-secondary">Pro Coach</span>
            <div className="flex items-baseline gap-2 mt-4 mb-2">
              <span className="font-headline-lg text-[50px] text-primary font-normal">$99</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">/month</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">
              For full-time coaches ready to automate client retention, billing, and weekly check-ins.
            </p>
            <div className="space-y-3 font-body-sm text-body-sm text-primary">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-sm">check</span>
                <span className="font-medium">Up to 50 Active Clients</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-sm">check</span>
                <span className="font-medium">Early Warning Anti-Churn Alerts</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-sm">check</span>
                <span className="font-medium">&quot;Why Your Plan Changed&quot; Client Feed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-sm">check</span>
                <span className="font-medium">Built-in 1-on-1 Video Calling</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-sm">check</span>
                <span className="font-medium">Smart Failed Payment Recovery (Stripe)</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => handleSelectPackage('pro')}
            className="mt-8 w-full py-3.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold hover:shadow-[0_0_24px_rgba(255,255,255,0.3)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Start 14-Day Free Trial</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>

        {/* Tier 3: Studio / Unlimited */}
        <div className="p-8 rounded-3xl bg-surface-container-lowest flex flex-col justify-between shadow-xl border border-surface-container-highest/30">
          <div>
            <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
              Studio &amp; Teams
            </span>
            <div className="flex items-baseline gap-2 mt-4 mb-2">
              <span className="font-headline-lg text-[44px] text-primary font-light">$199</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">/month</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">
              For high-volume advisory practices, multi-coach teams, and scaling agencies.
            </p>
            <div className="space-y-3 font-body-sm text-body-sm text-on-surface-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-sm">check</span>
                <span>Unlimited Active Clients</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-sm">check</span>
                <span>Assistant &amp; Associate Coach Accounts</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-sm">check</span>
                <span>Custom Domain &amp; White-label Branding</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-sm">check</span>
                <span>White-Glove Spreadsheet Migration</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-sm">check</span>
                <span>Priority 1-on-1 Support</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => handleSelectPackage('studio')}
            className="mt-8 w-full py-3 rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-container-highest hover:text-primary transition-all border border-surface-container-highest/50 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Start 14-Day Free Trial</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Trust & Guarantee reassurance */}
      <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-on-surface-variant font-mono">
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-secondary text-[16px]">verified</span>
          14-day free trial on all plans
        </span>
        <span className="text-surface-container-highest">•</span>
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-secondary text-[16px]">payments</span>
          0% transaction fees — keep 100% of revenue
        </span>
        <span className="text-surface-container-highest">•</span>
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-secondary text-[16px]">cancel</span>
          No long-term contracts, cancel anytime
        </span>
      </div>
    </section>
  );
}
