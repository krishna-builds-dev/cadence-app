import { useState, useEffect } from 'react';
import type { SettingsTab } from '../../types/dashboard';
import Toast from '../common/Toast';
import CoachPackagePaymentModal, {
  COACH_PACKAGES,
  type CoachSubscriptionPayment,
} from './CoachPackagePaymentModal';


interface SettingsSectionProps {
  settingsTab: SettingsTab;
  setSettingsTab: (tab: SettingsTab) => void;
  profileForm: any;
  setProfileForm: React.Dispatch<React.SetStateAction<any>>;
  handleSaveProfile: (e: React.FormEvent) => void;
  handleSaveBillingSettings: (e: React.FormEvent) => void;
  handleSaveSecurity: (e: React.FormEvent) => void;
  securityState: any;
  setSecurityState: React.Dispatch<React.SetStateAction<any>>;
  settingsSuccessNotice: string | null;
  setSettingsSuccessNotice: (msg: string | null) => void;
  handleCopyInviteLink?: (code?: string) => void;
}

export default function SettingsSection({
  settingsTab,
  setSettingsTab,
  profileForm,
  setProfileForm,
  handleSaveProfile,
  handleSaveBillingSettings,
  handleSaveSecurity,
  securityState,
  setSecurityState,
  settingsSuccessNotice,
  setSettingsSuccessNotice,
  handleCopyInviteLink,
}: SettingsSectionProps) {
  const [billingSettings, setBillingSettings] = useState({
    currency: 'USD ($)',
    defaultMonthlyFee: 1500,
    retryAttempts: 3,
    autoInvoice: true,
  });

  const getInitialCoachPackage = (): CoachSubscriptionPayment => {
    try {
      const stored = sessionStorage.getItem('cadence_coach_subscription');
      if (stored) return JSON.parse(stored) as CoachSubscriptionPayment;
    } catch {}
    return {
      packageId: 'pro',
      packageName: 'Pro Coach',
      billingCycle: 'monthly',
      amount: '$99.00',
      paidAt: 'Nov 1, 2026',
      paymentMethod: 'card',
      cardLast4: '4242',
      transactionId: 'sub_cad_live_pro_99',
      receiptNumber: 'RCP-CAD-109283',
      nextBillingDate: 'Dec 1, 2026',
    };
  };

  const [coachSubscription, setCoachSubscription] = useState<CoachSubscriptionPayment>(getInitialCoachPackage);
  const [showCoachPaymentModal, setShowCoachPaymentModal] = useState(false);
  const [selectedModalPkgId, setSelectedModalPkgId] = useState<'starter' | 'pro' | 'studio'>('pro');

  // Trigger package checkout modal after login if coach selected a plan from landing page
  useEffect(() => {
    try {
      const pendingPlan = sessionStorage.getItem('cadence_selected_coach_plan');
      if (pendingPlan && (pendingPlan === 'starter' || pendingPlan === 'pro' || pendingPlan === 'studio')) {
        setSelectedModalPkgId(pendingPlan);
        setShowCoachPaymentModal(true);
        sessionStorage.removeItem('cadence_selected_coach_plan');
      }
    } catch {}
  }, []);

  const handleOpenCoachPayment = (pkgId?: 'starter' | 'pro' | 'studio') => {
    if (pkgId) setSelectedModalPkgId(pkgId);
    setShowCoachPaymentModal(true);
  };

  const handleCoachPaymentSuccess = (payment: CoachSubscriptionPayment) => {
    setCoachSubscription(payment);
    setSettingsSuccessNotice(`✓ Coach plan successfully updated to ${payment.packageName} (${payment.amount})!`);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-[#1a1b20]/90 backdrop-blur-xl border border-[#292a2e]/60 flex flex-col gap-5">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-space text-xs text-[#ffb4a3] font-bold uppercase tracking-wider">
              <span>Settings</span>
              <span className="text-[#958ea0]">//</span>
              <span className="text-[#958ea0]">
                {settingsTab === 'profile' && 'Profile & Identity'}
                {settingsTab === 'billing' && 'Billing & Retainers'}
                {settingsTab === 'integrations' && 'Integrations'}
                {settingsTab === 'security' && 'Security & Credentials'}
              </span>
            </div>
            <h2 className="font-space text-2xl text-[#e3e2e8] font-bold mt-1">
              Settings &amp; Preferences
            </h2>
            <p className="text-xs text-[#958ea0] font-sans mt-0.5">
              Manage your public coach profile, protocol defaults, billing, and system credentials.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0d0e12] border border-[#292a2e]/60 font-space text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
              <span className="text-[#cbc3d7] font-medium">Auto-Sync Active</span>
            </div>
          </div>
        </div>

        {/* Integrated Navigation Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 border-t border-[#292a2e]/60 font-space text-xs">
          <button
            onClick={() => setSettingsTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              settingsTab === 'profile'
                ? 'bg-[#ffb4a3] text-[#3a0900] shadow-[0_0_12px_rgba(255,180,163,0.35)]'
                : 'bg-[#121317] text-[#cbc3d7] hover:bg-[#292a2e] hover:text-[#e3e2e8]'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">person</span>
            <span>Profile &amp; Identity</span>
          </button>

          <button
            onClick={() => setSettingsTab('security')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              settingsTab === 'security'
                ? 'bg-[#ffb4a3] text-[#3a0900] shadow-[0_0_12px_rgba(255,180,163,0.35)]'
                : 'bg-[#121317] text-[#cbc3d7] hover:bg-[#292a2e] hover:text-[#e3e2e8]'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">shield</span>
            <span>Security &amp; Credentials</span>
          </button>

         

          <button
            onClick={() => setSettingsTab('billing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              settingsTab === 'billing'
                ? 'bg-[#ffb4a3] text-[#3a0900] shadow-[0_0_12px_rgba(255,180,163,0.35)]'
                : 'bg-[#121317] text-[#cbc3d7] hover:bg-[#292a2e] hover:text-[#e3e2e8]'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">credit_card</span>
            <span>Stripe &amp; Retainers</span>
          </button>

          <button
            onClick={() => setSettingsTab('integrations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              settingsTab === 'integrations'
                ? 'bg-[#ffb4a3] text-[#3a0900] shadow-[0_0_12px_rgba(255,180,163,0.35)]'
                : 'bg-[#121317] text-[#cbc3d7] hover:bg-[#292a2e] hover:text-[#e3e2e8]'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">hub</span>
            <span>Integrations</span>
          </button>

          
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        show={Boolean(settingsSuccessNotice)}
        message={settingsSuccessNotice}
        title="Settings Updated"
        type="success"
        onClose={() => setSettingsSuccessNotice(null)}
      />

      {/* TAB 1: PROFILE & IDENTITY */}
      {settingsTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 flex flex-col gap-5">
            <div className="p-6 rounded-xl bg-[#1a1b20] border border-[#292a2e]/60 space-y-4 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="relative group/avatar cursor-pointer">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ffb4a3] to-[#88270f] text-[#3a0900] flex items-center justify-center font-bold text-2xl font-space shadow-lg">
                    {profileForm.firstName[0]}
                    {profileForm.lastName[0]}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-white text-[20px]">photo_camera</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-space font-bold text-base text-[#e3e2e8]">
                    {profileForm.firstName} {profileForm.lastName}
                  </h3>
                  <div className="text-xs text-[#ffdad2] font-medium font-sans">
                    {profileForm.title}
                  </div>
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-space text-[#4edea3] font-semibold bg-[#003824] px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]" />
                    Verified Coach Tier
                  </span>
                </div>
              </div>

              {/* <div className="p-3.5 rounded-lg bg-[#0d0e12] border border-[#292a2e]/50 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-space text-[#958ea0]">
                  <span>Public Coach Handle:</span>
                  <span className="text-[#4edea3] font-semibold">Live Online</span>
                </div>
                <div className="font-mono text-xs text-[#ffdad2] break-all font-semibold">
                  https://cadence.app/{profileForm.handle}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(`https://cadence.app/${profileForm.handle}`);
                      alert('Public link copied to clipboard!');
                    }}
                    className="flex-1 py-1 px-2 rounded bg-[#292a2e] hover:bg-[#343439] text-[#e3e2e8] text-[11px] font-space font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[13px]">content_copy</span>
                    <span>Copy Link</span>
                  </button>
                  <a
                    href={`#signup?coach=${profileForm.coachCode}`}
                    className="py-1 px-2 rounded bg-[#292a2e] hover:bg-[#343439] text-[#cbc3d7] text-[11px] font-space transition-colors flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                    <span>Preview</span>
                  </a>
                </div>
              </div> */}

              <div
                onClick={() => handleCopyInviteLink?.(profileForm.coachCode)}
                className="p-3.5 rounded-lg bg-[#0d0e12] border border-[#292a2e]/50 hover:border-[#ffb4a3]/40 transition-colors cursor-pointer space-y-1"
                title="Click to copy invite link"
              >
                <div className="flex items-center justify-between text-[11px] font-space text-[#958ea0]">
                  <span>Direct Client Intake Code:</span>
                  <span className="font-mono text-[#e3e2e8] font-bold">{profileForm.coachCode}</span>
                </div>
                <p className="text-[10px] text-[#958ea0] font-sans">
                  Clients enter this code at onboarding to automatically connect to your roster.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSaveProfile}
            className="lg:col-span-8 p-6 rounded-xl bg-[#1a1b20] border border-[#292a2e]/60 space-y-5 shadow-xl"
          >
            <div className="border-b border-[#292a2e]/60 pb-3">
              <h3 className="font-space font-bold text-base text-[#e3e2e8]">
                Personal Information &amp; Specialization
              </h3>
              <p className="text-xs text-[#958ea0] font-sans">
                This information is visible across your client mobile portal, strategy call invites, and weekly check-in summaries.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-space text-[#958ea0] uppercase font-semibold mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-lg px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffdad2]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-space text-[#958ea0] uppercase font-semibold mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-lg px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffdad2]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-space text-[#958ea0] uppercase font-semibold mb-1">
                  Email Address (Account &amp; Auth)
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-lg px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffdad2]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-space text-[#958ea0] uppercase font-semibold mb-1">
                  WhatsApp / Direct Contact Line
                </label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-lg px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffdad2]"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-space text-[#958ea0] uppercase font-semibold mb-1">
                Professional Headline / Specialty
              </label>
              <input
                type="text"
                value={profileForm.title}
                onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })}
                className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-lg px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffdad2]"
                placeholder="e.g. Lead Performance & Longevity Coach, M.Sc."
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-space text-[#958ea0] uppercase font-semibold mb-1">
                  Public Handle
                </label>
                <div className="flex items-center bg-[#0d0e12] border border-[#292a2e] rounded-lg px-3 py-2">
                  <span className="text-xs text-[#958ea0] font-mono mr-1">cadence.app/</span>
                  <input
                    type="text"
                    value={profileForm.handle}
                    onChange={(e) => setProfileForm({ ...profileForm, handle: e.target.value })}
                    className="flex-1 bg-transparent text-xs text-[#958ea0] font-mono font-semibold focus:outline-none"
                    disabled
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-space text-[#958ea0] uppercase font-semibold mb-1">
                  Timezone
                </label>
                <select
                  value={profileForm.timezone}
                  onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                  className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-lg px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffdad2]"
                >
                  <option value="America/New_York (EST, UTC-5)">America/New_York (EST, UTC-5)</option>
                  <option value="America/Chicago (CST, UTC-6)">America/Chicago (CST, UTC-6)</option>
                  <option value="America/Denver (MST, UTC-7)">America/Denver (MST, UTC-7)</option>
                  <option value="America/Los_Angeles (PST, UTC-8)">America/Los_Angeles (PST, UTC-8)</option>
                  <option value="Europe/London (GMT, UTC+0)">Europe/London (GMT, UTC+0)</option>
                  <option value="Europe/Zurich (CET, UTC+1)">Europe/Zurich (CET, UTC+1)</option>
                  <option value="Asia/Singapore (SGT, UTC+8)">Asia/Singapore (SGT, UTC+8)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-space text-[#958ea0] uppercase font-semibold mb-1">
                Bio &amp; Coaching Philosophy
              </label>
              <textarea
                rows={4}
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-lg p-3 text-xs text-[#e3e2e8] leading-relaxed focus:outline-none focus:border-[#ffdad2] resize-none"
                placeholder="Brief summary of your coaching credentials, athletic background, and client ethos..."
              />
              <div className="text-right text-[10px] text-[#958ea0] font-space mt-1">
                {profileForm.bio.length} / 500 characters
              </div>
            </div>

            <div className="pt-3 border-t border-[#292a2e]/60 flex items-center justify-between">
              <span className="text-[11px] text-[#958ea0] font-space">
                Changes update in real-time across your client portal.
              </span>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-[#ffb4a3] text-[#3a0900] font-space font-bold text-xs hover:bg-[#ffdad2] transition-all cursor-pointer shadow-[0_0_12px_rgba(255,180,163,0.4)]"
              >
                Save Profile Changes
              </button>
            </div>
          </form>
        </div>
      )}

     

      {/* TAB 3: STRIPE & BILLING RULES */}
      {settingsTab === 'billing' && (
        <div className="space-y-6">
          {/* ── COACH PLATFORM SUBSCRIPTION & PACKAGE SELECTION ── */}
          <div className="p-6 rounded-xl bg-[#1a1b20] border border-[#292a2e]/60 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#292a2e]/60 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#ffb4a3] text-[20px]">workspace_premium</span>
                  <h3 className="font-space font-bold text-base text-[#e3e2e8]">
                    Cadence Coach Membership &amp; Packages
                  </h3>
                </div>
                <p className="text-xs text-[#958ea0] font-sans mt-0.5">
                  Manage your personal coach platform plan, client capacity limits, and Stripe subscription payment.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenCoachPayment('pro')}
                className="px-4 py-2 rounded-xl bg-[#ffb4a3] text-[#3a0900] hover:bg-[#ffdad2] text-xs font-space font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(255,180,163,0.3)] flex items-center gap-1.5 self-start sm:self-auto"
              >
                <span className="material-symbols-outlined text-[15px]">credit_card</span>
                <span>Select Package &amp; Pay</span>
              </button>
            </div>

            {/* Current Active Plan Overview Card */}
            <div className="p-5 rounded-xl bg-[#0d0e12] border border-[#292a2e] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ffb4a3]/20 to-[#e85a2b]/20 border border-[#ffb4a3]/40 flex items-center justify-center text-[#ffdad2] flex-shrink-0">
                  <span className="material-symbols-outlined text-2xl">verified</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-space font-bold text-base text-[#e3e2e8]">
                      {coachSubscription.packageName}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#003824] text-[#4edea3] text-[10px] font-space font-bold border border-[#4edea3]/30">
                      ACTIVE SUBSCRIPTION
                    </span>
                    <span className="text-xs font-mono font-bold text-[#ffb4a3]">
                      {coachSubscription.amount} / {coachSubscription.billingCycle}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#958ea0] font-sans mt-1">
                    <span>Next Renewal: <strong className="text-[#cbc3d7]">{coachSubscription.nextBillingDate}</strong></span>
                    <span>•</span>
                    <span>Billed to: <strong className="text-[#cbc3d7]">Visa •••• {coachSubscription.cardLast4 || '4242'}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenCoachPayment(coachSubscription.packageId as any)}
                  className="px-3.5 py-2 rounded-lg bg-[#1a1b20] hover:bg-[#25262c] text-[#e3e2e8] text-xs font-space font-semibold border border-[#292a2e] transition-colors cursor-pointer"
                >
                  Change Tier
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenCoachPayment(coachSubscription.packageId as any)}
                  className="px-3.5 py-2 rounded-lg bg-[#292a2e] hover:bg-[#343439] text-[#ffdad2] text-xs font-space font-semibold transition-colors cursor-pointer"
                >
                  Update Payment Method
                </button>
              </div>
            </div>

            {/* Coach Packages Grid */}
            <div>
              <div className="text-xs font-space font-bold uppercase tracking-wider text-[#958ea0] mb-3">
                Available Coaching Packages
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {COACH_PACKAGES.map((pkg) => {
                  const isCurrent = coachSubscription.packageId === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between relative ${
                        isCurrent
                          ? 'bg-[#ffb4a3]/8 border-[#ffb4a3] shadow-[0_0_20px_rgba(255,180,163,0.15)]'
                          : 'bg-[#0d0e12] border-[#292a2e] hover:border-[#4a4855]'
                      }`}
                    >
                      {pkg.popular && (
                        <span className="absolute -top-2.5 right-4 text-[9px] font-space font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#ffb4a3] text-[#3a0900] shadow-md">
                          Most Popular
                        </span>
                      )}

                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-space font-bold text-sm text-[#e3e2e8]">{pkg.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] font-space font-bold px-2 py-0.5 rounded-full bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30">
                              Current
                            </span>
                          )}
                        </div>

                        <div className="flex items-baseline gap-1 mt-3 mb-1">
                          <span className="font-space text-2xl font-bold text-[#e3e2e8]">${pkg.monthlyPrice}</span>
                          <span className="text-xs text-[#958ea0]">/month</span>
                        </div>

                        <div className="text-[11px] text-[#4edea3] font-mono font-semibold mb-3">
                          {pkg.clientLimit}
                        </div>

                        <p className="text-xs text-[#958ea0] font-sans mb-4 min-h-[34px]">
                          {pkg.tagline}
                        </p>

                        <div className="space-y-2 border-t border-[#292a2e]/60 pt-3 mb-4">
                          {pkg.features.map((feat, fIdx) => (
                            <div key={fIdx} className="flex items-center gap-2 text-xs text-[#cbc3d7]">
                              <span className="material-symbols-outlined text-[15px] text-[#4edea3] flex-shrink-0">
                                check
                              </span>
                              <span className="leading-tight">{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenCoachPayment(pkg.id)}
                        className={`w-full py-2.5 rounded-xl font-space text-xs font-bold transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-[#292a2e] text-[#cbc3d7] hover:bg-[#343439]'
                            : 'bg-[#ffb4a3] text-[#3a0900] hover:bg-[#ffdad2] shadow-md'
                        }`}
                      >
                        {isCurrent ? 'Renew Current Plan' : `Select & Pay $${pkg.monthlyPrice}/mo`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── CLIENT RETAINERS & STRIPE CONNECT (FOR COACH COLLECTING CLIENT PAYMENTS) ── */}
          <form
            onSubmit={handleSaveBillingSettings}
            className="p-6 rounded-xl bg-[#1a1b20] border border-[#292a2e]/60 space-y-6 shadow-xl"
          >
            <div className="border-b border-[#292a2e]/60 pb-3">
              <h3 className="font-space font-bold text-base text-[#e3e2e8]">
                Client Retainers &amp; Stripe Connect
              </h3>
              <p className="text-xs text-[#958ea0] font-sans">
                Manage direct bank deposits, automated card debit retry schedules, and default pricing for onboarding your clients.
              </p>
            </div>

          <div className="p-5 rounded-lg bg-[#0d0e12] border border-[#292a2e]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4edea3]" />
                <span className="font-mono text-sm font-bold text-[#e3e2e8]">Stripe Connected (acct_1N92...7B81)</span>
              </div>
              <p className="text-xs text-[#958ea0] font-sans">
                Payout account: Chase Business Checking ending in •••• 8821
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#003824] text-[#4edea3] text-xs font-space font-bold border border-[#4edea3]/30 w-fit">
              0% Platform Fee Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-4 rounded-lg bg-[#0d0e12] border border-[#292a2e]/50 space-y-2">
              <label className="block text-xs font-space text-[#958ea0] uppercase font-semibold">
                Default Retainer Currency
              </label>
              <select
                value={billingSettings.currency}
                onChange={(e) => setBillingSettings({ ...billingSettings, currency: e.target.value })}
                className="w-full bg-[#1a1b20] border border-[#292a2e] rounded-lg px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffdad2]"
              >
                <option value="USD ($)">USD ($) - United States Dollar</option>
                <option value="EUR (€)">EUR (€) - Euro</option>
                <option value="GBP (£)">GBP (£) - British Pound</option>
                <option value="CAD ($)">CAD ($) - Canadian Dollar</option>
              </select>
            </div>

            <div className="p-4 rounded-lg bg-[#0d0e12] border border-[#292a2e]/50 space-y-2">
              <label className="block text-xs font-space text-[#958ea0] uppercase font-semibold">
                Default Monthly Fee ($)
              </label>
              <input
                type="number"
                step="50"
                value={billingSettings.defaultMonthlyFee}
                onChange={(e) => setBillingSettings({ ...billingSettings, defaultMonthlyFee: Number(e.target.value) })}
                className="w-full bg-[#1a1b20] border border-[#292a2e] rounded-lg px-3 py-2 text-xs text-[#e3e2e8] font-space font-bold focus:outline-none focus:border-[#ffdad2]"
              />
              <span className="text-[10px] text-[#958ea0] block font-sans">
                Base pricing applied to new client onboarding links.
              </span>
            </div>

            <div className="p-4 rounded-lg bg-[#0d0e12] border border-[#292a2e]/50 space-y-2">
              <label className="block text-xs font-space text-[#958ea0] uppercase font-semibold">
                Failed Card Retry Policy
              </label>
              <select
                value={billingSettings.retryAttempts}
                onChange={(e) => setBillingSettings({ ...billingSettings, retryAttempts: Number(e.target.value) })}
                className="w-full bg-[#1a1b20] border border-[#292a2e] rounded-lg px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffdad2]"
              >
                <option value={2}>2 Retries (over 3 days)</option>
                <option value={3}>3 Retries (over 5 days - Standard)</option>
                <option value={4}>4 Retries (over 7 days)</option>
              </select>
              <span className="text-[10px] text-[#958ea0] block font-sans">
                Stripe smart retries before triggering past-due warning.
              </span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#0d0e12] border border-[#292a2e]/50 flex items-center justify-between">
            <div>
              <div className="font-space font-semibold text-xs text-[#e3e2e8]">
                Automatic Client Invoicing &amp; PDF Receipts
              </div>
              <div className="text-[11px] text-[#958ea0] font-sans">
                Automatically sends itemized tax receipts to clients upon successful card debit.
              </div>
            </div>
            <input
              type="checkbox"
              checked={billingSettings.autoInvoice}
              onChange={(e) => setBillingSettings({ ...billingSettings, autoInvoice: e.target.checked })}
              className="accent-[#ffb4a3] scale-125 cursor-pointer"
            />
          </div>

          <div className="pt-3 border-t border-[#292a2e]/60 flex items-center justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-[#ffb4a3] text-[#3a0900] font-space font-bold text-xs hover:bg-[#ffdad2] transition-all cursor-pointer shadow-[0_0_12px_rgba(255,180,163,0.4)]"
            >
              Save Billing Rules
            </button>
          </div>
        </form>
      </div>
    )}

      {/* TAB 4: INTEGRATIONS & VIDEO */}
      {settingsTab === 'integrations' && (
        <div className="p-6 rounded-xl bg-[#1a1b20] border border-[#292a2e]/60 space-y-6 shadow-xl">
          <div className="border-b border-[#292a2e]/60 pb-3">
            <h3 className="font-space font-bold text-base text-[#e3e2e8]">
              Platform Integrations &amp; Telemetry Connectors
            </h3>
            <p className="text-xs text-[#958ea0] font-sans">
              Manage WebRTC video studio settings, calendar synchronizers, and WhatsApp automation webhooks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
           

            <div className="p-5 rounded-lg bg-[#0d0e12] border border-[#292a2e]/50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4edea3] text-[20px]">chat</span>
                  <span className="font-space font-bold text-sm text-[#e3e2e8]">
                    WhatsApp Re-engagement API
                  </span>
                </div>
                <span className="text-[10px] font-space text-[#4edea3] font-bold bg-[#003824] px-2 py-0.5 rounded">
                  Connected
                </span>
              </div>

              <p className="text-xs text-[#cbc3d7] font-sans leading-relaxed">
                Powers 1-click WhatsApp check-in nudges directly from your Anti-Churn Radar cards when clients go dark.
              </p>

              <div className="p-2.5 rounded bg-[#1a1b20] text-xs font-mono text-[#958ea0] flex items-center justify-between">
                <span>Verified Line: {profileForm.phone}</span>
                <span className="text-[#4edea3]">✓ Ready</span>
              </div>
            </div>

            

            <div className="p-5 rounded-lg bg-[#0d0e12] border border-[#292a2e]/50 space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ffb690] text-[20px]">calendar_month</span>
                <span className="font-space font-bold text-sm text-[#e3e2e8]">
                  Google &amp; Apple Calendar Sync
                </span>
              </div>
              <p className="text-xs text-[#958ea0] font-sans">
                Synchronizes 1-on-1 strategy sessions directly into your personal calendar without link clutter.
              </p>
              <span className="inline-block text-[11px] font-space text-[#ffdad2] font-semibold">
                ✓ Connected: {profileForm.email}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-[#292a2e]/60 flex items-center justify-end">
            <button
              type="button"
              onClick={() => {
                setSettingsSuccessNotice('Integration connectors refreshed and active!');
                setTimeout(() => setSettingsSuccessNotice(null), 3000);
              }}
              className="px-5 py-2.5 rounded-lg bg-[#ffb4a3] text-[#3a0900] font-space font-bold text-xs hover:bg-[#ffdad2] transition-all cursor-pointer shadow-[0_0_12px_rgba(255,180,163,0.4)]"
            >
              Save Integrations
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: SECURITY & CREDENTIALS */}
      {settingsTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSaveSecurity}
            className="lg:col-span-7 p-6 rounded-xl bg-[#1a1b20] border border-[#292a2e]/60 space-y-5 shadow-xl"
          >
            <div className="border-b border-[#292a2e]/60 pb-3">
              <h3 className="font-space font-bold text-base text-[#e3e2e8]">
                Update Password
              </h3>
              <p className="text-xs text-[#958ea0] font-sans">
                Ensure your account is using a strong, unique password with at least 8 characters.
              </p>
            </div>

            <div>
              <label className="block text-xs font-space text-[#958ea0] uppercase font-semibold mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={securityState.currentPass}
                onChange={(e) => setSecurityState({ ...securityState, currentPass: e.target.value })}
                placeholder="••••••••••••"
                className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-lg px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffdad2]"
              />
            </div>

            <div>
              <label className="block text-xs font-space text-[#958ea0] uppercase font-semibold mb-1">
                New Password
              </label>
              <input
                type="password"
                value={securityState.newPass}
                onChange={(e) => setSecurityState({ ...securityState, newPass: e.target.value })}
                placeholder="••••••••••••"
                className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-lg px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffdad2]"
              />
            </div>

            <div>
              <label className="block text-xs font-space text-[#958ea0] uppercase font-semibold mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={securityState.confirmPass}
                onChange={(e) => setSecurityState({ ...securityState, confirmPass: e.target.value })}
                placeholder="••••••••••••"
                className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-lg px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffdad2]"
              />
            </div>

            <div className="pt-3 border-t border-[#292a2e]/60 flex items-center justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-[#ffb4a3] text-[#3a0900] font-space font-bold text-xs hover:bg-[#ffdad2] transition-all cursor-pointer shadow-[0_0_12px_rgba(255,180,163,0.4)]"
              >
                Update Password
              </button>
            </div>
          </form>

          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="p-6 rounded-xl bg-[#1a1b20] border border-[#292a2e]/60 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4edea3] text-[20px]">verified_user</span>
                  <span className="font-space font-bold text-sm text-[#e3e2e8]">
                    Two-Factor Authentication
                  </span>
                </div>
                <span className="text-[10px] font-space text-[#4edea3] font-bold bg-[#003824] px-2 py-0.5 rounded">
                  Enforced
                </span>
              </div>
              <p className="text-xs text-[#cbc3d7] font-sans leading-relaxed">
                Protected via Google Authenticator app (TOTP). 8 backup recovery codes remain available.
              </p>
              <button
                type="button"
                onClick={() => alert('TOTP Authenticator QR setup regenerated.')}
                className="w-full py-2 rounded-lg bg-[#292a2e] hover:bg-[#343439] text-[#e3e2e8] text-xs font-space font-semibold transition-colors cursor-pointer"
              >
                Manage 2FA Devices
              </button>
            </div>

            <div className="p-6 rounded-xl bg-[#1a1b20] border border-[#292a2e]/60 space-y-4 shadow-xl">
              <div className="font-space font-bold text-sm text-[#e3e2e8]">
                Active Browser Sessions
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-[#0d0e12] border border-[#292a2e]/50 flex items-center justify-between">
                  <div>
                    <div className="font-space font-bold text-[#e3e2e8]">MacBook Pro 16&quot; (New York, US)</div>
                    <div className="text-[10px] text-[#4edea3] font-mono">Chrome 130 • Active Current Session</div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
                </div>

                <div className="p-3 rounded-lg bg-[#0d0e12] border border-[#292a2e]/50 flex items-center justify-between">
                  <div>
                    <div className="font-space font-bold text-[#e3e2e8]">iPhone 16 Pro (New York, US)</div>
                    <div className="text-[10px] text-[#958ea0] font-mono">Mobile Safari • 2 hours ago</div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => alert('All other sessions signed out.')}
                className="w-full py-2 rounded-lg bg-[#292a2e] hover:bg-[#ffb4ab]/20 hover:text-[#ffb4ab] text-[#cbc3d7] text-xs font-space font-semibold transition-colors cursor-pointer"
              >
                Sign Out of All Other Sessions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── COACH PACKAGE & SUBSCRIPTION CHECKOUT MODAL ── */}
      <CoachPackagePaymentModal
        isOpen={showCoachPaymentModal}
        onClose={() => setShowCoachPaymentModal(false)}
        initialPackageId={selectedModalPkgId}
        onPaymentSuccess={handleCoachPaymentSuccess}
      />
    </div>
  );
}
