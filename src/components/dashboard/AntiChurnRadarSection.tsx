import React, { useState } from 'react';
import type {
  ClientEntry,
  ChurnAlert,
  ChurnRiskLevel,
  ChurnInterventionStatus,
} from '../../types/dashboard';

interface AntiChurnRadarSectionProps {
  clients: ClientEntry[];
  alerts: ChurnAlert[];
  setAlerts: React.Dispatch<React.SetStateAction<ChurnAlert[]>>;
  onNavigateToPrescriptive?: (clientName: string) => void;
  onLaunchVideoCall?: (client: ClientEntry) => void;
}

const RISK_CONFIG: Record<ChurnRiskLevel, {
  label: string;
  border: string;
  bg: string;
  text: string;
  badge: string;
  badgeBg: string;
  dot: string;
}> = {
  critical: {
    label: 'Critical',
    border: 'border-[#ec6a06]/50',
    bg: 'bg-[#ec6a06]/10',
    text: 'text-[#ffb690]',
    badge: 'text-[#ffb690]',
    badgeBg: 'bg-[#ec6a06]/20',
    dot: 'bg-[#ec6a06]',
  },
  high: {
    label: 'High',
    border: 'border-[#ffb4a3]/40',
    bg: 'bg-[#ffb4a3]/5',
    text: 'text-[#ffdad2]',
    badge: 'text-[#ffdad2]',
    badgeBg: 'bg-[#ffb4a3]/20',
    dot: 'bg-[#ffb4a3]',
  },
  medium: {
    label: 'Medium',
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/5',
    text: 'text-amber-300',
    badge: 'text-amber-300',
    badgeBg: 'bg-amber-500/20',
    dot: 'bg-amber-400',
  },
  low: {
    label: 'Low',
    border: 'border-indigo-400/30',
    bg: 'bg-indigo-400/5',
    text: 'text-indigo-300',
    badge: 'text-indigo-300',
    badgeBg: 'bg-indigo-400/20',
    dot: 'bg-indigo-400',
  },
  resolved: {
    label: 'Resolved',
    border: 'border-[#4edea3]/30',
    bg: 'bg-[#4edea3]/5',
    text: 'text-[#4edea3]',
    badge: 'text-[#4edea3]',
    badgeBg: 'bg-[#4edea3]/20',
    dot: 'bg-[#4edea3]',
  },
};

const ANOMALY_ICONS: Record<string, string> = {
  ghost: 'person_off',
  plateau: 'trending_flat',
  compliance_drop: 'bar_chart',
  sentiment_drop: 'sentiment_dissatisfied',
  billing_risk: 'credit_card_off',
};

