import React, { useState, useEffect } from 'react';
import type {
  RetainerItem,
  RetainerStatus,
  RetainerBillingCycle,
  RetainerPlan,
  ClientEntry,
} from '../../types/dashboard';
import defaultRetainersData from '../../data/retainers.json';
import defaultRetainerPlansData from '../../data/retainerPlans.json';

interface RetainersSectionProps {
  clients?: ClientEntry[];
  retainers?: RetainerItem[];
  setRetainers?: React.Dispatch<React.SetStateAction<RetainerItem[]>>;
  onClientRetainerUpdated?: (clientId: string, newFee: number) => void;
}

const SESSION_RETAINERS_KEY = 'cadence_session_retainers';
const SESSION_RETAINER_PLANS_KEY = 'cadence_session_retainer_plans';

export default function RetainersSection({
  clients = [],
  retainers: propsRetainers,
  setRetainers: propsSetRetainers,
  onClientRetainerUpdated,
}: RetainersSectionProps) {
  // Session storage synchronization
  const [internalRetainers, setInternalRetainers] = useState<RetainerItem[]>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_RETAINERS_KEY);
      if (stored) return JSON.parse(stored) as RetainerItem[];
    } catch {}
    return defaultRetainersData as RetainerItem[];
  });

  const retainers = propsRetainers || internalRetainers;
  const setRetainers = propsSetRetainers || setInternalRetainers;

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_RETAINERS_KEY, JSON.stringify(retainers));
    } catch {}
  }, [retainers]);

  // Session storage synchronization for Retainer Plans (CRUD)
  const [plans, setPlans] = useState<RetainerPlan[]>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_RETAINER_PLANS_KEY);
      if (stored) return JSON.parse(stored) as RetainerPlan[];
    } catch {}
    return defaultRetainerPlansData as RetainerPlan[];
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_RETAINER_PLANS_KEY, JSON.stringify(plans));
    } catch {}
  }, [plans]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | RetainerStatus>('all');
  const [cycleFilter, setCycleFilter] = useState<'all' | RetainerBillingCycle>('all');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ── Modals State ──
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRetainer, setEditingRetainer] = useState<RetainerItem | null>(null);

  // ── Plans Manager Modals State (CRUD for Retainer Names/Packages) ──
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [planSearchQuery, setPlanSearchQuery] = useState('');
  const [editingPlan, setEditingPlan] = useState<RetainerPlan | null>(null);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);

  // Plan Form State (Create / Edit Plan Name)
  const [planFormName, setPlanFormName] = useState('');
  const [planFormTier, setPlanFormTier] = useState('Tier 1 Protocol');
  const [planFormAmount, setPlanFormAmount] = useState<number>(1800);
  const [planFormCycle, setPlanFormCycle] = useState<RetainerBillingCycle>('monthly');
  const [planFormDescription, setPlanFormDescription] = useState('');
  const [planFormDeliverables, setPlanFormDeliverables] = useState('');
  const [planFormBadgeColor, setPlanFormBadgeColor] = useState('#ffb4a3');
  const [planCascadeRename, setPlanCascadeRename] = useState(true);

  // Form State for Add / Edit Retainer
  const [formClientId, setFormClientId] = useState('');
  const [formClientName, setFormClientName] = useState('');
  const [formClientEmail, setFormClientEmail] = useState('');
  const [formSelectedPlanId, setFormSelectedPlanId] = useState<string>('');
  const [formTierLabel, setFormTierLabel] = useState('Tier 1 Protocol');
  const [formPlanName, setFormPlanName] = useState('Tier 1 High Performance Retainer');
  const [formAmount, setFormAmount] = useState<number>(1800);
  const [formCycle, setFormCycle] = useState<RetainerBillingCycle>('monthly');
  const [formStatus, setFormStatus] = useState<RetainerStatus>('active');
  const [formNextBillingDate, setFormNextBillingDate] = useState('Dec 01, 2026');
  const [formCardBrand, setFormCardBrand] = useState('Visa');
  const [formCardLast4, setFormCardLast4] = useState('4242');
  const [formNotes, setFormNotes] = useState('');

  // ── Plan Selector Handler for Add/Edit Retainer Modal ──
  const handleSelectPlanTemplate = (planId: string) => {
    setFormSelectedPlanId(planId);
    if (planId === 'custom') return;
    const found = plans.find((p) => p.id === planId);
    if (found) {
      setFormPlanName(found.name);
      setFormTierLabel(found.tierLabel);
      setFormAmount(found.defaultAmount);
      setFormCycle(found.billingCycle);
      if (found.description) setFormNotes(found.description);
    }
  };

  // ── Plan Package CRUD Operations ──
  const handleOpenCreatePlan = () => {
    setIsCreatingPlan(true);
    setEditingPlan(null);
    setPlanFormName('');
    setPlanFormTier('Tier 1 Protocol');
    setPlanFormAmount(1800);
    setPlanFormCycle('monthly');
    setPlanFormDescription('');
    setPlanFormDeliverables('Daily biometrics review\nWeekly video consultation\nPersonalized macronutrient targets');
    setPlanFormBadgeColor('#ffb4a3');
    setPlanCascadeRename(true);
  };

  const handleOpenEditPlan = (plan: RetainerPlan) => {
    setIsCreatingPlan(false);
    setEditingPlan(plan);
    setPlanFormName(plan.name);
    setPlanFormTier(plan.tierLabel);
    setPlanFormAmount(plan.defaultAmount);
    setPlanFormCycle(plan.billingCycle);
    setPlanFormDescription(plan.description || '');
    setPlanFormDeliverables(plan.deliverables ? plan.deliverables.join('\n') : '');
    setPlanFormBadgeColor(plan.badgeColor || '#ffb4a3');
    setPlanCascadeRename(true);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planFormName.trim()) {
      alert('Please enter a Retainer Plan Name.');
      return;
    }

    const deliverablesArray = planFormDeliverables
      .split('\n')
      .map((d) => d.trim())
      .filter(Boolean);

    const todayStr = new Date().toISOString().slice(0, 10);

    if (isCreatingPlan) {
      // CREATE PLAN
      const newPlan: RetainerPlan = {
        id: 'plan_' + Date.now(),
        name: planFormName.trim(),
        tierLabel: planFormTier.trim() || 'Tier 1 Protocol',
        defaultAmount: Number(planFormAmount) || 1800,
        currency: 'USD',
        billingCycle: planFormCycle,
        description: planFormDescription.trim(),
        deliverables: deliverablesArray,
        badgeColor: planFormBadgeColor,
        createdAt: todayStr,
        updatedAt: todayStr,
      };

      setPlans((prev) => [newPlan, ...prev]);
      setIsCreatingPlan(false);
      showToast(`✓ Created retainer package "${newPlan.name}"`);
    } else if (editingPlan) {
      // UPDATE / RENAME PLAN
      const oldPlanName = editingPlan.name;
      const updatedPlan: RetainerPlan = {
        ...editingPlan,
        name: planFormName.trim(),
        tierLabel: planFormTier.trim(),
        defaultAmount: Number(planFormAmount) || editingPlan.defaultAmount,
        billingCycle: planFormCycle,
        description: planFormDescription.trim(),
        deliverables: deliverablesArray,
        badgeColor: planFormBadgeColor,
        updatedAt: todayStr,
      };

      setPlans((prev) => prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p)));

      // CASCADE RENAME TO ACTIVE RETAINERS
      let affectedClientsCount = 0;
      if (planCascadeRename && oldPlanName !== updatedPlan.name) {
        setRetainers((prev) =>
          prev.map((r) => {
            if (r.planName === oldPlanName) {
              affectedClientsCount++;
              return {
                ...r,
                planName: updatedPlan.name,
                tierLabel: updatedPlan.tierLabel,
              };
            }
            return r;
          })
        );
      }

      setEditingPlan(null);
      if (affectedClientsCount > 0) {
        showToast(
          `✓ Renamed to "${updatedPlan.name}" and synced ${affectedClientsCount} client retainer(s)!`
        );
      } else {
        showToast(`✓ Retainer package "${updatedPlan.name}" updated successfully!`);
      }
    }
  };

  const handleDeletePlan = (planId: string, planName: string) => {
    const clientsSubscribed = retainers.filter((r) => r.planName === planName);
    const count = clientsSubscribed.length;

    let confirmMsg = `Are you sure you want to delete retainer plan "${planName}"?`;
    if (count > 0) {
      confirmMsg += `\n\nNote: ${count} active client(s) currently have this plan name. Deleting will remove it from packages, but their existing retainers will remain preserved.`;
    }

    if (window.confirm(confirmMsg)) {
      setPlans((prev) => prev.filter((p) => p.id !== planId));
      showToast(`Retainer plan "${planName}" removed.`);
    }
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    const defaultPlan = plans[0];
    const firstClient = clients[0];
    if (firstClient) {
      setFormClientId(firstClient.id);
      setFormClientName(firstClient.name);
      setFormClientEmail(firstClient.email || `${firstClient.name.toLowerCase().replace(' ', '.')}@example.com`);
      setFormCardLast4(firstClient.cardLast4 || '4242');
    } else {
      setFormClientId('c_new');
      setFormClientName('');
      setFormClientEmail('');
      setFormCardLast4('4242');
    }

    if (defaultPlan) {
      setFormSelectedPlanId(defaultPlan.id);
      setFormPlanName(defaultPlan.name);
      setFormTierLabel(defaultPlan.tierLabel);
      setFormAmount(defaultPlan.defaultAmount);
      setFormCycle(defaultPlan.billingCycle);
      setFormNotes(defaultPlan.description);
    } else {
      setFormSelectedPlanId('custom');
      setFormPlanName('High Performance Coaching Retainer');
      setFormTierLabel('Tier 1 Protocol');
      setFormAmount(1800);
      setFormCycle('monthly');
      setFormNotes('Standard automated monthly retainer agreement.');
    }

    setFormCycle('monthly');
    setFormStatus('active');
    setFormNextBillingDate('Dec 01, 2026');
    setFormCardBrand('Visa');
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: RetainerItem) => {
    setEditingRetainer(item);
    setFormClientId(item.clientId);
    setFormClientName(item.clientName);
    setFormClientEmail(item.clientEmail);
    setFormTierLabel(item.tierLabel);
    setFormPlanName(item.planName);
    setFormAmount(item.amount);
    setFormCycle(item.billingCycle);
    setFormStatus(item.status);
    setFormNextBillingDate(item.nextBillingDate);
    setFormCardBrand(item.cardBrand);
    setFormCardLast4(item.cardLast4);
    setFormNotes(item.notes || '');

    const matchingPlan = plans.find((p) => p.name === item.planName);
    setFormSelectedPlanId(matchingPlan ? matchingPlan.id : 'custom');
  };

  // Save New Retainer
  const handleSaveNewRetainer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientName.trim()) {
      alert('Please enter a client name.');
      return;
    }

    const initials = formClientName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const newRetainer: RetainerItem = {
      id: 'ret_' + Date.now(),
      clientId: formClientId || 'c_' + Date.now(),
      clientName: formClientName.trim(),
      clientEmail: formClientEmail.trim() || `${formClientName.toLowerCase().replace(' ', '.')}@cadence.app`,
      clientAvatar: initials,
      tierLabel: formTierLabel,
      planName: formPlanName.trim() || 'Coaching Retainer',
      amount: Number(formAmount) || 1800,
      currency: 'USD',
      billingCycle: formCycle,
      status: formStatus,
      nextBillingDate: formNextBillingDate,
      startDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      cardBrand: formCardBrand,
      cardLast4: formCardLast4.slice(-4),
      stripeSubscriptionId: `sub_Cadence_${initials}_${Date.now().toString().slice(-4)}`,
      notes: formNotes.trim(),
      lastChargedAmount: Number(formAmount),
      lastChargedDate: 'Just now (Setup)',
    };

    setRetainers((prev) => [newRetainer, ...prev]);
    if (onClientRetainerUpdated && formClientId) {
      onClientRetainerUpdated(formClientId, Number(formAmount));
    }

    setShowAddModal(false);
    showToast(`✓ Retainer created for ${newRetainer.clientName} ($${newRetainer.amount.toLocaleString()}/${newRetainer.billingCycle})`);
  };

  // Save Edited Retainer
  const handleSaveEditedRetainer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRetainer) return;

    const updated: RetainerItem = {
      ...editingRetainer,
      clientName: formClientName.trim(),
      clientEmail: formClientEmail.trim(),
      tierLabel: formTierLabel,
      planName: formPlanName.trim(),
      amount: Number(formAmount) || 0,
      billingCycle: formCycle,
      status: formStatus,
      nextBillingDate: formNextBillingDate,
      cardBrand: formCardBrand,
      cardLast4: formCardLast4.slice(-4),
      notes: formNotes.trim(),
    };

    setRetainers((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    if (onClientRetainerUpdated && updated.clientId) {
      onClientRetainerUpdated(updated.clientId, Number(formAmount));
    }

    setEditingRetainer(null);
    showToast(`✓ Retainer for ${updated.clientName} updated successfully!`);
  };

  // Toggle Status (Pause / Resume)
  const handleToggleStatus = (item: RetainerItem) => {
    const nextStatus: RetainerStatus = item.status === 'active' ? 'paused' : 'active';
    const updated: RetainerItem = {
      ...item,
      status: nextStatus,
      nextBillingDate: nextStatus === 'paused' ? 'On Hold (Paused)' : 'Dec 01, 2026',
    };
    setRetainers((prev) => prev.map((r) => (r.id === item.id ? updated : r)));
    showToast(`Retainer for ${item.clientName} is now ${nextStatus.toUpperCase()}.`);
  };

  // Trigger Instant Charge
  const handleChargeNow = (item: RetainerItem) => {
    const updated: RetainerItem = {
      ...item,
      status: 'active',
      lastChargedAmount: item.amount,
      lastChargedDate: 'Just now',
    };
    setRetainers((prev) => prev.map((r) => (r.id === item.id ? updated : r)));
    showToast(`✓ Charged $${item.amount.toLocaleString()} to ${item.clientName}'s ${item.cardBrand} •••• ${item.cardLast4} via Stripe!`);
  };

  // Delete Retainer
  const handleDeleteRetainer = (id: string, clientName: string) => {
    if (window.confirm(`Are you sure you want to cancel and delete the retainer for ${clientName}?`)) {
      setRetainers((prev) => prev.filter((r) => r.id !== id));
      showToast(`Retainer for ${clientName} removed from vault.`);
    }
  };

  // Export Retainers to CSV
  const handleExportCSV = () => {
    const headers = ['Client Name', 'Email', 'Tier', 'Plan Name', 'Monthly Amount', 'Billing Cycle', 'Status', 'Next Billing Date', 'Card', 'Stripe Sub ID'];
    const rows = retainers.map((r) => [
      `"${r.clientName}"`,
      `"${r.clientEmail}"`,
      `"${r.tierLabel}"`,
      `"${r.planName}"`,
      r.amount,
      r.billingCycle,
      r.status,
      `"${r.nextBillingDate}"`,
      `"${r.cardBrand} ${r.cardLast4}"`,
      `"${r.stripeSubscriptionId}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cadence_retainers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✓ Exported retainers ledger to CSV');
  };

  // ── Metrics Calculations ──
  const activeRetainers = retainers.filter((r) => r.status === 'active');
  const totalMRR = activeRetainers.reduce((acc, r) => acc + r.amount, 0);
  const avgRetainerValue = activeRetainers.length > 0 ? Math.round(totalMRR / activeRetainers.length) : 0;

  // ── Filtered List ──
  const filteredRetainers = retainers.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.clientName.toLowerCase().includes(q) ||
      r.clientEmail.toLowerCase().includes(q) ||
      r.planName.toLowerCase().includes(q) ||
      r.cardLast4.includes(q) ||
      r.tierLabel.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesCycle = cycleFilter === 'all' || r.billingCycle === cycleFilter;

    return matchesSearch && matchesStatus && matchesCycle;
  });

  // Filtered Plans List
  const filteredPlans = plans.filter((p) => {
    const q = planSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.tierLabel.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-[#003824] border border-[#4edea3]/40 text-[#4edea3] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 font-space text-xs animate-bounce">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── TOP HERO BANNER & CONTROL BAR ── */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#141519] border border-[#292a2e]/60 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 font-space text-xs text-[#ffdad2] font-bold uppercase tracking-wider">
            <span>Finance</span>
            <span className="text-[#958ea0]">//</span>
            <span>Retainers Vault</span>
          </div>
          <h2 className="font-space text-2xl text-[#e3e2e8] font-bold mt-1">
            Automated Client Retainer Subscriptions
          </h2>
          <p className="text-xs text-[#958ea0] font-sans mt-0.5 max-w-xl">
            Live recurring coaching agreements, automated Stripe debit cycles, and payment management. No manual invoicing needed.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Retainer Plan Packages Manager Button */}
          <button
            type="button"
            onClick={() => setShowPlansModal(true)}
            className="h-10 px-3.5 rounded-xl border border-[#ffb4a3]/40 bg-[#ffb4a3]/10 hover:bg-[#ffb4a3]/20 text-[#ffdad2] font-space font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            title="Manage Retainer Plan Names, Packages & Pricing"
          >
            <span className="material-symbols-outlined text-[16px] text-[#ffb4a3]">tune</span>
            <span>Retainer Plans</span>
            <span className="px-1.5 py-0.2 bg-[#ffb4a3]/20 text-[#ffb4a3] rounded-full text-[10px] font-bold font-mono">
              {plans.length}
            </span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="h-10 px-3.5 rounded-xl border border-[#292a2e] bg-[#0d0e12] hover:bg-[#1a1b20] text-[#cbc3d7] hover:text-[#e3e2e8] font-space font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download CSV report"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="h-10 px-4 rounded-xl bg-[#e85a2b] hover:bg-[#ff6b3d] text-white font-space font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-[0_0_18px_rgba(232,90,43,0.35)] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] font-bold">add_card</span>
            <span>+ New Retainer</span>
          </button>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* MRR */}
        <div className="p-4 rounded-xl bg-[#141519] border border-[#292a2e]/60 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-space uppercase text-[#958ea0] tracking-wider">Monthly Recurring (MRR)</span>
            <span className="material-symbols-outlined text-[16px] text-[#4edea3]">trending_up</span>
          </div>
          <div className="text-2xl font-space font-bold text-[#4edea3]">
            ${totalMRR.toLocaleString()}
          </div>
          <div className="text-[10px] text-[#958ea0] font-sans">
            Active auto-debit volume
          </div>
        </div>

        {/* Active Retainers */}
        <div className="p-4 rounded-xl bg-[#141519] border border-[#292a2e]/60 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-space uppercase text-[#958ea0] tracking-wider">Active Subscriptions</span>
            <span className="material-symbols-outlined text-[16px] text-[#e85a2b]">credit_card</span>
          </div>
          <div className="text-2xl font-space font-bold text-[#e3e2e8]">
            {activeRetainers.length} <span className="text-xs font-normal text-[#958ea0]">/ {retainers.length}</span>
          </div>
          <div className="text-[10px] text-[#4edea3] font-sans">
            {Math.round((activeRetainers.length / (retainers.length || 1)) * 100)}% retention cadence
          </div>
        </div>

        {/* Average Retainer Value */}
        <div className="p-4 rounded-xl bg-[#141519] border border-[#292a2e]/60 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-space uppercase text-[#958ea0] tracking-wider">Avg Retainer Value</span>
            <span className="material-symbols-outlined text-[16px] text-[#ffb4a3]">query_stats</span>
          </div>
          <div className="text-2xl font-space font-bold text-[#ffdad2]">
            ${avgRetainerValue.toLocaleString()}
          </div>
          <div className="text-[10px] text-[#958ea0] font-sans">
            Per active client / mo
          </div>
        </div>

        {/* Retainer Plans Defined */}
        <div 
          onClick={() => setShowPlansModal(true)}
          className="p-4 rounded-xl bg-[#141519] border border-[#292a2e]/60 space-y-1 hover:border-[#ffb4a3]/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-space uppercase text-[#958ea0] tracking-wider group-hover:text-[#ffdad2]">Active Plan Packages</span>
            <span className="material-symbols-outlined text-[16px] text-[#ffb4a3]">package_2</span>
          </div>
          <div className="text-2xl font-space font-bold text-[#e3e2e8] group-hover:text-[#ffb4a3]">
            {plans.length} <span className="text-xs font-normal text-[#958ea0]">tiers &amp; plans</span>
          </div>
          <div className="text-[10px] text-[#ffb4a3] font-sans flex items-center gap-1">
            <span>Manage names &amp; pricing</span>
            <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
          </div>
        </div>
      </div>

      {/* ── FILTER TABS & SEARCH CONTROLS ── */}
      <div className="bg-[#141519] border border-[#292a2e]/60 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', 'active', 'paused', 'overdue', 'cancelled'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-space font-semibold transition-all cursor-pointer capitalize ${
                statusFilter === s
                  ? 'bg-[#ffb4a3] text-[#3a0900] shadow-sm'
                  : 'bg-[#0d0e12] border border-[#292a2e] text-[#958ea0] hover:text-[#e3e2e8]'
              }`}
            >
              {s === 'all' ? 'All Retainers' : s}
            </button>
          ))}
        </div>

        {/* Search & Cycle Filter */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Cycle Dropdown */}
          <select
            value={cycleFilter}
            onChange={(e) => setCycleFilter(e.target.value as any)}
            className="bg-[#0d0e12] border border-[#292a2e] text-[#e3e2e8] text-xs font-space rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#ffb4a3] cursor-pointer"
          >
            <option value="all">All Billing Cycles</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="bi-weekly">Bi-Weekly</option>
            <option value="annual">Annual</option>
          </select>

          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-[16px] text-[#958ea0]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search client, plan, or card..."
              className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#e3e2e8] placeholder-[#958ea0] focus:outline-none focus:border-[#ffb4a3] font-sans"
            />
          </div>
        </div>
      </div>

      {/* ── RETAINERS TABLE ── */}
      <div className="rounded-2xl bg-[#141519] border border-[#292a2e]/60 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#1a1b20] border-b border-[#292a2e]/60 text-[#958ea0] font-space uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Client &amp; Tier</th>
                <th className="py-3 px-4">Retainer Plan</th>
                <th className="py-3 px-4">Fee / Cycle</th>
                <th className="py-3 px-4">Next Auto-Debit</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#292a2e]/50 text-[#cbc3d7]">
              {filteredRetainers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#958ea0]">
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <span className="material-symbols-outlined text-[28px] opacity-40">credit_card_off</span>
                      <p className="text-xs">No retainers found matching your filter criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRetainers.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#1a1b20]/50 transition-colors group"
                  >
                    {/* Client & Avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#292a2e] text-[#e3e2e8] flex items-center justify-center font-bold text-xs shrink-0 font-space group-hover:bg-[#e85a2b] group-hover:text-white transition-colors">
                          {item.clientAvatar}
                        </div>
                        <div>
                          <span className="font-space font-bold text-[#e3e2e8] block text-xs group-hover:text-white transition-colors">
                            {item.clientName}
                          </span>
                          <span className="text-[10px] text-[#958ea0] block">
                            {item.tierLabel}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Plan Name & Deliverables count */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-space font-semibold text-xs text-[#e3e2e8] group-hover:text-[#ffdad2] transition-colors">
                          {item.planName}
                        </span>
                        {plans.find((p) => p.name === item.planName) && (
                          <button
                            type="button"
                            onClick={() => {
                              const match = plans.find((p) => p.name === item.planName);
                              if (match) {
                                handleOpenEditPlan(match);
                                setShowPlansModal(true);
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-[#958ea0] hover:text-[#ffb4a3] transition-opacity cursor-pointer"
                            title="Edit / Rename this Plan Package globally"
                          >
                            <span className="material-symbols-outlined text-[13px]">tune</span>
                          </button>
                        )}
                      </div>
                      <div className="text-[10px] text-[#958ea0] font-sans flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[12px] text-[#4edea3]">check_circle</span>
                        <span>{item.deliverables?.length || 3} scope modules active</span>
                      </div>
                    </td>

                    {/* Amount & Cycle */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-sm text-[#4edea3]">
                        ${item.amount.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-[#958ea0] font-space capitalize">
                        {item.billingCycle}
                      </div>
                    </td>

                    {/* Next Billing Date */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs text-[#e3e2e8]">
                        {item.nextBillingDate}
                      </div>
                      {item.lastChargedDate && (
                        <div className="text-[10px] text-[#958ea0]">
                          Last: {item.lastChargedDate}
                        </div>
                      )}
                    </td>

                    {/* Card & Method */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-[#cbc3d7]">
                        <span className="material-symbols-outlined text-[15px] text-[#958ea0]">credit_card</span>
                        <span>{item.cardBrand} •••• {item.cardLast4}</span>
                      </div>
                      <div className="text-[10px] text-[#4a4855] font-mono">
                        {item.stripeSubscriptionId}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-space font-bold uppercase px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          item.status === 'active'
                            ? 'bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30'
                            : item.status === 'paused'
                            ? 'bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30'
                            : item.status === 'overdue'
                            ? 'bg-[#ff5449]/20 text-[#ff8a74] border border-[#ff5449]/40'
                            : 'bg-[#292a2e] text-[#958ea0] border border-[#343439]'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          item.status === 'active' ? 'bg-[#4edea3]' : item.status === 'paused' ? 'bg-[#f59e0b]' : 'bg-[#ff5449]'
                        }`} />
                        <span>{item.status}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Instant Charge Button */}
                        <button
                          type="button"
                          onClick={() => handleChargeNow(item)}
                          className="px-2.5 py-1 rounded-lg bg-[#003824] hover:bg-[#004d32] border border-[#4edea3]/30 text-[#4edea3] font-space text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Trigger instant auto-debit via Stripe"
                        >
                          <span className="material-symbols-outlined text-[13px]">bolt</span>
                          <span className="hidden sm:inline">Charge Now</span>
                        </button>

                        {/* Pause / Resume Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          className={`w-7 h-7 rounded-lg border text-xs flex items-center justify-center transition-colors cursor-pointer ${
                            item.status === 'active'
                              ? 'bg-[#0d0e12] border-[#292a2e] text-[#f59e0b] hover:bg-[#1a1b20]'
                              : 'bg-[#0d0e12] border-[#292a2e] text-[#4edea3] hover:bg-[#1a1b20]'
                          }`}
                          title={item.status === 'active' ? 'Pause retainer' : 'Resume retainer'}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {item.status === 'active' ? 'pause' : 'play_arrow'}
                          </span>
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="w-7 h-7 rounded-lg bg-[#0d0e12] border border-[#292a2e] text-[#958ea0] hover:text-[#ffb4a3] flex items-center justify-center transition-colors cursor-pointer"
                          title="Edit retainer fee & terms"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteRetainer(item.id, item.clientName)}
                          className="w-7 h-7 rounded-lg bg-[#0d0e12] border border-[#292a2e] text-[#958ea0] hover:text-[#ff5449] flex items-center justify-center transition-colors cursor-pointer"
                          title="Cancel and remove retainer"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ── MODAL: MANAGE RETAINER PLANS & PACKAGES (CRUD) ── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showPlansModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm font-sans">
          <div className="bg-[#141519] border border-[#292a2e] rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#292a2e] flex items-center justify-between bg-[#1a1b20]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#ffb4a3]/20 border border-[#ffb4a3]/40 flex items-center justify-center text-[#ffb4a3]">
                  <span className="material-symbols-outlined text-[20px]">tune</span>
                </div>
                <div>
                  <h3 className="font-space font-bold text-base text-[#e3e2e8]">
                    Retainer Plans &amp; Packages Manager
                  </h3>
                  <p className="text-xs text-[#958ea0]">
                    CRUD system for retainer package names, tiers, auto-fill pricing, and scope deliverables
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenCreatePlan}
                  className="px-3.5 py-1.5 rounded-xl bg-[#e85a2b] hover:bg-[#ff6b3d] text-white text-xs font-space font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>+ Add Plan Package</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPlansModal(false);
                    setEditingPlan(null);
                    setIsCreatingPlan(false);
                  }}
                  className="text-[#958ea0] hover:text-white p-1.5 rounded-lg hover:bg-[#25262c] transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            {/* Content Body: If editing or creating a plan, show form; otherwise show list */}
            {isCreatingPlan || editingPlan ? (
              <form onSubmit={handleSavePlan} className="p-6 space-y-4 overflow-y-auto text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#292a2e]">
                  <div>
                    <h4 className="font-space font-bold text-sm text-[#e3e2e8]">
                      {isCreatingPlan ? 'Create New Retainer Plan Package' : `Edit / Rename: ${editingPlan?.name}`}
                    </h4>
                    <p className="text-[11px] text-[#958ea0]">
                      Define the package name, default monthly price, tier alignment, and deliverables.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingPlan(false);
                      setEditingPlan(null);
                    }}
                    className="text-xs font-space text-[#958ea0] hover:text-[#e3e2e8] underline cursor-pointer"
                  >
                    ← Back to Plans List
                  </button>
                </div>

                {/* Plan Name & Tier */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#ffdad2] mb-1.5">
                      Retainer Plan Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={planFormName}
                      onChange={(e) => setPlanFormName(e.target.value)}
                      placeholder="e.g. Tier 1 Executive Metabolic Mastery"
                      className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-3.5 py-2 text-xs text-[#e3e2e8] focus:outline-none font-space font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                      Tier Label *
                    </label>
                    <input
                      type="text"
                      required
                      value={planFormTier}
                      onChange={(e) => setPlanFormTier(e.target.value)}
                      placeholder="e.g. Tier 1 Protocol, Hypertrophy Elite..."
                      className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-3.5 py-2 text-xs text-[#e3e2e8] focus:outline-none font-space"
                    />
                  </div>
                </div>

                {/* Fee, Cycle & Accent Color */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                      Default Fee ($ USD) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={planFormAmount}
                      onChange={(e) => setPlanFormAmount(Number(e.target.value))}
                      className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-3.5 py-2 text-xs text-[#4edea3] font-mono font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                      Billing Cycle
                    </label>
                    <select
                      value={planFormCycle}
                      onChange={(e) => setPlanFormCycle(e.target.value as RetainerBillingCycle)}
                      className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none font-space cursor-pointer capitalize"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="bi-weekly">Bi-Weekly</option>
                      <option value="annual">Annual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                      Badge Color
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      {['#ffb4a3', '#e85a2b', '#4edea3', '#60a5fa', '#ffd700', '#c084fc'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setPlanFormBadgeColor(c)}
                          className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                            planFormBadgeColor === c ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                    Plan Scope &amp; Target Demographic
                  </label>
                  <textarea
                    rows={2}
                    value={planFormDescription}
                    onChange={(e) => setPlanFormDescription(e.target.value)}
                    placeholder="Short narrative summary of what this retainer plan includes..."
                    className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-3.5 py-2 text-xs text-[#e3e2e8] focus:outline-none font-sans resize-none"
                  />
                </div>

                {/* Deliverables (one per line) */}
                <div>
                  <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                    Included Deliverables / Protocol Modules (one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={planFormDeliverables}
                    onChange={(e) => setPlanFormDeliverables(e.target.value)}
                    placeholder="Daily CGM glucose review&#10;Weekly 45-min video call&#10;Macro periodization adjustments"
                    className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-3.5 py-2 text-xs text-[#e3e2e8] focus:outline-none font-sans font-mono resize-none"
                  />
                </div>

                {/* Cascade Rename Option (When Editing) */}
                {editingPlan && (
                  <div className="p-3.5 rounded-xl bg-[#0d0e12] border border-[#292a2e] flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="cascadeRename"
                      checked={planCascadeRename}
                      onChange={(e) => setPlanCascadeRename(e.target.checked)}
                      className="mt-0.5 rounded border-[#292a2e] text-[#e85a2b] focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="cascadeRename" className="text-xs text-[#e3e2e8] cursor-pointer">
                      <span className="font-space font-bold text-[#ffdad2] block">
                        Cascade rename across active client retainers
                      </span>
                      <span className="text-[#958ea0] text-[11px]">
                        Automatically update all existing clients currently enrolled in &quot;{editingPlan.name}&quot; to the new plan name &amp; tier.
                      </span>
                    </label>
                  </div>
                )}

                {/* Form Buttons */}
                <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#292a2e]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingPlan(false);
                      setEditingPlan(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-[#292a2e] text-xs font-space font-semibold text-[#958ea0] hover:text-[#e3e2e8] hover:bg-[#1a1b20] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#e85a2b] hover:bg-[#ff6b3d] text-white text-xs font-space font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    <span>{isCreatingPlan ? 'Create Package' : 'Save & Rename'}</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Plans Grid / List View */
              <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
                {/* Search Bar & Counter */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[260px]">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-[16px] text-[#958ea0]">
                      search
                    </span>
                    <input
                      type="text"
                      value={planSearchQuery}
                      onChange={(e) => setPlanSearchQuery(e.target.value)}
                      placeholder="Filter plans by name, tier, or scope..."
                      className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-xl pl-9 pr-3 py-2 text-xs text-[#e3e2e8] placeholder-[#958ea0] focus:outline-none focus:border-[#ffb4a3] font-sans"
                    />
                  </div>
                  <div className="text-xs font-space text-[#958ea0]">
                    Showing <span className="text-[#e3e2e8] font-bold">{filteredPlans.length}</span> of {plans.length} Packages
                  </div>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredPlans.map((plan) => {
                    const activeSubscribers = retainers.filter((r) => r.planName === plan.name);
                    const subCount = activeSubscribers.length;

                    return (
                      <div
                        key={plan.id}
                        className="p-4 rounded-xl bg-[#0d0e12] border border-[#292a2e] hover:border-[#ffb4a3]/40 transition-all flex flex-col justify-between group shadow-sm"
                      >
                        <div>
                          {/* Top Tag Row */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-space font-bold tracking-wider uppercase"
                              style={{
                                backgroundColor: `${plan.badgeColor || '#ffb4a3'}22`,
                                color: plan.badgeColor || '#ffb4a3',
                                border: `1px solid ${plan.badgeColor || '#ffb4a3'}44`,
                              }}
                            >
                              {plan.tierLabel}
                            </span>

                            <div className="flex items-center gap-1 font-mono font-bold text-sm text-[#4edea3]">
                              ${plan.defaultAmount.toLocaleString()}
                              <span className="text-[10px] text-[#958ea0] font-space font-normal capitalize">
                                /{plan.billingCycle}
                              </span>
                            </div>
                          </div>

                          {/* Plan Name */}
                          <h4 className="font-space font-bold text-sm text-[#e3e2e8] group-hover:text-white transition-colors leading-snug">
                            {plan.name}
                          </h4>

                          {/* Description */}
                          {plan.description && (
                            <p className="text-[11px] text-[#958ea0] mt-1 line-clamp-2 leading-relaxed">
                              {plan.description}
                            </p>
                          )}

                          {/* Deliverables summary */}
                          {plan.deliverables && plan.deliverables.length > 0 && (
                            <div className="mt-2.5 space-y-1">
                              {plan.deliverables.slice(0, 2).map((deliv, idx) => (
                                <div key={idx} className="text-[10px] text-[#cbc3d7] flex items-center gap-1.5 truncate">
                                  <span className="material-symbols-outlined text-[12px] text-[#4edea3]">check</span>
                                  <span className="truncate">{deliv}</span>
                                </div>
                              ))}
                              {plan.deliverables.length > 2 && (
                                <span className="text-[10px] text-[#958ea0] pl-4 block">
                                  +{plan.deliverables.length - 2} more protocol items
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Bottom Footer: Subscribers count + Action buttons */}
                        <div className="mt-4 pt-3 border-t border-[#292a2e]/60 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-[11px] font-space">
                            <span className="material-symbols-outlined text-[14px] text-[#ffb4a3]">group</span>
                            <span className={subCount > 0 ? 'text-[#e3e2e8] font-bold' : 'text-[#958ea0]'}>
                              {subCount} {subCount === 1 ? 'client enrolled' : 'clients enrolled'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Edit / Rename Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditPlan(plan)}
                              className="px-2.5 py-1 rounded-lg bg-[#1a1b20] hover:bg-[#292a2e] text-[#e3e2e8] hover:text-[#ffb4a3] border border-[#292a2e] text-[11px] font-space font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Rename or edit this plan package"
                            >
                              <span className="material-symbols-outlined text-[13px]">edit</span>
                              <span>Rename / Edit</span>
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDeletePlan(plan.id, plan.name)}
                              className="w-7 h-7 rounded-lg bg-[#1a1b20] hover:bg-[#ff5449]/20 text-[#958ea0] hover:text-[#ff5449] border border-[#292a2e] text-xs flex items-center justify-center transition-colors cursor-pointer"
                              title="Delete this plan package"
                            >
                              <span className="material-symbols-outlined text-[14px]">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ── MODAL: CREATE NEW RETAINER ── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans">
          <div className="bg-[#141519] border border-[#292a2e] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[#292a2e] flex items-center justify-between bg-[#1a1b20]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#e85a2b]/20 border border-[#e85a2b]/40 flex items-center justify-center text-[#e85a2b]">
                  <span className="material-symbols-outlined text-[18px]">add_card</span>
                </div>
                <div>
                  <h3 className="font-space font-bold text-sm text-[#e3e2e8]">Create New Retainer</h3>
                  <p className="text-[11px] text-[#958ea0]">Establish recurring auto-debit subscription for client</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[#958ea0] hover:text-white p-1 rounded-lg hover:bg-[#25262c] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveNewRetainer} className="p-6 space-y-4 text-xs">
              {/* Select Existing Client */}
              <div>
                <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                  Assign To Client
                </label>
                <select
                  value={formClientId}
                  onChange={(e) => {
                    const selected = clients.find((c) => c.id === e.target.value);
                    if (selected) {
                      setFormClientId(selected.id);
                      setFormClientName(selected.name);
                      setFormClientEmail(selected.email || `${selected.name.toLowerCase().replace(' ', '.')}@example.com`);
                      setFormTierLabel(selected.tierLabel || 'Tier 1 Protocol');
                      setFormAmount(selected.monthlyFeeNum || 1800);
                      setFormCardLast4(selected.cardLast4 || '4242');
                    }
                  }}
                  className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none font-space cursor-pointer"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.tierLabel} • ${c.monthlyFeeNum}/mo)
                    </option>
                  ))}
                </select>
              </div>

              {/* Client Name & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    value={formClientName}
                    onChange={(e) => setFormClientName(e.target.value)}
                    required
                    className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-3.5 py-2 text-xs text-[#e3e2e8] focus:outline-none font-space"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                    Client Email
                  </label>
                  <input
                    type="email"
                    value={formClientEmail}
                    onChange={(e) => setFormClientEmail(e.target.value)}
                    className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-3.5 py-2 text-xs text-[#e3e2e8] focus:outline-none font-space"
                  />
                </div>
              </div>

              {/* Plan Package Selector & Creator */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-space font-bold uppercase tracking-wider text-[#ffdad2]">
                    Select Retainer Plan Package
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenCreatePlan();
                      setShowPlansModal(true);
                    }}
                    className="text-[10px] font-space font-semibold text-[#ffb4a3] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[12px]">add</span>
                    <span>+ New Plan Package</span>
                  </button>
                </div>
                <select
                  value={formSelectedPlanId}
                  onChange={(e) => handleSelectPlanTemplate(e.target.value)}
                  className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none font-space cursor-pointer"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.tierLabel} (${p.defaultAmount.toLocaleString()}/{p.billingCycle})
                    </option>
                  ))}
                  <option value="custom">-- Custom Bespoke Plan --</option>
                </select>
              </div>

              {/* Plan Name & Tier */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                    Plan / Agreement Title *
                  </label>
                  <input
                    type="text"
                    value={formPlanName}
                    onChange={(e) => setFormPlanName(e.target.value)}
                    required
                    className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-3.5 py-2 text-xs text-[#e3e2e8] focus:outline-none font-space"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                    Tier Label
                  </label>
                  <input
                    type="text"
                    value={formTierLabel}
                    onChange={(e) => setFormTierLabel(e.target.value)}
                    className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-3.5 py-2 text-xs text-[#e3e2e8] focus:outline-none font-space"
                  />
                </div>
              </div>

              {/* Fee, Cycle & Next Billing */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                    Monthly Fee ($) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formAmount}
                    onChange={(e) => setFormAmount(Number(e.target.value))}
                    required
                    className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-3.5 py-2 text-xs text-[#4edea3] font-mono font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                    Billing Cycle
                  </label>
                  <select
                    value={formCycle}
                    onChange={(e) => setFormCycle(e.target.value as RetainerBillingCycle)}
                    className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-2.5 py-2 text-xs text-[#e3e2e8] focus:outline-none font-space cursor-pointer capitalize"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="bi-weekly">Bi-Weekly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                    Next Auto-Debit
                  </label>
                  <input
                    type="text"
                    value={formNextBillingDate}
                    onChange={(e) => setFormNextBillingDate(e.target.value)}
                    className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-2.5 py-2 text-xs text-[#e3e2e8] focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Payment Card & Status */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                    Card Brand
                  </label>
                  <select
                    value={formCardBrand}
                    onChange={(e) => setFormCardBrand(e.target.value)}
                    className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-2.5 py-2 text-xs text-[#e3e2e8] focus:outline-none font-space cursor-pointer"
                  >
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="Amex">Amex</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                    Last 4 Digits
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={formCardLast4}
                    onChange={(e) => setFormCardLast4(e.target.value)}
                    className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-3 py-2 text-xs text-[#e3e2e8] font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as RetainerStatus)}
                    className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-2.5 py-2 text-xs text-[#e3e2e8] focus:outline-none font-space cursor-pointer capitalize"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                  Internal Notes
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Notes on agreement terms, pause rules, or perks..."
                  className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-3.5 py-2 text-xs text-[#e3e2e8] focus:outline-none font-sans resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#292a2e] text-xs font-space font-semibold text-[#958ea0] hover:text-[#e3e2e8] hover:bg-[#1a1b20] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#e85a2b] hover:bg-[#ff6b3d] text-white text-xs font-space font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Save Retainer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ── MODAL: EDIT RETAINER ── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {editingRetainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans">
          <div className="bg-[#141519] border border-[#292a2e] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[#292a2e] flex items-center justify-between bg-[#1a1b20]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#ffb4a3]/20 border border-[#ffb4a3]/40 flex items-center justify-center text-[#ffb4a3]">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </div>
                <div>
                  <h3 className="font-space font-bold text-sm text-[#e3e2e8]">
                    Manage Retainer: {editingRetainer.clientName}
                  </h3>
                  <p className="text-[11px] text-[#958ea0]">
                    Modify subscription pricing, auto-debit frequency, or payment terms
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRetainer(null)}
                className="text-[#958ea0] hover:text-white p-1 rounded-lg hover:bg-[#25262c] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEditedRetainer} className="p-6 space-y-4 text-xs">
              {/* Plan Package Selector & Creator */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-space font-bold uppercase tracking-wider text-[#ffdad2]">
                    Select Retainer Plan Package
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenCreatePlan();
                      setShowPlansModal(true);
                    }}
                    className="text-[10px] font-space font-semibold text-[#ffb4a3] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[12px]">add</span>
                    <span>+ New Plan Package</span>
                  </button>
                </div>
                <select
                  value={formSelectedPlanId}
                  onChange={(e) => handleSelectPlanTemplate(e.target.value)}
                  className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none font-space cursor-pointer"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.tierLabel} (${p.defaultAmount.toLocaleString()}/{p.billingCycle})
                    </option>
                  ))}
                  <option value="custom">-- Custom Bespoke Plan --</option>
                </select>
              </div>

              {/* Plan Name & Tier */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                    Plan Title *
                  </label>
                  <input
                    type="text"
                    value={formPlanName}
                    onChange={(e) => setFormPlanName(e.target.value)}
                    required
                    className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-3.5 py-2 text-xs text-[#e3e2e8] focus:outline-none font-space"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                    Tier Label
                  </label>
                  <input
                    type="text"
                    value={formTierLabel}
                    onChange={(e) => setFormTierLabel(e.target.value)}
                    className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-3.5 py-2 text-xs text-[#e3e2e8] focus:outline-none font-space"
                  />
                </div>
              </div>

              {/* Fee, Cycle & Next Billing */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                    Fee ($) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formAmount}
                    onChange={(e) => setFormAmount(Number(e.target.value))}
                    required
                    className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-3.5 py-2 text-xs text-[#4edea3] font-mono font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                    Cycle
                  </label>
                  <select
                    value={formCycle}
                    onChange={(e) => setFormCycle(e.target.value as RetainerBillingCycle)}
                    className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-2.5 py-2 text-xs text-[#e3e2e8] focus:outline-none font-space cursor-pointer capitalize"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="bi-weekly">Bi-Weekly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                    Next Auto-Debit
                  </label>
                  <input
                    type="text"
                    value={formNextBillingDate}
                    onChange={(e) => setFormNextBillingDate(e.target.value)}
                    className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-2.5 py-2 text-xs text-[#e3e2e8] focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Card & Status */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                    Card Brand
                  </label>
                  <select
                    value={formCardBrand}
                    onChange={(e) => setFormCardBrand(e.target.value)}
                    className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-2.5 py-2 text-xs text-[#e3e2e8] focus:outline-none font-space cursor-pointer"
                  >
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="Amex">Amex</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                    Card Last 4
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={formCardLast4}
                    onChange={(e) => setFormCardLast4(e.target.value)}
                    className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-3 py-2 text-xs text-[#e3e2e8] font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                    Subscription Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as RetainerStatus)}
                    className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-2.5 py-2 text-xs text-[#e3e2e8] focus:outline-none font-space cursor-pointer capitalize"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                  Internal Notes
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-3.5 py-2 text-xs text-[#e3e2e8] focus:outline-none font-sans resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRetainer(null)}
                  className="px-4 py-2 rounded-xl border border-[#292a2e] text-xs font-space font-semibold text-[#958ea0] hover:text-[#e3e2e8] hover:bg-[#1a1b20] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#e85a2b] hover:bg-[#ff6b3d] text-white text-xs font-space font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Update Retainer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
