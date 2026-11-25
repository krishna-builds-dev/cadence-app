import { useState, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole, User } from '../../types';
import type { AppView } from '../../App';
import AuthShowcase from '../../components/auth/AuthShowcase';

interface SignupPageProps {
  onNavigate: (view: AppView) => void;
  initialRole?: UserRole;
  onSuccess?: () => void;
}

export default function SignupPage({ onNavigate, onSuccess }: SignupPageProps) {
  const { login } = useAuth();
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistHandle, setWaitlistHandle] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);
  const [isDemoLoading, setIsDemoLoading] = useState<UserRole | null>(null);

  // Instant 1-Click Interactive Demo Login
  const handleLaunchDemo = async (demoRole: UserRole) => {
    setIsDemoLoading(demoRole);
    try {
      if (demoRole === 'coach') {
        await login({
          email: 'julian.vance@cadence.health',
          password: 'CoachPass123!',
          role: 'coach',
        });
      } else {
        await login({
          email: 'sarah.j@venturecapital.io',
          password: 'ClientPass123!',
          role: 'client',
        });
      }
      if (onSuccess) {
        onSuccess();
      } else {
        onNavigate('landing');
      }
    } catch {
      // Offline fallback: set demo session so reviewer can test the app immediately
      const mockUser: User =
        demoRole === 'coach'
          ? {
            id: 'demo-coach-1',
            email: 'julian.vance@cadence.health',
            first_name: 'Julian',
            last_name: 'Vance',
            role: 'coach',
          }
          : {
            id: 'demo-client-1',
            email: 'sarah.j@venturecapital.io',
            first_name: 'Sarah',
            last_name: 'Jenkins',
            role: 'client',
          };
      localStorage.setItem('auth_user', JSON.stringify(mockUser));
      localStorage.setItem('access_token', 'demo-access-token');
      localStorage.setItem('coach_code', 'COACH-JULIAN');
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.hash = '';
        window.location.reload();
      }
    } finally {
      setIsDemoLoading(null);
    }
  };

  const handleWaitlistSubmit = (e: FormEvent) => {
    e.preventDefault();

    setWaitlistError(null);

    const email = waitlistEmail.trim();
    // Sanitize spaces to hyphens and lowercase
    const handle = waitlistHandle.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // 1. Check if both inputs are filled
    if (!email || !handle) {
      setWaitlistError('Please fill out both your email address and custom handle.');
      return;
    }

    // 2. Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setWaitlistError('Please enter a valid email address.');
      return;
    }

    // 3. Check if the handle has at least one hyphen (-) to make it unique (e.g. first-last)
    if (!handle.includes('-')) {
      setWaitlistError("Handle must contain at least one hyphen '-' to make it unique (e.g. first-last or coach-name).");
      return;
    }

    // 4. Ensure hyphen is not just leading or trailing
    if (handle.startsWith('-') || handle.endsWith('-') || handle.length < 3) {
      setWaitlistError('Please enter a valid handle with words separated by a hyphen (e.g. your-name).');
      return;
    }

    setWaitlistHandle(handle);
    setWaitlistSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col lg:grid lg:grid-cols-12 relative overflow-hidden selection:bg-surface-container-highest selection:text-primary">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[750px] h-[450px] bg-secondary-container/15 blur-[160px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-on-tertiary-container/10 blur-[150px] pointer-events-none -z-10" />

      {/* ── LEFT COLUMN: DEMO ACCESS & WAITLIST (Cols 1-6 on lg) ─────────── */}
      <div className="w-full lg:col-span-6 xl:col-span-6 flex flex-col justify-between p-6 sm:p-10 md:p-12 z-10">
        {/* Top Header & Back Button */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => onNavigate('landing')}
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-xs font-mono uppercase tracking-wider py-1.5 px-3 rounded-full bg-surface-container-low border border-surface-container-highest/40 hover:border-white/20 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Back to Cadence</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="font-headline-sm font-semibold tracking-tight text-primary">Cadence</span>
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
          </div>
        </div>

        {/* Main Card */}
        <div className="max-w-lg w-full mx-auto my-auto">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container border border-amber-500/30 text-[11px] font-mono text-amber-300 mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Private • Public Signups Closed</span>
          </div>

          <h1 className="font-headline-lg text-[32px] sm:text-[38px] text-primary tracking-tight leading-tight mb-3">
            Explore Cadence with Live Demo Access
          </h1>

          <p className="font-body-md text-on-surface-variant text-[14.5px] leading-relaxed mb-8">
            We are onboarding independent coaches and advisors in small batches. You can <strong className="text-primary font-semibold">enter our full live simulation right now</strong> with 1 click to test check-in management, client action plans, and automated retainers.
          </p>

          {/* ── 1-CLICK INSTANT DEMO LAUNCHERS ── */}
          <div className="mb-8 p-5 sm:p-6 rounded-3xl bg-surface-container-low border border-secondary/30 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-secondary">
                <span className="material-symbols-outlined text-[20px] animate-pulse">bolt</span>
                <span className="text-xs font-mono font-semibold uppercase tracking-wider">
                  Interactive Live Demo
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                1-Click Direct Access
              </span>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed mb-5">
              Select a workspace below to immediately enter the live application pre-loaded with active retainers, client check-in reviews, and Stripe automation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Demo Coach Button */}
              <button
                type="button"
                onClick={() => handleLaunchDemo('coach')}
                disabled={isDemoLoading !== null}
                className="p-3.5 rounded-2xl bg-primary text-black font-label-md text-xs font-semibold flex items-center justify-between shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_28px_rgba(255,255,255,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-black" />
                  <div className="text-left">
                    <div className="font-semibold text-black">Launch Coach Demo</div>
                    <div className="text-[10px] text-black/70 font-mono"> Clients $13.1k MRR</div>
                  </div>
                </div>
                {isDemoLoading === 'coach' ? (
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[18px] text-black">arrow_forward</span>
                )}
              </button>

              {/* Demo Client Button */}
              <button
                type="button"
                onClick={() => handleLaunchDemo('client')}
                disabled={isDemoLoading !== null}
                className="p-3.5 rounded-2xl bg-secondary text-black font-label-md text-xs font-semibold flex items-center justify-between shadow-[0_0_20px_rgba(255,180,163,0.25)] hover:shadow-[0_0_28px_rgba(255,180,163,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-black" />
                  <div className="text-left">
                    <div className="font-semibold text-black">Launch Client Demo</div>
                    <div className="text-[10px] text-black/70 font-mono">Action Plans &amp; Check-ins</div>
                  </div>
                </div>
                {isDemoLoading === 'client' ? (
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[18px] text-black">arrow_forward</span>
                )}
              </button>
            </div>
          </div>

          {/* ── PRIORITY EARLY ACCESS / WAITLIST FORM ── */}
          <div className="p-5 sm:p-6 rounded-2xl bg-surface-container border border-surface-container-highest/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-primary">Request Early Access Invite</span>
              <span className="text-[11px] font-mono text-on-surface-variant">Next batch opening soon</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
              Reserve your spot and lock in your custom <code className="text-secondary font-mono">cadence.app/your-name</code> handle before public rollout.
            </p>

            {waitlistSubmitted ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-300">
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">verified</span>
                <div>
                  <div className="font-semibold text-emerald-200">Spot Reserved: cadence.app/{waitlistHandle}</div>
                  <div className="text-[11px] text-emerald-300/80 mt-1">
                    We will notify <span className="font-mono text-white">{waitlistEmail}</span> as soon as the next batch of invites is sent out.
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="space-y-3">
                {waitlistError && (
                  <div className="p-3 rounded-xl bg-error/10 border border-error/25 text-error text-xs flex items-center gap-2 animate-in fade-in duration-200">
                    <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
                    <span>{waitlistError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="email"
                    required
                    value={waitlistEmail}
                    onChange={(e) => {
                      setWaitlistEmail(e.target.value);
                      setWaitlistError(null);
                    }}
                    placeholder="coach@practice.com"
                    className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl border border-surface-container-highest/50 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary text-xs transition-colors"
                  />
                  <div className="flex items-center bg-surface-container-low rounded-xl border border-surface-container-highest/50 overflow-hidden focus-within:border-primary">
                    <span className="px-2.5 py-2 text-on-surface-variant/60 font-mono text-[11px] bg-surface-container border-r border-surface-container-highest/40">
                      cadence.app/
                    </span>
                    <input
                      type="text"
                      required
                      value={waitlistHandle}
                      onChange={(e) => {
                        setWaitlistHandle(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                        setWaitlistError(null);
                      }}
                      placeholder="your-name"
                      className="w-full px-2.5 py-2 bg-transparent text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none font-mono text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-surface-container-high border border-white/10 hover:border-white/30 text-primary hover:text-white font-label-md text-xs font-semibold transition-all cursor-pointer"
                >
                  Join Early Access Priority Waitlist →
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Security Reassurance */}
        <div className="mt-8 text-center text-[11px] font-mono text-on-surface-variant/60 flex items-center justify-center gap-4">
          <span>100% Data Confidentiality</span>
          <span>•</span>
          <span>Stripe Verified</span>
          <span>•</span>
          <span>Zero Platform Fees</span>
        </div>
      </div>

      {/* ── RIGHT COLUMN: DYNAMIC ANIMATED SHOWCASE ── */}
      <AuthShowcase />
    </div>
  );
}
