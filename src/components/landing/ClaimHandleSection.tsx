import { useState, type FormEvent } from 'react';
import type { AppView } from '../../App';

interface ClaimHandleSectionProps {
  onNavigate: (view: AppView) => void;
}

export default function ClaimHandleSection({ onNavigate }: ClaimHandleSectionProps) {
  const [handleInput, setHandleInput] = useState('');
  const [handleFeedback, setHandleFeedback] = useState<string | null>(null);

  const handleClaimSubmit = (e: FormEvent) => {
    e.preventDefault();
    const clean = handleInput.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
    if (clean) {
      setHandleFeedback(`✓ cadence.app/${clean} is available! Redirecting to setup...`);
      setTimeout(() => {
        onNavigate('signup');
      }, 700);
    } else {
      setHandleFeedback('Please enter your name or practice handle.');
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin py-20 mb-12" id="claim-id">
      <div className="rounded-3xl bg-surface-container-low p-8 md:p-16 flex flex-col items-center text-center relative overflow-hidden shadow-2xl border border-surface-container-highest/40">
        {/* Background Ambient Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-secondary-container/10 via-transparent to-on-tertiary-container/10 pointer-events-none" />

        <span className="font-label-md text-label-md uppercase tracking-widest text-secondary mb-3 relative z-10">
          Get Started in 30 Seconds
        </span>

        <h2 className="font-headline-lg lg:font-display-xl text-headline-lg lg:text-display-xl text-primary max-w-3xl tracking-tight mb-4 relative z-10 leading-tight">
          Run your entire coaching business from one private link.
        </h2>

        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto mb-10 font-light relative z-10">
          Claim your unique coach handle. Weekly check-in hubs, automated Stripe retainers, and 1-on-1 action plans — all in one place.
        </p>

        {/* Interactive Claim Form */}
        <div className="w-full max-w-xl relative z-10">
          <form
            onSubmit={handleClaimSubmit}
            className="flex flex-col sm:flex-row items-center gap-2 p-2 rounded-full bg-surface-container-lowest shadow-2xl border border-surface-container-highest/50"
          >
            <div className="flex items-center gap-1.5 px-4 py-2.5 w-full">
              <span className="text-on-surface-variant font-mono text-sm shrink-0">cadence.app/</span>
              <input
                className="w-full bg-transparent text-primary placeholder-on-surface-variant/40 outline-none font-mono text-sm"
                placeholder="your-name"
                required
                type="text"
                value={handleInput}
                onChange={(e) => setHandleInput(e.target.value)}
              />
            </div>
            <button
              className="w-full sm:w-auto px-8 py-3 rounded-full bg-primary text-on-primary font-headline-sm text-sm font-semibold whitespace-nowrap hover:shadow-[0_0_24px_rgba(255,255,255,0.35)] transition-all cursor-pointer"
              type="submit"
            >
              Claim My Link
            </button>
          </form>

          {handleFeedback && (
            <div className="mt-3 text-xs font-mono text-secondary animate-fadeIn">
              {handleFeedback}
            </div>
          )}

          <p className="font-label-sm text-label-sm text-on-surface-variant mt-4 font-mono">
            14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}
