
export default function PillarsSection() {
  return (
    <section className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin py-20" id="pillars">
      <div className="flex flex-col items-center text-center mb-16">
        <span className="font-label-md text-label-md uppercase tracking-wider text-secondary mb-2">
          What Makes It Powerful
        </span>
        <h2 className="font-headline-lg text-headline-lg text-primary max-w-3xl">
          5 things Cadence handles so you don't have to.
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-xl mt-3">
          Every feature is built around one goal: give coaches more time with clients and less time on admin.
        </p>
      </div>

      {/* 5 Bento Modules */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* PILLAR 01: Anti-Churn Early Warning (7 cols) */}
        <div className="md:col-span-7 rounded-3xl bg-surface-container p-8 md:p-10 flex flex-col justify-between shadow-xl relative overflow-hidden group border border-surface-container-highest/30">
          <div className="flex items-center justify-between mb-8">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-mono">
              Feature 01
            </span>
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
              notifications_active
            </span>
          </div>
          <div>
            <h3 className="font-headline-md text-headline-md text-primary mb-3">
              Know When a Client Is About to Quit — Before They Do
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-lg leading-relaxed mb-6">
              Clients rarely cancel out of nowhere. They first miss a check-in, then go quiet. Cadence
              watches for these signals and alerts you immediately — so a single timely message from you
              can save a $1,200–$2,800/mo relationship before it walks out the door.
            </p>
          </div>

          {/* Inline Visual Element */}
          <div className="w-full p-4 rounded-2xl bg-surface-container-low flex flex-col gap-3 border border-surface-container-highest/30">
            <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant">
              <span>CLIENT ACTIVITY TRACKER</span>
              <span className="text-secondary font-bold">CLIENT WENT DARK (4 DAYS INACTIVE)</span>
            </div>
            <div className="w-full h-10 flex items-end gap-1">
              <span className="w-1/12 h-[90%] bg-primary/80 rounded-t" />
              <span className="w-1/12 h-[85%] bg-primary/80 rounded-t" />
              <span className="w-1/12 h-[95%] bg-primary/80 rounded-t" />
              <span className="w-1/12 h-[80%] bg-primary/80 rounded-t" />
              <span className="w-1/12 h-[75%] bg-primary/80 rounded-t" />
              <span className="w-1/12 h-[70%] bg-primary/80 rounded-t" />
              <span className="w-1/12 h-[55%] bg-secondary/80 rounded-t" />
              <span className="w-1/12 h-[40%] bg-secondary/80 rounded-t" />
              <span className="w-1/12 h-[35%] bg-secondary/90 rounded-t animate-pulse" />
              <span className="w-1/12 h-[65%] bg-surface-container-highest rounded-t" />
              <span className="w-1/12 h-[80%] bg-surface-container-highest rounded-t" />
              <span className="w-1/12 h-[90%] bg-surface-container-highest rounded-t" />
            </div>
          </div>
        </div>

        {/* PILLAR 02: Dedicated Coach Link (5 cols) */}
        <div className="md:col-span-5 rounded-3xl bg-surface-container p-8 md:p-10 flex flex-col justify-between shadow-xl relative overflow-hidden group border border-surface-container-highest/30">
          <div className="flex items-center justify-between mb-8">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-mono">
              Feature 02
            </span>
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
              link
            </span>
          </div>
          <div>
            <h3 className="font-headline-md text-headline-md text-primary mb-3">Your Own Professional Coach Link</h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-6">
              Send new clients one clean link — <code className="text-secondary-fixed">cadence.app/yourname</code>. They fill
              in their details, enter payment, and land straight in their own client portal. No forms to email,
              no Calendly to set up, no onboarding spreadsheet to manage.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-surface-container-low flex items-center justify-between border border-surface-container-highest/30">
            <span className="font-mono text-sm text-primary">cadence.app/alexander-stone</span>
            <span className="material-symbols-outlined text-secondary text-sm">check_circle</span>
          </div>
        </div>

        {/* PILLAR 03: Automated Stripe Invoicing (4 cols) */}
        <div className="md:col-span-4 rounded-3xl bg-surface-container p-8 flex flex-col justify-between shadow-xl group border border-surface-container-highest/30">
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-mono">
                Feature 03
              </span>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
                credit_card
              </span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-primary mb-2 font-medium">
              Get Paid Every Month — Automatically
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Set your monthly retainer once. Stripe charges every client on their billing date —
              with smart retries if a card fails. Elena's $1,200. Sarah's $1,500. Alexander's $2,800.
              All collected without a single text from you.
            </p>
          </div>
          <div className="mt-8 pt-4 flex items-center gap-2 text-xs text-secondary-fixed border-t border-surface-container-highest/20">
            <span className="material-symbols-outlined text-[16px]">lock</span>
            Never chase a payment again
          </div>
        </div>

        {/* PILLAR 04: Action Plan & Reasoning (4 cols) */}
        <div className="md:col-span-4 rounded-3xl bg-surface-container p-8 flex flex-col justify-between shadow-xl group border border-surface-container-highest/30">
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-mono">
                Feature 04
              </span>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
                edit_note
              </span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-primary mb-2 font-medium">
              Clients Follow Through When They Know Why
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Every time you update a client's goals or plan, log one sentence explaining why. That
              note lives on their dashboard. No more "why did my coach change this?" — just trust,
              clarity, and clients who actually do the work.
            </p>
          </div>
          <div className="mt-8 pt-4 flex items-center gap-2 text-xs text-secondary-fixed border-t border-surface-container-highest/20">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            Builds client trust and long-term retention
          </div>
        </div>

        {/* PILLAR 05: Video & Check-ins (4 cols) */}
        <div className="md:col-span-4 rounded-3xl bg-surface-container p-8 flex flex-col justify-between shadow-xl group border border-surface-container-highest/30">
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-mono">
                Feature 05
              </span>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
                video_camera_front
              </span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-primary mb-2 font-medium">
              1-on-1 Video Calls, Built Right In
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Launch a private video call with any client directly from their file — their goals, notes,
              and last check-in visible right beside you. Weekly check-in forms keep progress on track
              between sessions. No Zoom links. No copy-pasting. No tab-switching.
            </p>
          </div>
          <div className="mt-8 pt-4 flex items-center gap-2 text-xs text-secondary-fixed border-t border-surface-container-highest/20">
            <span className="material-symbols-outlined text-[16px]">videocam</span>
            Everything in one screen — client file + live call
          </div>
        </div>
      </div>
    </section>
  );
}
