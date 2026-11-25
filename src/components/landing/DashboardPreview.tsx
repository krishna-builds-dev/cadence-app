
import type { AppView } from '../../App';

interface DashboardPreviewProps {
  onNavigate?: (view: AppView) => void;
}

export default function DashboardPreview({ onNavigate: _onNavigate }: DashboardPreviewProps) {


  return (
    <section id="features" className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin py-16 md:py-24">
      {/* Section Header */}
      <div className="flex flex-col items-center text-center mb-16">
        <span className="font-label-md text-label-md uppercase tracking-wider text-secondary mb-2">
          The Coach Dashboard
        </span>
        <h2 className="font-headline-lg text-headline-lg text-primary max-w-3xl">
          Everything you need to know about your clients in 5 seconds.
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-xl mt-3">
          See who is making progress, who is falling behind, and who is ready for their next
          session—all in one place. No spreadsheets. No WhatsApp threads.
        </p>
      </div>

      {/* Dashboard Mockup */}
      <div className="w-full rounded-3xl bg-surface-container-low p-4 sm:p-6 md:p-8 shadow-2xl relative border border-surface-container-highest/40">
        {/* Ambient glow */}
        <div className="absolute -inset-1 bg-gradient-to-br from-secondary/5 via-transparent to-primary/5 rounded-3xl pointer-events-none" />

        {/* Dashboard Top Bar */}
        <div className="flex items-center justify-between pb-5 mb-6 border-b border-surface-container-highest/30">
          <div className="flex items-center gap-3">
            {/* macOS traffic lights */}
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56]/70 border border-[#e0443e]/40" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e]/70 border border-[#dea123]/40" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f]/70 border border-[#1aab29]/40" />
            </div>
            <span className="font-label-md text-label-md text-on-surface-variant font-mono pl-3 border-l border-surface-container-highest/40">
              cadence.app/alexander-stone
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container border border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-emerald-400">Live</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-surface-container-highest text-primary font-label-sm text-label-sm">
              28 Active Clients
            </span>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter items-stretch">

          {/* ── Left Column ── */}
          <div className="md:col-span-5 flex flex-col gap-gutter">

            {/* Revenue Card */}
            <div className="p-6 rounded-2xl bg-surface-container flex flex-col justify-between shadow-lg relative overflow-hidden border border-surface-container-highest/30">
              {/* Subtle background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent pointer-events-none rounded-2xl" />

              <div className="flex items-start justify-between mb-3 relative">
                <div>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Monthly Coaching Revenue
                  </span>
                  <h3 className="font-headline-lg text-[42px] text-primary tracking-tight font-light mt-1 leading-none">
                    $18,450{' '}
                    <span className="text-secondary text-[18px] font-normal">/mo</span>
                  </h3>
                </div>
                <span className="mt-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 font-label-sm text-label-sm border border-emerald-500/20 whitespace-nowrap text-[11px]">
                  ↑ 22% growth this quarter
                </span>
              </div>

              {/* Sparkline */}
              <div className="w-full h-14 my-2">
                <svg className="w-full h-full" fill="none" viewBox="0 0 320 56">
                  <path
                    d="M0 50 Q 40 44, 80 34 T 160 26 T 240 12 T 320 4"
                    stroke="rgb(var(--color-secondary) / 0.5)"
                    strokeLinecap="round"
                    strokeWidth="2"
                  />
                  <path
                    d="M0 50 Q 40 44, 80 34 T 160 26 T 240 12 T 320 4 L 320 56 L 0 56 Z"
                    fill="rgb(var(--color-secondary) / 0.07)"
                  />
                  {/* Endpoint dot */}
                  <circle cx="320" cy="4" r="3" fill="rgb(var(--color-secondary) / 0.8)" />
                </svg>
              </div>

              <div className="flex items-center justify-between pt-3 font-body-sm text-body-sm text-on-surface-variant border-t border-surface-container-highest/20">
                <span>Avg Retainer: <strong className="text-on-surface">$840/mo</strong></span>
                <span className="flex items-center gap-1 text-emerald-300 text-[11px] font-medium">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  100% On-Time via Stripe
                </span>
              </div>
            </div>

            {/* Anti-Churn Alert Card */}
            <div className="p-6 rounded-2xl bg-surface-container flex flex-col gap-4 shadow-lg border border-surface-container-highest/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[20px]">
                    notifications_active
                  </span>
                  <span className="font-headline-sm text-[15px] text-primary font-semibold">
                    Anti-Churn Alerts
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-label-sm text-label-sm text-[11px]">
                  2 Need Attention
                </span>
              </div>

              <div className="space-y-2.5">
                {/* Alert 1 – matches HeroSection Row 1: Sarah Jenkins */}
                <div className="p-3 rounded-xl bg-surface-container-high flex items-center justify-between gap-3 border border-surface-container-highest/20">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-[11px] text-emerald-300 shrink-0">
                      SJ
                    </div>
                    <div className="min-w-0">
                      <p className="font-body-md text-[13px] text-primary leading-tight font-medium truncate">
                        Sarah Jenkins
                      </p>
                      <p className="font-body-sm text-[11px] text-on-surface-variant truncate">
                        Board deck review due · Q4 prep flagged
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-surface-container text-secondary text-[11px] font-medium whitespace-nowrap border border-white/5 shrink-0">
                    Send Note
                  </span>
                </div>

                {/* Alert 2 – matches HeroSection Row 2: Alexander Wright */}
                <div className="p-3 rounded-xl bg-surface-container-high flex items-center justify-between gap-3 border border-surface-container-highest/20">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-bold text-[11px] text-amber-300 shrink-0">
                      AW
                    </div>
                    <div className="min-w-0">
                      <p className="font-body-md text-[13px] text-primary leading-tight font-medium truncate">
                        Alexander Wright
                      </p>
                      <p className="font-body-sm text-[11px] text-on-surface-variant truncate">
                        Hit $45k milestone · Scaling plan needs review
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-surface-container text-secondary text-[11px] font-medium whitespace-nowrap border border-white/5 shrink-0">
                    Review Plan
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-on-surface-variant leading-relaxed border-t border-surface-container-highest/20 pt-3">
                Cadence alerts you before clients go quiet — giving you a window to re-engage before they cancel.
              </p>
            </div>
          </div>

          {/* ── Right Column ── */}
          <div className="md:col-span-7 flex flex-col gap-gutter">

            {/* "Why Your Plan Changed" Feed */}
            <div className="p-6 rounded-2xl bg-surface-container flex flex-col gap-5 shadow-lg flex-1 border border-surface-container-highest/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">feed</span>
                  <span className="font-headline-sm text-[16px] text-primary font-semibold">
                    "Why Your Plan Changed" Feed
                  </span>
                </div>
                <span className="font-label-sm text-[10px] text-on-surface-variant font-mono px-2 py-0.5 rounded bg-surface-container-high border border-white/5 uppercase tracking-wider">
                  Client-Visible
                </span>
              </div>

              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed -mt-1">
                Whenever you adjust a client's goals or homework, log a 1-sentence reason.
                Clients follow through because they understand <em>why</em> — not just <em>what</em>.
              </p>

              {/* Latest recommendation — tied to Alexander Wright closing deals */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-highest/40 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-[10px] uppercase tracking-wider text-secondary font-mono">
                    Latest · Alexander Wright
                  </span>
                  <span className="text-[11px] text-on-surface-variant font-mono">Today, 09:30 AM</span>
                </div>
                <p className="text-[15px] font-headline-sm text-primary font-bold leading-snug">
                  Pause Outbound Sales — Hire an Ops Lead First
                </p>
                <p className="font-body-sm text-[12px] text-on-surface-variant italic leading-relaxed">
                  "You just closed 2 enterprise deals and hit \$45k MRR — your team is now at max capacity.
                  Adding more leads right now will bottleneck fulfilment. Let's hire an operations lead before
                  we scale the pipeline further."
                </p>
              </div>

              {/* Second entry — Elena Rostova */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-highest/40 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-[10px] uppercase tracking-wider text-secondary font-mono">
                    Yesterday · Elena Rostova
                  </span>
                  <span className="text-[11px] text-on-surface-variant font-mono">Oct 27, 4:15 PM</span>
                </div>
                <p className="text-[14px] font-headline-sm text-primary font-semibold leading-snug">
                  Shift Focus to Equity Negotiation This Week
                </p>
                <p className="font-body-sm text-[12px] text-on-surface-variant italic leading-relaxed">
                  "You received your offer letter — congratulations! Salary is strong, but the equity package
                  has room to improve. I've sent you a negotiation script. Use this before accepting."
                </p>
              </div>

              {/* Built-in Video Call */}
              <div className="p-4 rounded-xl bg-surface-container-high flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-auto border border-surface-container-highest/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-on-secondary-container text-[20px]">
                      videocam
                    </span>
                  </div>
                  <div>
                    <p className="font-headline-sm text-[14px] text-primary font-semibold">
                      Built-in 1-on-1 Video Calls
                    </p>
                    <p className="font-body-sm text-[12px] text-on-surface-variant">
                      Launch directly from the client's file. No Zoom links. No copy-pasting.
                    </p>
                  </div>
                </div>

                
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
