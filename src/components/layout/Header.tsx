import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { AppView } from '../../App';

interface HeaderProps {
  onNavigate: (view: AppView) => void;
}

const NAV_ITEMS = [
  { label: 'Why Cadence',   href: '#features'  },
  { label: 'Core Features', href: '#pillars'   },
  { label: "Who It's For",  href: '#verticals' },
  { label: 'Pricing',       href: '#pricing'   },
] as const;

type NavHref = (typeof NAV_ITEMS)[number]['href'];

export default function Header({ onNavigate }: HeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();

  const [activeSection, setActiveSection] = useState<NavHref | null>(null);
  const [scrolled,      setScrolled]      = useState(false);
  const [mobileOpen,    setMobileOpen]    = useState(false);

  // ── Scroll: glass effect + reset active at top ────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      if (y < 80) setActiveSection(null);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── IntersectionObserver: highlight active section ────────────────────────
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    NAV_ITEMS.forEach(({ href }) => {
      const el = document.getElementById(href.slice(1));
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && window.scrollY >= 80) setActiveSection(href);
        },
        { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  // ── Smooth scroll on click ────────────────────────────────────────────────
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: NavHref) => {
    e.preventDefault();
    document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileOpen(false);
  };

  return (
    <header
      className={[
        'fixed top-0 inset-x-0 z-50 transition-all duration-300 pointer-events-none',
        scrolled
          ? 'bg-surface-container-lowest/70 backdrop-blur-xl shadow-lg shadow-black/20'
          : 'bg-transparent',
      ].join(' ')}
    >
      <div className="h-20 max-w-7xl mx-auto px-margin-mobile lg:px-margin flex items-center justify-between pointer-events-auto">

        {/* ── Logo & Badge ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-space-sm shrink-0">
          <a
            href="#"
            onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center gap-space-sm group cursor-pointer"
          >
            <span className="font-headline-sm text-headline-sm tracking-tight text-primary font-medium">
              Cadence
            </span>
          </a>
          <div className="hidden sm:flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-surface-container-low border border-surface-container-highest/40">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
              For 1-on-1 Professionals
            </span>
          </div>
        </div>

        {/* ── Floating Center Nav ───────────────────────────────────────── */}
        <div className="hidden md:flex items-center p-1 rounded-full bg-surface-container-low/80 backdrop-blur-2xl shadow-[0_1px_8px_rgba(0,0,0,0.12)] border border-surface-container-highest/30">
          <nav className="flex items-center" aria-label="Main navigation">
            {NAV_ITEMS.map(item => {
              const isActive = activeSection === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={e => handleNavClick(e, item.href)}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'px-space-md py-1.5 rounded-full font-label-md text-label-md transition-all duration-200 cursor-pointer whitespace-nowrap select-none',
                    isActive
                      ? 'bg-surface-container text-primary font-medium'
                      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container/60',
                  ].join(' ')}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>

        {/* ── Right Actions ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-space-sm shrink-0">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-low border border-surface-container-highest/40 hover:border-primary/30 transition-all cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-[11px]">
                  {user.first_name?.[0] || 'U'}{user.last_name?.[0] || ''}
                </div>
                <span className="font-label-sm text-label-sm text-primary font-medium hidden sm:inline">
                  Dashboard
                </span>
              </button>
              <button
                onClick={logout}
                className="px-3 py-1.5 rounded-full font-label-sm text-label-sm text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all cursor-pointer"
              >
                Log out
              </button>
            </div>
          ) : (
            <button
              id="header-signup-btn"
              onClick={() => onNavigate('signup')}
              className="inline-flex items-center justify-center px-space-md py-2 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer"
            >
              Start Free Trial
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            id="header-mobile-menu-btn"
            onClick={() => setMobileOpen(o => !o)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className={['block h-0.5 bg-on-surface rounded-full transition-all duration-200 origin-center', mobileOpen ? 'w-5 rotate-45 translate-y-2'  : 'w-5'].join(' ')} />
            <span className={['block h-0.5 bg-on-surface rounded-full transition-all duration-200',               mobileOpen ? 'w-0 opacity-0'               : 'w-4'].join(' ')} />
            <span className={['block h-0.5 bg-on-surface rounded-full transition-all duration-200 origin-center', mobileOpen ? 'w-5 -rotate-45 -translate-y-2' : 'w-5'].join(' ')} />
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ───────────────────────────────────────────────────── */}
      <div
        className={[
          'md:hidden overflow-hidden transition-all duration-300 ease-out bg-surface-container-lowest/95 backdrop-blur-xl pointer-events-auto',
          mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
        ].join(' ')}
      >
        <nav className="flex flex-col px-margin-mobile pb-space-md pt-space-sm gap-space-xs" aria-label="Mobile navigation">
          {NAV_ITEMS.map(item => (
            <a
              key={item.href}
              href={item.href}
              onClick={e => handleNavClick(e, item.href)}
              aria-current={activeSection === item.href ? 'page' : undefined}
              className={[
                'px-4 py-2.5 rounded-xl font-label-md text-label-md transition-all duration-150 cursor-pointer',
                activeSection === item.href
                  ? 'bg-surface-container text-primary font-medium'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
              ].join(' ')}
            >
              {item.label}
            </a>
          ))}

          <div className="flex flex-col gap-space-xs mt-space-sm pt-space-sm border-t border-surface-container-highest/30">
            <button
              onClick={() => { onNavigate('signup'); setMobileOpen(false); }}
              className="w-full px-4 py-2.5 rounded-xl font-label-md text-label-md bg-primary text-on-primary font-semibold transition-all cursor-pointer text-left"
            >
              Start Free Trial
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
