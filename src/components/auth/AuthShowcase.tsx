import { useState, useEffect, useRef } from 'react';

interface TabItem {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
}

const SHOWCASE_TABS: TabItem[] = [
  {
    id: 'roster',
    label: 'Client Hub',
    sublabel: 'Check-ins & Roadmaps',
    icon: 'groups',
    accent: 'text-emerald-400',
    accentBg: 'bg-emerald-500/10',
    accentBorder: 'border-emerald-500/30',
  },
  {
    id: 'retainers',
    label: 'Stripe Billing',
    sublabel: '0% Platform Fees',
    icon: 'payments',
    accent: 'text-secondary',
    accentBg: 'bg-secondary/10',
    accentBorder: 'border-secondary/30',
  },
  {
    id: 'antichurn',
    label: 'Anti-Churn Radar',
    sublabel: 'Early Warning Signals',
    icon: 'radar',
    accent: 'text-amber-300',
    accentBg: 'bg-amber-500/10',
    accentBorder: 'border-amber-500/30',
  },
];

const LIVE_EVENTS = [
  {
    icon: 'bolt',
    accent: 'text-emerald-400',
    text: 'Sarah Jenkins submitted weekly check-in • 4 action items updated',
    time: '2m ago',
  },
  {
    icon: 'payments',
    accent: 'text-secondary',
    text: 'Stripe auto-debited $2,800.00 monthly retainer for Alexander Wright',
    time: '5m ago',
  },
  {
    icon: 'calendar_month',
    accent: 'text-primary',
    text: 'Elena Rostova scheduled Q4 Board Deck strategy session',
    time: '14m ago',
  },
  {
    icon: 'notifications_active',
    accent: 'text-amber-300',
    text: 'Anti-Churn Watch: All 28 clients in green zone (99.2% adherence)',
    time: 'Just now',
  },
];

