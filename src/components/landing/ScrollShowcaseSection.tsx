import { useState, useEffect, useRef } from 'react';
import type { AppView } from '../../App';

interface ScrollShowcaseSectionProps {
  onNavigate?: (view: AppView) => void;
}

interface ActData {
  actIndex: number;
  sidebarActiveItem: string;
  cursorTargetAction: { x: number; y: number; label: string };
}

const ACTS: ActData[] = [
  {
    actIndex: 0,
    sidebarActiveItem: 'clients',
    cursorTargetAction: { x: 68, y: 265, label: "Review Alexander's $45k Milestone" },
  },
  {
    actIndex: 1,
    sidebarActiveItem: 'ai',
    cursorTargetAction: { x: 68, y: 390, label: 'Send Action Plan to Sarah' },
  },
  {
    actIndex: 2,
    sidebarActiveItem: 'retainers',
    cursorTargetAction: { x: 68, y: 310, label: 'Live Stripe Transaction Feed' },
  },
];

const SIDEBAR_ITEMS = [
  { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
  { id: 'clients', icon: 'people', label: 'Clients' },
  { id: 'ai', icon: 'auto_awesome', label: 'AI Studio' },
  { id: 'documents', icon: 'description', label: 'Documents' },
  { id: 'retainers', icon: 'credit_card', label: 'Retainers' },
  { id: 'schedule', icon: 'event', label: 'Schedule' },
  { id: 'settings', icon: 'settings', label: 'Settings' },
];

export default function ScrollShowcaseSection({ onNavigate: _onNavigate }: ScrollShowcaseSectionProps) {
  const [activeActIndex, setActiveActIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [cursorPos, setCursorPos] = useState({ x: 68, y: 148 });
  const [isClicking, setIsClicking] = useState(false);
  const [clickRipple, setClickRipple] = useState(false);
  const [actionPlanSent, setActionPlanSent] = useState(false);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-play: cycle through acts every 5s smoothly
  const startAutoPlay = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(() => {
      setActiveActIndex((prev) => (prev + 1) % 3);
    }, 5000);
  };

  useEffect(() => {
    startAutoPlay();
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manual tab click restarts timer
  const handleTabClick = (index: number) => {
    setActiveActIndex(index);
    startAutoPlay();
  };

  // Choreographed cursor per act
  useEffect(() => {
    const act = ACTS[activeActIndex];
    if (activeActIndex !== 1) setActionPlanSent(false);

    setCursorPos({ x: 8, y: 200 });

    const t1 = setTimeout(() => {
      setIsClicking(true); setClickRipple(true);
      setTimeout(() => { setIsClicking(false); setClickRipple(false); }, 350);
    }, 500);

    const t2 = setTimeout(() => {
      setCursorPos({ x: act.cursorTargetAction.x, y: act.cursorTargetAction.y - 80 });
    }, 900);

    const t3 = setTimeout(() => {
      setCursorPos({ x: act.cursorTargetAction.x, y: act.cursorTargetAction.y });
    }, 1800);

    const t4 = setTimeout(() => {
      setIsClicking(true); setClickRipple(true);
      if (activeActIndex === 1) setActionPlanSent(true);
      setTimeout(() => { setIsClicking(false); setClickRipple(false); }, 450);
    }, 2700);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [activeActIndex]);

  const activeSidebarItem = ACTS[activeActIndex].sidebarActiveItem;
  const activeLabel = ACTS[activeActIndex].cursorTargetAction.label;

  return (
    <section
      ref={containerRef}
      className="relative w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 py-16 md:py-28"
      id="how-it-works"
    >
      {/* Section Label */}
      <div className="flex flex-col items-center text-center mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1a1b20] border border-[#ffb4a3]/30 font-space text-[11px] text-[#ffdad2] uppercase tracking-wider mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4a3] animate-pulse" />
          <span>Interactive Product Walkthrough</span>
        </div>
        <h2 className="font-headline-lg text-headline-lg text-primary max-w-3xl">
          See how Cadence runs your practice on autopilot.
        </h2>
        <p className="text-sm sm:text-base text-[#958ea0] font-sans max-w-xl mt-4">
          Scroll to watch check-ins, AI action plans, and retainer auto-debits work together.
        </p>
      </div>

      {/* ── Browser Window ── */}
      <div className="relative rounded-2xl overflow-hidden border border-[#292a2e] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.95)] bg-[#0d0e12]">

        {/* Ambient glow */}
        <div className="absolute -inset-2 bg-gradient-to-br from-[#ffb4a3]/8 via-transparent to-[#4edea3]/8 rounded-3xl blur-3xl pointer-events-none -z-10" />

        {/* Browser Top Chrome */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-[#070809] border-b border-[#1e1f24]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
            </div>
            <div className="flex items-center gap-1.5 pl-3 border-l border-[#1e1f24]">
              <svg className="w-3 h-3 text-[#4edea3]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
              </svg>
              <span className="font-mono text-[11px] text-[#958ea0]">
                <span className="text-[#ffdad2] font-semibold">cadence.app</span>
                <span className="text-[#4a4855]"> / coach_workspace</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1a1b20] border border-[#292a2e]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#4edea3] font-bold">Live Simulation</span>
          </div>
        </div>

        {/* GPU-composited butter-smooth auto-play progress bar */}
        <div className="h-[2.5px] w-full bg-[#1e1f24] overflow-hidden relative">
          <div
            key={`top-progress-${activeActIndex}`}
            className="h-full w-full bg-gradient-to-r from-[#ffb4a3] via-[#ff957b] to-[#e85a2b] origin-left"
            style={{
              animation: 'cadenceProgressFill 5000ms linear forwards',
            }}
          />
        </div>

        {/* Inline style for smooth 60fps hardware-accelerated progress animation */}
        <style>{`
          @keyframes cadenceProgressFill {
            0% { transform: scaleX(0); }
            100% { transform: scaleX(1); }
          }
        `}</style>

        {/* App Shell */}
        <div className="flex" style={{ minHeight: '520px' }}>

          {/* ── Sidebar ── */}
          <div className="w-14 sm:w-[190px] flex-shrink-0 bg-[#121317] border-r border-[#1e1f24] flex flex-col">
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-3 sm:px-4 py-4 border-b border-[#1e1f24]">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#ffb4a3] to-[#e85a2b] flex items-center justify-center flex-shrink-0">
                <span className="font-space font-black text-[11px] text-[#1a0a00]">C</span>
              </div>
              <div className="hidden sm:block">
                <div className="font-space font-bold text-xs text-[#e3e2e8]">Cadence</div>
                <div className="text-[9px] text-[#4a4855] font-mono">Coach Platform</div>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 py-3 space-y-0.5 px-1.5 sm:px-2.5">
              {SIDEBAR_ITEMS.map((item) => {
                const isActive = item.id === activeSidebarItem;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-2.5 px-2 py-2.5 rounded-xl transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#ffb4a3]/15 text-[#ffdad2]'
                        : 'text-[#4a4855] hover:text-[#958ea0]'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[18px] flex-shrink-0 ${isActive ? 'text-[#ffb4a3]' : ''}`}>
                      {item.icon}
                    </span>
                    <span className={`hidden sm:block font-space text-[11px] font-semibold ${isActive ? 'text-[#ffdad2]' : ''}`}>
                      {item.label}
                    </span>
                    {isActive && <div className="ml-auto hidden sm:block w-1.5 h-1.5 rounded-full bg-[#ffb4a3]" />}
                  </div>
                );
              })}
            </nav>

            {/* Coach profile */}
            <div className="p-2.5 sm:p-3 border-t border-[#1e1f24] flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4edea3] to-[#2ab87d] flex items-center justify-center flex-shrink-0">
                <span className="font-space font-bold text-[9px] text-[#0a1f17]">JD</span>
              </div>
              <div className="hidden sm:block min-w-0">
                <div className="font-space font-bold text-[10px] text-[#e3e2e8] truncate">James Doe</div>
                <div className="text-[9px] text-[#4a4855] font-mono">Coach · Pro Plan</div>
              </div>
            </div>
          </div>

          {/* ── Main Content ── */}
          <div className="flex-1 overflow-hidden relative bg-[#141519]">

            {/* ACT I: CLIENT CHECK-IN HUB */}
            {activeActIndex === 0 && (
              <div className="h-full flex flex-col p-5 sm:p-6 gap-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="font-space font-bold text-sm text-[#e3e2e8]">Client Check-in Hub</h1>
                    <p className="text-[10px] text-[#958ea0] font-sans mt-0.5">28 active clients · 3 need review today</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-space font-bold border border-amber-500/25 animate-pulse">
                      3 Pending
                    </span>
                    <button type="button" className="px-2.5 py-1 rounded-xl bg-[#ffb4a3]/15 text-[#ffdad2] text-[10px] font-space font-semibold border border-[#ffb4a3]/25">
                      + Add Client
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0d0e12] border border-[#292a2e] text-[11px]">
                  <span className="material-symbols-outlined text-[15px] text-[#4a4855]">search</span>
                  <span className="text-[#4a4855] font-sans">Search clients, notes, milestones…</span>
                  <span className="ml-auto px-2 py-0.5 rounded-lg bg-[#1a1b20] border border-[#292a2e] text-[#958ea0] text-[9px] font-mono">⌘K</span>
                </div>

                <div className="flex-1 rounded-xl border border-[#1e1f24] bg-[#0d0e12] overflow-hidden">
                  <div className="grid grid-cols-12 px-4 py-2.5 border-b border-[#1e1f24] bg-[#121317] text-[9px] font-space uppercase tracking-wider text-[#4a4855]">
                    <div className="col-span-4">Client</div>
                    <div className="col-span-5 hidden sm:block">Latest Check-in</div>
                    <div className="col-span-2 hidden sm:block">Retainer</div>
                    <div className="col-span-8 sm:col-span-1 text-right">Status</div>
                  </div>

                  {/* Row 1 */}
                  <div className="grid grid-cols-12 px-4 py-3 border-b border-[#1e1f24]/60 hover:bg-[#1a1b20]/50 transition-colors items-center">
                    <div className="col-span-4 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#4edea3]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#4edea3] font-bold text-[9px]">SJ</span>
                      </div>
                      <div>
                        <div className="font-space font-bold text-[11px] text-[#e3e2e8]">Sarah Jenkins</div>
                        <div className="text-[9px] text-[#4a4855]">Sequoia Capital · Partner</div>
                      </div>
                    </div>
                    <div className="col-span-5 hidden sm:block text-[10px] text-[#cbc3d7] pr-2 leading-snug">
                      "Hired new VP of Ops. Need help finalizing our 5-slide Q4 deck."
                    </div>
                    <div className="col-span-2 hidden sm:block font-mono font-bold text-[11px] text-[#e3e2e8]">$1,500/mo</div>
                    <div className="col-span-8 sm:col-span-1 flex justify-end">
                      <span className="px-2 py-0.5 rounded-full bg-[#4edea3]/15 text-[#4edea3] text-[9px] font-space font-bold border border-[#4edea3]/30">Done</span>
                    </div>
                  </div>

                  {/* Row 2 — Cursor target */}
                  <div className={`grid grid-cols-12 px-4 py-3 border-b border-[#1e1f24]/60 items-center transition-all duration-500 ${
                    cursorPos.y > 220 && cursorPos.y < 320 ? 'bg-[#ffb4a3]/10 border-l-2 border-l-[#ffb4a3]' : 'hover:bg-[#1a1b20]/50'
                  }`}>
                    <div className="col-span-4 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#ffb4a3]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#ffb4a3] font-bold text-[9px]">AW</span>
                      </div>
                      <div>
                        <div className="font-space font-bold text-[11px] text-[#ffdad2]">Alexander Wright</div>
                        <div className="text-[9px] text-[#4a4855]">B2B Growth Advisory</div>
                      </div>
                    </div>
                    <div className="col-span-5 hidden sm:block text-[10px] text-[#e3e2e8] font-medium pr-2 leading-snug">
                      "Closed 2 enterprise deals! Hit $45k monthly milestone this week."
                    </div>
                    <div className="col-span-2 hidden sm:block font-mono font-bold text-[11px] text-[#e3e2e8]">$2,800/mo</div>
                    <div className="col-span-8 sm:col-span-1 flex justify-end">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-space font-bold border border-amber-500/30 animate-pulse">Review</span>
                    </div>
                  </div>

                  {/* Row 3 */}
                  <div className="grid grid-cols-12 px-4 py-3 items-center hover:bg-[#1a1b20]/50 transition-colors">
                    <div className="col-span-4 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-300 font-bold text-[9px]">ER</span>
                      </div>
                      <div>
                        <div className="font-space font-bold text-[11px] text-[#e3e2e8]">Elena Rostova</div>
                        <div className="text-[9px] text-[#4a4855]">Career Transition</div>
                      </div>
                    </div>
                    <div className="col-span-5 hidden sm:block text-[10px] text-[#cbc3d7] pr-2 leading-snug">
                      "Offer letter received! Need advice negotiating equity package."
                    </div>
                    <div className="col-span-2 hidden sm:block font-mono font-bold text-[11px] text-[#e3e2e8]">$1,200/mo</div>
                    <div className="col-span-8 sm:col-span-1 flex justify-end">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 text-[9px] font-space font-bold border border-indigo-500/30">Call Booked</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-[#958ea0]">
                  <span className="material-symbols-outlined text-[13px] text-[#ffb4a3]">auto_awesome</span>
                  Cadence AI surfaced Alexander Wright — $45k milestone signals high-value moment for review.
                </div>
              </div>
            )}

            {/* ACT II: AI ACTION PLANS */}
            {activeActIndex === 1 && (
              <div className="h-full flex flex-col p-5 sm:p-6 gap-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="font-space font-bold text-sm text-[#e3e2e8]">AI Coaching Studio</h1>
                    <p className="text-[10px] text-[#958ea0] mt-0.5">Session with Sarah Jenkins · 45-min strategy call</p>
                  </div>
                  <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#4edea3]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
                    Ready to send to client
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0d0e12] border border-amber-500/30 gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-bold text-black text-sm flex-shrink-0">✦</div>
                    <div>
                      <div className="font-space font-bold text-xs text-[#e3e2e8] flex items-center gap-2">
                        AI Coaching Assistant
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">Call Summarized</span>
                      </div>
                      <div className="text-[9px] text-[#958ea0] mt-0.5">Listening to 45-min strategy session with Sarah Jenkins &amp; drafting her action plan</div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Left: Takeaways */}
                  <div className="p-4 rounded-xl bg-[#0d0e12] border border-[#1e1f24] flex flex-col gap-3">
                    <div className="text-[10px] font-space font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[13px]">lightbulb</span>
                      Key Takeaways from Sarah's Check-in
                    </div>
                    <div className="space-y-2 text-[10px] leading-relaxed flex-1">
                      <div className="p-2 rounded-lg bg-[#141519] border border-[#1e1f24]">
                        <span className="font-bold text-[#e3e2e8]">Top Win:</span>
                        <span className="text-[#cbc3d7]"> Finalized hiring VP of Operations.</span>
                      </div>
                      <div className="p-2 rounded-lg bg-[#141519] border border-[#ffdad2]/10">
                        <span className="font-bold text-[#ffdad2]">Main Blocker:</span>
                        <span className="text-[#cbc3d7]"> Still spending 14 hrs/week answering routine team Slack questions.</span>
                      </div>
                      <div className="p-2 rounded-lg bg-[#141519] border border-[#1e1f24]">
                        <span className="font-bold text-[#e3e2e8]">Coach Recommendation:</span>
                        <span className="text-[#cbc3d7]"> Share delegation rubric and protect 3 hours for board deck prep.</span>
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-[#141519] border border-[#1e1f24] text-[9px] text-[#958ea0] flex items-center gap-1.5 font-mono">
                      <span className="material-symbols-outlined text-[13px] text-[#ffb4a3]">mic</span>
                      Audio voice note brief ready for WhatsApp
                    </div>
                  </div>

                  {/* Right: Action Plan */}
                  <div className="p-4 rounded-xl bg-[#0d0e12] border border-[#1e1f24] flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-space font-bold text-[#e3e2e8] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-[#4edea3]">check_circle</span>
                        Sarah's 7-Day Action Plan
                      </div>
                      <span className="text-[9px] font-mono text-[#4a4855]">Week 4 of 12</span>
                    </div>
                    <div className="space-y-1.5 flex-1 text-[10px]">
                      <div className="p-2 rounded-lg bg-[#141519] border border-[#1e1f24] flex items-start gap-1.5">
                        <span className="text-[#4edea3] font-bold flex-shrink-0">1.</span>
                        <span className="text-[#cbc3d7]"><strong>Delegate daily Slack standups</strong> to new Operations Lead (frees 2.5 hrs/day).</span>
                      </div>
                      <div className="p-2 rounded-lg bg-[#141519] border border-[#1e1f24] flex items-start gap-1.5">
                        <span className="text-amber-300 font-bold flex-shrink-0">2.</span>
                        <span className="text-[#cbc3d7]"><strong>Draft 5-slide Q4 deck</strong> using the board template provided in portal.</span>
                      </div>
                      <div className="p-2 rounded-lg bg-[#141519] border border-[#1e1f24] flex items-start gap-1.5">
                        <span className="text-[#ffb4a3] font-bold flex-shrink-0">3.</span>
                        <span className="text-[#cbc3d7]"><strong>Thursday 10:00 AM</strong> 1-on-1 strategy call with coach.</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`w-full py-2.5 rounded-xl font-space text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        actionPlanSent
                          ? 'bg-[#003824] text-[#4edea3] border border-[#4edea3]/40'
                          : isClicking && cursorPos.y > 350
                          ? 'bg-[#ffdad2] text-[#3a0900] scale-95'
                          : 'bg-[#ffb4a3] text-[#3a0900] hover:bg-[#ffdad2]'
                      }`}
                    >
                      {actionPlanSent ? (
                        <><span className="material-symbols-outlined text-[15px]">verified</span>Action Plan Dispatched to Sarah ✓</>
                      ) : (
                        <>Send Action Plan to Sarah<span className="material-symbols-outlined text-[15px]">send</span></>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ACT III: RETAINERS / STRIPE */}
            {activeActIndex === 2 && (
              <div className="h-full flex flex-col p-5 sm:p-6 gap-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="font-space font-bold text-sm text-[#e3e2e8]">Automated Retainers</h1>
                    <p className="text-[10px] text-[#958ea0] mt-0.5">Stripe Auto-Debit · 100% collected on 1st of month</p>
                  </div>
                  <button type="button" className="px-2.5 py-1 rounded-xl bg-[#ffb4a3]/15 text-[#ffdad2] text-[10px] font-space font-semibold border border-[#ffb4a3]/25">
                    + New Retainer
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#0d0e12] border border-[#1e1f24]">
                    <div className="text-[9px] uppercase tracking-wider text-[#4a4855] font-space">Coaching MRR</div>
                    <div className="text-xl font-space font-bold text-[#e3e2e8] mt-1">$18,450</div>
                    <div className="text-[9px] text-[#4edea3] font-mono mt-0.5">↑ 22% this quarter</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#0d0e12] border border-[#1e1f24]">
                    <div className="text-[9px] uppercase tracking-wider text-[#4a4855] font-space">Active Clients</div>
                    <div className="text-xl font-space font-bold text-[#e3e2e8] mt-1">28</div>
                    <div className="text-[9px] text-[#4a4855] font-mono mt-0.5">100% card debit</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#0d0e12] border border-[#1e1f24]">
                    <div className="text-[9px] uppercase tracking-wider text-[#4a4855] font-space">Payment Chasing</div>
                    <div className="text-xl font-space font-bold text-[#4edea3] mt-1">0 Days</div>
                    <div className="text-[9px] text-[#4edea3] font-mono mt-0.5">Zero awkward texts</div>
                  </div>
                </div>

                <div className="flex-1 rounded-xl border border-[#1e1f24] bg-[#0d0e12] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e1f24] bg-[#121317]">
                    <span className="text-[9px] font-space uppercase tracking-widest text-[#4a4855]">Live Stripe Billing Stream</span>
                    <span className="flex items-center gap-1.5 text-[9px] text-[#4edea3] font-mono font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
                      Auto-Debit Active
                    </span>
                  </div>

                  <div className={`flex items-center justify-between p-4 border-b border-[#1e1f24]/60 transition-all ${
                    cursorPos.y > 270 && cursorPos.y < 360 ? 'bg-[#4edea3]/8 border-l-2 border-l-[#4edea3]' : 'hover:bg-[#1a1b20]/40'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#4edea3]/15 text-[#4edea3] flex items-center justify-center font-bold text-[11px] flex-shrink-0">✓</div>
                      <div>
                        <div className="font-space font-bold text-[11px] text-[#e3e2e8]">Sarah Jenkins — Performance Retainer</div>
                        <div className="text-[9px] text-[#4a4855] font-mono">Invoice #INV-2026-11 · Auto-Debited · Visa •••• 7721</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-[#4edea3] text-xs">+$1,500.00</div>
                      <div className="text-[9px] text-[#4a4855]">Just now</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border-b border-[#1e1f24]/60 hover:bg-[#1a1b20]/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#ffb4a3]/15 text-[#ffb4a3] flex items-center justify-center font-bold text-[11px] flex-shrink-0">★</div>
                      <div>
                        <div className="font-space font-bold text-[11px] text-[#e3e2e8]">Alexander Wright — Quarterly B2B Advisory</div>
                        <div className="text-[9px] text-[#4a4855] font-mono">Invoice #CAD-1091 · 3-Month Retainer Auto-Renewed</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-[#e3e2e8] text-xs">+$8,400.00</div>
                      <div className="text-[9px] text-[#4a4855]">Today 09:14 AM</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 hover:bg-[#1a1b20]/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/15 text-indigo-300 flex items-center justify-center font-bold text-[11px] flex-shrink-0">★</div>
                      <div>
                        <div className="font-space font-bold text-[11px] text-[#e3e2e8]">Elena Rostova — Career Transition Coaching</div>
                        <div className="text-[9px] text-[#4a4855] font-mono">Invoice #CAD-1088 · Monthly Retainer · Amex •••• 4521</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-[#e3e2e8] text-xs">+$1,200.00</div>
                      <div className="text-[9px] text-[#4a4855]">Today 09:00 AM</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[9px] text-[#4a4855] font-mono">
                  <span>🔒 Stripe PCI-DSS Level 1 · 256-Bit SSL Encrypted Vault</span>
                  <span className="text-[#4edea3]">Chase Payout: Settled ✓</span>
                </div>
              </div>
            )}

            {/* FLOATING CURSOR */}
            <div
              className="absolute pointer-events-none z-30 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
              style={{
                left: `${cursorPos.x}%`,
                top: `${cursorPos.y}px`,
                transform: `translate(-2px,-2px) ${isClicking ? 'scale(0.82)' : 'scale(1)'}`,
              }}
            >
              {clickRipple && (
                <span className="absolute -top-4 -left-4 w-12 h-12 rounded-full border-2 border-[#ffb4a3] bg-[#ffb4a3]/20 animate-ping pointer-events-none" />
              )}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="drop-shadow-[0_4px_14px_rgba(0,0,0,0.9)]">
                <path d="M5.5 2V19.5L9.8 15.2L13.5 22.8L16.2 21.5L12.5 14H18.5L5.5 2Z" fill="#ffb4a3" stroke="#0d0e12" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
              <span className="absolute left-5 top-3 whitespace-nowrap px-2 py-0.5 rounded-full bg-[#1a1b20] border border-[#ffb4a3]/40 text-[9px] font-space font-bold text-[#ffdad2] shadow-lg">
                {activeLabel}
              </span>
            </div>

          </div>
          {/* /Main Content */}
        </div>
        {/* /App Shell */}

        {/* Tab switcher strip at the bottom */}
        <div className="grid grid-cols-3 border-t border-[#1e1f24] bg-[#0d0e12]">
          {(['Client Check-in Hub', 'AI 1-on-1 Action Plans', 'Automated Retainers'] as const).map((label, idx) => {
            const isActive = activeActIndex === idx;
            return (
              <button
                key={label}
                type="button"
                onClick={() => handleTabClick(idx)}
                className={`py-3 px-2 text-center font-space text-[10px] sm:text-[11px] font-semibold transition-all relative cursor-pointer overflow-hidden ${
                  isActive ? 'text-[#ffdad2] bg-[#141519]/70' : 'text-[#4a4855] hover:text-[#958ea0] hover:bg-[#121317]'
                }`}
              >
                <span className="relative z-10">{label}</span>
                {isActive && (
                  <div
                    key={`tab-progress-${activeActIndex}`}
                    className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#ffb4a3] to-[#e85a2b] origin-left"
                    style={{
                      animation: 'cadenceProgressFill 5000ms linear forwards',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
      {/* /Browser Window */}
    </section>
  );
}
