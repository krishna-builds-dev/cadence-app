import React, { useState, useEffect } from 'react';
import type { ClientEntry, PrescriptionItem, PrescriptionCategory, PrescriptionStatus } from '../../types/dashboard';

interface PrescriptiveStudioSectionProps {
  clients: ClientEntry[];
  prescriptions: PrescriptionItem[];
  setPrescriptions: React.Dispatch<React.SetStateAction<PrescriptionItem[]>>;
  initialRecipient?: string;
  initialCal?: string;
  initialCarbs?: string;
  initialReason?: string;
}

const CATEGORY_LABELS: Record<PrescriptionCategory, { label: string; color: string }> = {
  macro_shift: { label: 'Macro Shift', color: 'bg-[#ffb4a3]/10 text-[#ffb4a3] border-[#ffb4a3]/30' },
  refeed_buffer: { label: 'Re-feed Buffer', color: 'bg-[#4edea3]/10 text-[#4edea3] border-[#4edea3]/30' },
  metabolic_reset: { label: 'Metabolic Reset', color: 'bg-amber-400/10 text-amber-300 border-amber-400/30' },
  deload_recovery: { label: 'Deload Recovery', color: 'bg-indigo-400/10 text-indigo-300 border-indigo-400/30' },
  peak_week: { label: 'Peak Week', color: 'bg-rose-400/10 text-rose-300 border-rose-400/30' },
};

const AI_RATIONALE_TEMPLATES = [
  {
    title: 'Glycogen & Leptin Reset',
    delta: '+25g Carbs',
    category: 'refeed_buffer' as PrescriptionCategory,
    calDelta: 100,
    carbsDelta: 25,
    proteinDelta: 0,
    fatDelta: 0,
    text: 'Sustained metabolic plateaus suggest chronic glycogen depletion. Increasing carbohydrate allocation by +25g daily restores leptin dynamics, blunts cortisol elevations, and reactivates baseline metabolic rate.',
  },
  {
    title: 'Nervous System Deload',
    delta: '-15% Calories',
    category: 'deload_recovery' as PrescriptionCategory,
    calDelta: -300,
    carbsDelta: -50,
    proteinDelta: 10,
    fatDelta: -5,
    text: 'Normalized training volume to 50% for 7-day central nervous system recovery. Elevated protein floor to 2.2g/kg to safeguard lean tissue during systemic fatigue flush.',
  },
  {
    title: 'Metabolic Rate Reboot',
    delta: '+150 kcal Surplus',
    category: 'metabolic_reset' as PrescriptionCategory,
    calDelta: 150,
    carbsDelta: 20,
    proteinDelta: 10,
    fatDelta: 3,
    text: 'Breaking 14-day weight stall by bumping maintenance caloric buffer. Enhances active thyroid T3 conversion after multi-week sustained caloric restriction.',
  },
  {
    title: 'Diurnal Protein Front-Load',
    delta: '+15g AM Protein',
    category: 'macro_shift' as PrescriptionCategory,
    calDelta: 60,
    carbsDelta: 0,
    proteinDelta: 15,
    fatDelta: 0,
    text: 'Front-loading 40g leucine-rich protein to the morning meal stimulates muscle protein synthesis early in the circadian cycle and mitigates mid-afternoon cravings.',
  },
  {
    title: 'Intra-Workout Osmolality',
    delta: '+40g Intra-Carbs',
    category: 'peak_week' as PrescriptionCategory,
    calDelta: 160,
    carbsDelta: 40,
    proteinDelta: 0,
    fatDelta: 0,
    text: 'Supplementing intra-workout cluster dextrin and electrolyte matrix during 90-minute endurance sessions prevents cardiac drift and preserves glycogen stores.',
  },
];

