import React, { useState, useEffect } from 'react';
import Toast from '../common/Toast';

export type ClientSettingsTab = 'profile' | 'protocol' | 'billing' | 'wearables' | 'security';

interface ClientSettingsSectionProps {
  onMessageCoach?: () => void;
  onNavigateSection?: (section: string) => void;
  activeTab?: ClientSettingsTab;
  setActiveTab?: (tab: ClientSettingsTab) => void;
}

const SESSION_CLIENT_SETTINGS_KEY = 'cadence_session_client_settings';

export default function ClientSettingsSection({
  onMessageCoach,
  onNavigateSection,
  activeTab: controlledActiveTab,
  setActiveTab: controlledSetActiveTab,
}: ClientSettingsSectionProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<ClientSettingsTab>('profile');
  const activeTab = controlledActiveTab ?? internalActiveTab;
  const setActiveTab = controlledSetActiveTab ?? setInternalActiveTab;
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ── 1. Profile State ──
  const [profile, setProfile] = useState(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_CLIENT_SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.profile) return parsed.profile;
      }
    } catch {}
    return {
      firstName: 'Sarah',
      lastName: 'Jenkins',
      title: 'Venture Partner · Sequoia Capital',
      email: 'sarah.j@venturecapital.io',
      phone: '+1 (415) 890-4321',
      emergencyContactName: 'David Jenkins',
      emergencyContactPhone: '+1 (415) 555-0199',
      timezone: 'America/Los_Angeles (PST, UTC-8)',
      location: 'San Francisco, CA',
      bio: 'Competitive Hyrox athlete and long-distance runner. Focused on executive energy stability, glucose modulation, and lean hypertrophy.',
      assignedCoach: 'Julian Vance',
      coachTitle: 'Lead Performance & Longevity Coach',
      coachCode: 'COACH-JULIAN',
      tierLabel: 'Tier 1 Metabolic & Biometrics',
      membershipStatus: 'Active Retainer',
    };
  });

  // ── 2. Protocol & Biometrics State ──
  const [protocol, setProtocol] = useState(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_CLIENT_SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.protocol) return parsed.protocol;
      }
    } catch {}
    return {
      units: 'metric' as 'metric' | 'imperial',
      currentWeight: '64.5',
      targetWeight: '62.0',
      height: '173',
      bodyFat: '21.4',
      dietaryClassification: 'High-Protein Metabolic Periodization',
      allergies: ['Shellfish', 'Sucralose / Artificial Sweeteners', 'High-Lactose Dairy'],
      fastingProtocol: '16:8 Time-Restricted Feeding (12:00 PM – 8:00 PM)',
      calorieTarget: 2150,
      proteinTarget: 145,
      carbsTarget: 210,
      fatTarget: 55,
      trainingDaysPerWeek: 5,
      primaryGoal: 'Lean Recomposition & VO2 Max Endurance',
    };
  });

  const [newAllergyInput, setNewAllergyInput] = useState('');

  // ── 3. Billing & Retainer State ──
  const [billing, setBilling] = useState(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_CLIENT_SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.billing) return parsed.billing;
      }
    } catch {}
    return {
      planName: 'Cadence 1-on-1 Performance Retainer',
      monthlyFee: '$1,500.00',
      nextBillingDate: 'Dec 15, 2026',
      cardBrand: 'Visa',
      cardLast4: '7721',
      cardExpiry: '12/28',
      cardholder: 'Sarah Jenkins',
      billingAddress: '3000 Sand Hill Rd, Menlo Park, CA 94025',
      autoDebit: true,
      invoices: [
        {
          id: 'inv_103',
          number: 'INV-2026-11',
          date: 'Nov 20, 2026',
          desc: 'Monthly Retainer & CGM Telemetry (Nov 2026)',
          amount: '$1,500.00',
          status: 'paid' as 'paid' | 'pending',
        },
        {
          id: 'inv_102',
          number: 'INV-2026-10',
          date: 'Oct 15, 2026',
          desc: 'Monthly Retainer & CGM Telemetry (Oct 2026)',
          amount: '$1,500.00',
          status: 'paid' as 'paid' | 'pending',
        },
        {
          id: 'inv_101',
          number: 'INV-2026-09',
          date: 'Sep 15, 2026',
          desc: 'Monthly Retainer & CGM Telemetry (Sep 2026)',
          amount: '$1,500.00',
          status: 'paid' as 'paid' | 'pending',
        },
      ],
    };
  });

  // Modal for updating card
  const [showUpdateCardModal, setShowUpdateCardModal] = useState(false);
  const [tempCardNumber, setTempCardNumber] = useState('•••• •••• •••• 7721');
  const [tempExpiry, setTempExpiry] = useState('12/28');
  const [tempCvc, setTempCvc] = useState('888');
  const [tempZip, setTempZip] = useState('94025');

  // Modal for membership pause
  const [showPauseModal, setShowPauseModal] = useState(false);

  // ── 4. Wearables State ──
  const [wearables, setWearables] = useState({
    dexcom: {
      connected: true,
      sensorId: 'DX-88912',
      daysRemaining: 6,
      uptime: '98.4%',
      lastReading: '91 mg/dL (2m ago)',
    },
    whoop: {
      connected: true,
      battery: '84%',
      recoveryScore: '78% (Green)',
      hrvBaseline: '64 ms',
    },
    appleHealth: {
      connected: true,
      lastSync: 'Today, 8:45 AM',
      steps: '8,420',
      activeEnergy: '540 kcal',
    },
    withings: {
      connected: true,
      lastWeighIn: 'Today, 7:15 AM (64.5 kg)',
    },
    oura: {
      connected: false,
    },
  });

  // ── 5. Security Credentials ──
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: true,
    biometricLogin: true,
  });

  // Save to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(
        SESSION_CLIENT_SETTINGS_KEY,
        JSON.stringify({ profile, protocol, billing })
      );
    } catch {}
  }, [profile, protocol, billing]);

  // Handlers
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('✓ Personal profile and contact information updated!');
  };

  const handleSaveProtocol = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('✓ Health preferences and biometric protocol saved!');
  };

  const handleAddAllergy = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const trimmed = newAllergyInput.trim();
    if (trimmed && !protocol.allergies.includes(trimmed)) {
      setProtocol((prev: any) => ({
        ...prev,
        allergies: [...prev.allergies, trimmed],
      }));
      setNewAllergyInput('');
    }
  };

  const handleRemoveAllergy = (item: string) => {
    setProtocol((prev: any) => ({
      ...prev,
      allergies: prev.allergies.filter((a: string) => a !== item),
    }));
  };

  const handleUpdatePaymentCard = (e: React.FormEvent) => {
    e.preventDefault();
    const last4 = tempCardNumber.replace(/\s+/g, '').slice(-4) || '7721';
    setBilling((prev: any) => ({
      ...prev,
      cardLast4: last4,
      cardExpiry: tempExpiry,
    }));
    setShowUpdateCardModal(false);
    showToast(`✓ Card on file updated to Visa ending in ${last4} via Stripe Vault!`);
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (securityForm.newPassword) {
      if (securityForm.newPassword !== securityForm.confirmPassword) {
        alert('New passwords do not match. Please re-enter.');
        return;
      }
      if (securityForm.newPassword.length < 8) {
        alert('Password must be at least 8 characters.');
        return;
      }
    }
    setSecurityForm((prev) => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }));
    showToast('✓ Security credentials and authentication settings saved!');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <Toast
        show={Boolean(toastMessage)}
        message={toastMessage || ''}
        title="Settings Updated"
        type="success"
        onClose={() => setToastMessage(null)}
      />

      {/* Top Header Card */}
      <div className="p-6 rounded-xl bg-[#1a1b20]/90 backdrop-blur-xl border border-[#292a2e]/60 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-space text-xs text-[#ffb4a3] font-bold uppercase tracking-wider">
              <span>Client Settings</span>
              <span className="text-[#958ea0]">//</span>
              <span className="text-[#958ea0]">
                {activeTab === 'profile' && 'Personal Profile & Identity'}
                {activeTab === 'protocol' && 'Protocol & Biometric Preferences'}
                {activeTab === 'billing' && 'Membership Retainer & Invoices'}
                {activeTab === 'wearables' && 'Connected Health Wearables'}
                {activeTab === 'security' && 'Security & Data Privacy'}
              </span>
            </div>
            <h2 className="font-space text-2xl text-[#e3e2e8] font-bold mt-1">
              Client Settings &amp; Preferences
            </h2>
            <p className="text-xs text-[#958ea0] font-sans mt-0.5">
              Manage your personal identity, biometric targets, connected telemetry devices, and subscription retainers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0d0e12] border border-[#292a2e]/60 font-space text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
              <span className="text-[#cbc3d7] font-medium">Vault Synced</span>
            </div>
          </div>
        </div>

        {/* Client Navigation Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 border-t border-[#292a2e]/60 font-space text-xs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-[#ffb4a3] text-[#3a0900] shadow-[0_0_12px_rgba(255,180,163,0.35)]'
                : 'bg-[#121317] text-[#cbc3d7] hover:bg-[#292a2e] hover:text-[#e3e2e8]'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">person</span>
            <span>Profile &amp; Personal Info</span>
          </button>

           <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-[#ffb4a3] text-[#3a0900] shadow-[0_0_12px_rgba(255,180,163,0.35)]'
                : 'bg-[#121317] text-[#cbc3d7] hover:bg-[#292a2e] hover:text-[#e3e2e8]'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">shield</span>
            <span>Security &amp; Privacy</span>
          </button>

          <button
            onClick={() => setActiveTab('protocol')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'protocol'
                ? 'bg-[#ffb4a3] text-[#3a0900] shadow-[0_0_12px_rgba(255,180,163,0.35)]'
                : 'bg-[#121317] text-[#cbc3d7] hover:bg-[#292a2e] hover:text-[#e3e2e8]'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">nutrition</span>
            <span>Protocol &amp; Biometrics</span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'billing'
                ? 'bg-[#ffb4a3] text-[#3a0900] shadow-[0_0_12px_rgba(255,180,163,0.35)]'
                : 'bg-[#121317] text-[#cbc3d7] hover:bg-[#292a2e] hover:text-[#e3e2e8]'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">credit_card</span>
            <span>Membership &amp; Invoices</span>
          </button>

          

         
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 1: PROFILE & PERSONAL INFO */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Summary Cards */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* User Avatar Card */}
            <div className="p-6 rounded-xl bg-[#1a1b20] border border-[#292a2e]/60 space-y-4 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ffb4a3] to-[#88270f] text-[#3a0900] flex items-center justify-center font-bold text-2xl font-space shadow-lg">
                  {profile.firstName[0]}
                  {profile.lastName[0]}
                </div>
                <div>
                  <h3 className="font-space font-bold text-base text-[#e3e2e8]">
                    {profile.firstName} {profile.lastName}
                  </h3>
                  <div className="text-xs text-[#ffdad2] font-medium font-sans">
                    {profile.title}
                  </div>
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-space text-[#4edea3] font-semibold bg-[#003824] px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]" />
                    {profile.membershipStatus}
                  </span>
                </div>
              </div>

              {/* Assigned Coach Pill */}
              <div className="p-3.5 rounded-lg bg-[#0d0e12] border border-[#292a2e]/50 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-space text-[#958ea0]">
                  <span>Dedicated Lead Coach:</span>
                  <span className="text-[#4edea3] font-semibold">Active Session</span>
                </div>
                <div className="flex items-center gap-2.5 pt-1">
                  <div className="w-8 h-8 rounded-full bg-[#ffb4a3]/20 border border-[#ffb4a3]/40 flex items-center justify-center text-[#ffdad2] font-space font-bold text-xs">
                    JV
                  </div>
                  <div>
                    <span className="font-space font-bold text-xs text-[#e3e2e8] block">
                      {profile.assignedCoach}
                    </span>
                    <span className="text-[10px] text-[#958ea0] block font-sans">
                      {profile.coachTitle}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#292a2e]/40 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onMessageCoach}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-[#292a2e] hover:bg-[#343439] text-[#e3e2e8] text-[11px] font-space font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[13px] text-[#ffb4a3]">chat</span>
                    <span>Message Coach</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateSection?.('meetings')}
                    className="py-1.5 px-2.5 rounded-lg bg-[#292a2e] hover:bg-[#343439] text-[#cbc3d7] text-[11px] font-space transition-colors cursor-pointer flex items-center justify-center"
                    title="View scheduled strategy calls"
                  >
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                  </button>
                </div>
              </div>

              {/* Membership Tier Badge */}
              <div className="p-3.5 rounded-lg bg-[#0d0e12] border border-[#292a2e]/50 space-y-1 font-sans">
                <span className="text-[10px] font-space uppercase text-[#958ea0] tracking-wider block">
                  Active Tier
                </span>
                <span className="text-xs font-space font-bold text-[#e3e2e8] block">
                  {profile.tierLabel}
                </span>
                <span className="text-[11px] text-[#4edea3] block font-mono">
                  $1,500 / month · Auto-renews Dec 15, 2026
                </span>
              </div>
            </div>
          </div>

          {/* Right Edit Form */}
          <form
            onSubmit={handleSaveProfile}
            className="lg:col-span-8 p-6 rounded-xl bg-[#1a1b20] border border-[#292a2e]/60 space-y-5 shadow-xl"
          >
            <div className="border-b border-[#292a2e]/60 pb-3">
              <h3 className="font-space font-bold text-base text-[#e3e2e8]">
                Personal Information &amp; Bio
              </h3>
              <p className="text-xs text-[#958ea0] font-sans">
                Your personal identity details are confidential and shared solely with your assigned coach.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-space text-[#958ea0] uppercase font-semibold mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
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
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-lg px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffdad2]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-space text-[#958ea0] uppercase font-semibold mb-1">
                  Email Address (Account Login)
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-lg px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffdad2]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-space text-[#958ea0] uppercase font-semibold mb-1">
                  Mobile / SMS Telehealth Line
                </label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-lg px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffdad2]"
                  placeholder="+1 (415) 000-0000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-space text-[#958ea0] uppercase font-semibold mb-1">
                  Professional Title &amp; Firm
                </label>
                <input
                  type="text"
                  value={profile.title}
                  onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                  className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-lg px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffdad2]"
                  placeholder="e.g. Venture Partner · Sequoia Capital"
                />
              </div>
              <div>
                <label className="block text-xs font-space text-[#958ea0] uppercase font-semibold mb-1">
                  Location &amp; Primary Timezone
                </label>
                <select
                  value={profile.timezone}
                  onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                  className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-lg px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffdad2]"
                >
                  <option value="America/Los_Angeles (PST, UTC-8)">America/Los_Angeles (PST, UTC-8)</option>
                  <option value="America/New_York (EST, UTC-5)">America/New_York (EST, UTC-5)</option>
                  <option value="America/Chicago (CST, UTC-6)">America/Chicago (CST, UTC-6)</option>
                  <option value="America/Denver (MST, UTC-7)">America/Denver (MST, UTC-7)</option>
                  <option value="Europe/London (GMT, UTC+0)">Europe/London (GMT, UTC+0)</option>
                  <option value="Europe/Zurich (CET, UTC+1)">Europe/Zurich (CET, UTC+1)</option>
                </select>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="p-4 rounded-xl bg-[#0d0e12] border border-[#292a2e] space-y-3">
              <span className="font-space font-bold text-xs text-[#e3e2e8] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#ffb4a3]">emergency</span>
                <span>Emergency Contact Information</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-space text-[#958ea0] mb-1">
                    Contact Full Name
                  </label>
                  <input
                    type="text"
                    value={profile.emergencyContactName}
                    onChange={(e) => setProfile({ ...profile, emergencyContactName: e.target.value })}
                    className="w-full bg-[#141519] border border-[#292a2e] rounded-lg px-3 py-1.5 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffdad2]"
                    placeholder="e.g. David Jenkins"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-space text-[#958ea0] mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    value={profile.emergencyContactPhone}
                    onChange={(e) => setProfile({ ...profile, emergencyContactPhone: e.target.value })}
                    className="w-full bg-[#141519] border border-[#292a2e] rounded-lg px-3 py-1.5 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffdad2]"
                    placeholder="+1 (415) 555-0199"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-space text-[#958ea0] uppercase font-semibold mb-1">
                Athletic Background &amp; Coaching Goals
              </label>
              <textarea
                rows={3}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-lg p-3 text-xs text-[#e3e2e8] leading-relaxed focus:outline-none focus:border-[#ffdad2] resize-none"
                placeholder="Share your athletic background, endurance race targets, or metabolic health priorities..."
              />
            </div>

            <div className="pt-3 border-t border-[#292a2e]/60 flex items-center justify-between">
              <span className="text-[11px] text-[#958ea0] font-space">
                Synced in real-time with Coach Julian Vance.
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

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 2: PROTOCOL & BIOMETRICS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'protocol' && (
        <form
          onSubmit={handleSaveProtocol}
          className="p-6 rounded-xl bg-[#1a1b20] border border-[#292a2e]/60 space-y-6 shadow-xl"
        >
          <div className="border-b border-[#292a2e]/60 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-space font-bold text-base text-[#e3e2e8]">
                Nutritional Protocol &amp; Biometric Preferences
              </h3>
              <p className="text-xs text-[#958ea0] font-sans">
                Set preferred measurement units, dietary frameworks, food intolerances, and review coach macro ceilings.
              </p>
            </div>

            {/* Units Toggle */}
            <div className="flex items-center gap-1 bg-[#0d0e12] p-1 rounded-xl border border-[#292a2e]">
              <button
                type="button"
                onClick={() => setProtocol({ ...protocol, units: 'metric' })}
                className={`px-3 py-1 rounded-lg text-xs font-space font-semibold transition-all cursor-pointer ${
                  protocol.units === 'metric'
                    ? 'bg-[#ffb4a3] text-[#3a0900]'
                    : 'text-[#958ea0] hover:text-[#e3e2e8]'
                }`}
              >
                Metric (kg / cm)
              </button>
              <button
                type="button"
                onClick={() => setProtocol({ ...protocol, units: 'imperial' })}
                className={`px-3 py-1 rounded-lg text-xs font-space font-semibold transition-all cursor-pointer ${
                  protocol.units === 'imperial'
                    ? 'bg-[#ffb4a3] text-[#3a0900]'
                    : 'text-[#958ea0] hover:text-[#e3e2e8]'
                }`}
              >
                Imperial (lbs / in)
              </button>
            </div>
          </div>

          {/* Current Biometric Telemetry Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#0d0e12] border border-[#292a2e]/60">
              <span className="text-[10px] font-space text-[#958ea0] uppercase tracking-wider block">
                Current Weight
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <input
                  type="text"
                  value={protocol.currentWeight}
                  onChange={(e) => setProtocol({ ...protocol, currentWeight: e.target.value })}
                  className="w-16 bg-transparent font-space font-bold text-lg text-[#e3e2e8] focus:outline-none border-b border-[#ffb4a3]"
                />
                <span className="text-xs text-[#958ea0] font-mono">
                  {protocol.units === 'metric' ? 'kg' : 'lbs'}
                </span>
              </div>
              <span className="text-[10px] text-[#4edea3] font-mono block mt-1">
                Auto-syncs via Withings
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#0d0e12] border border-[#292a2e]/60">
              <span className="text-[10px] font-space text-[#958ea0] uppercase tracking-wider block">
                Target Recomp Goal
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <input
                  type="text"
                  value={protocol.targetWeight}
                  onChange={(e) => setProtocol({ ...protocol, targetWeight: e.target.value })}
                  className="w-16 bg-transparent font-space font-bold text-lg text-[#ffb4a3] focus:outline-none border-b border-[#ffb4a3]"
                />
                <span className="text-xs text-[#958ea0] font-mono">
                  {protocol.units === 'metric' ? 'kg' : 'lbs'}
                </span>
              </div>
              <span className="text-[10px] text-[#958ea0] font-mono block mt-1">
                -2.5 kg buffer phase
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#0d0e12] border border-[#292a2e]/60">
              <span className="text-[10px] font-space text-[#958ea0] uppercase tracking-wider block">
                Height
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <input
                  type="text"
                  value={protocol.height}
                  onChange={(e) => setProtocol({ ...protocol, height: e.target.value })}
                  className="w-16 bg-transparent font-space font-bold text-lg text-[#e3e2e8] focus:outline-none border-b border-[#ffb4a3]"
                />
                <span className="text-xs text-[#958ea0] font-mono">
                  {protocol.units === 'metric' ? 'cm' : 'in'}
                </span>
              </div>
              <span className="text-[10px] text-[#958ea0] font-mono block mt-1">
                5&apos;8&quot; equivalent
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#0d0e12] border border-[#292a2e]/60">
              <span className="text-[10px] font-space text-[#958ea0] uppercase tracking-wider block">
                Body Fat % (DEXA)
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-space font-bold text-lg text-[#4edea3]">
                  {protocol.bodyFat}%
                </span>
              </div>
              <span className="text-[10px] text-[#4edea3] font-mono block mt-1">
                DEXA scan verified
              </span>
            </div>
          </div>

          {/* Dietary Framework & Fasting Protocol */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-space text-[#958ea0] uppercase font-semibold mb-1">
                Nutritional Framework &amp; Classification
              </label>
              <select
                value={protocol.dietaryClassification}
                onChange={(e) => setProtocol({ ...protocol, dietaryClassification: e.target.value })}
                className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-lg px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffdad2]"
              >
                <option value="High-Protein Metabolic Periodization">High-Protein Metabolic Periodization</option>
                <option value="Mediterranean Longevity & Athletic">Mediterranean Longevity &amp; Athletic</option>
                <option value="Low-FODMAP Gut Microbiome Reset">Low-FODMAP Gut Microbiome Reset</option>
                <option value="Cyclic Ketogenic / Carb Refeed">Cyclic Ketogenic / Carb Refeed</option>
                <option value="Plant-Based Performance Omnivore">Plant-Based Performance Omnivore</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-space text-[#958ea0] uppercase font-semibold mb-1">
                Time-Restricted Feeding / Fasting Window
              </label>
              <select
                value={protocol.fastingProtocol}
                onChange={(e) => setProtocol({ ...protocol, fastingProtocol: e.target.value })}
                className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-lg px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffdad2]"
              >
                <option value="16:8 Time-Restricted Feeding (12:00 PM – 8:00 PM)">
                  16:8 Protocol (12:00 PM – 8:00 PM)
                </option>
                <option value="14:10 Moderate Window (10:00 AM – 8:00 PM)">
                  14:10 Moderate Window (10:00 AM – 8:00 PM)
                </option>
                <option value="Circadian Alignment (Sunrise to Sunset)">
                  Circadian Alignment (Sunrise to Sunset)
                </option>
                <option value="No Fasting Restriction (Ad-libitum Fueling)">
                  No Fasting Restriction (Ad-libitum Fueling)
                </option>
              </select>
            </div>
          </div>

          {/* Food Allergies & Intolerances Chips */}
          <div className="p-4 rounded-xl bg-[#0d0e12] border border-[#292a2e] space-y-3">
            <div>
              <span className="font-space font-bold text-xs text-[#e3e2e8] block">
                Food Allergies, Intolerances &amp; Exclusions
              </span>
              <span className="text-[11px] text-[#958ea0] font-sans">
                These restrictions are enforced by Cadence AI meal analysis and checked by Coach Vance.
              </span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {protocol.allergies.map((allergy: string) => (
                <span
                  key={allergy}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1a1b20] border border-[#ffb4a3]/40 text-[#ffdad2] text-xs font-space"
                >
                  <span className="material-symbols-outlined text-[13px] text-[#ffb4a3]">block</span>
                  <span>{allergy}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAllergy(allergy)}
                    className="hover:text-white transition-colors cursor-pointer ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {/* Add Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newAllergyInput}
                onChange={(e) => setNewAllergyInput(e.target.value)}
                onKeyDown={handleAddAllergy}
                placeholder="Type an allergy (e.g. Tree Nuts, Soy) and press Enter"
                className="flex-1 bg-[#141519] border border-[#292a2e] rounded-lg px-3 py-1.5 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffdad2]"
              />
              <button
                type="button"
                onClick={handleAddAllergy}
                className="px-3 py-1.5 rounded-lg bg-[#292a2e] hover:bg-[#343439] text-xs font-space font-semibold text-[#e3e2e8] transition-colors cursor-pointer"
              >
                + Add Exclusion
              </button>
            </div>
          </div>

          {/* Coach Prescribed Macro Ceilings (Read & Review) */}
          <div className="p-4 rounded-xl bg-[#0d0e12] border border-[#292a2e] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-space font-bold text-xs text-[#e3e2e8] block">
                  Current Coach Macronutrient Targets (Protocol v2.4)
                </span>
                <span className="text-[11px] text-[#958ea0] font-sans">
                  Prescribed by Julian Vance based on Dexcom CGM telemetry.
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#4edea3] bg-[#003824] px-2 py-0.5 rounded-full border border-[#4edea3]/30">
                Active Protocol
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-[#141519] border border-[#292a2e]/60">
                <span className="text-[10px] text-[#958ea0] font-space block">Calories</span>
                <span className="text-base font-space font-bold text-[#e3e2e8]">
                  {protocol.calorieTarget} kcal
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#141519] border border-[#292a2e]/60">
                <span className="text-[10px] text-[#958ea0] font-space block">Protein (Floor)</span>
                <span className="text-base font-space font-bold text-[#ffdad2]">
                  {protocol.proteinTarget}g
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#141519] border border-[#292a2e]/60">
                <span className="text-[10px] text-[#958ea0] font-space block">Carbohydrates</span>
                <span className="text-base font-space font-bold text-[#e3e2e8]">
                  {protocol.carbsTarget}g
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#141519] border border-[#292a2e]/60">
                <span className="text-[10px] text-[#958ea0] font-space block">Essential Fats</span>
                <span className="text-base font-space font-bold text-[#e3e2e8]">
                  {protocol.fatTarget}g
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#292a2e]/60 flex items-center justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-[#ffb4a3] text-[#3a0900] font-space font-bold text-xs hover:bg-[#ffdad2] transition-all cursor-pointer shadow-[0_0_12px_rgba(255,180,163,0.4)]"
            >
              Save Protocol Preferences
            </button>
          </div>
        </form>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 3: MEMBERSHIP & INVOICES */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Active Membership Retainer Card */}
          <div className="p-6 rounded-xl bg-[#1a1b20] border border-[#292a2e]/60 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#292a2e]/60 pb-4">
              <div>
                <span className="text-[10px] font-space uppercase tracking-wider text-[#ffb4a3] font-bold block">
                  Active Subscription Retainer
                </span>
                <h3 className="text-lg font-space font-bold text-[#e3e2e8] mt-0.5">
                  {billing.planName}
                </h3>
                <p className="text-xs text-[#958ea0] font-sans">
                  Direct 1-on-1 performance engineering, daily CGM feedback, and weekly telehealth check-ins.
                </p>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-2xl font-space font-extrabold text-[#4edea3]">
                  {billing.monthlyFee}
                </div>
                <span className="text-[11px] text-[#958ea0] font-mono">
                  Billed monthly via Stripe Auto-Debit
                </span>
              </div>
            </div>

            {/* Payment Method on File */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#0d0e12] border border-[#292a2e] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#141519] border border-[#292a2e] flex items-center justify-center text-[#ffdad2]">
                    <span className="material-symbols-outlined text-[20px]">credit_card</span>
                  </div>
                  <div>
                    <span className="text-xs font-space font-bold text-[#e3e2e8] block">
                      {billing.cardBrand} ending in •••• {billing.cardLast4}
                    </span>
                    <span className="text-[10px] text-[#958ea0] font-mono">
                      Expires {billing.cardExpiry} · Cardholder: {billing.cardholder}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowUpdateCardModal(true)}
                  className="px-3 py-1.5 rounded-lg border border-[#292a2e] bg-[#1a1b20] hover:bg-[#25262c] text-xs font-space font-semibold text-[#ffdad2] transition-colors cursor-pointer"
                >
                  Update Card
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[#0d0e12] border border-[#292a2e] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-space text-[#958ea0] uppercase tracking-wider block">
                    Next Auto-Renewal Date
                  </span>
                  <span className="text-sm font-space font-bold text-[#e3e2e8] block mt-0.5">
                    {billing.nextBillingDate}
                  </span>
                  <span className="text-[10px] text-[#4edea3] font-mono">
                    ✓ 256-Bit SSL Stripe Vault Protection
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPauseModal(true)}
                  className="text-xs font-space text-[#958ea0] hover:text-[#ff5449] transition-colors cursor-pointer"
                >
                  Pause / Cancel
                </button>
              </div>
            </div>
          </div>

          {/* Past Invoices & Receipts History */}
          <div className="p-6 rounded-xl bg-[#1a1b20] border border-[#292a2e]/60 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#292a2e]/60 pb-3">
              <div>
                <h3 className="font-space font-bold text-base text-[#e3e2e8]">
                  Retainer Billing &amp; Invoices History
                </h3>
                <p className="text-xs text-[#958ea0] font-sans">
                  Itemized tax receipts for all monthly performance subscriptions.
                </p>
              </div>
              <span className="text-xs font-mono text-[#958ea0]">
                {billing.invoices.length} Invoices Recorded
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-[#292a2e] text-[#958ea0] font-space text-[10px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#292a2e]/50 font-mono">
                  {billing.invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-[#141519] transition-colors">
                      <td className="py-3 px-3 text-[#ffdad2] font-bold">{inv.number}</td>
                      <td className="py-3 px-3 text-[#cbc3d7]">{inv.date}</td>
                      <td className="py-3 px-3 text-[#e3e2e8] font-sans">{inv.desc}</td>
                      <td className="py-3 px-3 text-[#e3e2e8] font-bold">{inv.amount}</td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-space font-bold px-2 py-0.5 rounded-full bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30 uppercase">
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => showToast(`✓ Receipt for ${inv.number} downloaded!`)}
                          className="px-2.5 py-1 rounded bg-[#292a2e] hover:bg-[#343439] text-[11px] font-space font-semibold text-[#e3e2e8] transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[13px]">download</span>
                          <span>PDF</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 4: WEARABLES & DEVICES */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'wearables' && (
        <div className="p-6 rounded-xl bg-[#1a1b20] border border-[#292a2e]/60 space-y-6 shadow-xl">
          <div className="border-b border-[#292a2e]/60 pb-3">
            <h3 className="font-space font-bold text-base text-[#e3e2e8]">
              Connected Health Wearables &amp; Telemetry
            </h3>
            <p className="text-xs text-[#958ea0] font-sans">
              Manage live biometrics integration with Dexcom CGM, Whoop, Apple HealthKit, and Withings Smart Scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Dexcom G7 */}
            <div className="p-5 rounded-xl bg-[#0d0e12] border border-[#292a2e] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#4edea3]/15 border border-[#4edea3]/30 flex items-center justify-center text-[#4edea3]">
                    <span className="material-symbols-outlined text-[20px]">monitor_heart</span>
                  </div>
                  <div>
                    <span className="font-space font-bold text-sm text-[#e3e2e8] block">
                      Dexcom G7 CGM
                    </span>
                    <span className="text-[10px] text-[#958ea0] font-mono">
                      Continuous Glucose Monitor
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-space text-[#4edea3] font-bold bg-[#003824] px-2 py-0.5 rounded border border-[#4edea3]/30">
                  Connected
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#141519] space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between text-[#958ea0]">
                  <span>Active Sensor:</span>
                  <span className="text-[#e3e2e8]">{wearables.dexcom.sensorId}</span>
                </div>
                <div className="flex items-center justify-between text-[#958ea0]">
                  <span>Signal Uptime:</span>
                  <span className="text-[#4edea3]">{wearables.dexcom.uptime}</span>
                </div>
                <div className="flex items-center justify-between text-[#958ea0]">
                  <span>Latest Reading:</span>
                  <span className="text-[#ffdad2]">{wearables.dexcom.lastReading}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[#958ea0] font-sans">
                  Sensor expires in {wearables.dexcom.daysRemaining} days
                </span>
                <button
                  type="button"
                  onClick={() => showToast('✓ Dexcom sensor recalibrated with fresh telemetry stream!')}
                  className="text-xs font-space text-[#ffb4a3] hover:underline cursor-pointer"
                >
                  Recalibrate
                </button>
              </div>
            </div>

            {/* Whoop 4.0 */}
            <div className="p-5 rounded-xl bg-[#0d0e12] border border-[#292a2e] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#3b82f6]/15 border border-[#3b82f6]/30 flex items-center justify-center text-[#60a5fa]">
                    <span className="material-symbols-outlined text-[20px]">watch</span>
                  </div>
                  <div>
                    <span className="font-space font-bold text-sm text-[#e3e2e8] block">
                      Whoop 4.0 Recovery
                    </span>
                    <span className="text-[10px] text-[#958ea0] font-mono">
                      HRV &amp; Strain Telemetry
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-space text-[#4edea3] font-bold bg-[#003824] px-2 py-0.5 rounded border border-[#4edea3]/30">
                  Connected
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#141519] space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between text-[#958ea0]">
                  <span>Battery Level:</span>
                  <span className="text-[#e3e2e8]">{wearables.whoop.battery}</span>
                </div>
                <div className="flex items-center justify-between text-[#958ea0]">
                  <span>Today&apos;s Recovery:</span>
                  <span className="text-[#4edea3]">{wearables.whoop.recoveryScore}</span>
                </div>
                <div className="flex items-center justify-between text-[#958ea0]">
                  <span>7-Day HRV Baseline:</span>
                  <span className="text-[#e3e2e8]">{wearables.whoop.hrvBaseline}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[#958ea0] font-sans">
                  Sleep &amp; recovery synced daily at 06:00 AM
                </span>
                <button
                  type="button"
                  onClick={() => showToast('✓ Whoop strap sync refreshed!')}
                  className="text-xs font-space text-[#ffb4a3] hover:underline cursor-pointer"
                >
                  Sync Now
                </button>
              </div>
            </div>

            {/* Apple Health */}
            <div className="p-5 rounded-xl bg-[#0d0e12] border border-[#292a2e] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#ef4444]/15 border border-[#ef4444]/30 flex items-center justify-center text-[#f87171]">
                    <span className="material-symbols-outlined text-[20px]">favorite</span>
                  </div>
                  <div>
                    <span className="font-space font-bold text-sm text-[#e3e2e8] block">
                      Apple Health / HealthKit
                    </span>
                    <span className="text-[10px] text-[#958ea0] font-mono">
                      Steps &amp; Active Burn
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-space text-[#4edea3] font-bold bg-[#003824] px-2 py-0.5 rounded border border-[#4edea3]/30">
                  Connected
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#141519] space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between text-[#958ea0]">
                  <span>Last Sync:</span>
                  <span className="text-[#e3e2e8]">{wearables.appleHealth.lastSync}</span>
                </div>
                <div className="flex items-center justify-between text-[#958ea0]">
                  <span>Today&apos;s Steps:</span>
                  <span className="text-[#e3e2e8]">{wearables.appleHealth.steps}</span>
                </div>
                <div className="flex items-center justify-between text-[#958ea0]">
                  <span>Active Energy Burn:</span>
                  <span className="text-[#ffdad2]">{wearables.appleHealth.activeEnergy}</span>
                </div>
              </div>
            </div>

            {/* Withings Smart Scale */}
            <div className="p-5 rounded-xl bg-[#0d0e12] border border-[#292a2e] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 flex items-center justify-center text-[#a78bfa]">
                    <span className="material-symbols-outlined text-[20px]">scale</span>
                  </div>
                  <div>
                    <span className="font-space font-bold text-sm text-[#e3e2e8] block">
                      Withings Body Smart Scale
                    </span>
                    <span className="text-[10px] text-[#958ea0] font-mono">
                      Morning Weigh-In Auto-Sync
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-space text-[#4edea3] font-bold bg-[#003824] px-2 py-0.5 rounded border border-[#4edea3]/30">
                  Connected
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#141519] space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between text-[#958ea0]">
                  <span>Latest Weigh-In:</span>
                  <span className="text-[#e3e2e8]">{wearables.withings.lastWeighIn}</span>
                </div>
                <div className="flex items-center justify-between text-[#958ea0]">
                  <span>Sync Mechanism:</span>
                  <span className="text-[#4edea3]">Wi-Fi Direct Telemetry</span>
                </div>
              </div>
            </div>

            {/* Oura Ring Gen 3 */}
            <div className="p-5 rounded-xl bg-[#0d0e12] border border-[#292a2e] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#f59e0b]/15 border border-[#f59e0b]/30 flex items-center justify-center text-[#fbbf24]">
                    <span className="material-symbols-outlined text-[20px]">circle</span>
                  </div>
                  <div>
                    <span className="font-space font-bold text-sm text-[#e3e2e8] block">
                      Oura Ring Gen 3
                    </span>
                    <span className="text-[10px] text-[#958ea0] font-mono">
                      Sleep Architecture &amp; Readiness
                    </span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-space font-bold px-2 py-0.5 rounded border ${
                    wearables.oura.connected
                      ? 'bg-[#003824] text-[#4edea3] border-[#4edea3]/30'
                      : 'bg-[#1a1b20] text-[#958ea0] border-[#292a2e]'
                  }`}
                >
                  {wearables.oura.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-[#958ea0] font-sans">
                  {wearables.oura.connected
                    ? 'Nightly sleep stage tracking active'
                    : 'Connect to sync nocturnal HRV & readiness'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const nextState = !wearables.oura.connected;
                    setWearables((prev) => ({ ...prev, oura: { connected: nextState } }));
                    showToast(
                      nextState
                        ? '✓ Oura Ring Gen 3 connected to Cadence Vault!'
                        : 'Oura Ring disconnected.'
                    );
                  }}
                  className={`text-xs font-space font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    wearables.oura.connected
                      ? 'border-[#ff5449]/40 text-[#ff5449] hover:bg-[#ff5449]/10'
                      : 'border-[#ffb4a3]/50 bg-[#ffb4a3]/20 text-[#ffdad2] hover:bg-[#ffb4a3]/30'
                  }`}
                >
                  {wearables.oura.connected ? 'Disconnect' : 'Connect Oura'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 5: SECURITY & DATA PRIVACY */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSaveSecurity}
            className="lg:col-span-7 p-6 rounded-xl bg-[#1a1b20] border border-[#292a2e]/60 space-y-5 shadow-xl"
          >
            <div className="border-b border-[#292a2e]/60 pb-3">
              <h3 className="font-space font-bold text-base text-[#e3e2e8]">
                Update Account Password
              </h3>
              <p className="text-xs text-[#958ea0] font-sans">
                Choose a strong, unique password to safeguard your personal health telemetry and lab reports.
              </p>
            </div>

            <div>
              <label className="block text-xs font-space text-[#958ea0] uppercase font-semibold mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={securityForm.currentPassword}
                onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                placeholder="••••••••••••"
                className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-lg px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none focus:border-[#ffdad2]"
              />
            </div>

            <div>
              <label className="block text-xs font-space text-[#958ea0] uppercase font-semibold mb-1">
                New Password (Minimum 8 Characters)
              </label>
              <input
                type="password"
                value={securityForm.newPassword}
                onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
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
                value={securityForm.confirmPassword}
                onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
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

          {/* Right Col: 2FA & Privacy Vault */}
          <div className="lg:col-span-5 space-y-5">
            {/* 2FA */}
            <div className="p-6 rounded-xl bg-[#1a1b20] border border-[#292a2e]/60 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-space font-bold text-sm text-[#e3e2e8]">
                    Two-Factor Authentication (2FA)
                  </h4>
                  <p className="text-[11px] text-[#958ea0] font-sans">
                    SMS verification codes sent to +1 (415) 890-4321 on new logins.
                  </p>
                </div>
                <span className="text-[10px] font-space text-[#4edea3] font-bold bg-[#003824] px-2 py-0.5 rounded border border-[#4edea3]/30">
                  Enabled
                </span>
              </div>
            </div>

            {/* HIPAA Compliance */}
            <div className="p-6 rounded-xl bg-[#0d0e12] border border-[#292a2e]/60 space-y-2">
              <div className="flex items-center gap-2 text-[#4edea3]">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                <span className="font-space font-bold text-xs">HIPAA &amp; SOC2 Data Isolation</span>
              </div>
              <p className="text-[11px] text-[#958ea0] font-sans leading-relaxed">
                Your biological datasets, blood chemistry panels, Dexcom glucose feeds, and DEXA scans are stored in a dedicated encrypted tenant partition. No coach outside Julian Vance has authorization to access your health data.
              </p>
            </div>

            {/* Active Sessions */}
            <div className="p-6 rounded-xl bg-[#1a1b20] border border-[#292a2e]/60 space-y-3 shadow-xl">
              <h4 className="font-space font-bold text-xs text-[#e3e2e8] uppercase tracking-wider">
                Active Client Sessions
              </h4>
              <div className="space-y-2 font-mono text-[11px]">
                <div className="p-2.5 rounded-lg bg-[#0d0e12] border border-[#292a2e] flex items-center justify-between">
                  <div>
                    <span className="text-[#e3e2e8] block">Chrome 128 · macOS Sonoma</span>
                    <span className="text-[#958ea0] text-[10px]">San Francisco, CA · Current Session</span>
                  </div>
                  <span className="text-[#4edea3] font-bold">Active</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0d0e12] border border-[#292a2e] flex items-center justify-between">
                  <div>
                    <span className="text-[#e3e2e8] block">Cadence Mobile iOS 18</span>
                    <span className="text-[#958ea0] text-[10px]">iPhone 16 Pro · Active 2h ago</span>
                  </div>
                  <span className="text-[#958ea0]">Background</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── UPDATE PAYMENT CARD MODAL ── */}
      {showUpdateCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans animate-fadeIn">
          <div className="bg-[#141519] border border-[#292a2e] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#292a2e] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ffb4a3] text-[20px]">credit_card</span>
                <h3 className="font-space font-bold text-sm text-[#e3e2e8]">
                  Update Payment Method
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUpdateCardModal(false)}
                className="text-[#958ea0] hover:text-[#e3e2e8] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <form onSubmit={handleUpdatePaymentCard} className="space-y-3">
              <div>
                <label className="text-[11px] font-space text-[#958ea0] block mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  value={tempCardNumber}
                  onChange={(e) => setTempCardNumber(e.target.value)}
                  placeholder="4242 •••• •••• 7721"
                  required
                  className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-xl px-3 py-2 text-xs text-[#e3e2e8] font-mono focus:outline-none focus:border-[#ffb4a3]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-space text-[#958ea0] block mb-1">
                    Expiry
                  </label>
                  <input
                    type="text"
                    value={tempExpiry}
                    onChange={(e) => setTempExpiry(e.target.value)}
                    placeholder="MM/YY"
                    required
                    className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-xl px-3 py-2 text-xs text-[#e3e2e8] font-mono focus:outline-none focus:border-[#ffb4a3]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-space text-[#958ea0] block mb-1">
                    CVC
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={tempCvc}
                    onChange={(e) => setTempCvc(e.target.value)}
                    placeholder="888"
                    required
                    className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-xl px-3 py-2 text-xs text-[#e3e2e8] font-mono focus:outline-none focus:border-[#ffb4a3]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-space text-[#958ea0] block mb-1">
                    ZIP
                  </label>
                  <input
                    type="text"
                    value={tempZip}
                    onChange={(e) => setTempZip(e.target.value)}
                    placeholder="94025"
                    required
                    className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-xl px-3 py-2 text-xs text-[#e3e2e8] font-mono focus:outline-none focus:border-[#ffb4a3]"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0d0e12] border border-[#292a2e] flex items-center gap-2 text-[10px] text-[#958ea0] font-mono">
                <span className="material-symbols-outlined text-[14px] text-[#4edea3]">lock</span>
                <span>Tokenized with Stripe PCI-DSS Level 1 Encryption</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUpdateCardModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#292a2e] text-xs font-space font-semibold text-[#958ea0] hover:text-[#e3e2e8] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#ffb4a3] text-[#3a0900] hover:bg-[#ffdad2] text-xs font-space font-bold cursor-pointer shadow-md"
                >
                  Save Card to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PAUSE / CANCEL RETAINER MODAL ── */}
      {showPauseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans animate-fadeIn">
          <div className="bg-[#141519] border border-[#292a2e] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#f59e0b]">
              <span className="material-symbols-outlined text-[22px]">pause_circle</span>
              <h3 className="font-space font-bold text-sm text-[#e3e2e8]">
                Pause or Modify Coaching Retainer
              </h3>
            </div>

            <p className="text-xs text-[#cbc3d7] font-sans leading-relaxed">
              Per your Cadence Coaching Agreement, retainers can be paused for up to 60 days (e.g. for injury, travel, or off-season) or terminated with a 30-day written notice.
            </p>

            <p className="text-xs text-[#958ea0] font-sans">
              Would you like to notify Coach Julian Vance directly to schedule a transition review?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPauseModal(false)}
                className="px-4 py-2 rounded-xl border border-[#292a2e] text-xs font-space font-semibold text-[#958ea0] hover:text-[#e3e2e8] cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPauseModal(false);
                  onMessageCoach?.();
                }}
                className="px-4 py-2 rounded-xl bg-[#ffb4a3] text-[#3a0900] hover:bg-[#ffdad2] text-xs font-space font-bold cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[15px]">chat</span>
                <span>Discuss with Coach Vance</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
