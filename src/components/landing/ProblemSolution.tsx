
export default function ProblemSolution() {
  return (
    <section className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin py-20" >
      <div className="flex flex-col items-center text-center mb-16">
        <span className="font-label-md text-label-md uppercase tracking-widest text-secondary mb-2">
          Why Coaches Switch
        </span>
        <h2 className="font-headline-lg text-headline-lg text-primary max-w-3xl">
          Juggling 5 different tools is hurting your business.
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-xl mt-3">
          Coaches burn 3–4 hours every day on admin tasks, while clients lose messages and quietly drop off.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter items-stretch">
        {/* The Broken Way */}
        <div className="p-8 md:p-10 rounded-3xl bg-surface-container-lowest flex flex-col justify-between shadow-xl relative overflow-hidden border border-surface-container-highest/30">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-error-container/40 text-error font-label-sm text-label-sm mb-4">
              <span className="material-symbols-outlined text-[14px]">close</span>
              The Fragmented Way
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Admin Chaos &amp; Silent Churn</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Duct-taping Google Sheets, WhatsApp, Calendly, and manual bank transfers — all disconnected.
            </p>
          </div>

          <div className="space-y-4 my-6">
            <div className="flex items-start gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5">warning</span>
              <span className="font-body-sm text-body-sm">
                <strong className="text-on-surface">Missed Check-ins:</strong> Alexander Wright hit his
                $45k milestone — but his update sat unread in a Google Sheet for 4 days with no coach response.
              </span>
            </div>
            <div className="flex items-start gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5">warning</span>
              <span className="font-body-sm text-body-sm">
                <strong className="text-on-surface">Buried Requests:</strong> Sarah Jenkins asked for
                help on her Q4 board deck over WhatsApp — lost in a 200-message thread. Deadline missed.
              </span>
            </div>
            <div className="flex items-start gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5">warning</span>
              <span className="font-body-sm text-body-sm">
                <strong className="text-on-surface">Missed &amp; Late Payments:</strong> Elena Rostova's
                $1,200 retainer went unpaid — chased manually over text for the third time this month.
              </span>
            </div>
          </div>

          <div className="pt-6 font-label-sm text-label-sm uppercase tracking-wider text-error border-t border-surface-container-highest/20">
            Result: Burnout &amp; High Client Turnover
          </div>
        </div>

        {/* The Cadence Way */}
        <div className="p-8 md:p-10 rounded-3xl bg-surface-container flex flex-col justify-between shadow-2xl relative overflow-hidden border border-surface-container-highest/40">
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-secondary-container/20 rounded-full blur-[80px] pointer-events-none" />
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-highest text-primary font-label-sm text-label-sm mb-4">
              <span className="material-symbols-outlined text-secondary text-[14px]">check_circle</span>
              The Cadence Way
            </div>
            <h3 className="font-headline-md text-headline-md text-primary mb-2">One Dashboard. Zero Missed Signals.</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Check-in hub, action plans, and automated retainers — managed in one professional dashboard.
            </p>
          </div>

          <div className="space-y-4 my-6">
            <div className="flex items-start gap-3 text-on-surface">
              <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">verified</span>
              <span className="font-body-sm text-body-sm">
                <strong className="text-primary">Client Check-in Hub:</strong> Alexander's milestone
                check-in surfaced the moment he submitted it. Scaling Playbook v2 sent within the hour — replaces messy spreadsheets.
              </span>
            </div>
            <div className="flex items-start gap-3 text-on-surface">
              <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">verified</span>
              <span className="font-body-sm text-body-sm">
                <strong className="text-primary">AI 1-on-1 Action Plans:</strong> Sarah's Q4 board deck
                request was turned into an action plan instantly. Session booked before the Friday deadline — no WhatsApp needed.
              </span>
            </div>
            <div className="flex items-start gap-3 text-on-surface">
              <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">verified</span>
              <span className="font-body-sm text-body-sm">
                <strong className="text-primary">Automated Monthly Retainers:</strong> Elena's $1,200
                was auto-debited by Stripe on her billing date. No awkward texts. You get paid like clockwork.
              </span>
            </div>
          </div>

          <div className="pt-6 font-label-sm text-label-sm uppercase tracking-wider text-secondary border-t border-surface-container-highest/30">
            Result: 3x Longer Client Lifespans &amp; Zero Admin Headache
          </div>
        </div>
      </div>
    </section>
  );
}
