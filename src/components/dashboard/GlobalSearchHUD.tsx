import { useState, useEffect, useRef } from 'react';
import type { ClientEntry, NavSection } from '../../types/dashboard';

interface GlobalSearchHUDProps {
  clients: ClientEntry[];
  onNavigateSection: (section: NavSection) => void;
  onSelectClient?: (clientName: string) => void;
  onExportCSV?: () => void;
  onCopyInviteLink?: () => void;
}

interface ActionItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  category: 'navigation' | 'action';
  section?: NavSection;
  action?: () => void;
}

const NAV_ACTIONS: ActionItem[] = [
  { id: 'nav-overview', title: 'Dashboard Overview', subtitle: 'Live telemetry, MRR cards & momentum chart', icon: 'dashboard', category: 'navigation', section: 'overview' },
  { id: 'nav-roster', title: 'Client Roster', subtitle: '28 active retainers, tier distribution & approvals', icon: 'group', category: 'navigation', section: 'client-roster' },
  { id: 'nav-retainers', title: 'Retainers & Subscriptions', subtitle: 'Stripe auto-debit agreements, MRR & client tiers', icon: 'credit_card', category: 'navigation', section: 'stripe-billing' },
  { id: 'nav-meetings', title: '1-on-1 Meetings', subtitle: 'Encrypted video strategy sessions & schedule', icon: 'video_call', category: 'navigation', section: 'meetings' },
  { id: 'nav-tasks', title: 'Coach Task Board', subtitle: 'Personal to-dos & client action items', icon: 'check_box', category: 'navigation', section: 'tasks' },
  { id: 'nav-documents', title: 'Contracts & Documents', subtitle: 'Client agreements, proposals & signed PDFs', icon: 'description', category: 'navigation', section: 'documents' },
  { id: 'nav-settings', title: 'System Settings', subtitle: 'Profile, coaching defaults, Stripe & credentials', icon: 'settings', category: 'navigation', section: 'settings' },
  { id: 'nav-radar', title: 'Anti-Churn Radar', subtitle: 'Early drop-off signals & dark telemetry alerts', icon: 'radar', category: 'navigation', section: 'anti-churn-radar' },
  { id: 'nav-studio', title: 'Prescriptive Studio', subtitle: 'Caloric shifts, macro protocols & AI plans', icon: 'stylus', category: 'navigation', section: 'prescriptive-studio' },
  { id: 'nav-video', title: 'Video Studio', subtitle: 'High-definition 1-on-1 strategy sessions', icon: 'videocam', category: 'navigation', section: 'video-studio' },
  { id: 'nav-queue', title: 'Check-in Queue', subtitle: 'Pending weekly reviews & client telemetry updates', icon: 'pending_actions', category: 'navigation', section: 'check-in-queue' },
  { id: 'nav-ai', title: 'AI Messenger & Copilot', subtitle: 'Cadence copilot, client chat & protocol push', icon: 'smart_toy', category: 'navigation', section: 'ai-messenger' },
  { id: 'nav-aichat', title: 'AI Chat Intelligence', subtitle: 'Consult Cadence AI on protocols, re-engagement & clinical questions', icon: 'auto_awesome', category: 'navigation', section: 'ai-chat' },
];

