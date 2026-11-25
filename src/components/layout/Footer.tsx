export default function Footer() {
  const scrollTo = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer className="w-full bg-surface-container-lowest relative overflow-hidden border-t border-surface-container-highest/30">
      <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter items-start mb-12">
          {/* Logo & Brand matching Header */}
          <div className="md:col-span-6 flex flex-col gap-4">
            <div className="flex items-center gap-space-sm">
              <a
                href="#"
                onClick={scrollTo('top')}
                className="flex items-center gap-space-sm group cursor-pointer"
              >
                <span className="font-headline-sm text-headline-sm tracking-tight text-primary font-medium hover:text-secondary transition-colors">
                  Cadence
                </span>
              </a>
              <div className="flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-surface-container-low border border-surface-container-highest/40">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
                  For 1-on-1 Professionals
                </span>
              </div>
            </div>

            <p className="font-body-md text-body-md text-on-surface-variant max-w-sm leading-relaxed">
              The operating system for independent coaches, mentors, and advisors. Client check-ins, automated retainers, and action plans in one dashboard.
            </p>
            
          </div>

          {/* Clean Navigation Links - Only 2 items */}
          <div className="md:col-span-6 grid grid-cols-2 gap-gutter sm:justify-items-end">
            <div className="flex flex-col gap-3">
              <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface font-semibold mb-1">
                Navigation
              </span>
              <a
                className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                href="#features"
                onClick={scrollTo('features')}
              >
                Features
              </a>
              <a
                className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                href="#pricing"
                onClick={scrollTo('pricing')}
              >
                Pricing
              </a>
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface font-semibold mb-1">
                Legal
              </span>
              <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">
                Privacy Policy
              </a>
              <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">
                Terms of Service
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-surface-container-highest/20">
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            © {new Date().getFullYear()} Cadence Technologies Inc. All rights reserved.
          </span>
          <div className="flex items-center gap-3 text-xs text-on-surface-variant font-mono">
            <span>Bank-Grade Stripe Security</span>
            <span className="text-surface-container-highest">•</span>
            <span>100% Data Privacy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
