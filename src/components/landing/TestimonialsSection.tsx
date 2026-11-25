export default function TestimonialsSection() {
  const testimonials = [
    {
      name: 'David Sterling',
      role: 'Executive & Leadership Coach',
      roster: '16 Active Executives',
      retainer: '$18,500/mo',
      avatar: 'DS',
      avatarColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      quote:
        'Before Cadence, Sunday nights were pure stress. Executive clients would send voice notes and board deck drafts scattered across WhatsApp and email. Now, every client update and action plan lives in one structured hub.',
      highlight: 'Zero lost updates across 16 executives',
    },
    {
      name: 'Rachel Torres',
      role: 'B2B Growth & Sales Mentor',
      roster: '24 Active Founders',
      retainer: '$26,000/mo',
      avatar: 'RT',
      avatarColor: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      quote:
        'The anti-churn early warning saved a $2,800/mo retainer in my third week. A founder went dark after a tough sales cycle; Cadence alerted me after 4 days. A quick targeted playbook got them back on track before they considered canceling.',
      highlight: 'Saved a $2,800/mo retainer in week 3',
    },
    {
      name: 'Marcus Vance',
      role: 'Career & Mindset Advisor',
      roster: '19 Active Clients',
      retainer: '$14,200/mo',
      avatar: 'MV',
      avatarColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
      quote:
        'Stripe auto-debit alone is worth 10x the price. I used to dread sending manual invoices and following up on late bank transfers over text. Now retainers are collected like clockwork, and my clients love having one private link.',
      highlight: '100% on-time payments, zero awkward texts',
    },
  ];

  return (
    <section className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin py-20">
      {/* Proof Metric Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 sm:p-8 rounded-3xl bg-surface-container-low border border-surface-container-highest/40 mb-16 shadow-xl">
        <div className="text-center p-3">
          <div className="font-headline-lg text-[32px] sm:text-[38px] text-primary font-normal tracking-tight">
            $850k+
          </div>
          <div className="text-xs font-mono uppercase tracking-wider text-on-surface-variant mt-1">
            Retainers Managed
          </div>
        </div>
        <div className="text-center p-3 border-l border-surface-container-highest/30">
          <div className="font-headline-lg text-[32px] sm:text-[38px] text-secondary font-normal tracking-tight">
            99.2%
          </div>
          <div className="text-xs font-mono uppercase tracking-wider text-on-surface-variant mt-1">
            On-Time Check-ins
          </div>
        </div>
        <div className="text-center p-3 border-t md:border-t-0 md:border-l border-surface-container-highest/30">
          <div className="font-headline-lg text-[32px] sm:text-[38px] text-emerald-400 font-normal tracking-tight">
            3.5 hrs
          </div>
          <div className="text-xs font-mono uppercase tracking-wider text-on-surface-variant mt-1">
            Saved Every Week
          </div>
        </div>
        <div className="text-center p-3 border-t md:border-t-0 md:border-l border-surface-container-highest/30">
          <div className="font-headline-lg text-[32px] sm:text-[38px] text-primary font-normal tracking-tight">
            0%
          </div>
          <div className="text-xs font-mono uppercase tracking-wider text-on-surface-variant mt-1">
            Platform Cut on Earnings
          </div>
        </div>
      </div>

      {/* Section Header */}
      <div className="flex flex-col items-center text-center mb-16">
        <span className="font-label-md text-label-md uppercase tracking-wider text-secondary mb-2">
          Trusted By Full-Time Coaches
        </span>
        <h2 className="font-headline-lg text-headline-lg text-primary max-w-3xl">
          Here is what happens when you stop managing clients in spreadsheets.
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-xl mt-3">
          Real feedback from independent mentors and advisors running high-ticket 1-on-1 practices on Cadence.
        </p>
      </div>

      {/* Testimonial Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter items-stretch">
        {testimonials.map((t, idx) => (
          <div
            key={idx}
            className="p-8 rounded-3xl bg-surface-container flex flex-col justify-between shadow-xl border border-surface-container-highest/30 relative"
          >
            <div>
              {/* Highlight Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high border border-white/5 text-[11px] font-mono text-secondary mb-6">
                <span className="material-symbols-outlined text-[13px]">verified</span>
                {t.highlight}
              </div>

              {/* Quote */}
              <p className="font-body-md text-[14px] text-on-surface leading-relaxed mb-6 italic">
                &ldquo;{t.quote}&rdquo;
              </p>
            </div>

            {/* Author Info */}
            <div className="pt-5 border-t border-surface-container-highest/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border shrink-0 ${t.avatarColor}`}
                >
                  {t.avatar}
                </div>
                <div className="min-w-0">
                  <div className="font-headline-sm text-[14px] text-primary font-semibold truncate">
                    {t.name}
                  </div>
                  <div className="text-[11px] text-on-surface-variant truncate font-sans">
                    {t.role}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[11px] font-mono text-emerald-400 font-medium">
                  {t.retainer}
                </div>
                <div className="text-[10px] text-on-surface-variant font-mono">
                  {t.roster}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

