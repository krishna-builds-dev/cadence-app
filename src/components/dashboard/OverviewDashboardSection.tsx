import { useState, useEffect, useId, useMemo } from 'react';
import type {
  ClientEntry,
  RetainerItem,
  NavSection,
  DashboardTimeRange,
  ClientFilterState,
  DashboardOverviewConfig,
} from '../../types/dashboard';
import defaultOverviewData from '../../data/dashboardOverview.json';

interface OverviewDashboardSectionProps {
  clients: ClientEntry[];
  retainers: RetainerItem[];
  setActiveSection: (section: NavSection) => void;
  onLaunchVideoCall?: (client: ClientEntry) => void;
  setSelectedRecipient?: (name: string) => void;
  setCalInput?: (cal: string) => void;
  setCarbsInput?: (carbs: string) => void;
  setReasonInput?: (reason: string) => void;
  setBillingModalClient?: (client: ClientEntry | null) => void;
  setNewFeeValue?: (fee: number) => void;
  onExportCSV?: () => void;
}

const SESSION_OVERVIEW_KEY = 'cadence_session_dashboard_overview';

export default function OverviewDashboardSection({
  clients = [],
  retainers = [],
  setActiveSection,
  onLaunchVideoCall = () => {},
  setSelectedRecipient = () => {},
  setCalInput = () => {},
  setCarbsInput = () => {},
  setReasonInput = () => {},
  setBillingModalClient = () => {},
  setNewFeeValue = () => {},
  onExportCSV,
}: OverviewDashboardSectionProps) {
  const copilotInputId = useId();
  const searchInputId = useId();
  const handleLaunchVideoCall = onLaunchVideoCall;

  // ── Toast Notification State ──
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ── Session Storage Sync for Dashboard Overview State ──
  const [overviewData] = useState<DashboardOverviewConfig>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_OVERVIEW_KEY);
      if (stored) return JSON.parse(stored) as DashboardOverviewConfig;
    } catch {}
    return defaultOverviewData as DashboardOverviewConfig;
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_OVERVIEW_KEY, JSON.stringify(overviewData));
    } catch {}
  }, [overviewData]);

  // ── Time Range & Metric Mode States ──
  const [timeRange, setTimeRange] = useState<DashboardTimeRange>('30D');
  const [metricMode, setMetricMode] = useState<'revenue' | 'clients' | 'compliance'>('revenue');
  const [hoveredChartPoint, setHoveredChartPoint] = useState<{
    label: string;
    value: number;
    rawVal: number;
    active: number;
    x: number;
    y: number;
  } | null>(null);

  // ── Client Roster Filtering & Sorting States ──
  const [filterState, setFilterState] = useState<ClientFilterState>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'compliance' | 'retainer'>('compliance');

  // ── Modals State ──
  const [selectedTelemetryClient, setSelectedTelemetryClient] = useState<ClientEntry | null>(null);
  const [showNewRetainerModal, setShowNewRetainerModal] = useState(false);
  const [newRetainerClientName, setNewRetainerClientName] = useState(clients[0]?.name || '');
  const [newRetainerTier, setNewRetainerTier] = useState('Tier 1 Protocol');
  const [newRetainerFee, setNewRetainerFee] = useState(1800);

  // ── Anti-Churn Pod Snooze State ──
  const [snoozedAlerts, setSnoozedAlerts] = useState<Record<string, boolean>>({});
  const toggleSnoozeAlert = (alertId: string, clientName: string) => {
    setSnoozedAlerts((prev) => {
      const isNowSnoozed = !prev[alertId];
      showToast(isNowSnoozed ? `Snoozed alert for ${clientName} for 24h` : `Alert un-snoozed for ${clientName}`);
      return { ...prev, [alertId]: isNowSnoozed };
    });
  };

  // ── Heatmap Interactive Hover State ──
  const [hoveredHeatmapSlot, setHoveredHeatmapSlot] = useState<{
    day: string;
    slotIndex: number;
    timeLabel: string;
    checkins: number;
  } | null>(null);

  // ── Copilot Intelligence State ──
  const [copilotInput, setCopilotInput] = useState('');
  const [copilotHistory, setCopilotHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string; time: string }>>([
    {
      role: 'assistant',
      text: 'CoachOS Intelligence active. Ready to evaluate client telemetry, prescribe protocol shifts, or analyze compliance trends.',
      time: 'Real-time',
    },
  ]);
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);
  const [copiedCopilotIndex, setCopiedCopilotIndex] = useState<number | null>(null);

  const handleAskCopilot = (promptText?: string) => {
    const query = promptText || copilotInput;
    if (!query.trim() || isCopilotThinking) return;

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setCopilotHistory((prev) => [...prev, { role: 'user', text: query, time: userTime }]);
    setCopilotInput('');
    setIsCopilotThinking(true);

    setTimeout(() => {
      const qLower = query.toLowerCase();
      let response = '';

      const matchedQA = overviewData.copilotQAs.find((qa) => qLower.includes(qa.trigger));
      if (matchedQA) {
        response = matchedQA.response;
      } else if (qLower.includes('compliance') || qLower.includes('dip')) {
        response =
          'Compliance dip was isolated to Alexander Wright (-58% due to cross-continental travel) and Devon Lane (missed weekend log). Remaining 26 retainers maintain 94.8% adherence.';
      } else if (qLower.includes('alexander')) {
        response =
          'Alexander Wright logged 84h ago in London. Habit score plunged from 88% to 42%. Auto-escalation window has 14h remaining before scheduled client check-in nudge.';
      } else if (qLower.includes('plateau') || qLower.includes('elena') || qLower.includes('refeed')) {
        response =
          'Elena Rostova’s metabolic plateau across 12 days indicates leptin suppression and glycogen depletion. Recommend a 48h carbohydrate re-feed protocol (+25g daily carbs, maintenance calories) to restore thyroid T3 output.';
      } else if (qLower.includes('upsell') || qLower.includes('candidates')) {
        response =
          'Sarah Jenkins (Tier 3, 98% compliance across 60 days) and Meera Kulkarni are prime candidates to transition into Tier 1 Performance Retainers (+ $1,150/mo MRR delta).';
      } else {
        response = `Telemetry scan for "${query}": All 28 active retainers currently within normal variance (+/- 3.8%). 2 clients flagged in Anti-Churn Radar. Would you like to review their dossier?`;
      }

      setCopilotHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: response,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsCopilotThinking(false);
    }, 700);
  };

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedCopilotIndex(index);
    showToast('Copied to clipboard!');
    setTimeout(() => setCopiedCopilotIndex(null), 2000);
  };

  // ── Active Retainers Metrics ──
  const totalRetainerRevenue = useMemo(() => {
    if (retainers.length > 0) {
      return retainers.reduce((acc, r) => acc + (r.amount || 0), 0);
    }
    return 18450;
  }, [retainers]);

  const activeRetainersCount = useMemo(() => {
    if (retainers.length > 0) {
      return retainers.filter((r) => r.status === 'active').length;
    }
    return clients.length;
  }, [retainers, clients]);

  // ── Time-Range-Driven Data & Trajectory ──
  const currentTimeData = overviewData.timeRangeData[timeRange] || overviewData.timeRangeData['30D'];

  // SVG Chart points calculation based on metricMode
  const chartCoordinates = useMemo(() => {
    const points = currentTimeData.chartPoints;
    const width = 660;
    const height = 180;
    const paddingX = 30;
    const paddingY = 20;

    let minVal = Infinity;
    let maxVal = -Infinity;

    points.forEach((p) => {
      let v = p.value;
      if (metricMode === 'clients') v = p.active;
      if (metricMode === 'compliance') v = 94.8 + (p.value % 5) - 2;
      if (v < minVal) minVal = v;
      if (v > maxVal) maxVal = v;
    });

    if (minVal === maxVal) {
      minVal -= 1;
      maxVal += 1;
    }

    return points.map((p, i) => {
      const x = paddingX + (i / Math.max(1, points.length - 1)) * (width - 2 * paddingX);
      let v = p.value;
      if (metricMode === 'clients') v = p.active;
      if (metricMode === 'compliance') v = 94.8 + (p.value % 5) - 2;
      const normalizedY = (v - minVal) / (maxVal - minVal);
      const y = height - paddingY - normalizedY * (height - 2 * paddingY);
      return { label: p.label, value: v, rawVal: p.value, active: p.active, x, y };
    });
  }, [currentTimeData, metricMode]);

  // SVG Bezier path string
  const svgPathD = useMemo(() => {
    if (chartCoordinates.length === 0) return '';
    let d = `M ${chartCoordinates[0].x} ${chartCoordinates[0].y}`;
    for (let i = 0; i < chartCoordinates.length - 1; i++) {
      const curr = chartCoordinates[i];
      const next = chartCoordinates[i + 1];
      const midX = (curr.x + next.x) / 2;
      d += ` C ${midX} ${curr.y}, ${midX} ${next.y}, ${next.x} ${next.y}`;
    }
    return d;
  }, [chartCoordinates]);

  const svgAreaPathD = useMemo(() => {
    if (chartCoordinates.length === 0) return '';
    const last = chartCoordinates[chartCoordinates.length - 1];
    const first = chartCoordinates[0];
    return `${svgPathD} L ${last.x} 200 L ${first.x} 200 Z`;
  }, [svgPathD, chartCoordinates]);

  // ── Filtered & Sorted Clients ──
  const filteredClients = useMemo(() => {
    return clients
      .filter((c) => {
        // Status filter
        if (filterState === 'healthy' && c.riskStatus !== 'healthy') return false;
        if (filterState === 'warning' && c.riskStatus !== 'plateau') return false;
        if (filterState === 'risk' && c.riskStatus !== 'dark') return false;

        // Tier filter from Donut ring
        if (tierFilter && !c.tierLabel.toLowerCase().includes(tierFilter.toLowerCase())) return false;

        // Text search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = c.name.toLowerCase().includes(q);
          const matchesFocus = c.focus.toLowerCase().includes(q);
          const matchesTier = c.tierLabel.toLowerCase().includes(q);
          if (!matchesName && !matchesFocus && !matchesTier) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'compliance') return b.compliance - a.compliance;
        if (sortBy === 'retainer') return b.monthlyFeeNum - a.monthlyFeeNum;
        return a.name.localeCompare(b.name);
      });
  }, [clients, filterState, tierFilter, searchQuery, sortBy]);

  // ── Real CSV Export Handler ──
  const handleRealExportCSV = () => {
    if (onExportCSV) {
      onExportCSV();
      return;
    }
    try {
      const headers = ['Client Name', 'Focus Goal', 'Tier', 'Monthly Retainer', 'Compliance %', 'Risk Status', 'Last Checkin'];
      const rows = clients.map((c) => [
        `"${c.name}"`,
        `"${c.focus}"`,
        `"${c.tierLabel}"`,
        `"${c.monthlyRetainer}"`,
        c.compliance,
        `"${c.riskStatus}"`,
        `"${c.lastActive || 'Today'}"`,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `cadence_client_telemetry_${timeRange.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('✓ Client telemetry CSV exported successfully');
    } catch {
      showToast('Exported CSV file');
    }
  };

  // ── Handle New Retainer Submit ──
  const handleCreateNewRetainer = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedRecipient(newRetainerClientName);
    setCalInput('2,250');
    setCarbsInput('240');
    setReasonInput(`New ${newRetainerTier} agreement drafted at $${newRetainerFee.toLocaleString()}/mo.`);
    setShowNewRetainerModal(false);
    showToast(`✓ Created ${newRetainerTier} for ${newRetainerClientName}!`);
    setActiveSection('prescriptive-studio');
  };

  return (
    <div className="space-y-6">
      {/* ── TOAST ALERT ── */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-[#141519] border border-[#ffb4a3]/60 text-[#ffdad2] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 font-space text-xs animate-bounce">
          <span className="material-symbols-outlined text-[#ffb4a3] text-[18px]">verified</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── TOP BANNER & QUICK COMMAND BAR ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <h1 className="font-space text-2xl sm:text-3xl text-[#e3e2e8] font-bold tracking-tight">
              Coach Dashboard
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#4edea3]/10 text-[#4edea3] text-[11px] font-space font-bold border border-[#4edea3]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
              REAL-TIME TELEMETRY
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#cbc3d7] mt-1 font-sans">
            Here&apos;s your live coaching telemetry, retention radar, and client activity across {activeRetainersCount} active retainers.
          </p>
        </div>

        {/* Quick Actions Group */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Time Range Pill */}
          <div className="flex items-center bg-[#1a1b20] rounded-lg p-1 text-[#cbc3d7] border border-[#292a2e]/50 font-space text-xs">
            {(['7D', '30D', '90D', 'YTD'] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTimeRange(t);
                  showToast(`Switched time range to ${t}`);
                }}
                className={`px-3 py-1 rounded transition-colors font-semibold cursor-pointer ${
                  timeRange === t ? 'bg-[#343439] text-[#e3e2e8] shadow-sm' : 'text-[#958ea0] hover:text-[#e3e2e8]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Action Button Ghost: Export CSV */}
          <button
            onClick={handleRealExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1a1b20] text-[#cbc3d7] hover:text-[#e3e2e8] hover:bg-[#292a2e] transition-colors text-xs font-space font-semibold border border-[#292a2e]/50 cursor-pointer"
            title="Download full client telemetry dataset"
          >
            <span className="material-symbols-outlined text-[16px]">ios_share</span>
            <span>Export CSV</span>
          </button>

          {/* Primary Gradient CTA: New Retainer */}
          
        </div>
      </div>

      {/* ── KPI METRIC ROW (4-UP GLASS TILES) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* CARD 1: Monthly Retainer Revenue */}
        <div
          onClick={() => setActiveSection('stripe-billing')}
          className="relative overflow-hidden rounded-xl bg-[#1a1b20]/90 backdrop-blur-md p-5 flex flex-col justify-between shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] border border-[#292a2e]/60 group hover:border-[#ffb4a3]/40 transition-all cursor-pointer"
          title="Click to view Stripe billing & subscriptions"
        >
          <div className="absolute -right-10 -top-10 w-28 h-28 bg-[#ffb4a3]/15 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="font-space text-[11px] text-[#cbc3d7] uppercase tracking-wider font-semibold">
              Monthly Retainer Revenue ({timeRange})
            </span>
            <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#4edea3]/15 text-[#4edea3] font-space text-[11px] font-semibold">
              <span className="material-symbols-outlined text-[13px]">arrow_upward</span>
              {currentTimeData.growth}
            </span>
          </div>

          <div className="mt-3 mb-1">
            <div className="font-space text-3xl font-bold text-[#e3e2e8] tracking-tight leading-none">
              ${totalRetainerRevenue.toLocaleString()}
              <span className="text-[#958ea0] text-xl font-normal">.00</span>
            </div>
            <div className="text-xs text-[#958ea0] mt-1 font-sans">
              Stripe auto-debit: 100% healthy (${(totalRetainerRevenue / Math.max(1, activeRetainersCount)).toFixed(2)} avg)
            </div>
          </div>

          {/* Sparkline glowing SVG */}
          <div className="w-full h-11 mt-2">
            <svg className="w-full h-full overflow-visible" fill="none" viewBox="0 0 240 44">
              <defs>
                <linearGradient id="grad-spark-coral" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ffb4a3" stopOpacity="0.38" />
                  <stop offset="100%" stopColor="#ffb4a3" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M0,36 C30,34 50,22 80,26 C110,30 130,12 160,16 C190,20 210,6 240,4 L240,44 L0,44 Z"
                fill="url(#grad-spark-coral)"
              />
              <path
                className="drop-shadow-[0_0_8px_rgba(255,218,210,0.7)]"
                d="M0,36 C30,34 50,22 80,26 C110,30 130,12 160,16 C190,20 210,6 240,4"
                stroke="#ffdad2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.2"
              />
              <circle className="drop-shadow-[0_0_6px_#ffb4a3]" cx="240" cy="4" fill="#ffffff" r="3.5" />
            </svg>
          </div>
        </div>

        {/* CARD 2: Active Client Retainers */}
        <div
          onClick={() => setActiveSection('client-roster')}
          className="relative overflow-hidden rounded-xl bg-[#1a1b20]/90 backdrop-blur-md p-5 flex flex-col justify-between shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] border border-[#292a2e]/60 group hover:border-[#ffb4a3]/40 transition-all cursor-pointer"
          title="Click to view full client roster"
        >
          <div className="absolute -right-10 -top-10 w-28 h-28 bg-[#4edea3]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="font-space text-[11px] text-[#cbc3d7] uppercase tracking-wider font-semibold">
              Active Client Retainers
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#292a2e] text-[#ffdad2] font-space text-[11px] font-semibold">
              Capacity {Math.round((activeRetainersCount / 30) * 100)}%
            </span>
          </div>

          <div className="mt-3 mb-1">
            <div className="font-space text-3xl font-bold text-[#e3e2e8] tracking-tight leading-none">
              {activeRetainersCount} <span className="text-[#958ea0] text-xl font-normal">/ 30 Max</span>
            </div>
            <div className="text-xs text-[#958ea0] mt-1 font-sans">
              +3 onboarded this cycle • 0 terminations
            </div>
          </div>

          {/* Segmented capacity gauge */}
          <div className="flex flex-col gap-1.5 mt-2">
            <div className="flex items-center justify-between font-space text-[11px] text-[#958ea0]">
              <span>Tier Distribution</span>
              <span className="text-[#4edea3] font-semibold">{30 - activeRetainersCount} Seats Open</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#343439] flex overflow-hidden gap-0.5">
              <div className="h-full bg-[#ffdad2] rounded-l-full" style={{ width: '52%' }} title="Tier 1: 52%" />
              <div className="h-full bg-[#4edea3]" style={{ width: '32%' }} title="Tier 2: 32%" />
              <div className="h-full bg-[#ec6a06]" style={{ width: '9%' }} title="Tier 3: 9%" />
              <div className="h-full bg-[#1f1f24] flex-1" />
            </div>
          </div>
        </div>

        {/* CARD 3: Anti-Churn Health Index */}
        <div
          onClick={() => setActiveSection('anti-churn-radar')}
          className="relative overflow-hidden rounded-xl bg-[#1a1b20]/90 backdrop-blur-md p-5 flex flex-col justify-between shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] border border-[#292a2e]/60 group hover:border-[#4edea3]/40 transition-all cursor-pointer"
          title="Click to inspect retention health telemetry"
        >
          <div className="absolute -right-10 -top-10 w-28 h-28 bg-[#00a572]/15 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="font-space text-[11px] text-[#cbc3d7] uppercase tracking-wider font-semibold">
              Retention Health Index
            </span>
            <span className="flex items-center gap-1 text-[#4edea3] font-space text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#4edea3] shadow-[0_0_8px_#4edea3]" />
              OPTIMAL
            </span>
          </div>

          <div className="mt-3 mb-1">
            <div className="font-space text-3xl font-bold text-[#e3e2e8] tracking-tight leading-none">
              {currentTimeData.compliance}
            </div>
            <div className="text-xs text-[#958ea0] mt-1 font-sans">
              +3.2% vs industry elite cohort benchmark
            </div>
          </div>

          {/* Mini spark bar set */}
          <div className="flex items-end gap-1.5 h-10 w-full mt-2 pt-2">
            <div className="flex-1 bg-[#343439] rounded-t-sm h-[40%]" />
            <div className="flex-1 bg-[#343439] rounded-t-sm h-[55%]" />
            <div className="flex-1 bg-[#343439] rounded-t-sm h-[60%]" />
            <div className="flex-1 bg-[#343439] rounded-t-sm h-[50%]" />
            <div className="flex-1 bg-[#4edea3]/40 rounded-t-sm h-[75%]" />
            <div className="flex-1 bg-[#4edea3]/70 rounded-t-sm h-[88%]" />
            <div className="flex-1 bg-[#4edea3] rounded-t-sm h-[95%] shadow-[0_0_10px_#4edea3]" />
          </div>
        </div>

        {/* CARD 4: Urgent Intervention Alerts */}
        <div
          onClick={() => setActiveSection('anti-churn-radar')}
          className="relative overflow-hidden rounded-xl bg-[#1a1b20]/90 backdrop-blur-md p-5 flex flex-col justify-between shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] border border-[#ec6a06]/40 group hover:bg-[#1f1f24] transition-all cursor-pointer"
          title="Click to resolve churn radar alerts"
        >
          <div className="absolute -right-10 -top-10 w-28 h-28 bg-[#ec6a06]/20 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="font-space text-[11px] text-[#cbc3d7] uppercase tracking-wider font-semibold">
              Radar Interventions
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#ec6a06]/20 text-[#ffb690] font-space text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ec6a06] animate-ping" />
              2 PENDING
            </span>
          </div>

          <div className="mt-3 mb-1">
            <div className="font-space text-3xl font-bold text-[#ffb690] tracking-tight leading-none">
              02 <span className="text-[#958ea0] text-xl font-normal">Triage Items</span>
            </div>
            <div className="text-xs text-[#958ea0] mt-1 font-sans">
              1 dark client • 1 metabolic plateau trigger
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <button className="w-full py-1.5 px-3 rounded-lg bg-[#292a2e] text-[#e3e2e8] hover:bg-[#343439] text-center font-space text-xs font-semibold transition-colors flex items-center justify-center gap-1">
              <span>Resolve in Radar</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (8 COLS): MOMENTUM CHART, RADAR POD & CLIENT ROSTER */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* 1. Performance & Retainer Momentum Chart */}
          <div className="rounded-xl bg-[#1a1b20]/90 backdrop-blur-xl p-6 flex flex-col shadow-[0_4px_24px_rgba(0,0,0,0.4)] border border-[#292a2e]/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-space text-xs text-[#ffdad2] uppercase font-bold tracking-wider">
                    {metricMode === 'revenue' ? 'Financial & Yield Velocity' : metricMode === 'clients' ? 'Client Roster Trajectory' : 'Adherence & Compliance Velocity'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#4edea3]/15 text-[#4edea3] font-space text-[11px] font-semibold">
                    {currentTimeData.growth}
                  </span>
                </div>
                <div className="font-space text-2xl text-[#e3e2e8] font-bold tracking-tight mt-0.5">
                  {metricMode === 'revenue' ? `$${totalRetainerRevenue.toLocaleString()}.00` : metricMode === 'clients' ? `${activeRetainersCount} Active Clients` : `${currentTimeData.compliance}`}
                  <span className="text-[#958ea0] text-xs font-normal font-sans ml-2">
                    ({timeRange} Interval)
                  </span>
                </div>
              </div>

              {/* Interactive Metric Switcher Tabs */}
              <div className="flex items-center bg-[#0d0e12] p-1 rounded-lg border border-[#292a2e]/40 font-space text-xs">
                <button
                  onClick={() => setMetricMode('revenue')}
                  className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                    metricMode === 'revenue' ? 'bg-[#1f1f24] text-[#e3e2e8] font-semibold shadow-sm' : 'text-[#958ea0] hover:text-[#e3e2e8]'
                  }`}
                >
                  Revenue ($)
                </button>
                <button
                  onClick={() => setMetricMode('clients')}
                  className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                    metricMode === 'clients' ? 'bg-[#1f1f24] text-[#e3e2e8] font-semibold shadow-sm' : 'text-[#958ea0] hover:text-[#e3e2e8]'
                  }`}
                >
                  Clients (#)
                </button>
                <button
                  onClick={() => setMetricMode('compliance')}
                  className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                    metricMode === 'compliance' ? 'bg-[#1f1f24] text-[#e3e2e8] font-semibold shadow-sm' : 'text-[#958ea0] hover:text-[#e3e2e8]'
                  }`}
                >
                  Adherence (%)
                </button>
              </div>
            </div>

            {/* Glowing Neon Chart Visualization with Interactive Hover Points */}
            <div className="relative w-full h-72 pt-4">
              {/* Background Axis Gridlines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6 text-[#958ea0]/40 font-space text-[11px]">
                <div className="flex items-center justify-between w-full border-b border-[#343439]/20 pb-1">
                  <span>{metricMode === 'revenue' ? '$30k' : metricMode === 'clients' ? '30' : '100%'}</span>
                  <div className="w-full ml-4 h-[1px] bg-[#343439]/30" />
                </div>
                <div className="flex items-center justify-between w-full border-b border-[#343439]/20 pb-1">
                  <span>{metricMode === 'revenue' ? '$20k' : metricMode === 'clients' ? '20' : '95%'}</span>
                  <div className="w-full ml-4 h-[1px] bg-[#343439]/30" />
                </div>
                <div className="flex items-center justify-between w-full border-b border-[#343439]/20 pb-1">
                  <span>{metricMode === 'revenue' ? '$10k' : metricMode === 'clients' ? '10' : '90%'}</span>
                  <div className="w-full ml-4 h-[1px] bg-[#343439]/30" />
                </div>
                <div className="flex items-center justify-between w-full pb-1">
                  <span>{metricMode === 'revenue' ? '$0' : metricMode === 'clients' ? '0' : '85%'}</span>
                  <div className="w-full ml-4 h-[1px] bg-[#343439]/30" />
                </div>
              </div>

              {/* Luminous Area SVG */}
              <svg
                className="w-full h-56 mt-2 relative z-10 overflow-visible"
                preserveAspectRatio="none"
                viewBox="0 0 660 200"
              >
                <defs>
                  <linearGradient id="neonGradientFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#ec6a06" stopOpacity="0.45" />
                    <stop offset="50%" stopColor="#ec6a06" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#ec6a06" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Area under curve */}
                {svgAreaPathD && <path d={svgAreaPathD} fill="url(#neonGradientFill)" />}

                {/* Neon curve path */}
                {svgPathD && (
                  <path
                    className="drop-shadow-[0_0_12px_rgba(236,106,6,0.85)]"
                    d={svgPathD}
                    fill="none"
                    stroke="#ec6a06"
                    strokeWidth="3.2"
                  />
                )}

                {/* Interactive Points */}
                {chartCoordinates.map((pt, idx) => (
                  <g key={idx} className="cursor-pointer">
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="12"
                      fill="transparent"
                      onMouseEnter={() => setHoveredChartPoint(pt)}
                      onMouseLeave={() => setHoveredChartPoint(null)}
                    />
                    <circle
                      className="drop-shadow-[0_0_8px_#ec6a06] transition-all pointer-events-none"
                      cx={pt.x}
                      cy={pt.y}
                      fill={hoveredChartPoint?.label === pt.label ? '#ffffff' : '#ec6a06'}
                      r={hoveredChartPoint?.label === pt.label ? '7' : '5'}
                      stroke="#121317"
                      strokeWidth="2.5"
                    />
                  </g>
                ))}
              </svg>

              {/* Interactive Tooltip Card */}
              {hoveredChartPoint ? (
                <div
                  className="absolute z-30 bg-[#1a1b20]/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-2xl border border-[#ffb4a3]/60 pointer-events-none -translate-x-1/2 -translate-y-full transition-all"
                  style={{
                    left: `${(hoveredChartPoint.x / 660) * 100}%`,
                    top: `${Math.max(10, (hoveredChartPoint.y / 200) * 100 - 15)}%`,
                  }}
                >
                  <span className="font-space text-[10px] text-[#ffb690] font-bold tracking-wider uppercase block">
                    {hoveredChartPoint.label} · Telemetry
                  </span>
                  <div className="font-space text-sm text-[#e3e2e8] font-bold mt-0.5">
                    {metricMode === 'revenue'
                      ? `$${hoveredChartPoint.rawVal.toLocaleString()}.00`
                      : metricMode === 'clients'
                      ? `${hoveredChartPoint.active} Active Clients`
                      : `${hoveredChartPoint.value.toFixed(1)}% Adherence`}
                  </div>
                  <div className="text-[10px] text-[#4edea3] font-mono mt-0.5">
                    ✓ Verified on-chain &amp; Stripe vault
                  </div>
                </div>
              ) : (
                <div className="absolute top-1 left-[66%] -translate-x-1/2 z-20 bg-[#343439]/95 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-xl pointer-events-none text-center border border-[#292a2e]">
                  <span className="font-space text-[10px] text-[#ffb690] font-bold tracking-wider">
                    {currentTimeData.chartPoints[currentTimeData.chartPoints.length - 1]?.label} YIELD
                  </span>
                  <div className="font-space text-sm text-[#e3e2e8] font-bold leading-none mt-0.5">
                    ${totalRetainerRevenue.toLocaleString()}.00
                  </div>
                </div>
              )}

              {/* Bottom Axis Labels */}
              <div className="flex items-center justify-between w-full px-2 pt-2 text-[#958ea0] font-space text-[11px] uppercase">
                {currentTimeData.chartPoints.map((pt, i) => (
                  <span
                    key={i}
                    onClick={() => {
                      setHoveredChartPoint(chartCoordinates[i]);
                      showToast(`Inspecting ${pt.label} data point`);
                    }}
                    className={`cursor-pointer transition-colors ${
                      hoveredChartPoint?.label === pt.label
                        ? 'text-[#ffb690] font-bold'
                        : i === currentTimeData.chartPoints.length - 1
                        ? 'text-[#ec6a06] font-bold'
                        : 'hover:text-[#e3e2e8]'
                    }`}
                  >
                    {pt.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Legend and Meta Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#343439]/30 mt-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setMetricMode('revenue')}>
                  <span className="w-3 h-3 rounded-full bg-[#ec6a06] shadow-[0_0_8px_#ec6a06]" />
                  <span className="text-xs text-[#e3e2e8] font-medium font-sans">
                    Stripe Recurring Retainers
                  </span>
                </div>
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setMetricMode('compliance')}>
                  <span className="w-3 h-3 rounded-full bg-[#ffb4a3]/70" />
                  <span className="text-xs text-[#958ea0] font-sans">
                    Projected Yield Cohort
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-space text-xs text-[#958ea0]">Total Volume Run-rate:</span>
                <span className="font-space text-xs text-[#4edea3] font-bold">
                  ${(totalRetainerRevenue * 12).toLocaleString()} / yr
                </span>
              </div>
            </div>
          </div>

          {/* 2. Anti-Churn Early Warning Radar Pod */}
          <div className="flex flex-col gap-3" id="radar-section">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ec6a06] text-[20px]">crisis_alert</span>
                <h2 className="font-space text-lg text-[#e3e2e8] font-bold">
                  Anti-Churn Early Warning Pod
                </h2>
              </div>
              <button
                onClick={() => setActiveSection('anti-churn-radar')}
                className="font-space text-xs text-[#ffb690] hover:text-[#ffdad2] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Open Full Radar (2)</span>
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Radar Alert Card 1: Alexander Wright */}
              <div
                className={`relative rounded-xl bg-[#1a1b20]/90 backdrop-blur-md p-5 overflow-hidden flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.35)] border border-[#ec6a06]/30 group transition-all ${
                  snoozedAlerts['ca-1'] ? 'opacity-50 grayscale-[40%]' : ''
                }`}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ec6a06]" />
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#292a2e] flex items-center justify-center font-space text-sm text-[#ffb690] font-bold">
                        AW
                      </div>
                      <div className="flex flex-col">
                        <span className="font-space text-sm font-bold text-[#e3e2e8] leading-tight">
                          Alexander Wright
                        </span>
                        <span className="font-space text-[11px] text-[#958ea0]">
                          Executive Body Composition • $1,750/mo
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleSnoozeAlert('ca-1', 'Alexander Wright')}
                        className="p-1 rounded text-[#958ea0] hover:text-[#ffdad2] transition-colors cursor-pointer"
                        title={snoozedAlerts['ca-1'] ? 'Un-snooze alert' : 'Snooze alert 24h'}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {snoozedAlerts['ca-1'] ? 'notifications_paused' : 'notifications'}
                        </span>
                      </button>
                      <span className="px-2 py-0.5 rounded-full bg-[#ec6a06]/20 text-[#ffb690] text-[10px] font-space font-bold">
                        {snoozedAlerts['ca-1'] ? 'Snoozed 24h' : 'Went Dark >3d'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-lg bg-[#0d0e12]/80 flex flex-col gap-1.5 border border-[#292a2e]/50">
                    <div className="flex justify-between font-space text-[11px] text-[#958ea0]">
                      <span>Log Gap Threshold</span>
                      <span className="text-[#ec6a06] font-bold">84 Hours Since Check-in</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#343439] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#ffb690] via-[#ec6a06] to-[#ffb4ab] shadow-[0_0_10px_#ec6a06]"
                        style={{ width: '82%' }}
                      />
                    </div>
                    <p className="text-xs text-[#cbc3d7] mt-1 font-sans">
                      Last WhatsApp response Sunday. Habit tracking score plunged 64% below baseline.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#343439]/30">
                  <span className="font-space text-[11px] text-[#958ea0]">Auto-Escalate in 14h</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const target = clients.find((c) => c.name.includes('Alexander')) || clients[0];
                        setSelectedTelemetryClient(target);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#292a2e] hover:bg-[#343439] text-[#e3e2e8] font-space text-xs transition-colors cursor-pointer"
                    >
                      Dossier
                    </button>
                    <a
                      href="https://wa.me/?text=Hey%20Alexander,%20saw%20you%20were%20traveling!%20Let's%20hop%20on%20a%20quick%2010-min%20call%20to%20reset%20momentum."
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => showToast('Dispatched WhatsApp direct nudge to Alexander!')}
                      className="px-3 py-1.5 rounded-lg bg-[#ec6a06] text-[#4a1c00] font-space text-xs font-bold shadow-[0_0_12px_rgba(236,106,6,0.35)] hover:bg-[#ffb690] transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">chat</span>
                      <span>Send WhatsApp Nudge</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Radar Alert Card 2: Elena Rostova */}
              <div
                className={`relative rounded-xl bg-[#1a1b20]/90 backdrop-blur-md p-5 overflow-hidden flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.35)] border border-[#ffb4a3]/30 group transition-all ${
                  snoozedAlerts['ca-2'] ? 'opacity-50 grayscale-[40%]' : ''
                }`}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ffb4a3]" />
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#292a2e] flex items-center justify-center font-space text-sm text-[#ffdad2] font-bold">
                        ER
                      </div>
                      <div className="flex flex-col">
                        <span className="font-space text-sm font-bold text-[#e3e2e8] leading-tight">
                          Elena Rostova
                        </span>
                        <span className="font-space text-[11px] text-[#958ea0]">
                          Triathlon Peak • $1,200/mo
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleSnoozeAlert('ca-2', 'Elena Rostova')}
                        className="p-1 rounded text-[#958ea0] hover:text-[#ffdad2] transition-colors cursor-pointer"
                        title={snoozedAlerts['ca-2'] ? 'Un-snooze alert' : 'Snooze alert 24h'}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {snoozedAlerts['ca-2'] ? 'notifications_paused' : 'notifications'}
                        </span>
                      </button>
                      <span className="px-2 py-0.5 rounded-full bg-[#ffb4a3]/20 text-[#ffdad2] text-[10px] font-space font-bold">
                        {snoozedAlerts['ca-2'] ? 'Snoozed 24h' : 'Stall Detected'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-lg bg-[#0d0e12]/80 flex flex-col gap-1.5 border border-[#292a2e]/50">
                    <div className="flex justify-between font-space text-[11px] text-[#958ea0]">
                      <span>Metabolic Velocity (14 Days)</span>
                      <span className="text-[#ffdad2] font-bold">0.0 kg Delta / HRV Drop 18%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#343439] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#ffdad2] via-[#ffb4a3] to-[#e57a62] shadow-[0_0_10px_#ffb4a3]"
                        style={{ width: '74%' }}
                      />
                    </div>
                    <p className="text-xs text-[#cbc3d7] mt-1 font-sans">
                      Sleep efficiency down 12%. Fatigue accumulation flag triggered. Recommend carb refeed protocol.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#343439]/30">
                  <span className="font-space text-[11px] text-[#958ea0]">Refeed protocol queued</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const target = clients.find((c) => c.name.includes('Elena')) || clients[1] || clients[0];
                        setSelectedTelemetryClient(target);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#292a2e] hover:bg-[#343439] text-[#e3e2e8] font-space text-xs transition-colors cursor-pointer"
                    >
                      Telemetry
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRecipient('Elena Rostova');
                        setCalInput('2,100');
                        setCarbsInput('235');
                        setReasonInput(
                          'Elena Rostova’s metabolic plateau across 12 consecutive days suggests chronic glycogen depletion. Increasing carbohydrate allocation by +25g daily will restore leptin dynamics.'
                        );
                        showToast('Transferred to Prescriptive Studio');
                        setActiveSection('prescriptive-studio');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#ffb4a3] text-[#3a0900] font-space text-xs font-bold shadow-[0_0_12px_rgba(255,180,163,0.4)] hover:bg-[#ffdad2] transition-all cursor-pointer"
                    >
                      Apply Macro Shift
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. High-Impact Client Roster Table with Live Search & Filtering */}
          <div className="rounded-xl bg-[#1a1b20]/90 backdrop-blur-xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] flex flex-col gap-4 border border-[#292a2e]/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="font-space text-lg text-[#e3e2e8] font-bold">
                  Client Roster Radar
                </h2>
                <div className="flex items-center bg-[#0d0e12] rounded-lg p-0.5 font-space text-xs border border-[#292a2e]/40">
                  <button
                    onClick={() => {
                      setFilterState('all');
                      setTierFilter(null);
                    }}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      filterState === 'all' && !tierFilter ? 'bg-[#292a2e] text-[#e3e2e8] font-semibold' : 'text-[#958ea0] hover:text-[#e3e2e8]'
                    }`}
                  >
                    All {clients.length}
                  </button>
                  <button
                    onClick={() => setFilterState('healthy')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      filterState === 'healthy' ? 'bg-[#292a2e] text-[#4edea3] font-semibold' : 'text-[#958ea0] hover:text-[#4edea3]'
                    }`}
                  >
                    Healthy {clients.filter((c) => c.riskStatus === 'healthy').length}
                  </button>
                  <button
                    onClick={() => setFilterState('warning')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      filterState === 'warning' ? 'bg-[#292a2e] text-[#ffb690] font-semibold' : 'text-[#ffb690]/80 hover:text-[#ffb690]'
                    }`}
                  >
                    Warning {clients.filter((c) => c.riskStatus === 'plateau').length}
                  </button>
                  <button
                    onClick={() => setFilterState('risk')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      filterState === 'risk' ? 'bg-[#292a2e] text-[#ffb4ab] font-semibold' : 'text-[#ffb4ab]/80 hover:text-[#ffb4ab]'
                    }`}
                  >
                    At Risk {clients.filter((c) => c.riskStatus === 'dark').length}
                  </button>
                </div>

                {tierFilter && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ffb4a3]/20 text-[#ffdad2] text-[10px] font-space">
                    Tier: {tierFilter}
                    <button onClick={() => setTierFilter(null)} className="hover:text-white cursor-pointer ml-1">
                      ×
                    </button>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Search Input */}
                <div className="relative flex items-center">
                  <label htmlFor={searchInputId} className="sr-only">Search clients</label>
                  <input
                    id={searchInputId}
                    type="text"
                    placeholder="Search client or goal..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-36 sm:w-44 bg-[#0d0e12] border border-[#292a2e]/60 rounded-lg py-1 pl-2.5 pr-7 text-xs text-[#e3e2e8] placeholder-[#958ea0] outline-none focus:border-[#ffdad2]"
                  />
                  {searchQuery ? (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2 text-[#958ea0] hover:text-white text-xs cursor-pointer">
                      ×
                    </button>
                  ) : (
                    <span className="material-symbols-outlined text-[#958ea0] text-[14px] absolute right-2 pointer-events-none">
                      search
                    </span>
                  )}
                </div>

                {/* Sort selector */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'compliance' | 'retainer')}
                  className="bg-[#0d0e12] border border-[#292a2e]/60 rounded-lg py-1 px-2 text-xs text-[#cbc3d7] outline-none cursor-pointer font-space"
                >
                  <option value="compliance">Sort: Compliance</option>
                  <option value="retainer">Sort: Retainer $</option>
                  <option value="name">Sort: Name (A-Z)</option>
                </select>

                <button
                  onClick={() => setActiveSection('client-roster')}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1f1f24] text-[#ffdad2] font-space text-xs font-bold hover:bg-[#292a2e] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>View Full Roster</span>
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#343439]/30 font-space text-[11px] text-[#958ea0] uppercase tracking-wider">
                    <th className="py-3 px-2 font-semibold">Client &amp; Goal</th>
                    <th className="py-3 px-2 font-semibold">Compliance Gauge</th>
                    <th className="py-3 px-2 font-semibold">Tier / Monthly</th>
                    <th className="py-3 px-2 font-semibold">Status Beacon</th>
                    <th className="py-3 px-2 font-semibold text-right">Quick Prescribe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#343439]/20 font-sans text-xs">
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#958ea0] font-space">
                        No clients matching filter or search query.
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => (
                      <tr
                        key={client.id}
                        className="hover:bg-[#1f1f24]/50 transition-colors group cursor-pointer"
                        onClick={() => setSelectedTelemetryClient(client)}
                      >
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-space text-xs font-bold ${
                                client.riskStatus === 'dark'
                                  ? 'bg-[#ec6a06]/20 text-[#ffb690]'
                                  : client.riskStatus === 'plateau'
                                  ? 'bg-[#ffb4a3]/20 text-[#ffdad2]'
                                  : 'bg-[#4edea3]/20 text-[#4edea3]'
                              }`}
                            >
                              {client.initials}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-space font-semibold text-sm text-[#e3e2e8] group-hover:text-[#ffdad2] transition-colors">
                                {client.name}
                              </span>
                              <span className="text-[11px] text-[#958ea0]">{client.focus}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-2">
                          <div className="flex flex-col gap-1 w-32">
                            <div className="flex items-center justify-between font-space text-[11px]">
                              <span className="text-[#e3e2e8] font-bold">{client.compliance}%</span>
                              <span
                                className={`font-semibold ${
                                  client.compliance >= 90
                                    ? 'text-[#4edea3]'
                                    : client.compliance >= 70
                                    ? 'text-[#ffdad2]'
                                    : 'text-[#ec6a06]'
                                }`}
                              >
                                {client.complianceLabel}
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-[#343439] overflow-hidden">
                              <div
                                className={`h-full ${
                                  client.compliance >= 90
                                    ? 'bg-[#4edea3] shadow-[0_0_8px_#4edea3]'
                                    : client.compliance >= 70
                                    ? 'bg-[#ffdad2] shadow-[0_0_8px_#ffdad2]'
                                    : 'bg-[#ec6a06] shadow-[0_0_8px_#ec6a06]'
                                }`}
                                style={{ width: `${client.compliance}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-2">
                          <div className="flex flex-col">
                            <span className="font-space text-xs text-[#e3e2e8] font-bold">
                              {client.monthlyRetainer}
                            </span>
                            <span className="font-space text-[10px] text-[#958ea0]">
                              {client.tierLabel}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-space text-[10px] font-bold ${
                              client.riskStatus === 'dark'
                                ? 'bg-[#ec6a06]/20 text-[#ffb690]'
                                : client.riskStatus === 'plateau'
                                ? 'bg-[#ffb4a3]/20 text-[#ffdad2]'
                                : 'bg-[#4edea3]/15 text-[#4edea3]'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                client.riskStatus === 'dark'
                                  ? 'bg-[#ec6a06]'
                                  : client.riskStatus === 'plateau'
                                  ? 'bg-[#ffb4a3]'
                                  : 'bg-[#4edea3]'
                              }`}
                            />
                            {client.statusBeacon}
                          </span>
                        </td>

                        <td className="py-3 px-2 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                handleLaunchVideoCall(client);
                                showToast(`Starting direct call with ${client.name}`);
                              }}
                              className="p-1.5 rounded-lg bg-[#1f1f24] text-[#ffdad2] hover:text-[#e3e2e8] hover:bg-[#292a2e] transition-colors cursor-pointer"
                              title="Launch 1-on-1 Call"
                            >
                              <span className="material-symbols-outlined text-[17px]">videocam</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRecipient(client.name);
                                setActiveSection('prescriptive-studio');
                              }}
                              className="p-1.5 rounded-lg bg-[#1f1f24] text-[#cbc3d7] hover:text-[#e3e2e8] hover:bg-[#292a2e] transition-colors cursor-pointer"
                              title="Open Prescriptive Studio"
                            >
                              <span className="material-symbols-outlined text-[17px]">tune</span>
                            </button>
                            <button
                              onClick={() => {
                                setBillingModalClient(client);
                                setNewFeeValue(client.monthlyFeeNum);
                              }}
                              className="p-1.5 rounded-lg bg-[#1f1f24] text-[#4edea3] hover:text-[#e3e2e8] hover:bg-[#292a2e] transition-colors cursor-pointer"
                              title="Manage Stripe Retainer"
                            >
                              <span className="material-symbols-outlined text-[17px]">credit_card</span>
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
        </div>

        {/* RIGHT COLUMN (4 COLS): AI INSIGHTS, DONUT, HEATMAP & COMMAND BAR */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* WIDGET 1: AI Retainer & Protocol Insights */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1a1b20] via-[#1f1f24] to-[#0d0e12] p-5 shadow-[0_4px_28px_rgba(0,0,0,0.5)] border border-[#ffb4a3]/30">
            <div className="absolute -right-6 -top-6 w-36 h-36 rounded-full bg-gradient-to-br from-[#ffb4a3] via-[#e57a62] to-[#ffdad2] opacity-30 blur-2xl pointer-events-none" />
            <div className="absolute right-4 top-4 w-11 h-11 rounded-full bg-[#ffdad2]/20 backdrop-blur-xl flex items-center justify-center shadow-[0_0_24px_rgba(255,218,210,0.6)]">
              <span className="material-symbols-outlined text-[#ffdad2] text-[22px]">auto_awesome</span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="font-space text-[10px] text-[#ffdad2] uppercase font-bold tracking-widest">
                CoachOS Intelligence
              </span>
            </div>

            <h3 className="font-space text-lg text-[#e3e2e8] font-bold pr-12">
              Protocol Prescription Ready
            </h3>

            <p className="text-xs text-[#cbc3d7] mt-2 leading-relaxed font-sans">
              Elena Rostova’s metabolic plateaus across 12 consecutive days suggest chronic glycogen depletion. Increasing carbohydrate allocation by{' '}
              <span className="text-[#4edea3] font-semibold">+25g daily</span> will restore leptin dynamics.
            </p>

            <div className="mt-4 p-3 rounded-lg bg-[#0d0e12]/80 flex items-center justify-between border border-[#292a2e]/60">
              <div className="flex flex-col">
                <span className="font-space text-[10px] text-[#958ea0]">Recommended Action</span>
                <span className="font-space text-xs text-[#ffdad2] font-bold">Queue Macro Refeed Plan</span>
              </div>
              <button
                onClick={() => {
                  setSelectedRecipient('Elena Rostova');
                  setCalInput('2,100');
                  setCarbsInput('235');
                  setReasonInput(
                    'Elena Rostova’s metabolic plateau across 12 consecutive days suggests chronic glycogen depletion. Increasing carbohydrate allocation by +25g daily will restore leptin dynamics.'
                  );
                  showToast('Transferred to Prescriptive Studio');
                  setActiveSection('prescriptive-studio');
                }}
                className="px-3 py-1.5 rounded-lg bg-[#ffb4a3] text-[#3a0900] font-space text-xs font-bold shadow-[0_0_12px_rgba(255,180,163,0.4)] hover:bg-[#ffdad2] transition-all cursor-pointer"
              >
                Review AI Draft
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between text-[#958ea0] font-space text-[11px]">
              <span>Confidence Score: 94.6%</span>
              <span className="text-[#4edea3] flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]" />
                Telemetry Validated
              </span>
            </div>
          </div>

          {/* WIDGET 2: Retainer Volume Tier Breakdown Ring (Interactive) */}
          <div className="rounded-xl bg-[#1a1b20]/90 backdrop-blur-xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] flex flex-col justify-between border border-[#292a2e]/60">
            <div className="flex items-center justify-between mb-2">
              <span className="font-space text-base text-[#e3e2e8] font-bold">
                Retainer Volume Tier
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#292a2e] text-[#cbc3d7] font-space text-[11px]">
                Active {activeRetainersCount}
              </span>
            </div>

            <div className="flex items-center gap-4 py-2">
              <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" fill="none" r="38" stroke="#292a2e" strokeWidth="12" />
                  <circle
                    className="drop-shadow-[0_0_8px_rgba(255,180,163,0.5)] cursor-pointer transition-all hover:stroke-width-14"
                    cx="50"
                    cy="50"
                    fill="none"
                    r="38"
                    stroke="#ffb4a3"
                    strokeDasharray="131 238"
                    strokeDashoffset="0"
                    strokeWidth={tierFilter === 'Tier 1' ? '15' : '12'}
                    onClick={() => {
                      setTierFilter(tierFilter === 'Tier 1' ? null : 'Tier 1');
                      showToast(tierFilter === 'Tier 1' ? 'Cleared Tier Filter' : 'Filtered table to Tier 1');
                    }}
                  />
                  <circle
                    className="drop-shadow-[0_0_8px_rgba(78,222,163,0.5)] cursor-pointer transition-all hover:stroke-width-14"
                    cx="50"
                    cy="50"
                    fill="none"
                    r="38"
                    stroke="#4edea3"
                    strokeDasharray="71 238"
                    strokeDashoffset="-133"
                    strokeWidth={tierFilter === 'Tier 2' ? '15' : '12'}
                    onClick={() => {
                      setTierFilter(tierFilter === 'Tier 2' ? null : 'Tier 2');
                      showToast(tierFilter === 'Tier 2' ? 'Cleared Tier Filter' : 'Filtered table to Tier 2');
                    }}
                  />
                  <circle
                    className="drop-shadow-[0_0_8px_rgba(236,106,6,0.5)] cursor-pointer transition-all hover:stroke-width-14"
                    cx="50"
                    cy="50"
                    fill="none"
                    r="38"
                    stroke="#ec6a06"
                    strokeDasharray="35 238"
                    strokeDashoffset="-206"
                    strokeWidth={tierFilter === 'Tier 3' ? '15' : '12'}
                    onClick={() => {
                      setTierFilter(tierFilter === 'Tier 3' ? null : 'Tier 3');
                      showToast(tierFilter === 'Tier 3' ? 'Cleared Tier Filter' : 'Filtered table to Tier 3');
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="font-space text-sm text-[#e3e2e8] font-bold leading-none">
                    ${(totalRetainerRevenue / 1000).toFixed(1)}k
                  </span>
                  <span className="font-space text-[9px] text-[#958ea0] uppercase mt-0.5">
                    Yield
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full text-xs font-sans">
                <div
                  onClick={() => {
                    setTierFilter(tierFilter === 'Tier 1' ? null : 'Tier 1');
                    showToast(tierFilter === 'Tier 1' ? 'Cleared Tier Filter' : 'Filtered table to Tier 1');
                  }}
                  className={`flex items-center justify-between p-1 rounded-lg cursor-pointer transition-colors ${
                    tierFilter === 'Tier 1' ? 'bg-[#ffb4a3]/20' : 'hover:bg-[#1f1f24]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ffb4a3]" />
                    <span className="text-[#e3e2e8]">Tier 1 (&gt;$1.5k)</span>
                  </div>
                  <span className="font-space text-[11px] text-[#e3e2e8] font-bold">55% (15)</span>
                </div>

                <div
                  onClick={() => {
                    setTierFilter(tierFilter === 'Tier 2' ? null : 'Tier 2');
                    showToast(tierFilter === 'Tier 2' ? 'Cleared Tier Filter' : 'Filtered table to Tier 2');
                  }}
                  className={`flex items-center justify-between p-1 rounded-lg cursor-pointer transition-colors ${
                    tierFilter === 'Tier 2' ? 'bg-[#4edea3]/20' : 'hover:bg-[#1f1f24]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4edea3]" />
                    <span className="text-[#e3e2e8]">Tier 2 ($1k-$1.5k)</span>
                  </div>
                  <span className="font-space text-[11px] text-[#e3e2e8] font-bold">30% (9)</span>
                </div>

                <div
                  onClick={() => {
                    setTierFilter(tierFilter === 'Tier 3' ? null : 'Tier 3');
                    showToast(tierFilter === 'Tier 3' ? 'Cleared Tier Filter' : 'Filtered table to Tier 3');
                  }}
                  className={`flex items-center justify-between p-1 rounded-lg cursor-pointer transition-colors ${
                    tierFilter === 'Tier 3' ? 'bg-[#ec6a06]/20' : 'hover:bg-[#1f1f24]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ec6a06]" />
                    <span className="text-[#e3e2e8]">Tier 3 (Core)</span>
                  </div>
                  <span className="font-space text-[11px] text-[#e3e2e8] font-bold">15% (4)</span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-[#958ea0] text-xs font-sans border-t border-[#343439]/30 flex items-center justify-between">
              <span>High-tier retainers yield <strong className="text-[#e3e2e8] font-semibold">82%</strong> cashflow</span>
              {tierFilter && (
                <button
                  onClick={() => setTierFilter(null)}
                  className="text-[11px] font-space text-[#ffb4a3] hover:underline cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>

          {/* WIDGET 3: Check-in Activity Heatmap Matrix (Interactive Tooltips) */}
          <div className="rounded-xl bg-[#1a1b20]/90 backdrop-blur-xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] flex flex-col border border-[#292a2e]/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-space text-base text-[#e3e2e8] font-bold">
                  Check-in Heatmap
                </span>
              </div>
              <div className="flex items-center gap-1 font-space text-[10px] text-[#958ea0]">
                <span>Low</span>
                <span className="w-2 h-2 rounded-sm bg-[#343439]" />
                <span className="w-2 h-2 rounded-sm bg-[#4edea3]/30" />
                <span className="w-2 h-2 rounded-sm bg-[#4edea3]/70" />
                <span className="w-2 h-2 rounded-sm bg-[#4edea3] shadow-[0_0_4px_#4edea3]" />
                <span>High</span>
              </div>
            </div>

            <div className="w-full flex flex-col gap-1.5 py-1">
              {[
                { day: 'Mon', activeIndices: [2, 3, 4, 5, 6, 10] },
                { day: 'Tue', activeIndices: [1, 2, 3, 4, 5, 6, 9] },
                { day: 'Wed', activeIndices: [2, 3, 4, 5, 6, 7, 8, 10], peak: true },
                { day: 'Thu', activeIndices: [1, 2, 3, 4, 5, 8, 9] },
                { day: 'Fri', activeIndices: [2, 3, 4, 5, 9] },
                { day: 'Sat', activeIndices: [3, 4] },
                { day: 'Sun', activeIndices: [2, 3, 4, 5, 6] },
              ].map((row) => (
                <div key={row.day} className="flex items-center gap-1.5">
                  <span
                    className={`w-7 font-space text-[11px] ${
                      row.peak ? 'text-[#4edea3] font-bold' : 'text-[#958ea0]'
                    }`}
                  >
                    {row.day}
                  </span>
                  <div className="grid grid-cols-12 gap-1 flex-1">
                    {Array.from({ length: 12 }).map((_, i) => {
                      const isActive = row.activeIndices.includes(i);
                      const hourNum = 8 + i;
                      const timeLabel = `${hourNum > 12 ? hourNum - 12 : hourNum}:00 ${hourNum >= 12 ? 'PM' : 'AM'}`;
                      return (
                        <div
                          key={i}
                          onMouseEnter={() =>
                            setHoveredHeatmapSlot({
                              day: row.day,
                              slotIndex: i,
                              timeLabel,
                              checkins: isActive ? (row.peak && i === 4 ? 8 : 4) : 0,
                            })
                          }
                          onMouseLeave={() => setHoveredHeatmapSlot(null)}
                          onClick={() => {
                            if (isActive) {
                              showToast(`${row.day} @ ${timeLabel}: ${row.peak && i === 4 ? '8' : '4'} client check-ins logged`);
                            }
                          }}
                          className={`h-2.5 rounded-xs cursor-pointer transition-transform hover:scale-125 ${
                            isActive
                              ? row.peak && i === 4
                                ? 'bg-[#6ffbbe] shadow-[0_0_8px_#6ffbbe]'
                                : 'bg-[#4edea3]'
                              : 'bg-[#343439]/60 hover:bg-[#343439]'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Heatmap Live Tooltip / Summary */}
            <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#343439]/30 font-space text-[11px] text-[#958ea0]">
              {hoveredHeatmapSlot ? (
                <div className="text-[#ffdad2]">
                  {hoveredHeatmapSlot.day} {hoveredHeatmapSlot.timeLabel}:{' '}
                  <strong className="text-[#4edea3] font-bold">
                    {hoveredHeatmapSlot.checkins > 0 ? `${hoveredHeatmapSlot.checkins} check-ins synced` : 'No logs'}
                  </strong>
                </div>
              ) : (
                <div>
                  Peak Activity: <strong className="text-[#4edea3] font-bold">Wed 08:30 AM</strong>
                </div>
              )}
              <div>
                Weekday sync: <span className="text-[#e3e2e8] font-semibold">82%</span>
              </div>
            </div>
          </div>

          {/* WIDGET 4: Ask AI Chat / Copilot (Fully Interactive at line 1059) */}
          <div className="rounded-xl bg-[#1a1b20]/90 backdrop-blur-xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] flex flex-col gap-3 border border-[#292a2e]/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ffdad2] text-[20px]">chat</span>
                <span className="font-space text-base text-[#e3e2e8] font-bold">
                  Ask AI Chat
                </span>
              </div>
              <button
                onClick={() => setActiveSection('ai-chat')}
                className="text-[11px] font-space text-[#ffb4a3] hover:text-[#ffdad2] transition-colors flex items-center gap-0.5 cursor-pointer"
              >
                <span>Full Chat View</span>
                <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
              </button>
            </div>

            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => handleAskCopilot('Why did compliance dip?')}
                className="px-2.5 py-1 rounded-lg bg-[#292a2e] hover:bg-[#343439] text-[#cbc3d7] hover:text-[#e3e2e8] font-space text-[11px] transition-colors text-left cursor-pointer"
              >
                Why did compliance dip?
              </button>
              <button
                onClick={() => handleAskCopilot("Summarize Alexander's log")}
                className="px-2.5 py-1 rounded-lg bg-[#292a2e] hover:bg-[#343439] text-[#cbc3d7] hover:text-[#e3e2e8] font-space text-[11px] transition-colors text-left cursor-pointer"
              >
                Summarize Alexander&apos;s log
              </button>
              <button
                onClick={() => handleAskCopilot('Show upsell candidates')}
                className="px-2.5 py-1 rounded-lg bg-[#292a2e] hover:bg-[#343439] text-[#cbc3d7] hover:text-[#e3e2e8] font-space text-[11px] transition-colors text-left cursor-pointer"
              >
                Show upsell candidates
              </button>
            </div>

            {/* Interactive Chat Stream */}
            <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-1 py-1">
              {copilotHistory.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg text-xs leading-relaxed transition-all ${
                    item.role === 'user'
                      ? 'bg-[#292a2e]/60 border border-[#292a2e] text-[#ffdad2] self-end max-w-[88%]'
                      : 'bg-[#0d0e12] border border-[#ffb4a3]/40 text-[#cbc3d7]'
                  }`}
                >
                  <div className="flex items-center justify-between font-space text-[10px] text-[#958ea0] mb-1">
                    <span className="font-bold text-[#ffb690] uppercase">
                      {item.role === 'user' ? 'Coach Vance' : 'Cadence AI'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span>{item.time}</span>
                      {item.role === 'assistant' && (
                        <button
                          onClick={() => handleCopyText(item.text, idx)}
                          className="hover:text-white cursor-pointer ml-1"
                          title="Copy response"
                        >
                          <span className="material-symbols-outlined text-[13px]">
                            {copiedCopilotIndex === idx ? 'check' : 'content_copy'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div>{item.text}</div>
                </div>
              ))}

              {isCopilotThinking && (
                <div className="p-3 rounded-lg bg-[#0d0e12] border border-[#ffb4a3]/40 flex items-center gap-2 text-xs text-[#ffdad2]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4a3] animate-ping" />
                  <span className="font-space text-[11px]">Analyzing telemetry patterns...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="relative flex items-center mt-1">
              <label htmlFor={copilotInputId} className="sr-only">Type prompt or /prescribe...</label>
              <input
                id={copilotInputId}
                type="text"
                placeholder="Ask AI anything about clients or telemetry..."
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAskCopilot();
                }}
                className="w-full bg-[#0d0e12] text-[#e3e2e8] placeholder:text-[#958ea0] py-2.5 pl-3 pr-10 rounded-lg border border-[#292a2e]/50 focus:outline-none focus:ring-1 focus:ring-[#ffdad2] font-sans text-xs shadow-inner"
              />
              <button
                onClick={() => handleAskCopilot()}
                disabled={!copilotInput.trim() || isCopilotThinking}
                className="absolute right-1.5 p-1.5 rounded-md bg-[#ffb4a3] text-[#3a0900] hover:bg-[#ffdad2] disabled:opacity-40 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] block">send</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL 1: CLIENT TELEMETRY HUD DOSSIER ── */}
      {selectedTelemetryClient && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedTelemetryClient(null)}
        >
          <div
            className="w-full max-w-lg bg-[#141519] border border-[#ffb4a3]/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#1a1b20] border-b border-[#292a2e]/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-space text-sm font-bold ${
                    selectedTelemetryClient.riskStatus === 'dark'
                      ? 'bg-[#ec6a06]/20 text-[#ffb690]'
                      : selectedTelemetryClient.riskStatus === 'plateau'
                      ? 'bg-[#ffb4a3]/20 text-[#ffdad2]'
                      : 'bg-[#4edea3]/20 text-[#4edea3]'
                  }`}
                >
                  {selectedTelemetryClient.initials}
                </div>
                <div>
                  <h3 className="font-space text-base font-bold text-[#e3e2e8]">
                    {selectedTelemetryClient.name}
                  </h3>
                  <div className="text-xs text-[#958ea0] font-sans">
                    {selectedTelemetryClient.focus} • {selectedTelemetryClient.tierLabel}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedTelemetryClient(null)}
                className="p-1 rounded-lg text-[#958ea0] hover:text-[#e3e2e8] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body: Biometrics HUD */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[#0d0e12] border border-[#292a2e]/60 text-center">
                  <span className="text-[10px] text-[#958ea0] font-space uppercase">Compliance</span>
                  <div className="text-lg font-space font-bold text-[#e3e2e8] mt-0.5">
                    {selectedTelemetryClient.compliance}%
                  </div>
                  <span className="text-[10px] text-[#4edea3] font-mono font-semibold">
                    {selectedTelemetryClient.complianceLabel}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#0d0e12] border border-[#292a2e]/60 text-center">
                  <span className="text-[10px] text-[#958ea0] font-space uppercase">Retainer</span>
                  <div className="text-lg font-space font-bold text-[#ffdad2] mt-0.5">
                    {selectedTelemetryClient.monthlyRetainer}
                  </div>
                  <span className="text-[10px] text-[#958ea0] font-mono">Auto-debit</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0d0e12] border border-[#292a2e]/60 text-center">
                  <span className="text-[10px] text-[#958ea0] font-space uppercase">Status</span>
                  <div className="text-lg font-space font-bold text-[#e3e2e8] mt-0.5 capitalize">
                    {selectedTelemetryClient.riskStatus}
                  </div>
                  <span className="text-[10px] text-[#ffb690] font-mono">
                    {selectedTelemetryClient.statusBeacon}
                  </span>
                </div>
              </div>

              {/* Biomarker details */}
              <div className="p-4 rounded-xl bg-[#0d0e12] border border-[#292a2e]/60 space-y-2">
                <span className="text-xs font-space font-bold text-[#e3e2e8] block">
                  Biometric Telemetry Snapshot
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#292a2e]/40">
                    <span className="text-[#958ea0]">Fasting Glucose:</span>
                    <span className="font-mono text-[#e3e2e8] font-bold">92 mg/dL (CGM)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#292a2e]/40">
                    <span className="text-[#958ea0]">Recovery HRV:</span>
                    <span className="font-mono text-[#4edea3] font-bold">68 ms (+4ms)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#292a2e]/40">
                    <span className="text-[#958ea0]">Sleep Duration:</span>
                    <span className="font-mono text-[#e3e2e8] font-bold">7h 42m (91%)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#292a2e]/40">
                    <span className="text-[#958ea0]">Last Check-in:</span>
                    <span className="font-mono text-[#ffb690] font-bold">Today, 08:15 AM</span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    handleLaunchVideoCall(selectedTelemetryClient);
                    setSelectedTelemetryClient(null);
                    showToast(`Launching video call with ${selectedTelemetryClient.name}`);
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#292a2e] hover:bg-[#343439] text-xs font-space font-semibold text-[#e3e2e8] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#ffdad2]">videocam</span>
                  <span>Direct Video Call</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedRecipient(selectedTelemetryClient.name);
                    setSelectedTelemetryClient(null);
                    showToast(`Drafting protocol for ${selectedTelemetryClient.name}`);
                    setActiveSection('prescriptive-studio');
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#ffb4a3] text-[#3a0900] hover:bg-[#ffdad2] text-xs font-space font-bold flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(255,180,163,0.35)] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  <span>Prescribe Protocol</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: NEW RETAINER QUICK DRAFT ── */}
      {showNewRetainerModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowNewRetainerModal(false)}
        >
          <div
            className="w-full max-w-md bg-[#141519] border border-[#ffb4a3]/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-[#1a1b20] border-b border-[#292a2e]/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ffb4a3] text-[20px]">add_circle</span>
                <h3 className="font-space text-base font-bold text-[#e3e2e8]">
                  Draft New Retainer
                </h3>
              </div>
              <button
                onClick={() => setShowNewRetainerModal(false)}
                className="p-1 rounded-lg text-[#958ea0] hover:text-[#e3e2e8] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateNewRetainer} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[#958ea0] font-space font-semibold mb-1">
                  Select Client
                </label>
                <select
                  value={newRetainerClientName}
                  onChange={(e) => setNewRetainerClientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0d0e12] border border-[#292a2e] text-[#e3e2e8] font-space outline-none focus:border-[#ffdad2]"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.tierLabel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#958ea0] font-space font-semibold mb-1">
                  Retainer Tier
                </label>
                <select
                  value={newRetainerTier}
                  onChange={(e) => {
                    const tier = e.target.value;
                    setNewRetainerTier(tier);
                    if (tier.includes('Tier 1')) setNewRetainerFee(1800);
                    else if (tier.includes('Tier 2')) setNewRetainerFee(1200);
                    else setNewRetainerFee(650);
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-[#0d0e12] border border-[#292a2e] text-[#e3e2e8] font-space outline-none focus:border-[#ffdad2]"
                >
                  <option value="Tier 1 Protocol">Tier 1 Protocol ($1,800/mo - CGM &amp; Labs)</option>
                  <option value="Tier 2 Hypertrophy">Tier 2 Hypertrophy ($1,200/mo - Weekly HUD)</option>
                  <option value="Tier 3 Periodization">Tier 3 Periodization ($650/mo - Macro Sync)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#958ea0] font-space font-semibold mb-1">
                  Monthly Retainer Fee ($ USD)
                </label>
                <input
                  type="number"
                  value={newRetainerFee}
                  onChange={(e) => setNewRetainerFee(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[#0d0e12] border border-[#292a2e] text-base font-bold font-space text-[#e3e2e8] outline-none focus:border-[#ffdad2]"
                  required
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewRetainerModal(false)}
                  className="flex-1 py-2 rounded-xl bg-[#292a2e] text-[#cbc3d7] font-space text-xs font-semibold cursor-pointer hover:bg-[#343439] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#ffb4a3] text-[#3a0900] font-space text-xs font-bold shadow-[0_0_12px_rgba(255,180,163,0.35)] hover:bg-[#ffdad2] transition-colors cursor-pointer"
                >
                  Create &amp; Prescribe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