export default function AntiChurnRadarSection({
  clients,
  alerts,
  setAlerts,
  onNavigateToPrescriptive,
  onLaunchVideoCall,
}: AntiChurnRadarSectionProps) {
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingAlert, setEditingAlert] = useState<ChurnAlert | null>(null);
  const [addingAlert, setAddingAlert] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // New alert form state
  const [newAlert, setNewAlert] = useState<Partial<ChurnAlert>>({
    riskLevel: 'high',
    anomalyType: 'ghost',
    interventionStatus: 'pending',
    nudgesSent: 0,
    churnProbability: 50,
    complianceDrop: 60,
    hoursInactive: 24,
    daysInactive: 1,
    sentimentScore: 5,
    logStreakBroken: false,
    weightDelta: null,
    resolvedAt: null,
    resolvedNote: null,
  });

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // ── KPIs ──
  const criticalCount = alerts.filter(a => a.riskLevel === 'critical').length;
  const highCount = alerts.filter(a => a.riskLevel === 'high').length;
  const resolvedCount = alerts.filter(a => a.riskLevel === 'resolved').length;
  const pendingCount = alerts.filter(a => a.interventionStatus === 'pending').length;
  const avgChurnRisk = alerts.length > 0
    ? Math.round(alerts.filter(a => a.riskLevel !== 'resolved').reduce((acc, a) => acc + a.churnProbability, 0) /
        Math.max(1, alerts.filter(a => a.riskLevel !== 'resolved').length))
    : 0;
  const retainerAtRisk = alerts
    .filter(a => a.riskLevel !== 'resolved')
    .reduce((acc, a) => {
      const num = parseFloat(a.retainer.replace(/[^0-9.]/g, '')) || 0;
      return acc + num;
    }, 0);

  // ── Filtered list ──
  const filtered = alerts.filter(a => {
    const matchSearch =
      searchQuery === '' ||
      a.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.anomalyLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRisk = filterRisk === 'all' || a.riskLevel === filterRisk;
    const matchStatus = filterStatus === 'all' || a.interventionStatus === filterStatus;
    return matchSearch && matchRisk && matchStatus;
  });

  // ── Actions ──
  const handleNudge = (id: string) => {
    setAlerts(prev =>
      prev.map(a =>
        a.id === id
          ? { ...a, nudgesSent: a.nudgesSent + 1, interventionStatus: 'nudged' }
          : a
      )
    );
    showToast('Nudge recorded — intervention logged.');
  };

  const handleResolve = () => {
    if (!resolveId) return;
    setAlerts(prev =>
      prev.map(a =>
        a.id === resolveId
          ? {
              ...a,
              riskLevel: 'resolved',
              interventionStatus: 'resolved',
              resolvedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              resolvedNote: resolveNote.trim() || 'Marked resolved by coach.',
            }
          : a
      )
    );
    setResolveId(null);
    setResolveNote('');
    showToast('Alert marked as resolved.');
  };

  const handleDelete = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    setDeleteId(null);
    showToast('Alert removed from radar.');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlert) return;
    setAlerts(prev => prev.map(a => a.id === editingAlert.id ? editingAlert : a));
    setEditingAlert(null);
    showToast('Alert updated.');
  };

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === newAlert.clientId);
    if (!client) return;

    const alert: ChurnAlert = {
      id: 'ca_' + Date.now(),
      clientId: client.id,
      clientName: client.name,
      initials: client.initials,
      focus: client.focus,
      retainer: client.monthlyRetainer,
      riskLevel: (newAlert.riskLevel as ChurnRiskLevel) || 'medium',
      anomalyType: (newAlert.anomalyType as ChurnAlert['anomalyType']) || 'ghost',
      anomalyLabel: newAlert.anomalyLabel || 'Manual Flag',
      hoursInactive: newAlert.hoursInactive || 0,
      daysInactive: newAlert.daysInactive || 0,
      churnProbability: newAlert.churnProbability || 50,
      complianceDrop: newAlert.complianceDrop || 60,
      lastActive: newAlert.lastActive || 'Unknown',
      sentimentScore: newAlert.sentimentScore || 5,
      weightDelta: newAlert.weightDelta ?? null,
      logStreakBroken: newAlert.logStreakBroken || false,
      interventionStatus: 'pending',
      nudgesSent: 0,
      summary: newAlert.summary || '',
      suggestedIntervention: newAlert.suggestedIntervention || '',
      resolvedAt: null,
      resolvedNote: null,
    };

    setAlerts(prev => [alert, ...prev]);
    setAddingAlert(false);
    setNewAlert({
      riskLevel: 'high',
      anomalyType: 'ghost',
      interventionStatus: 'pending',
      nudgesSent: 0,
      churnProbability: 50,
      complianceDrop: 60,
      hoursInactive: 24,
      daysInactive: 1,
      sentimentScore: 5,
      logStreakBroken: false,
      weightDelta: null,
      resolvedAt: null,
      resolvedNote: null,
    });
    showToast(`Alert created for ${client.name}.`);
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="p-6 rounded-xl bg-[#1a1b20]/90 backdrop-blur-xl border border-[#ec6a06]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-space text-xs text-[#ffb690] font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-[#ec6a06] text-[18px]">crisis_alert</span>
            <span>Pillar 1 // Churn Telemetry Engine</span>
          </div>
          <h2 className="font-space text-2xl text-[#e3e2e8] font-bold mt-1">Anti-Churn Radar</h2>
          <p className="text-xs text-[#958ea0] font-sans mt-0.5 max-w-2xl">
            Clients ghost before they cancel. Cadence telemetry tracks log gaps, sleep drops, weight stalls, and sentiment
            to trigger proactive interventions before retention is lost.
          </p>
        </div>
        <button
          onClick={() => setAddingAlert(true)}
          className="px-4 py-2.5 rounded-lg bg-[#ec6a06] hover:bg-[#ffb690] text-[#4a1c00] text-xs font-space font-bold flex items-center gap-2 transition-all shadow-[0_0_14px_rgba(236,106,6,0.35)] cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Flag New Risk
        </button>
      </div>

      {/* ── KPI METRICS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#1a1b20] border border-[#ec6a06]/30">
          <div className="flex items-center justify-between text-xs text-[#958ea0] font-space uppercase">
            <span>Critical / High</span>
            <span className="material-symbols-outlined text-[18px] text-[#ec6a06]">warning</span>
          </div>
          <div className="text-2xl font-bold font-space text-[#ec6a06] mt-1">
            {criticalCount}<span className="text-[#ffb690]">+{highCount}</span>
          </div>
          <p className="text-[11px] text-[#958ea0] mt-1 font-space">Needs immediate action</p>
        </div>

        <div className="p-4 rounded-xl bg-[#1a1b20] border border-[#292a2e]/60">
          <div className="flex items-center justify-between text-xs text-[#958ea0] font-space uppercase">
            <span>Avg Churn Risk</span>
            <span className="material-symbols-outlined text-[18px] text-amber-400">radar</span>
          </div>
          <div className="text-2xl font-bold font-space text-[#e3e2e8] mt-1">{avgChurnRisk}<span className="text-sm font-normal text-[#958ea0]">%</span></div>
          <p className="text-[11px] text-[#958ea0] mt-1 font-space">Across active flags</p>
        </div>

        <div className="p-4 rounded-xl bg-[#1a1b20] border border-[#292a2e]/60">
          <div className="flex items-center justify-between text-xs text-[#958ea0] font-space uppercase">
            <span>Retainer at Risk</span>
            <span className="material-symbols-outlined text-[18px] text-[#ffdad2]">account_balance_wallet</span>
          </div>
          <div className="text-2xl font-bold font-space text-[#ffdad2] mt-1">
            ${retainerAtRisk.toLocaleString()}<span className="text-xs font-normal text-[#958ea0]">/mo</span>
          </div>
          <p className="text-[11px] text-[#958ea0] mt-1 font-space">{pendingCount} pending interventions</p>
        </div>

        <div className="p-4 rounded-xl bg-[#1a1b20] border border-[#4edea3]/20">
          <div className="flex items-center justify-between text-xs text-[#958ea0] font-space uppercase">
            <span>Resolved (Session)</span>
            <span className="material-symbols-outlined text-[18px] text-[#4edea3]">verified</span>
          </div>
          <div className="text-2xl font-bold font-space text-[#4edea3] mt-1">{resolvedCount}</div>
          <p className="text-[11px] text-[#4edea3] mt-1 font-space">Re-engaged athletes</p>
        </div>
      </div>

      {successToast && (
        <div className="p-3.5 rounded-lg bg-[#003824] text-[#4edea3] font-space text-xs font-semibold flex items-center gap-2 border border-[#4edea3]/30">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{successToast}</span>
        </div>
      )}

      {/* ── FILTERS & SEARCH ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-[16px] text-[#958ea0]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search athlete, anomaly, summary..."
            className="w-full bg-[#1a1b20] border border-[#292a2e] rounded-lg pl-8 pr-3 py-2 text-xs text-[#e3e2e8] placeholder-[#958ea0]/60 focus:outline-none focus:border-[#ec6a06]/60 font-space"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2 text-[#958ea0] hover:text-[#e3e2e8]">
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap text-[11px] font-space">
          {(['all', 'critical', 'high', 'medium', 'low', 'resolved'] as const).map(r => (
            <button
              key={r}
              onClick={() => setFilterRisk(r)}
              className={`px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer capitalize ${
                filterRisk === r
                  ? 'bg-[#ec6a06] border-[#ec6a06] text-[#4a1c00] font-bold'
                  : 'border-[#292a2e] text-[#958ea0] hover:border-[#ec6a06]/40 hover:text-[#e3e2e8]'
              }`}
            >
              {r === 'all' ? 'All Risks' : r}
            </button>
          ))}
        </div>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-[#1a1b20] border border-[#292a2e] rounded-lg px-3 py-2 text-xs text-[#cbc3d7] font-space focus:outline-none cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="nudged">Nudged</option>
          <option value="escalated">Escalated</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* ── ALERT CARDS ── */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-[#1a1b20] rounded-xl border border-[#292a2e]/60">
          <span className="material-symbols-outlined text-4xl text-[#4edea3] mb-2 block">radar</span>
          <p className="font-space text-sm text-[#e3e2e8] font-semibold">All clear — no alerts match filter.</p>
          <p className="text-xs text-[#958ea0] mt-1">The churn radar is clean for this view.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map(alert => {
            const cfg = RISK_CONFIG[alert.riskLevel];
            const isExpanded = expandedId === alert.id;

            return (
              <div
                key={alert.id}
                className={`rounded-xl bg-[#1a1b20] border ${cfg.border} shadow-lg flex flex-col transition-all`}
              >
                {/* Card Header */}
                <div className={`p-5 flex flex-col gap-3`}>
                  {/* Top Row: avatar + name + badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-full ${cfg.badgeBg} ${cfg.badge} flex items-center justify-center font-space text-sm font-bold shrink-0`}>
                        {alert.initials}
                      </div>
                      <div>
                        <div className="font-space font-bold text-sm text-[#e3e2e8]">{alert.clientName}</div>
                        <div className="text-[11px] text-[#958ea0]">{alert.focus} • {alert.retainer}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-space font-bold border ${cfg.badgeBg} ${cfg.badge} border-current`}>
                        {alert.anomalyLabel}
                      </span>
                      <span className={`text-[10px] font-space flex items-center gap-1 ${
                        alert.interventionStatus === 'resolved' ? 'text-[#4edea3]' :
                        alert.interventionStatus === 'nudged' ? 'text-indigo-300' :
                        'text-[#958ea0]'
                      }`}>
                        <span className="material-symbols-outlined text-[11px]">
                          {alert.interventionStatus === 'resolved' ? 'check_circle' :
                           alert.interventionStatus === 'nudged' ? 'send' :
                           alert.interventionStatus === 'escalated' ? 'escalator_warning' : 'schedule'}
                        </span>
                        {alert.interventionStatus.charAt(0).toUpperCase() + alert.interventionStatus.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Telemetry mini-stats */}
                  <div className="grid grid-cols-4 gap-2 p-2 bg-[#0d0e12] rounded-lg border border-[#292a2e]/60 text-center font-space">
                    <div>
                      <div className="text-[9px] text-[#958ea0] uppercase">Churn%</div>
                      <div className={`text-sm font-bold ${
                        alert.churnProbability >= 70 ? 'text-[#ec6a06]' :
                        alert.churnProbability >= 45 ? 'text-amber-300' : 'text-[#4edea3]'
                      }`}>{alert.churnProbability}%</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#958ea0] uppercase">Compliance</div>
                      <div className="text-sm font-bold text-[#e3e2e8]">{alert.complianceDrop}%</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#958ea0] uppercase">Sentiment</div>
                      <div className={`text-sm font-bold ${
                        alert.sentimentScore <= 3 ? 'text-[#ec6a06]' :
                        alert.sentimentScore <= 6 ? 'text-amber-300' : 'text-[#4edea3]'
                      }`}>{alert.sentimentScore}/10</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#958ea0] uppercase">Inactive</div>
                      <div className="text-sm font-bold text-[#e3e2e8]">{alert.lastActive}</div>
                    </div>
                  </div>

                  {/* Anomaly summary block */}
                  <div className="p-3.5 rounded-lg bg-[#0d0e12] border border-[#292a2e]/50 space-y-1.5">
                    <div className={`text-xs font-space font-bold flex items-center gap-1.5 ${cfg.text}`}>
                      <span className="material-symbols-outlined text-[15px]">
                        {ANOMALY_ICONS[alert.anomalyType] || 'warning'}
                      </span>
                      <span>Anomaly: {alert.anomalyLabel}</span>
                    </div>
                    <p className={`text-xs text-[#cbc3d7] leading-relaxed font-sans ${!isExpanded ? 'line-clamp-2' : ''}`}>
                      {alert.summary}
                    </p>
                    {alert.summary.length > 120 && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                        className="text-[11px] font-space text-[#ffb4a3] hover:text-[#ffdad2] cursor-pointer"
                      >
                        {isExpanded ? 'Show less ↑' : 'Read more ↓'}
                      </button>
                    )}
                  </div>

                  {/* Suggested Intervention */}
                  {isExpanded && (
                    <div className="p-3 rounded-lg bg-[#1a1b20] border border-indigo-400/20 space-y-1">
                      <div className="text-[10px] font-space text-indigo-300 uppercase font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">tips_and_updates</span>
                        AI Suggested Intervention
                      </div>
                      <p className="text-xs text-[#cbc3d7] italic leading-relaxed font-sans">
                        {alert.suggestedIntervention}
                      </p>
                    </div>
                  )}

                  {alert.resolvedAt && (
                    <div className="p-2.5 rounded-lg bg-[#003824] border border-[#4edea3]/30 text-[11px] font-space text-[#4edea3] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[13px]">verified</span>
                      <span>Resolved {alert.resolvedAt}</span>
                      {alert.resolvedNote && <span className="text-[#958ea0]"> — {alert.resolvedNote}</span>}
                    </div>
                  )}
                </div>

                {/* Action Toolbar */}
                <div className="px-4 pb-4 flex flex-wrap items-center gap-2 border-t border-[#292a2e]/40 pt-3">
                  {alert.riskLevel !== 'resolved' && (
                    <>
                      {/* Nudge / WhatsApp */}
                      <button
                        onClick={() => handleNudge(alert.id)}
                        className="flex-1 py-2 rounded-lg bg-[#ec6a06] hover:bg-[#ffb690] text-[#4a1c00] font-space font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_0_10px_rgba(236,106,6,0.3)]"
                        title="Log a nudge intervention"
                      >
                        <span className="material-symbols-outlined text-[15px]">chat</span>
                        <span>Send Nudge{alert.nudgesSent > 0 ? ` (${alert.nudgesSent})` : ''}</span>
                      </button>

                      {/* Video Call */}
                      {onLaunchVideoCall && (
                        <button
                          onClick={() => {
                            const client = clients.find(c => c.id === alert.clientId);
                            if (client) onLaunchVideoCall(client);
                          }}
                          className="py-2 px-3 rounded-lg bg-[#292a2e] hover:bg-[#343439] text-xs font-space font-semibold text-[#e3e2e8] flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Launch video call"
                        >
                          <span className="material-symbols-outlined text-[15px] text-[#ffdad2]">videocam</span>
                          <span>Video</span>
                        </button>
                      )}

                      {/* Navigate to Prescriptive Studio */}
                      {onNavigateToPrescriptive && (
                        <button
                          onClick={() => onNavigateToPrescriptive(alert.clientName)}
                          className="py-2 px-3 rounded-lg bg-[#292a2e] hover:bg-[#343439] text-xs font-space font-semibold text-[#e3e2e8] flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Open Prescriptive Studio for this client"
                        >
                          <span className="material-symbols-outlined text-[15px] text-[#ffb4a3]">tune</span>
                          <span>Protocol</span>
                        </button>
                      )}

                      {/* Mark Resolved */}
                      <button
                        onClick={() => { setResolveId(alert.id); setResolveNote(''); }}
                        className="py-2 px-3 rounded-lg bg-[#003824] hover:bg-[#004d2e] text-[#4edea3] text-xs font-space font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-[#4edea3]/20"
                        title="Mark alert as resolved"
                      >
                        <span className="material-symbols-outlined text-[15px]">check_circle</span>
                        <span>Resolve</span>
                      </button>
                    </>
                  )}

                  {/* Edit */}
                  <button
                    onClick={() => setEditingAlert({ ...alert })}
                    className="py-2 px-2.5 rounded-lg bg-[#292a2e] hover:bg-[#343439] text-[#958ea0] hover:text-[#e3e2e8] text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    title="Edit alert"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => setDeleteId(alert.id)}
                    className="py-2 px-2.5 rounded-lg bg-[#292a2e] hover:bg-red-500/20 text-[#958ea0] hover:text-red-400 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    title="Remove alert"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL: ADD NEW ALERT ── */}
      {addingAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#141519] border border-[#292a2e] rounded-xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[#292a2e] flex items-center justify-between">
              <div>
                <h3 className="font-space text-base font-bold text-[#e3e2e8]">Flag New Churn Risk</h3>
                <p className="text-xs text-[#958ea0] mt-0.5">Manually create a churn alert for a client.</p>
              </div>
              <button onClick={() => setAddingAlert(false)} className="text-[#958ea0] hover:text-[#e3e2e8]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAddAlert} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-xs font-space text-[#958ea0] uppercase">Client</label>
                <select
                  required
                  value={newAlert.clientId || ''}
                  onChange={e => setNewAlert(p => ({ ...p, clientId: e.target.value }))}
                  className="w-full mt-1 bg-[#0d0e12] border border-[#292a2e] rounded-lg p-2.5 text-xs text-[#e3e2e8] font-space"
                >
                  <option value="">Select client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} — {c.focus}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-space text-[#958ea0] uppercase">Risk Level</label>
                  <select
                    value={newAlert.riskLevel}
                    onChange={e => setNewAlert(p => ({ ...p, riskLevel: e.target.value as ChurnRiskLevel }))}
                    className="w-full mt-1 bg-[#0d0e12] border border-[#292a2e] rounded-lg p-2.5 text-xs text-[#e3e2e8] font-space"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-space text-[#958ea0] uppercase">Anomaly Type</label>
                  <select
                    value={newAlert.anomalyType}
                    onChange={e => setNewAlert(p => ({ ...p, anomalyType: e.target.value as ChurnAlert['anomalyType'] }))}
                    className="w-full mt-1 bg-[#0d0e12] border border-[#292a2e] rounded-lg p-2.5 text-xs text-[#e3e2e8] font-space"
                  >
                    <option value="ghost">Went Dark / Ghost</option>
                    <option value="plateau">Metabolic Plateau</option>
                    <option value="compliance_drop">Compliance Drop</option>
                    <option value="sentiment_drop">Sentiment Drop</option>
                    <option value="billing_risk">Billing Risk</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-space text-[#958ea0] uppercase">Anomaly Label (shown as badge)</label>
                <input
                  required
                  type="text"
                  value={newAlert.anomalyLabel || ''}
                  onChange={e => setNewAlert(p => ({ ...p, anomalyLabel: e.target.value }))}
                  placeholder="e.g. Went Dark >48h"
                  className="w-full mt-1 bg-[#0d0e12] border border-[#292a2e] rounded-lg p-2.5 text-xs text-[#e3e2e8] font-space"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-space text-[#958ea0] uppercase">Churn %</label>
                  <input type="number" min={0} max={100}
                    value={newAlert.churnProbability}
                    onChange={e => setNewAlert(p => ({ ...p, churnProbability: parseInt(e.target.value) || 0 }))}
                    className="w-full mt-1 bg-[#0d0e12] border border-[#292a2e] rounded-lg p-2.5 text-xs text-[#e3e2e8] font-space"
                  />
                </div>
                <div>
                  <label className="text-xs font-space text-[#958ea0] uppercase">Compliance%</label>
                  <input type="number" min={0} max={100}
                    value={newAlert.complianceDrop}
                    onChange={e => setNewAlert(p => ({ ...p, complianceDrop: parseInt(e.target.value) || 0 }))}
                    className="w-full mt-1 bg-[#0d0e12] border border-[#292a2e] rounded-lg p-2.5 text-xs text-[#e3e2e8] font-space"
                  />
                </div>
                <div>
                  <label className="text-xs font-space text-[#958ea0] uppercase">Sentiment/10</label>
                  <input type="number" min={1} max={10}
                    value={newAlert.sentimentScore}
                    onChange={e => setNewAlert(p => ({ ...p, sentimentScore: parseInt(e.target.value) || 5 }))}
                    className="w-full mt-1 bg-[#0d0e12] border border-[#292a2e] rounded-lg p-2.5 text-xs text-[#e3e2e8] font-space"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-space text-[#958ea0] uppercase">Summary / Anomaly Details</label>
                <textarea required rows={3}
                  value={newAlert.summary || ''}
                  onChange={e => setNewAlert(p => ({ ...p, summary: e.target.value }))}
                  placeholder="Describe the churn signal observed..."
                  className="w-full mt-1 bg-[#0d0e12] border border-[#292a2e] rounded-lg p-2.5 text-xs text-[#e3e2e8] font-sans resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-space text-[#958ea0] uppercase">Suggested Intervention</label>
                <textarea rows={2}
                  value={newAlert.suggestedIntervention || ''}
                  onChange={e => setNewAlert(p => ({ ...p, suggestedIntervention: e.target.value }))}
                  placeholder="What should the coach do next?"
                  className="w-full mt-1 bg-[#0d0e12] border border-[#292a2e] rounded-lg p-2.5 text-xs text-[#e3e2e8] font-sans resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#292a2e]">
                <button type="button" onClick={() => setAddingAlert(false)}
                  className="px-4 py-2 rounded-lg bg-[#292a2e] text-xs font-space text-[#e3e2e8] hover:bg-[#343439] cursor-pointer">
                  Cancel
                </button>
                <button type="submit"
                  className="px-4 py-2 rounded-lg bg-[#ec6a06] hover:bg-[#ffb690] text-[#4a1c00] text-xs font-space font-bold cursor-pointer">
                  Create Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT ALERT ── */}
      {editingAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#141519] border border-[#292a2e] rounded-xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[#292a2e] flex items-center justify-between">
              <div>
                <h3 className="font-space text-base font-bold text-[#e3e2e8]">Edit Alert — {editingAlert.clientName}</h3>
                <p className="text-xs text-[#958ea0] mt-0.5">Update churn signal details.</p>
              </div>
              <button onClick={() => setEditingAlert(null)} className="text-[#958ea0] hover:text-[#e3e2e8]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-space text-[#958ea0] uppercase">Risk Level</label>
                  <select
                    value={editingAlert.riskLevel}
                    onChange={e => setEditingAlert(p => p ? { ...p, riskLevel: e.target.value as ChurnRiskLevel } : p)}
                    className="w-full mt-1 bg-[#0d0e12] border border-[#292a2e] rounded-lg p-2.5 text-xs text-[#e3e2e8] font-space"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-space text-[#958ea0] uppercase">Intervention Status</label>
                  <select
                    value={editingAlert.interventionStatus}
                    onChange={e => setEditingAlert(p => p ? { ...p, interventionStatus: e.target.value as ChurnInterventionStatus } : p)}
                    className="w-full mt-1 bg-[#0d0e12] border border-[#292a2e] rounded-lg p-2.5 text-xs text-[#e3e2e8] font-space"
                  >
                    <option value="pending">Pending</option>
                    <option value="nudged">Nudged</option>
                    <option value="escalated">Escalated</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-space text-[#958ea0] uppercase">Anomaly Label</label>
                <input type="text" required
                  value={editingAlert.anomalyLabel}
                  onChange={e => setEditingAlert(p => p ? { ...p, anomalyLabel: e.target.value } : p)}
                  className="w-full mt-1 bg-[#0d0e12] border border-[#292a2e] rounded-lg p-2.5 text-xs text-[#e3e2e8] font-space"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-space text-[#958ea0] uppercase">Churn %</label>
                  <input type="number" min={0} max={100}
                    value={editingAlert.churnProbability}
                    onChange={e => setEditingAlert(p => p ? { ...p, churnProbability: parseInt(e.target.value) || 0 } : p)}
                    className="w-full mt-1 bg-[#0d0e12] border border-[#292a2e] rounded-lg p-2.5 text-xs text-[#e3e2e8] font-space"
                  />
                </div>
                <div>
                  <label className="text-xs font-space text-[#958ea0] uppercase">Compliance%</label>
                  <input type="number" min={0} max={100}
                    value={editingAlert.complianceDrop}
                    onChange={e => setEditingAlert(p => p ? { ...p, complianceDrop: parseInt(e.target.value) || 0 } : p)}
                    className="w-full mt-1 bg-[#0d0e12] border border-[#292a2e] rounded-lg p-2.5 text-xs text-[#e3e2e8] font-space"
                  />
                </div>
                <div>
                  <label className="text-xs font-space text-[#958ea0] uppercase">Nudges Sent</label>
                  <input type="number" min={0}
                    value={editingAlert.nudgesSent}
                    onChange={e => setEditingAlert(p => p ? { ...p, nudgesSent: parseInt(e.target.value) || 0 } : p)}
                    className="w-full mt-1 bg-[#0d0e12] border border-[#292a2e] rounded-lg p-2.5 text-xs text-[#e3e2e8] font-space"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-space text-[#958ea0] uppercase">Summary</label>
                <textarea required rows={3}
                  value={editingAlert.summary}
                  onChange={e => setEditingAlert(p => p ? { ...p, summary: e.target.value } : p)}
                  className="w-full mt-1 bg-[#0d0e12] border border-[#292a2e] rounded-lg p-2.5 text-xs text-[#e3e2e8] font-sans resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-space text-[#958ea0] uppercase">Suggested Intervention</label>
                <textarea rows={2}
                  value={editingAlert.suggestedIntervention}
                  onChange={e => setEditingAlert(p => p ? { ...p, suggestedIntervention: e.target.value } : p)}
                  className="w-full mt-1 bg-[#0d0e12] border border-[#292a2e] rounded-lg p-2.5 text-xs text-[#e3e2e8] font-sans resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#292a2e]">
                <button type="button" onClick={() => setEditingAlert(null)}
                  className="px-4 py-2 rounded-lg bg-[#292a2e] text-xs font-space text-[#e3e2e8] hover:bg-[#343439] cursor-pointer">
                  Cancel
                </button>
                <button type="submit"
                  className="px-4 py-2 rounded-lg bg-[#ffb4a3] text-[#3a0900] text-xs font-space font-bold hover:bg-[#ffdad2] cursor-pointer">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: RESOLVE ALERT ── */}
      {resolveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#141519] border border-[#4edea3]/30 rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-[#4edea3]">
              <span className="material-symbols-outlined text-2xl">verified</span>
              <h3 className="font-space text-base font-bold text-[#e3e2e8]">Mark as Resolved</h3>
            </div>
            <p className="text-xs text-[#958ea0]">
              Briefly note how this alert was resolved. This will be logged in the audit trail.
            </p>
            <textarea
              rows={3}
              value={resolveNote}
              onChange={e => setResolveNote(e.target.value)}
              placeholder="e.g. Re-engaged after 1 WhatsApp nudge. Back to full protocol."
              className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-lg p-2.5 text-xs text-[#e3e2e8] font-sans resize-none focus:outline-none focus:border-[#4edea3]/40"
            />
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setResolveId(null)}
                className="px-3.5 py-1.5 rounded-lg bg-[#292a2e] text-xs font-space text-[#e3e2e8] hover:bg-[#343439] cursor-pointer">
                Cancel
              </button>
              <button onClick={handleResolve}
                className="px-3.5 py-1.5 rounded-lg bg-[#4edea3] text-[#002614] text-xs font-space font-bold hover:bg-[#79edbc] cursor-pointer">
                Confirm Resolved
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: DELETE CONFIRMATION ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#141519] border border-[#292a2e] rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <span className="material-symbols-outlined text-2xl">delete_forever</span>
              <h3 className="font-space text-base font-bold text-[#e3e2e8]">Remove Alert?</h3>
            </div>
            <p className="text-xs text-[#958ea0] leading-relaxed">
              This will permanently remove this churn alert from the radar. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleteId(null)}
                className="px-3.5 py-1.5 rounded-lg bg-[#292a2e] text-xs font-space text-[#e3e2e8] hover:bg-[#343439] cursor-pointer">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)}
                className="px-3.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-space font-bold cursor-pointer">
                Delete Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