export default function AuthShowcase() {
  const [activeTab, setActiveTab] = useState(0);
  const [progress, setProgress] = useState(0);
  const [eventIndex, setEventIndex] = useState(0);
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  // Auto-advance tabs with a smooth progress bar
  useEffect(() => {
    setProgress(0);
    const intervalTime = 50;
    const stepDuration = 5000; // 5s per tab
    const increment = (intervalTime / stepDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev + increment >= 100) {
          const nextTab = (activeTabRef.current + 1) % SHOWCASE_TABS.length;
          setActiveTab(nextTab);
          return 0;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [activeTab]);

  // Cycle live notifications ticker
  useEffect(() => {
    const eventTimer = setInterval(() => {
      setEventIndex((prev) => (prev + 1) % LIVE_EVENTS.length);
    }, 3800);
    return () => clearInterval(eventTimer);
  }, []);

  const activeEvent = LIVE_EVENTS[eventIndex];

  return (
    <div className="hidden lg:flex lg:col-span-6 xl:col-span-6 bg-surface-container-lowest/80 border-l border-surface-container-highest/30 flex-col justify-between p-8 xl:p-12 relative overflow-hidden min-h-screen">
      {/* Dynamic Ambient Gradient Glow */}
      <div className="absolute top-1/4 right-0 w-[550px] h-[550px] bg-secondary-container/20 rounded-full blur-[150px] pointer-events-none -z-10 animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-primary/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* ── TOP HEADER / BADGES ── */}
      <div className="h-10 shrink-0 flex items-center justify-between relative z-10 mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-low/90 border border-white/10 text-xs font-mono text-on-surface shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-emerald-400 font-semibold">Live Simulation</span>
          <span className="text-on-surface-variant">• 280+ Coaches Active</span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant">
          <span className="text-secondary font-semibold">cadence.app</span>
          <span>/</span>
          <span>julian-vance</span>
        </div>
      </div>

      {/* ── CENTER: THE DYNAMIC COACH OS SHOWCASE WINDOW (FIXED HEIGHT) ── */}
      <div className="my-auto max-w-xl w-full mx-auto relative z-10 shrink-0">
        <div className="rounded-3xl bg-surface-container-low/90 backdrop-blur-2xl border border-white/10 shadow-[0_24px_70px_-15px_rgba(0,0,0,0.9)] overflow-hidden">
          
          {/* macOS Window Controls + Address Bar */}
          <div className="h-11 px-5 bg-surface-container-lowest/90 border-b border-surface-container-highest/40 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56]/90 border border-[#e0443e]" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e]/90 border border-[#dea123]" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f]/90 border border-[#1aab29]" />
              <span className="ml-2 font-mono text-[11px] text-on-surface-variant/70 hidden sm:inline">
                Cadence Coach Command Center v2.4
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Synced Real-Time
              </span>
            </div>
          </div>

          {/* Interactive Animated Tabs */}
          <div className="h-14 grid grid-cols-3 border-b border-surface-container-highest/40 bg-surface-container-lowest/50 shrink-0">
            {SHOWCASE_TABS.map((tab, idx) => {
              const isActive = activeTab === idx;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(idx);
                    setProgress(0);
                  }}
                  className={`relative px-3 py-2 text-left transition-all cursor-pointer flex flex-col justify-center h-full ${
                    isActive
                      ? 'bg-surface-container-high/60 text-primary'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`material-symbols-outlined text-[16px] ${isActive ? tab.accent : 'text-on-surface-variant'}`}>
                      {tab.icon}
                    </span>
                    <span className="text-xs font-semibold tracking-tight truncate">{tab.label}</span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant/70 truncate hidden sm:block">
                    {tab.sublabel}
                  </span>

                  {/* Animated Progress Bar under active tab */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-surface-container-highest overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-secondary to-primary transition-all duration-75"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content Window — RIGID EXACT HEIGHT: NO JITTER / EXPANSION */}
          <div className="p-5 relative h-[310px] overflow-hidden flex flex-col justify-between">
            {/* ── TAB 0: CLIENT HUB ── */}
            {activeTab === 0 && (
              <div className="h-full flex flex-col justify-between animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2.5 border-b border-surface-container-highest/30 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-secondary-container flex items-center justify-center font-bold text-xs text-on-secondary-container">
                      JV
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-primary leading-tight">Julian Vance</div>
                      <div className="text-[10px] font-mono text-on-surface-variant">julian.vance@cadence.health</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-semibold text-primary leading-tight">$18,450 MRR</div>
                    <div className="text-[10px] font-mono text-emerald-400">28 Active Clients</div>
                  </div>
                </div>

                <div className="space-y-2 py-1">
                  <div className="p-2.5 rounded-xl bg-surface-container flex items-center justify-between gap-3 border border-white/5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                        SJ
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-primary truncate leading-tight">Sarah Jenkins (Executive Tech)</p>
                        <p className="text-[10px] text-on-surface-variant truncate">Board deck review complete • $1,500/mo</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 text-[10px] font-mono border border-emerald-500/20 whitespace-nowrap shrink-0">
                      Check-in Done
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-surface-container flex items-center justify-between gap-3 border border-white/5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                        AW
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-primary truncate leading-tight">Alexander Wright (Sales Director)</p>
                        <p className="text-[10px] text-on-surface-variant truncate">Hit $45k quarterly quota • $2,800/mo</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-mono border border-amber-500/20 whitespace-nowrap shrink-0">
                      Needs Review
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-surface-container flex items-center justify-between gap-3 border border-white/5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                        ER
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-primary truncate leading-tight">Elena Rostova (Product VP)</p>
                        <p className="text-[10px] text-on-surface-variant truncate">Series A roadmap locked • $3,200/mo</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px] font-mono border border-indigo-500/20 whitespace-nowrap shrink-0">
                      Retainer Active
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-surface-container-highest/20 flex items-center justify-between text-[11px] font-mono text-on-surface-variant shrink-0">
                  <span className="text-secondary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">notifications_active</span>
                    Anti-churn early warnings active
                  </span>
                  <span>28/28 Clients Engaged</span>
                </div>
              </div>
            )}

            {/* ── TAB 1: STRIPE BILLING & 0% FEES ── */}
            {activeTab === 1 && (
              <div className="h-full flex flex-col justify-between animate-in fade-in duration-200">
                <div className="grid grid-cols-2 gap-2.5 shrink-0">
                  <div className="p-2.5 rounded-xl bg-surface-container border border-white/5">
                    <span className="text-[10px] font-mono uppercase text-on-surface-variant">Gross Retainers</span>
                    <div className="text-lg font-headline-sm font-semibold text-primary leading-tight mt-0.5">$18,450.00</div>
                    <span className="text-[10px] font-mono text-emerald-400">100% on-time via Stripe</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-surface-container border border-emerald-500/20">
                    <span className="text-[10px] font-mono uppercase text-emerald-400">Platform Cut</span>
                    <div className="text-lg font-headline-sm font-semibold text-emerald-300 leading-tight mt-0.5">$0.00</div>
                    <span className="text-[10px] font-mono text-on-surface-variant">0% Commission taken</span>
                  </div>
                </div>

                <div className="space-y-1.5 py-1">
                  <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-surface-container-low border border-white/5">
                    <div className="flex items-center gap-2 truncate">
                      <span className="material-symbols-outlined text-secondary text-[15px] shrink-0">check_circle</span>
                      <span className="text-on-surface text-xs font-medium truncate">Alexander Wright ($2,800 Retainer)</span>
                    </div>
                    <span className="font-mono text-emerald-400 text-[10px] shrink-0 ml-2">Auto-Debited</span>
                  </div>

                  <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-surface-container-low border border-white/5">
                    <div className="flex items-center gap-2 truncate">
                      <span className="material-symbols-outlined text-secondary text-[15px] shrink-0">check_circle</span>
                      <span className="text-on-surface text-xs font-medium truncate">Sarah Jenkins ($1,500 Retainer)</span>
                    </div>
                    <span className="font-mono text-emerald-400 text-[10px] shrink-0 ml-2">Auto-Debited</span>
                  </div>

                  <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-surface-container-low border border-white/5">
                    <div className="flex items-center gap-2 truncate">
                      <span className="material-symbols-outlined text-secondary text-[15px] shrink-0">check_circle</span>
                      <span className="text-on-surface text-xs font-medium truncate">Elena Rostova ($3,200 Retainer)</span>
                    </div>
                    <span className="font-mono text-emerald-400 text-[10px] shrink-0 ml-2">Auto-Debited</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-surface-container-highest/20 flex items-center justify-between text-[11px] font-mono text-on-surface-variant shrink-0">
                  <span>Stripe 256-bit TLS Encryption</span>
                  <span className="text-secondary font-medium">Direct Bank Settlement</span>
                </div>
              </div>
            )}

            {/* ── TAB 2: ANTI-CHURN RADAR ── */}
            {activeTab === 2 && (
              <div className="h-full flex flex-col justify-between animate-in fade-in duration-200">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 shrink-0">
                  <span className="material-symbols-outlined text-amber-300 text-[18px] shrink-0 mt-0.5 animate-pulse">
                    radar
                  </span>
                  <div>
                    <h4 className="text-xs font-semibold text-amber-200 leading-tight">Zero Inactive Clients (Green Zone)</h4>
                    <p className="text-[10px] text-on-surface-variant mt-0.5 leading-relaxed">
                      Cadence automatically flags clients who miss check-in routines 48h before churn risks.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 py-1">
                  <div className="p-2.5 rounded-xl bg-surface-container border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-primary leading-tight">Smart Check-in Reminders</div>
                      <div className="text-[10px] text-on-surface-variant">WhatsApp &amp; Email dispatches active</div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                      Active
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-surface-container border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-primary leading-tight">Retention Adherence Score</div>
                      <div className="text-[10px] text-on-surface-variant">28 active client weekly reviews</div>
                    </div>
                    <span className="text-xs font-mono font-bold text-primary shrink-0">99.2%</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-surface-container-highest/20 flex items-center justify-between text-[11px] font-mono text-on-surface-variant shrink-0">
                  <span>Client Lifetime: 11.4 Months</span>
                  <span className="text-emerald-400">0% Churn This Quarter</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── LIVE NOTIFICATION TICKER / ANIMATION (STABLE FIXED HEIGHT) ── */}
        <div className="mt-4 h-12 px-4 rounded-2xl bg-surface-container-low/80 border border-white/10 backdrop-blur-md flex items-center justify-between gap-3 shadow-lg overflow-hidden shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={`material-symbols-outlined text-[16px] shrink-0 ${activeEvent.accent} animate-bounce`}>
              {activeEvent.icon}
            </span>
            <p className="text-[11px] font-mono text-on-surface truncate">
              {activeEvent.text}
            </p>
          </div>
          <span className="text-[10px] font-mono text-on-surface-variant shrink-0 bg-surface-container px-2 py-0.5 rounded-full">
            {activeEvent.time}
          </span>
        </div>
      </div>

      {/* ── BOTTOM STATS BAR (FIXED HEIGHT) ── */}
      <div className="h-16 shrink-0 grid grid-cols-3 gap-4 pt-3 border-t border-surface-container-highest/20 text-xs font-mono text-on-surface-variant relative z-10">
        <div>
          <div className="text-primary text-base font-semibold leading-tight">$850k+</div>
          <div className="text-[10px] text-on-surface-variant/70 uppercase">Retainers Managed</div>
        </div>
        <div>
          <div className="text-secondary text-base font-semibold leading-tight">99.2%</div>
          <div className="text-[10px] text-on-surface-variant/70 uppercase">On-Time Check-ins</div>
        </div>
        <div>
          <div className="text-emerald-400 text-base font-semibold leading-tight">0%</div>
          <div className="text-[10px] text-on-surface-variant/70 uppercase">Platform Cut</div>
        </div>
      </div>
    </div>
  );
}