export default function GlobalSearchHUD({
  clients,
  onNavigateSection,
  onSelectClient,
  onExportCSV,
  onCopyInviteLink,
}: GlobalSearchHUDProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
        inputRef.current?.select();
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Click outside to close (without any full-screen black backdrop)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const quickActions: ActionItem[] = [
    {
      id: 'act-export',
      title: 'Export Telemetry to CSV',
      subtitle: 'Download 28 active client telemetry records',
      icon: 'ios_share',
      category: 'action',
      action: () => {
        if (onExportCSV) onExportCSV();
        else alert('Exporting 28 client telemetry records to CSV...');
      },
    },
    {
      id: 'act-invite',
      title: 'Copy Direct Intake Link',
      subtitle: 'Share onboarding link with athlete or client',
      icon: 'content_copy',
      category: 'action',
      action: () => {
        if (onCopyInviteLink) onCopyInviteLink();
        else {
          navigator.clipboard?.writeText(`${window.location.origin}/#signup`);
          alert('Client invite link copied to clipboard!');
        }
      },
    },
    {
      id: 'act-new-retainer',
      title: 'Create New Client Retainer',
      subtitle: 'Launch prescriptive studio for a new athlete',
      icon: 'add_circle',
      category: 'action',
      section: 'prescriptive-studio',
    },
  ];

  const lowerQuery = query.toLowerCase().trim();

  // Filter Clients
  const matchedClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.focus.toLowerCase().includes(lowerQuery) ||
      c.tierLabel.toLowerCase().includes(lowerQuery) ||
      c.riskStatus.toLowerCase().includes(lowerQuery)
  );

  // Filter Navigation
  const matchedNav = NAV_ACTIONS.filter(
    (item) =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.subtitle.toLowerCase().includes(lowerQuery)
  );

  // Filter Actions
  const matchedActions = quickActions.filter(
    (item) =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.subtitle.toLowerCase().includes(lowerQuery)
  );

  interface CombinedItem {
    type: 'client' | 'nav' | 'action';
    data: any;
  }

  const flattenedList: CombinedItem[] = [
    ...matchedClients.slice(0, 4).map((c) => ({ type: 'client' as const, data: c })),
    ...matchedNav.slice(0, 4).map((n) => ({ type: 'nav' as const, data: n })),
    ...matchedActions.slice(0, 2).map((a) => ({ type: 'action' as const, data: a })),
  ];

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (flattenedList.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev <= 0 ? (flattenedList.length || 1) - 1 : prev - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = flattenedList[selectedIndex];
      if (current) {
        executeItem(current);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const executeItem = (item: CombinedItem) => {
    if (item.type === 'client') {
      const client = item.data as ClientEntry;
      if (onSelectClient) onSelectClient(client.name);
      onNavigateSection('client-roster');
    } else if (item.type === 'nav') {
      const nav = item.data as ActionItem;
      if (nav.section) onNavigateSection(nav.section);
    } else if (item.type === 'action') {
      const act = item.data as ActionItem;
      if (act.action) act.action();
      else if (act.section) onNavigateSection(act.section);
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* ── HEADER SEARCH INPUT BAR (ALWAYS IN PLACE) ── */}
      <div
        className={`flex items-center rounded-lg px-3 py-1.5 gap-2 w-64 sm:w-72 border transition-all ${
          isOpen
            ? 'bg-[#202127] border-[#ffb4a3]/60 shadow-[0_0_12px_rgba(255,180,163,0.18)]'
            : 'bg-[#1a1b20] border-[#292a2e]/60 hover:border-[#292a2e]'
        }`}
      >
        <span className="material-symbols-outlined text-[#958ea0] text-[18px]">search</span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Quick search HUD..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleInputKeyDown}
          className="bg-transparent text-[#e3e2e8] placeholder:text-[#958ea0] focus:outline-none text-xs w-full font-sans"
        />
        {query ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setQuery('');
              inputRef.current?.focus();
            }}
            className="text-[#958ea0] hover:text-[#e3e2e8] p-0.5 rounded transition-colors cursor-pointer shrink-0"
            title="Clear search"
          >
            <span className="material-symbols-outlined text-[15px]">close</span>
          </button>
        ) : (
          <kbd
            onClick={() => {
              setIsOpen(true);
              inputRef.current?.focus();
            }}
            className="shrink-0 font-space text-[10px] text-[#958ea0] px-1.5 py-0.5 rounded bg-[#292a2e] font-semibold border border-[#343439] cursor-pointer"
          >
            {isMac ? '⌘K' : 'Ctrl K'}
          </kbd>
        )}
      </div>

      {/* ── ATTACHED DROPDOWN PALETTE (NO FULL-SCREEN BLACK BACKDROP) ── */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-[440px] max-w-[90vw] bg-[#1a1b20]/98 backdrop-blur-xl border border-[#292a2e] rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.8)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[460px]">
          {/* Results Area */}
          <div className="overflow-y-auto p-2 divide-y divide-[#292a2e]/30 scrollbar-thin scrollbar-thumb-[#292a2e]">
            {flattenedList.length === 0 ? (
              <div className="p-6 text-center text-[#958ea0] font-sans text-xs">
                <p className="font-space font-semibold text-[#e3e2e8]">No matches found</p>
                <p className="text-[11px] mt-0.5">Try searching for a client name or view.</p>
              </div>
            ) : (
              <>
                {/* GROUP 1: CLIENTS */}
                {matchedClients.length > 0 && (
                  <div className="py-1.5">
                    <div className="px-3 py-1 text-[10px] font-space font-bold uppercase tracking-wider text-[#ffb4a3] flex items-center justify-between">
                      <span>Clients ({matchedClients.length})</span>
                    </div>
                    <div className="mt-0.5 space-y-0.5">
                      {matchedClients.slice(0, 4).map((client) => {
                        const itemIndex = flattenedList.findIndex(
                          (x) => x.type === 'client' && x.data.id === client.id
                        );
                        const isSelected = itemIndex === selectedIndex;
                        return (
                          <div
                            key={client.id}
                            onClick={() => executeItem({ type: 'client', data: client })}
                            onMouseEnter={() => setSelectedIndex(itemIndex)}
                            className={`flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[#ffb4a3]/10 border border-[#ffb4a3]/40 text-[#e3e2e8]'
                                : 'hover:bg-[#25262c] text-[#cbc3d7]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-6 h-6 rounded-full bg-[#ffdad2] text-[#3a0900] flex items-center justify-center font-bold text-[11px] font-space shrink-0">
                                {client.initials}
                              </div>
                              <div className="min-w-0">
                                <div className="font-space font-semibold text-xs text-[#e3e2e8] truncate">
                                  {client.name}{' '}
                                  <span className="text-[10px] font-normal text-[#958ea0]">
                                    • {client.focus}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <span
                              className={`text-[9px] font-space font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                                client.riskStatus === 'healthy'
                                  ? 'bg-[#4edea3]/10 text-[#4edea3]'
                                  : client.riskStatus === 'plateau'
                                  ? 'bg-[#ec6a06]/10 text-[#ec6a06]'
                                  : 'bg-[#ff5449]/10 text-[#ff5449]'
                              }`}
                            >
                              {client.riskLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* GROUP 2: NAVIGATION */}
                {matchedNav.length > 0 && (
                  <div className="py-1.5">
                    <div className="px-3 py-1 text-[10px] font-space font-bold uppercase tracking-wider text-[#958ea0]">
                      Navigation Views
                    </div>
                    <div className="mt-0.5 space-y-0.5">
                      {matchedNav.slice(0, 4).map((nav) => {
                        const itemIndex = flattenedList.findIndex(
                          (x) => x.type === 'nav' && x.data.id === nav.id
                        );
                        const isSelected = itemIndex === selectedIndex;
                        return (
                          <div
                            key={nav.id}
                            onClick={() => executeItem({ type: 'nav', data: nav })}
                            onMouseEnter={() => setSelectedIndex(itemIndex)}
                            className={`flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[#ffb4a3]/10 border border-[#ffb4a3]/40 text-[#e3e2e8]'
                                : 'hover:bg-[#25262c] text-[#cbc3d7]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="material-symbols-outlined text-[17px] text-[#ffb4a3] shrink-0">
                                {nav.icon}
                              </span>
                              <span className="font-space font-semibold text-xs text-[#e3e2e8] truncate">
                                {nav.title}
                              </span>
                            </div>
                            <span className="material-symbols-outlined text-[13px] text-[#958ea0]">
                              arrow_forward
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* GROUP 3: ACTIONS */}
                {matchedActions.length > 0 && (
                  <div className="py-1.5">
                    <div className="px-3 py-1 text-[10px] font-space font-bold uppercase tracking-wider text-[#958ea0]">
                      Actions
                    </div>
                    <div className="mt-0.5 space-y-0.5">
                      {matchedActions.slice(0, 2).map((act) => {
                        const itemIndex = flattenedList.findIndex(
                          (x) => x.type === 'action' && x.data.id === act.id
                        );
                        const isSelected = itemIndex === selectedIndex;
                        return (
                          <div
                            key={act.id}
                            onClick={() => executeItem({ type: 'action', data: act })}
                            onMouseEnter={() => setSelectedIndex(itemIndex)}
                            className={`flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[#ffb4a3]/10 border border-[#ffb4a3]/40 text-[#e3e2e8]'
                                : 'hover:bg-[#25262c] text-[#cbc3d7]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="material-symbols-outlined text-[17px] text-[#4edea3] shrink-0">
                                {act.icon}
                              </span>
                              <span className="font-space font-semibold text-xs text-[#e3e2e8] truncate">
                                {act.title}
                              </span>
                            </div>
                            <span className="text-[9px] font-space text-[#958ea0] bg-[#0d0e12] px-1.5 py-0.5 rounded border border-[#292a2e]">
                              Action
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Hints */}
          <div className="p-2 border-t border-[#292a2e]/60 bg-[#121317] flex items-center justify-between text-[10px] font-space text-[#958ea0] px-3">
            <span>↑ ↓ navigate • ↵ select</span>
            <span>ESC close</span>
          </div>
        </div>
      )}
    </div>
  );
}
