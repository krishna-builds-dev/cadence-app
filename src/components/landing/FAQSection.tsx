import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: 'Do my clients have to download an app or create a password?',
    answer:
      'No. Your clients receive their own private, branded link (cadence.app/your-name). It opens instantly in mobile Safari or Chrome with zero friction. They can submit weekly check-ins, view their action plans, and access their billing portal without ever visiting an app store or remembering a password.',
  },
  {
    question: 'How do payments work? Does Cadence take a percentage of my revenue?',
    answer:
      'Zero platform fees on client payments. You connect your own Stripe account with a single click. 100% of your retainers deposit directly into your bank account on your normal Stripe payout schedule. Cadence only charges the flat monthly subscription for your software seat.',
  },
  {
    question: 'How easy is it to migrate my existing client roster from Google Sheets or Airtable?',
    answer:
      'You can paste or upload your existing client list in under 3 minutes during onboarding. If you are on our Pro or Studio plan, our team will even migrate your entire spreadsheet roster, past client notes, and billing schedules for you at no charge.',
  },
  {
    question: 'How does the anti-churn early warning system detect at-risk clients?',
    answer:
      'Cadence monitors check-in cadence and activity timelines. If a client skips a weekly check-in or has not logged activity for 4+ days, an alert surfaces on your coach hub before they cool off. You get a one-click prompt to send a targeted note or check-in nudge while there is still time to retain them.',
  },
  {
    question: 'Can I still use my own Zoom or Google Meet links if I prefer?',
    answer:
      'Yes. Cadence includes private 1-on-1 video calls directly inside the client workspace (no Zoom required), but you are free to add your own Zoom, Google Meet, or Calendly links to any client profile or session invite whenever you prefer.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full max-w-4xl mx-auto px-margin-mobile lg:px-margin py-20" id="faq">
      <div className="flex flex-col items-center text-center mb-14">
        <span className="font-label-md text-label-md uppercase tracking-wider text-secondary mb-2">
          Frequently Asked Questions
        </span>
        <h2 className="font-headline-lg text-headline-lg text-primary max-w-2xl">
          Everything you need to know before moving your practice to Cadence.
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-lg mt-3">
          Have another question? Reach out to our team anytime via live chat or during your 14-day trial.
        </p>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`rounded-2xl transition-all border ${
                isOpen
                  ? 'bg-surface-container border-secondary/30 shadow-lg'
                  : 'bg-surface-container-low hover:bg-surface-container border-surface-container-highest/30'
              }`}
            >
              <button
                onClick={() => toggleFAQ(idx)}
                className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                aria-expanded={isOpen}
              >
                <span className="font-headline-sm text-[16px] text-primary font-medium">
                  {faq.question}
                </span>
                <span
                  className={`material-symbols-outlined text-[20px] text-secondary transition-transform duration-200 shrink-0 ${
                    isOpen ? 'rotate-180 text-primary' : ''
                  }`}
                >
                  expand_more
                </span>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0 text-on-surface-variant font-body-sm text-[13.5px] leading-relaxed border-t border-surface-container-highest/20 mt-1 pt-3 animate-fadeIn">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

