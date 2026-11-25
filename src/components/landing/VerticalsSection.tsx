
export default function VerticalsSection() {
  return (
    <section className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin py-20" id="verticals">
      <div className="flex flex-col items-center text-center mb-16">
        <span className="font-label-md text-label-md uppercase tracking-wider text-secondary mb-2">
          Built For 1-on-1 Professionals
        </span>
        <h2 className="font-headline-lg text-headline-lg text-primary max-w-3xl">
          If you coach clients 1-on-1, Cadence was built for you.
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-xl mt-3">
          No scattered check-ins, missed payments, or lost threads. Just one clean workspace for your high-ticket clients.
        </p>
      </div>

      {/* Vertical Cards Grid - 4 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {/* Card 1 — Executive & Leadership */}
        <div className="p-6 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col border border-surface-container-highest/30">
          <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary mb-4">
            <span className="material-symbols-outlined">business_center</span>
          </div>
          <h4 className="font-headline-sm text-[18px] text-primary mb-2 font-medium">Executive &amp; Leadership</h4>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            Capture weekly executive priorities, review board slide drafts, and organize leadership agendas in one secure space. Never lose crucial decision notes in buried email chains or messy chat threads.
          </p>
        </div>

        {/* Card 2 — Career & Business Mentors */}
        <div className="p-6 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col border border-surface-container-highest/30">
          <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary mb-4">
            <span className="material-symbols-outlined">trending_up</span>
          </div>
          <h4 className="font-headline-sm text-[18px] text-primary mb-2 font-medium">Career &amp; Business Mentors</h4>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            Surface client revenue wins the moment they happen, deliver targeted sprint playbooks, and map promotion milestones. Keep momentum moving fast between calls with real-time progress check-ins.
          </p>
        </div>

        {/* Card 3 — Life & Mindset Coaches */}
        <div className="p-6 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col border border-surface-container-highest/30">
          <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary mb-4">
            <span className="material-symbols-outlined">psychology</span>
          </div>
          <h4 className="font-headline-sm text-[18px] text-primary mb-2 font-medium">Life &amp; Mindset Coaches</h4>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            Run weekly reflection check-ins, monitor habit streaks, and identify slipping motivation before clients go quiet. Re-engage at-risk clients early with personalized notes that rebuild accountability.
          </p>
        </div>

        {/* Card 4 — Health & Wellness Specialists */}
        <div className="p-6 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col border border-surface-container-highest/30">
          <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary mb-4">
            <span className="material-symbols-outlined">self_improvement</span>
          </div>
          <h4 className="font-headline-sm text-[18px] text-primary mb-2 font-medium">Health &amp; Wellness Specialists</h4>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            Deliver tailored wellness protocols, document the reasoning behind every plan adjustment, and track routine adherence. Collect monthly client retainers automatically without chasing invoices.
          </p>
        </div>
      </div>
    </section>
  );
}