export default function PrescriptiveStudioSection({
  clients,
  prescriptions,
  setPrescriptions,
  initialRecipient,
  initialCal,
  initialCarbs,
  initialReason,
}: PrescriptiveStudioSectionProps) {
  // Primary View Mode
  const [activeTab, setActiveTab] = useState<'studio' | 'mobile_preview'>('studio');

  // Form State
  const [selectedClientId, setSelectedClientId] = useState<string>(
    clients[0]?.id || 'c10'
  );
  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];

  const [calInput, setCalInput] = useState<string>('2150');
  const [proteinInput, setProteinInput] = useState<string>('150');
  const [carbsInput, setCarbsInput] = useState<string>('215');
  const [fatInput, setFatInput] = useState<string>('55');
  const [categoryInput, setCategoryInput] = useState<PrescriptionCategory>('refeed_buffer');
  const [deltaTagInput, setDeltaTagInput] = useState<string>('+25g Carbs / Re-feed');
  const [reasonInput, setReasonInput] = useState<string>(
    'Metabolic plateaus across consecutive days suggest chronic glycogen depletion. Increasing carbohydrate allocation restores leptin dynamics and baseline metabolic rate.'
  );

  useEffect(() => {
    if (initialRecipient) {
      const match = clients.find(
        (c) => c.name.toLowerCase() === initialRecipient.toLowerCase() || c.id === initialRecipient
      );
      if (match) setSelectedClientId(match.id);
    }
    if (initialCal) setCalInput(initialCal.replace(/,/g, ''));
    if (initialCarbs) setCarbsInput(initialCarbs.replace(/,/g, ''));
    if (initialReason) setReasonInput(initialReason);
  }, [initialRecipient, initialCal, initialCarbs, initialReason, clients]);
  const [publishToMobile, setPublishToMobile] = useState<boolean>(true);
  const [commitNotice, setCommitNotice] = useState<string | null>(null);

  // Search and Filtering in Audit Feed
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Editing Modal State
  const [editingItem, setEditingItem] = useState<PrescriptionItem | null>(null);

  // Mobile Preview Modal State (from Feed)
  const [previewItem, setPreviewItem] = useState<PrescriptionItem | null>(null);

  // Delete Confirmation Modal State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Calculations for Macro Ratio
  const pGrams = parseFloat(proteinInput) || 0;
  const cGrams = parseFloat(carbsInput) || 0;
  const fGrams = parseFloat(fatInput) || 0;
  const targetCal = parseFloat(calInput) || 0;
  const calcCal = pGrams * 4 + cGrams * 4 + fGrams * 9;

  const pPct = calcCal > 0 ? Math.round(((pGrams * 4) / calcCal) * 100) : 0;
  const cPct = calcCal > 0 ? Math.round(((cGrams * 4) / calcCal) * 100) : 0;
  const fPct = calcCal > 0 ? Math.round(((fGrams * 9) / calcCal) * 100) : 0;

  // Filtered Prescriptions for Audit Feed
  const filteredPrescriptions = prescriptions.filter((p) => {
    const matchesSearch =
      searchQuery === '' ||
      p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.shiftTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.rationale.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategoryFilter === 'all' || p.category === selectedCategoryFilter;

    const matchesStatus =
      selectedStatusFilter === 'all' || p.status === selectedStatusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // KPI Calculations
  const activeCount = prescriptions.filter((p) => p.status === 'active').length;
  const mobileSyncedCount = prescriptions.filter((p) => p.publishedToMobile).length;
  const syncRate = prescriptions.length > 0
    ? Math.round((mobileSyncedCount / prescriptions.length) * 100)
    : 100;
  const avgCalories = prescriptions.length > 0
    ? Math.round(prescriptions.reduce((acc, p) => acc + (p.calories || 0), 0) / prescriptions.length)
    : 2150;

  // Apply Quick Template
  const handleApplyTemplate = (tmpl: typeof AI_RATIONALE_TEMPLATES[0]) => {
    setCategoryInput(tmpl.category);
    setDeltaTagInput(tmpl.delta);
    setReasonInput(tmpl.text);
    const currCal = parseInt(calInput, 10) || 2150;
    const currProtein = parseInt(proteinInput, 10) || 150;
    const currCarbs = parseInt(carbsInput, 10) || 215;
    const currFat = parseInt(fatInput, 10) || 55;

    setCalInput(String(Math.max(1200, currCal + tmpl.calDelta)));
    setProteinInput(String(Math.max(50, currProtein + tmpl.proteinDelta)));
    setCarbsInput(String(Math.max(50, currCarbs + tmpl.carbsDelta)));
    setFatInput(String(Math.max(20, currFat + tmpl.fatDelta)));
  };

  // Submit New Prescription
  const handleCommitProtocol = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonInput.trim()) return;

    const newPrescription: PrescriptionItem = {
      id: 'rx_' + Date.now(),
      clientId: selectedClient?.id || 'c1',
      clientName: selectedClient?.name || 'Athlete',
      timestamp: 'Just now',
      shiftTag: deltaTagInput.trim() || `${calInput} kcal Shift`,
      statusText: publishToMobile ? 'Published to Mobile' : 'Draft Protocol',
      status: 'active',
      category: categoryInput,
      calories: parseInt(calInput, 10) || 2000,
      protein: parseInt(proteinInput, 10) || 150,
      carbs: parseInt(carbsInput, 10) || 200,
      fat: parseInt(fatInput, 10) || 50,
      deltaTag: deltaTagInput.trim() || undefined,
      rationale: reasonInput.trim(),
      publishedToMobile: publishToMobile,
      notes: `Target: ${calInput} kcal • P:${proteinInput}g C:${carbsInput}g F:${fatInput}g`,
    };

    setPrescriptions((prev) => [newPrescription, ...prev]);
    setCommitNotice(`Published protocol to ${selectedClient?.name || 'Client'}'s mobile timeline!`);
    setTimeout(() => setCommitNotice(null), 4000);
  };

  // Toggle Mobile Publish status
  const handleTogglePublish = (id: string) => {
    setPrescriptions((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextPub = !item.publishedToMobile;
          return {
            ...item,
            publishedToMobile: nextPub,
            statusText: nextPub ? 'Published to Mobile' : 'Unpublished (Draft)',
          };
        }
        return item;
      })
    );
  };

  // Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setPrescriptions((prev) =>
      prev.map((item) => (item.id === editingItem.id ? editingItem : item))
    );
    setEditingItem(null);
  };

  // Delete Prescription
  const handleDelete = (id: string) => {
    setPrescriptions((prev) => prev.filter((p) => p.id !== id));
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      {/* ── TOP BANNER & KPI METRICS ── */}
      <div className="p-6 rounded-xl bg-[#1a1b20]/90 backdrop-blur-xl border border-[#292a2e]/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-space text-xs text-[#ffdad2] font-bold uppercase tracking-wider">
            <span className="px-1.5 py-0.5 rounded bg-[#e85a2b]/20 text-[#ffb4a3]">Pillar 4</span>
            <span className="text-[#958ea0]">//</span>
            <span>Clinical & Athletic Rationale Engine</span>
          </div>
          <h2 className="font-space text-2xl text-[#e3e2e8] font-bold mt-1">Prescriptive Intelligence Desk</h2>
          <p className="text-xs text-[#958ea0] font-sans mt-0.5 max-w-2xl">
            Every macro adjustment automatically crafts a clear clinical/athletic rationale card pushed directly to your client&apos;s mobile app (&quot;Why My Plan Changed&quot;).
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-[#0d0e12] p-1 rounded-lg border border-[#292a2e] self-start md:self-auto shrink-0">
          <button
            onClick={() => setActiveTab('studio')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-space font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'studio'
                ? 'bg-[#ffb4a3] text-[#3a0900] shadow'
                : 'text-[#958ea0] hover:text-[#e3e2e8]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>Studio &amp; Feed</span>
          </button>
          <button
            onClick={() => setActiveTab('mobile_preview')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-space font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'mobile_preview'
                ? 'bg-[#ffb4a3] text-[#3a0900] shadow'
                : 'text-[#958ea0] hover:text-[#e3e2e8]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">smartphone</span>
            <span>Mobile App Preview</span>
          </button>
        </div>
      </div>

      {/* ── KPI METRICS CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#1a1b20] border border-[#292a2e]/60">
          <div className="flex items-center justify-between text-xs text-[#958ea0] font-space uppercase">
            <span>Active Protocols</span>
            <span className="material-symbols-outlined text-[18px] text-[#4edea3]">electric_bolt</span>
          </div>
          <div className="text-2xl font-bold font-space text-[#e3e2e8] mt-1">{activeCount}</div>
          <p className="text-[11px] text-[#4edea3] mt-1 font-space">Live in client timelines</p>
        </div>

        <div className="p-4 rounded-xl bg-[#1a1b20] border border-[#292a2e]/60">
          <div className="flex items-center justify-between text-xs text-[#958ea0] font-space uppercase">
            <span>Mobile Push Sync</span>
            <span className="material-symbols-outlined text-[18px] text-[#ffb4a3]">cloud_done</span>
          </div>
          <div className="text-2xl font-bold font-space text-[#e3e2e8] mt-1">{syncRate}%</div>
          <p className="text-[11px] text-[#958ea0] mt-1 font-space">{mobileSyncedCount} of {prescriptions.length} synced</p>
        </div>

        <div className="p-4 rounded-xl bg-[#1a1b20] border border-[#292a2e]/60">
          <div className="flex items-center justify-between text-xs text-[#958ea0] font-space uppercase">
            <span>Avg Daily Intake</span>
            <span className="material-symbols-outlined text-[18px] text-[#ffdad2]">local_fire_department</span>
          </div>
          <div className="text-2xl font-bold font-space text-[#e3e2e8] mt-1">{avgCalories.toLocaleString()} <span className="text-xs font-normal text-[#958ea0]">kcal</span></div>
          <p className="text-[11px] text-[#958ea0] mt-1 font-space">Across active roster</p>
        </div>

        <div className="p-4 rounded-xl bg-[#1a1b20] border border-[#292a2e]/60">
          <div className="flex items-center justify-between text-xs text-[#958ea0] font-space uppercase">
            <span>Total Logged Shifts</span>
            <span className="material-symbols-outlined text-[18px] text-amber-300">history_edu</span>
          </div>
          <div className="text-2xl font-bold font-space text-[#e3e2e8] mt-1">{prescriptions.length}</div>
          <p className="text-[11px] text-amber-300 mt-1 font-space">Audited clinical entries</p>
        </div>
      </div>

      {commitNotice && (
        <div className="p-3.5 rounded-lg bg-[#003824] text-[#4edea3] font-space text-xs font-semibold flex items-center gap-2 border border-[#4edea3]/30 animate-fadeIn">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{commitNotice}</span>
        </div>
      )}

      {/* ── TAB 1: STUDIO COMPOSER & AUDIT FEED ── */}
      {activeTab === 'studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── LEFT: PRESCRIPTION COMPOSER (7 cols) ── */}
          <form
            onSubmit={handleCommitProtocol}
            className="lg:col-span-7 bg-[#1a1b20] border border-[#292a2e]/60 rounded-xl p-6 shadow-sm flex flex-col justify-between gap-5"
          >
            <div className="flex flex-col gap-4">
              {/* Recipient Selection Header */}
              <div className="flex items-center justify-between">
                <span className="font-space text-xs text-[#958ea0] uppercase tracking-wider font-semibold">
                  Target Recipient &amp; Baseline
                </span>
                <span className="text-[11px] font-space text-[#4edea3] bg-[#003824] px-2 py-0.5 rounded font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
                  Mobile Synced
                </span>
              </div>

              {/* Recipient Card */}
              <div className="p-3.5 rounded-lg bg-[#0d0e12] border border-[#292a2e]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#ffb4a3]/20 text-[#ffdad2] font-space text-xs flex items-center justify-center font-bold">
                    {selectedClient?.initials || 'C'}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-space font-semibold text-sm text-[#e3e2e8]">
                      {selectedClient?.name || 'Client'}
                    </span>
                    <span className="text-xs text-[#958ea0] font-sans">
                      {selectedClient?.focus || 'Metabolic Optimization'} • Retainer: {selectedClient?.monthlyRetainer || '$1,200/mo'}
                    </span>
                  </div>
                </div>

                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="bg-[#292a2e] border border-[#343439] font-space text-xs text-[#e3e2e8] px-3 py-1.5 rounded-lg cursor-pointer focus:outline-none"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.focus.split('•')[0].trim()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick AI Presets Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-space text-[#958ea0] uppercase font-semibold">
                    1-Click Clinical Presets
                  </span>
                  <span className="text-[10px] font-space text-[#ffb4a3] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                    Auto-adjusts macros &amp; rationale
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {AI_RATIONALE_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.title}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#0d0e12] hover:bg-[#292a2e] border border-[#292a2e] hover:border-[#ffb4a3]/40 text-[11px] font-space text-[#cbc3d7] transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#e85a2b]" />
                      <span>{tmpl.title}</span>
                      <span className="text-[10px] text-[#ffdad2] font-bold">({tmpl.delta})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Macro Inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="flex flex-col gap-1 bg-[#0d0e12] border border-[#292a2e]/50 p-3 rounded-lg">
                  <span className="text-[10px] font-space text-[#958ea0] uppercase font-semibold">Calories</span>
                  <div className="flex items-baseline gap-1">
                    <input
                      type="number"
                      value={calInput}
                      onChange={(e) => setCalInput(e.target.value)}
                      className="w-full bg-transparent font-space text-lg font-bold text-[#e3e2e8] focus:outline-none"
                      required
                    />
                    <span className="text-[10px] text-[#958ea0] font-space">kcal</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 bg-[#0d0e12] border border-[#292a2e]/50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-space text-[#958ea0] uppercase font-semibold">Protein</span>
                    <span className="text-[9px] font-space text-indigo-400 font-bold">{pPct}%</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <input
                      type="number"
                      value={proteinInput}
                      onChange={(e) => setProteinInput(e.target.value)}
                      className="w-full bg-transparent font-space text-lg font-bold text-[#e3e2e8] focus:outline-none"
                      required
                    />
                    <span className="text-[10px] text-[#958ea0] font-space">g</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 bg-[#0d0e12] border border-[#292a2e]/50 p-3 rounded-lg relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-space text-[#958ea0] uppercase font-semibold">Carbs</span>
                    <span className="text-[9px] font-space text-[#ffdad2] font-bold">{cPct}%</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <input
                      type="number"
                      value={carbsInput}
                      onChange={(e) => setCarbsInput(e.target.value)}
                      className="w-full bg-transparent font-space text-lg font-bold text-[#ffdad2] focus:outline-none"
                      required
                    />
                    <span className="text-[10px] text-[#958ea0] font-space">g</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 bg-[#0d0e12] border border-[#292a2e]/50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-space text-[#958ea0] uppercase font-semibold">Fat</span>
                    <span className="text-[9px] font-space text-amber-300 font-bold">{fPct}%</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <input
                      type="number"
                      value={fatInput}
                      onChange={(e) => setFatInput(e.target.value)}
                      className="w-full bg-transparent font-space text-lg font-bold text-[#e3e2e8] focus:outline-none"
                      required
                    />
                    <span className="text-[10px] text-[#958ea0] font-space">g</span>
                  </div>
                </div>
              </div>

              {/* Macro Energy Ratio Bar */}
              <div className="p-3 bg-[#0d0e12] border border-[#292a2e]/50 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-space">
                  <span className="text-[#958ea0]">Macro Energy Ratio:</span>
                  <span className="text-[#e3e2e8]">
                    Calculated: <span className="font-bold">{calcCal}</span> kcal{' '}
                    {targetCal > 0 && Math.abs(calcCal - targetCal) > 50 && (
                      <span className="text-amber-400">({calcCal > targetCal ? `+${calcCal - targetCal}` : calcCal - targetCal} delta)</span>
                    )}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#1a1b20] overflow-hidden flex">
                  <div style={{ width: `${pPct}%` }} className="bg-indigo-400 h-full" title={`Protein ${pPct}%`} />
                  <div style={{ width: `${cPct}%` }} className="bg-[#ffb4a3] h-full" title={`Carbs ${cPct}%`} />
                  <div style={{ width: `${fPct}%` }} className="bg-amber-400 h-full" title={`Fat ${fPct}%`} />
                </div>
                <div className="flex items-center justify-between text-[10px] font-space text-[#958ea0] pt-0.5">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" /> Protein {pPct}%</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ffb4a3] inline-block" /> Carbs {cPct}%</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Fat {fPct}%</span>
                </div>
              </div>

              {/* Category & Shift Tag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-space text-[#958ea0] uppercase font-semibold">
                    Protocol Category
                  </label>
                  <select
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value as PrescriptionCategory)}
                    className="bg-[#0d0e12] border border-[#292a2e]/60 rounded-lg p-2.5 text-xs text-[#e3e2e8] font-space cursor-pointer focus:outline-none focus:border-[#ffdad2]"
                  >
                    <option value="refeed_buffer">Re-feed Buffer</option>
                    <option value="macro_shift">Macro Shift</option>
                    <option value="metabolic_reset">Metabolic Reset</option>
                    <option value="deload_recovery">Deload Recovery</option>
                    <option value="peak_week">Peak Week</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-space text-[#958ea0] uppercase font-semibold">
                    Shift Headline / Tag
                  </label>
                  <input
                    type="text"
                    value={deltaTagInput}
                    onChange={(e) => setDeltaTagInput(e.target.value)}
                    placeholder="e.g. +25g Carbs / Re-feed"
                    className="bg-[#0d0e12] border border-[#292a2e]/60 rounded-lg p-2.5 text-xs text-[#e3e2e8] font-space focus:outline-none focus:border-[#ffdad2]"
                    required
                  />
                </div>
              </div>

              {/* Coach Reasoning Rationale */}
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="coach-reasoning-input" className="text-xs font-space text-[#958ea0] uppercase font-semibold">
                    Coach Reasoning Rationale
                  </label>
                  <span className="text-[11px] font-space text-[#ffdad2] flex items-center gap-1 font-semibold">
                    <span className="material-symbols-outlined text-[13px]">visibility</span>
                    Visible in client mobile app
                  </span>
                </div>
                <textarea
                  id="coach-reasoning-input"
                  rows={3}
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="w-full bg-[#0d0e12] border border-[#292a2e]/60 rounded-lg p-3 text-xs text-[#e3e2e8] leading-relaxed focus:outline-none focus:border-[#ffdad2] resize-none font-sans"
                  placeholder="Explain the clinical, metabolic, or athletic rationale behind this shift..."
                  required
                />
              </div>

              {/* Publish to mobile toggle */}
              <label className="flex items-center gap-2.5 text-xs text-[#e3e2e8] font-space cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={publishToMobile}
                  onChange={(e) => setPublishToMobile(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#0d0e12] border-[#292a2e] text-[#e85a2b] focus:ring-0 cursor-pointer"
                />
                <span>Broadcast directly to client mobile app push feed</span>
              </label>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-[#343439]/30">
              <div className="flex items-center gap-2 text-xs text-[#958ea0] font-space">
                <span className="material-symbols-outlined text-[16px] text-[#4edea3]">check_circle</span>
                <span>Pre-flight telemetry checked</span>
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-[#ffb4a3] text-[#3a0900] font-space text-xs font-bold hover:bg-[#ffdad2] transition-all flex items-center justify-center gap-2 shadow-[0_0_14px_rgba(255,180,163,0.35)] cursor-pointer"
              >
                <span>Commit Protocol &amp; Publish Reason</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
            </div>
          </form>

          {/* ── RIGHT: CHRONOLOGICAL RATIONALE FEED (5 cols) ── */}
          <div className="lg:col-span-5 bg-[#1a1b20] border border-[#292a2e]/60 rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-space text-xs uppercase tracking-wider text-[#958ea0] font-semibold block">
                    Chronological Rationale Feed
                  </span>
                  <span className="text-[11px] text-[#cbc3d7] font-space">
                    {filteredPrescriptions.length} protocol records found
                  </span>
                </div>
                <span className="text-[11px] font-space text-[#4edea3] bg-[#003824] px-2 py-0.5 rounded font-bold">
                  Live Audit Trail
                </span>
              </div>

              {/* Feed Search & Filters */}
              <div className="space-y-2">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-[16px] text-[#958ea0]">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by athlete, tag, rationale..."
                    className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#e3e2e8] placeholder-[#958ea0]/60 focus:outline-none focus:border-[#ffdad2] font-space"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 text-[#958ea0] hover:text-[#e3e2e8]"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px] font-space">
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="bg-[#0d0e12] border border-[#292a2e] rounded px-2 py-1 text-[#cbc3d7] focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    <option value="refeed_buffer">Re-feed Buffer</option>
                    <option value="macro_shift">Macro Shift</option>
                    <option value="metabolic_reset">Metabolic Reset</option>
                    <option value="deload_recovery">Deload Recovery</option>
                    <option value="peak_week">Peak Week</option>
                  </select>

                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value)}
                    className="bg-[#0d0e12] border border-[#292a2e] rounded px-2 py-1 text-[#cbc3d7] focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Feed List */}
              <div className="flex flex-col gap-3.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredPrescriptions.length === 0 ? (
                  <div className="p-8 text-center bg-[#0d0e12] rounded-lg border border-[#292a2e]/40 text-[#958ea0]">
                    <span className="material-symbols-outlined text-3xl mb-1 text-[#ffb4a3]">inventory_2</span>
                    <p className="text-xs font-space">No prescription records match filter.</p>
                  </div>
                ) : (
                  filteredPrescriptions.map((shift) => {
                    const catStyle = CATEGORY_LABELS[shift.category] || CATEGORY_LABELS.macro_shift;

                    return (
                      <div
                        key={shift.id}
                        className="p-3.5 rounded-lg bg-[#0d0e12] border border-[#292a2e]/50 hover:border-[#ffdad2]/30 transition-all flex flex-col gap-2 group"
                      >
                        {/* Header line */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#ffb4a3]/20 text-[#ffdad2] text-[10px] font-space font-bold flex items-center justify-center">
                              {shift.clientName.split(' ').map((n) => n[0]).join('')}
                            </span>
                            <span className="font-space text-xs font-bold text-[#e3e2e8]">
                              {shift.clientName}
                            </span>
                          </div>
                          <span className="text-[10px] font-space text-[#958ea0]">
                            {shift.timestamp}
                          </span>
                        </div>

                        {/* Badges line */}
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-[#292a2e] text-[10px] font-space text-[#ffdad2] font-semibold">
                            {shift.shiftTag}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-space border ${catStyle.color}`}>
                            {catStyle.label}
                          </span>
                          <span className={`text-[10px] flex items-center gap-1 font-space ml-auto ${
                            shift.publishedToMobile ? 'text-[#4edea3]' : 'text-[#958ea0]'
                          }`}>
                            <span className="material-symbols-outlined text-[12px]">
                              {shift.publishedToMobile ? 'done_all' : 'unpublished'}
                            </span>
                            {shift.statusText}
                          </span>
                        </div>

                        {/* Macros line */}
                        <div className="grid grid-cols-4 gap-1 p-1.5 bg-[#141519] rounded font-space text-[10px] text-center">
                          <div>
                            <span className="text-[#958ea0] block">Calories</span>
                            <span className="font-bold text-[#e3e2e8]">{shift.calories}</span>
                          </div>
                          <div>
                            <span className="text-[#958ea0] block">P</span>
                            <span className="font-bold text-indigo-300">{shift.protein}g</span>
                          </div>
                          <div>
                            <span className="text-[#958ea0] block">C</span>
                            <span className="font-bold text-[#ffdad2]">{shift.carbs}g</span>
                          </div>
                          <div>
                            <span className="text-[#958ea0] block">F</span>
                            <span className="font-bold text-amber-300">{shift.fat}g</span>
                          </div>
                        </div>

                        {/* Rationale Quote */}
                        <p className="text-xs text-[#cbc3d7] line-clamp-2 italic font-sans pl-2 border-l-2 border-[#ffb4a3]/60">
                          &quot;{shift.rationale}&quot;
                        </p>

                        {/* Action Toolbar */}
                        <div className="flex items-center justify-between pt-1 text-[11px] font-space text-[#958ea0] border-t border-[#292a2e]/40">
                          <button
                            type="button"
                            onClick={() => setPreviewItem(shift)}
                            className="hover:text-[#ffdad2] flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span className="material-symbols-outlined text-[13px]">visibility</span>
                            <span>Client View</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleTogglePublish(shift.id)}
                              className={`hover:text-[#4edea3] flex items-center gap-0.5 cursor-pointer ${
                                shift.publishedToMobile ? 'text-[#4edea3]' : 'text-[#958ea0]'
                              }`}
                              title={shift.publishedToMobile ? 'Unpublish from mobile' : 'Publish to mobile'}
                            >
                              <span className="material-symbols-outlined text-[13px]">
                                {shift.publishedToMobile ? 'sync' : 'sync_disabled'}
                              </span>
                              <span>{shift.publishedToMobile ? 'Live' : 'Draft'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditingItem(shift)}
                              className="hover:text-[#e3e2e8] flex items-center gap-0.5 cursor-pointer"
                              title="Edit prescription"
                            >
                              <span className="material-symbols-outlined text-[13px]">edit</span>
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteId(shift.id)}
                              className="hover:text-red-400 flex items-center gap-0.5 cursor-pointer"
                              title="Delete prescription"
                            >
                              <span className="material-symbols-outlined text-[13px]">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Bottom Audit Status */}
            <div className="pt-4 flex items-center justify-between text-xs font-space text-[#958ea0] border-t border-[#343439]/30 mt-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#4edea3]" />
                <span>Feed Status: Synchronized</span>
              </span>
              <span className="text-[#ffdad2] font-bold">
                {prescriptions.length} Records in Ledger
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: MOBILE APP SIMULATION ("Why My Plan Changed") ── */}
      {activeTab === 'mobile_preview' && (
        <div className="p-6 rounded-xl bg-[#1a1b20] border border-[#292a2e]/60 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#292a2e]">
            <div>
              <h3 className="font-space text-lg font-bold text-[#e3e2e8]">
                Cadence Mobile — Athlete Experience Simulator
              </h3>
              <p className="text-xs text-[#958ea0] font-sans">
                Real-time preview of the &quot;Why My Plan Changed&quot; clinical rationale card delivered to the client&apos;s phone.
              </p>
            </div>

            {/* Client selector for mobile view */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-space text-[#958ea0]">Previewing:</span>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="bg-[#0d0e12] border border-[#292a2e] rounded-lg px-3 py-1.5 text-xs text-[#e3e2e8] font-space cursor-pointer"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Smartphone Frame Simulator */}
          <div className="flex justify-center">
            <div className="w-full max-w-[390px] bg-[#000] border-4 border-[#292a2e] rounded-[38px] p-4 shadow-2xl space-y-4">
              {/* Phone Speaker Notch */}
              <div className="flex justify-center">
                <div className="w-24 h-4 bg-[#141519] rounded-full" />
              </div>

              {/* Status bar */}
              <div className="flex justify-between items-center text-[10px] font-mono text-[#958ea0] px-2">
                <span>09:41</span>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[12px]">signal_cellular_alt</span>
                  <span className="material-symbols-outlined text-[12px]">wifi</span>
                  <span className="material-symbols-outlined text-[12px]">battery_full</span>
                </div>
              </div>

              {/* Mobile Push Notification Banner */}
              <div className="p-3 bg-[#1a1b20]/95 backdrop-blur-md rounded-2xl border border-[#ffb4a3]/30 shadow-lg space-y-1">
                <div className="flex items-center justify-between text-[10px] font-space">
                  <div className="flex items-center gap-1.5">
                    <img src="/favicon.svg" alt="Cadence" className="w-3.5 h-3.5" />
                    <span className="font-bold text-[#ffdad2]">CADENCE COACH</span>
                  </div>
                  <span className="text-[#958ea0]">Now</span>
                </div>
                <div className="text-xs font-bold text-[#e3e2e8] font-space">
                  New Protocol: {prescriptions.find((p) => p.clientName === selectedClient?.name)?.shiftTag || '+25g Carbs / Re-feed'}
                </div>
                <p className="text-[11px] text-[#cbc3d7] font-sans line-clamp-2">
                  Coach updated your daily nutrition protocol. Tap to review why your targets changed.
                </p>
              </div>

              {/* In-App "Why My Plan Changed" Card */}
              <div className="bg-[#141519] rounded-2xl p-4 border border-[#292a2e] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#292a2e]/60">
                  <div className="flex items-center gap-1.5 text-xs font-space font-bold text-[#ffb4a3]">
                    <span className="material-symbols-outlined text-[16px]">tips_and_updates</span>
                    <span>Why My Plan Changed</span>
                  </div>
                  <span className="text-[10px] font-space text-[#4edea3] bg-[#003824] px-1.5 py-0.5 rounded">
                    Active
                  </span>
                </div>

                {(() => {
                  const clientRx =
                    prescriptions.find((p) => p.clientName === selectedClient?.name) ||
                    prescriptions[0];

                  if (!clientRx) {
                    return (
                      <p className="text-xs text-[#958ea0] py-4 text-center">
                        No active protocols logged for this athlete yet.
                      </p>
                    );
                  }

                  return (
                    <>
                      {/* Macro Targets Card */}
                      <div className="grid grid-cols-4 gap-1.5 bg-[#0d0e12] p-2.5 rounded-xl border border-[#292a2e]/60 text-center">
                        <div>
                          <div className="text-[9px] font-space text-[#958ea0] uppercase">Target</div>
                          <div className="text-xs font-bold font-space text-[#e3e2e8]">{clientRx.calories}</div>
                          <div className="text-[8px] text-[#958ea0]">kcal</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-space text-[#958ea0] uppercase">Protein</div>
                          <div className="text-xs font-bold font-space text-indigo-300">{clientRx.protein}g</div>
                          <div className="text-[8px] text-[#958ea0]">30%</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-space text-[#958ea0] uppercase">Carbs</div>
                          <div className="text-xs font-bold font-space text-[#ffdad2]">{clientRx.carbs}g</div>
                          <div className="text-[8px] text-[#958ea0]">45%</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-space text-[#958ea0] uppercase">Fat</div>
                          <div className="text-xs font-bold font-space text-amber-300">{clientRx.fat}g</div>
                          <div className="text-[8px] text-[#958ea0]">25%</div>
                        </div>
                      </div>

                      {/* Coach Clinical Rationale */}
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-space text-[#958ea0] uppercase font-semibold">
                          Coach Clinical Rationale
                        </div>
                        <div className="p-3 bg-[#1a1b20] rounded-xl border-l-2 border-[#ffb4a3] text-xs text-[#e3e2e8] italic leading-relaxed">
                          &quot;{clientRx.rationale}&quot;
                        </div>
                      </div>

                      {/* Client Acknowledge Action */}
                      <button
                        type="button"
                        onClick={() => {
                          setCommitNotice(`Client acknowledged protocol: ${clientRx.shiftTag}`);
                          setTimeout(() => setCommitNotice(null), 3000);
                        }}
                        className="w-full py-2 bg-[#ffb4a3] text-[#3a0900] rounded-xl font-space text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow hover:bg-[#ffdad2]"
                      >
                        <span className="material-symbols-outlined text-[15px]">done_all</span>
                        <span>Acknowledge &amp; Sync to HealthKit</span>
                      </button>
                    </>
                  );
                })()}
              </div>

              {/* Bottom Phone Bar */}
              <div className="flex justify-center pt-2">
                <div className="w-32 h-1 bg-[#343439] rounded-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT PRESCRIPTION ── */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-[#141519] border border-[#292a2e] rounded-xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[#292a2e] flex items-center justify-between">
              <div>
                <h3 className="font-space text-base font-bold text-[#e3e2e8]">
                  Edit Protocol — {editingItem.clientName}
                </h3>
                <p className="text-xs text-[#958ea0]">
                  Modify macro targets, rationale, or category for this logged shift.
                </p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-[#958ea0] hover:text-[#e3e2e8] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-space text-[#958ea0] uppercase">Category</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        category: e.target.value as PrescriptionCategory,
                      })
                    }
                    className="w-full mt-1 bg-[#0d0e12] border border-[#292a2e] rounded-lg p-2 text-xs text-[#e3e2e8] font-space"
                  >
                    <option value="refeed_buffer">Re-feed Buffer</option>
                    <option value="macro_shift">Macro Shift</option>
                    <option value="metabolic_reset">Metabolic Reset</option>
                    <option value="deload_recovery">Deload Recovery</option>
                    <option value="peak_week">Peak Week</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-space text-[#958ea0] uppercase">Status</label>
                  <select
                    value={editingItem.status}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        status: e.target.value as PrescriptionStatus,
                      })
                    }
                    className="w-full mt-1 bg-[#0d0e12] border border-[#292a2e] rounded-lg p-2 text-xs text-[#e3e2e8] font-space"
                  >
                    <option value="active">Active</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-space text-[#958ea0] uppercase">Shift Tag / Title</label>
                <input
                  type="text"
                  value={editingItem.shiftTag}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, shiftTag: e.target.value })
                  }
                  className="w-full mt-1 bg-[#0d0e12] border border-[#292a2e] rounded-lg p-2 text-xs text-[#e3e2e8] font-space"
                  required
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] font-space text-[#958ea0] uppercase">Calories</label>
                  <input
                    type="number"
                    value={editingItem.calories}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, calories: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full mt-1 bg-[#0d0e12] border border-[#292a2e] rounded-lg p-2 text-xs text-[#e3e2e8] font-space"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-space text-[#958ea0] uppercase">Protein (g)</label>
                  <input
                    type="number"
                    value={editingItem.protein}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, protein: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full mt-1 bg-[#0d0e12] border border-[#292a2e] rounded-lg p-2 text-xs text-[#e3e2e8] font-space"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-space text-[#958ea0] uppercase">Carbs (g)</label>
                  <input
                    type="number"
                    value={editingItem.carbs}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, carbs: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full mt-1 bg-[#0d0e12] border border-[#292a2e] rounded-lg p-2 text-xs text-[#e3e2e8] font-space"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-space text-[#958ea0] uppercase">Fat (g)</label>
                  <input
                    type="number"
                    value={editingItem.fat}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, fat: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full mt-1 bg-[#0d0e12] border border-[#292a2e] rounded-lg p-2 text-xs text-[#e3e2e8] font-space"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-space text-[#958ea0] uppercase">Rationale</label>
                <textarea
                  rows={3}
                  value={editingItem.rationale}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, rationale: e.target.value })
                  }
                  className="w-full mt-1 bg-[#0d0e12] border border-[#292a2e] rounded-lg p-2.5 text-xs text-[#e3e2e8] leading-relaxed resize-none font-sans"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#292a2e]">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-lg bg-[#292a2e] text-xs font-space font-semibold text-[#e3e2e8] hover:bg-[#343439]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#ffb4a3] text-[#3a0900] text-xs font-space font-bold hover:bg-[#ffdad2]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: PREVIEW ITEM IN CLIENT MOBILE CARD ── */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-[#141519] border border-[#292a2e] rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#292a2e]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ffb4a3] text-[20px]">smartphone</span>
                <span className="font-space font-bold text-sm text-[#e3e2e8]">
                  Mobile Preview: {previewItem.clientName}
                </span>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="text-[#958ea0] hover:text-[#e3e2e8]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-3.5 bg-[#0d0e12] rounded-xl border border-[#292a2e]/60 space-y-3">
              <div className="flex items-center justify-between text-xs font-space">
                <span className="font-bold text-[#ffdad2]">{previewItem.shiftTag}</span>
                <span className="text-[10px] text-[#958ea0]">{previewItem.timestamp}</span>
              </div>

              <div className="grid grid-cols-4 gap-1 p-2 bg-[#1a1b20] rounded-lg text-center font-space text-[10px]">
                <div>
                  <span className="text-[#958ea0] block">Cal</span>
                  <span className="font-bold text-[#e3e2e8]">{previewItem.calories}</span>
                </div>
                <div>
                  <span className="text-[#958ea0] block">P</span>
                  <span className="font-bold text-indigo-300">{previewItem.protein}g</span>
                </div>
                <div>
                  <span className="text-[#958ea0] block">C</span>
                  <span className="font-bold text-[#ffdad2]">{previewItem.carbs}g</span>
                </div>
                <div>
                  <span className="text-[#958ea0] block">F</span>
                  <span className="font-bold text-amber-300">{previewItem.fat}g</span>
                </div>
              </div>

              <div className="p-3 bg-[#1a1b20] rounded-lg border-l-2 border-[#ffb4a3] text-xs text-[#e3e2e8] italic leading-relaxed">
                &quot;{previewItem.rationale}&quot;
              </div>

              <div className="flex items-center justify-between text-[10px] font-space text-[#4edea3]">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">verified</span>
                  Verified Coach Directive
                </span>
                <span className="text-[#958ea0]">HealthKit Synced</span>
              </div>
            </div>

            <button
              onClick={() => setPreviewItem(null)}
              className="w-full py-2 bg-[#292a2e] hover:bg-[#343439] text-[#e3e2e8] rounded-lg font-space text-xs font-semibold"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: DELETE CONFIRMATION ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-[#141519] border border-[#292a2e] rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <span className="material-symbols-outlined text-2xl">warning</span>
              <h3 className="font-space text-base font-bold text-[#e3e2e8]">Delete Protocol Record?</h3>
            </div>
            <p className="text-xs text-[#958ea0] leading-relaxed">
              This will permanently remove this prescription and its clinical rationale from both the coach audit feed and the client&apos;s timeline.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="px-3.5 py-1.5 rounded-lg bg-[#292a2e] text-xs font-space font-semibold text-[#e3e2e8] hover:bg-[#343439]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteId)}
                className="px-3.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-space font-bold"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
