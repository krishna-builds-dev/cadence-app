import React, { useState, useEffect, useRef } from 'react';
import type { ClientEntry, NavSection, MeetingItem } from '../../types/dashboard';
import defaultMeetingsData from '../../data/meetings.json';

interface ClientRosterSectionProps {
  clients: ClientEntry[];
  filteredClients: ClientEntry[];
  clientFilter: 'all' | 'approved' | 'waitlist' | 'unapproved';
  setClientFilter: (filter: 'all' | 'approved' | 'waitlist' | 'unapproved') => void;
  setClients: React.Dispatch<React.SetStateAction<ClientEntry[]>>;
  setSelectedRecipient: (name: string) => void;
  setActiveSection: (section: NavSection) => void;
  handleLaunchVideoCall: (client: ClientEntry) => void;
  setBillingModalClient: (client: ClientEntry | null) => void;
  setNewFeeValue: (fee: number) => void;
  meetings?: MeetingItem[];
  onAddMeeting?: (m: MeetingItem) => void;
  onUpdateMeeting?: (m: MeetingItem) => void;
  onDeleteMeeting?: (id: string) => void;
  selectedClientId?: string;
  setSelectedClientId?: (id: string) => void;
}

type ClientCategory = 'active' | 'spam';

export default function ClientRosterSection({
  clients,
  setClients,
  setSelectedRecipient,
  setActiveSection,
  handleLaunchVideoCall,
  setBillingModalClient,
  setNewFeeValue,
  meetings: propsMeetings,
  onAddMeeting,
  onUpdateMeeting,
  onDeleteMeeting,
  selectedClientId: propsSelectedClientId,
  setSelectedClientId: propsSetSelectedClientId,
}: ClientRosterSectionProps) {
  // Collapsible sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);


  // Edit Retainer Tier Name state (Card number is read-only via Stripe)
  const [editingTierClient, setEditingTierClient] = useState<ClientEntry | null>(null);
  const [newTierName, setNewTierName] = useState('');
  const [newFocusName, setNewFocusName] = useState('');

  const handleOpenTierEdit = (c: ClientEntry) => {
    setEditingTierClient(c);
    setNewTierName(c.tierLabel || 'Tier 1 Protocol');
    setNewFocusName(c.focus || '');
  };

  const handleSaveTierName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTierClient) return;
    const tier = newTierName.trim() || editingTierClient.tierLabel;
    const focus = newFocusName.trim() || editingTierClient.focus;

    setClients((prev) =>
      prev.map((c) =>
        c.id === editingTierClient.id
          ? { ...c, tierLabel: tier, focus }
          : c
      )
    );
    setEditingTierClient(null);
  };

  // Category filter: strictly 'active' | 'spam'
  const [activeCategory, setActiveCategory] = useState<ClientCategory>('active');

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Selected client for Profile Info view
  // Default to first active client (c3 = Imran Sheikh) so the highlighted row is at the top on load
  const [internalSelectedClientId, setInternalSelectedClientId] = useState<string>('c3');
  const selectedClientId = propsSelectedClientId !== undefined ? propsSelectedClientId : internalSelectedClientId;
  const setSelectedClientId = propsSetSelectedClientId || setInternalSelectedClientId;

  // Auto-switch category and clear search when selectedClientId is explicitly requested (e.g. from Messages profile button)
  useEffect(() => {
    if (selectedClientId) {
      const match = clients.find((c) => c.id === selectedClientId);
      if (match) {
        setActiveCategory(getCategory(match));
      }
    }
  }, [selectedClientId, clients]);

  useEffect(() => {
    if (propsSelectedClientId) {
      setSearchQuery('');
    }
  }, [propsSelectedClientId]);

  // Auto-scroll the selected row into view when navigating from elsewhere (e.g. Messages profile button)
  const clientRowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  useEffect(() => {
    if (!selectedClientId) return;
    const node = clientRowRefs.current.get(selectedClientId);
    if (node) {
      node.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [selectedClientId]);

  // Profile detail tab for active clients
  const [profileTab, setProfileTab] = useState<'notes' | 'billing' | 'files' | 'meetings'>('notes');

  // Per-client file attachments — persisted to sessionStorage
  const SESSION_FILES_KEY = 'cadence_session_files';
  const DEFAULT_FILES: Record<string, { id: string; name: string; size: string; type: string; date: string; icon: string }[]> = {
    c3: [
      { id: 'f1', name: 'Onboarding Intake Form.pdf', size: '340 KB', type: 'pdf', date: 'Nov 10, 2026', icon: 'picture_as_pdf' },
      { id: 'f2', name: 'Blood Panel – Oct 2026.pdf', size: '1.2 MB', type: 'pdf', date: 'Oct 28, 2026', icon: 'picture_as_pdf' },
    ],
    c4: [
      { id: 'f3', name: 'Body Recomp Progress Photos.zip', size: '8.4 MB', type: 'zip', date: 'Nov 14, 2026', icon: 'folder_zip' },
      { id: 'f4', name: 'Dexa Scan Report.pdf', size: '2.1 MB', type: 'pdf', date: 'Nov 02, 2026', icon: 'picture_as_pdf' },
    ],
    c8: [
      { id: 'f5', name: 'Hypertrophy Program Phase 2.xlsx', size: '580 KB', type: 'sheet', date: 'Nov 12, 2026', icon: 'table_chart' },
      { id: 'f6', name: 'Weekly Check-In Video.mp4', size: '44 MB', type: 'video', date: 'Nov 15, 2026', icon: 'videocam' },
    ],
  };
  const getInitialFiles = () => {
    try {
      const stored = sessionStorage.getItem(SESSION_FILES_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT_FILES;
  };
  const [clientFiles, setClientFiles] = useState(getInitialFiles);
  useEffect(() => {
    try { sessionStorage.setItem(SESSION_FILES_KEY, JSON.stringify(clientFiles)); } catch {}
  }, [clientFiles]);

  // Per-client past & upcoming meetings — persisted to sessionStorage
  const SESSION_MEETINGS_KEY = 'cadence_session_meetings';
  const getInitialMeetings = (): MeetingItem[] => {
    try {
      const stored = sessionStorage.getItem(SESSION_MEETINGS_KEY);
      if (stored) return JSON.parse(stored) as MeetingItem[];
    } catch {}
    return defaultMeetingsData as MeetingItem[];
  };
  const [localMeetings, setLocalMeetings] = useState<MeetingItem[]>(getInitialMeetings);
  useEffect(() => {
    if (!propsMeetings) {
      try { sessionStorage.setItem(SESSION_MEETINGS_KEY, JSON.stringify(localMeetings)); } catch {}
    }
  }, [localMeetings, propsMeetings]);
  const allMeetings = propsMeetings ?? localMeetings;

  // Quick schedule meeting form state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newMeetingTitle, setNewMeetingTitle] = useState('1-on-1 Strategy & Check-In');
  const [newMeetingDate, setNewMeetingDate] = useState('Nov 20, 2026');
  const [newMeetingTime, setNewMeetingTime] = useState('11:00 AM');
  const [newMeetingDuration, setNewMeetingDuration] = useState('30 min');

  // Interactive client notes — persisted to sessionStorage
  const SESSION_NOTES_KEY = 'cadence_session_notes';
  const DEFAULT_NOTES: Record<string, { id: string; text: string; date: string }[]> = {
    c3: [
      { id: 'n1', text: 'Baseline established. Priority roadmap review scheduled for Thursday.', date: 'Nov 12, 2026' },
    ],
    c7: [
      { id: 'n2', text: 'Quarterly review completed. Retainer fee adjusted.', date: 'Nov 15, 2026' },
    ],
  };
  const getInitialNotes = () => {
    try {
      const stored = sessionStorage.getItem(SESSION_NOTES_KEY);
      if (stored) return JSON.parse(stored) as typeof DEFAULT_NOTES;
    } catch {}
    return DEFAULT_NOTES;
  };
  const [clientNotes, setClientNotes] = useState(getInitialNotes);

  // Persist notes to sessionStorage on every change
  useEffect(() => {
    try { sessionStorage.setItem(SESSION_NOTES_KEY, JSON.stringify(clientNotes)); } catch {}
  }, [clientNotes]);
  const [newNoteInput, setNewNoteInput] = useState('');



  // Helper to determine category: strictly 'active' or 'spam'
  const getCategory = (c: ClientEntry): ClientCategory => {
    if (c.clientType) return c.clientType;
    return c.status === 'unapproved' ? 'spam' : 'active';
  };

  // Counts
  const activeCount = clients.filter((c) => getCategory(c) === 'active').length;
  const spamCount = clients.filter((c) => getCategory(c) === 'spam').length;

  // Search & category filtered list
  const searchLower = searchQuery.toLowerCase().trim();
  const filteredList = clients.filter((c) => {
    const cat = getCategory(c);
    if (cat !== activeCategory) return false;

    if (!searchLower) return true;
    return (
      c.name.toLowerCase().includes(searchLower) ||
      (c.email && c.email.toLowerCase().includes(searchLower)) ||
      (c.company && c.company.toLowerCase().includes(searchLower)) ||
      (c.message && c.message.toLowerCase().includes(searchLower))
    );
  });

  // Resolve currently selected client
  const currentSelected =
    clients.find((c) => c.id === selectedClientId) ||
    filteredList[0] ||
    null;

  // Accept a client from Spam -> Moves directly to Active
  const handleAcceptClient = (clientId: string) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== clientId) return c;
        return {
          ...c,
          clientType: 'active',
          status: 'approved',
          statusBeacon: 'Active Retainer',
          riskStatus: 'healthy',
          riskLabel: 'Active Client',
          daysInactive: 0,
        };
      })
    );
    // Switch to active tab so coach sees accepted client immediately
    setActiveCategory('active');
    setSelectedClientId(clientId);
  };

  // Decline a client from Spam -> Dismisses and removes lead
  const handleDeclineClient = (clientId: string) => {
    setClients((prev) => prev.filter((c) => c.id !== clientId));
    if (selectedClientId === clientId) {
      setSelectedClientId('');
    }
  };

  // Move an active client to Spam
  const handleMoveToSpam = (clientId: string) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== clientId) return c;
        return {
          ...c,
          clientType: 'spam',
          status: 'unapproved',
          statusBeacon: 'Spam Lead',
        };
      })
    );
    setActiveCategory('spam');
    setSelectedClientId(clientId);
  };

  // Permanently delete a client (active or spam)
  const handleDeleteClient = (clientId: string) => {
    if (!window.confirm('Permanently remove this client? This cannot be undone.')) return;
    setClients((prev) => prev.filter((c) => c.id !== clientId));
    if (selectedClientId === clientId) setSelectedClientId('');
  };

  // Delete coaching note
  const handleDeleteNote = (clientId: string, noteId: string) => {
    setClientNotes((prev: Record<string, { id: string; text: string; date: string }[]>) => ({
      ...prev,
      [clientId]: (prev[clientId] || []).filter((n) => n.id !== noteId),
    }));
  };

  // Upload file for current client
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !currentSelected) return;
    const file = e.target.files[0];
    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    let icon = 'description';
    let type = 'file';
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') { icon = 'picture_as_pdf'; type = 'pdf'; }
    else if (['xls', 'xlsx', 'csv'].includes(ext || '')) { icon = 'table_chart'; type = 'sheet'; }
    else if (['zip', 'rar', '7z'].includes(ext || '')) { icon = 'folder_zip'; type = 'zip'; }
    else if (['mp4', 'mov', 'avi'].includes(ext || '')) { icon = 'videocam'; type = 'video'; }
    else if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) { icon = 'image'; type = 'image'; }

    const newFileObj = {
      id: 'f_' + Date.now(),
      name: file.name,
      size: sizeStr,
      type,
      date: 'Just now',
      icon,
    };

    setClientFiles((prev: Record<string, typeof newFileObj[]>) => ({
      ...prev,
      [currentSelected.id]: [newFileObj, ...(prev[currentSelected.id] || [])],
    }));
    e.target.value = '';
  };

  // Delete file
  const handleDeleteFile = (clientId: string, fileId: string) => {
    setClientFiles((prev: Record<string, { id: string; name: string; size: string; type: string; date: string; icon: string }[]>) => ({
      ...prev,
      [clientId]: (prev[clientId] || []).filter((f) => f.id !== fileId),
    }));
  };

  // Schedule new meeting
  const handleScheduleMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSelected) return;
    const newMeeting: MeetingItem = {
      id: 'mt_' + Date.now(),
      clientId: currentSelected.id,
      client: currentSelected.name,
      type: newMeetingTitle.trim() || '1-on-1 Strategy',
      date: newMeetingDate.trim() || 'Nov 20, 2026',
      time: newMeetingTime.trim() || '11:00 AM',
      duration: newMeetingDuration,
      status: 'upcoming',
      notes: 'Scheduled via client roster',
    };
    if (onAddMeeting) {
      onAddMeeting(newMeeting);
    } else {
      setLocalMeetings((prev) => [newMeeting, ...prev]);
    }
    setShowScheduleModal(false);
  };

  // Delete/cancel meeting
  const handleDeleteMeeting = (meetingId: string) => {
    if (onDeleteMeeting) {
      onDeleteMeeting(meetingId);
    } else {
      setLocalMeetings((prev) => prev.filter((m) => m.id !== meetingId));
    }
  };

  // Toggle status for meeting
  const handleToggleMeetingStatus = (m: MeetingItem) => {
    const updated: MeetingItem = {
      ...m,
      status: m.status === 'upcoming' ? 'completed' : 'upcoming',
    };
    if (onUpdateMeeting) {
      onUpdateMeeting(updated);
    } else {
      setLocalMeetings((prev) => prev.map((item) => item.id === m.id ? updated : item));
    }
  };

  // Add coaching note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteInput.trim() || !currentSelected) return;

    const newNote = {
      id: 'nt_' + Date.now(),
      text: newNoteInput.trim(),
      date: 'Just now',
    };

    setClientNotes((prev) => ({
      ...prev,
      [currentSelected.id]: [newNote, ...(prev[currentSelected.id] || [])],
    }));
    setNewNoteInput('');
  };


    return (
    <div className="rounded-2xl border border-[#292a2e]/60 bg-[#1a1b20] overflow-hidden flex flex-col md:flex-row h-full max-h-full shadow-2xl relative">
      {/* ── LEFT PANEL: CLIENTS NAMES (COLLAPSIBLE) ── */}
      <div
        className={`border-b md:border-b-0 md:border-r border-[#292a2e]/60 bg-[#141519] flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out ${
          isSidebarCollapsed
            ? 'w-0 md:w-0 overflow-hidden opacity-0 pointer-events-none'
            : 'w-full md:w-80 lg:w-96 flex-shrink-0 opacity-100'
        }`}
      >
        {/* Panel Header */}
        <div className="p-4 border-b border-[#292a2e]/60 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ffb4a3] text-[20px]">groups</span>
            <h2 className="font-space text-lg font-bold text-[#e3e2e8]">Clients Names</h2>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Collapse Button */}
            <button
              onClick={() => setIsSidebarCollapsed(true)}
              className="w-7 h-7 rounded-lg border border-[#292a2e] text-[#958ea0] hover:text-[#e3e2e8] hover:border-[#ffb4a3]/40 transition-colors cursor-pointer flex items-center justify-center flex-shrink-0"
              title="Collapse sidebar"
            >
              <span className="material-symbols-outlined text-[16px]">first_page</span>
            </button>
          </div>
        </div>

        {/* ── LABELS: ACTIVE & SPAM ONLY ── */}
        <div className="p-3 border-b border-[#292a2e]/40 flex-shrink-0">
          <div className="grid grid-cols-2 gap-1.5 bg-[#0d0e12] p-1 rounded-xl border border-[#292a2e]">
            {/* Active Tab */}
            <button
              onClick={() => {
                setActiveCategory('active');
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-space font-bold transition-all cursor-pointer ${
                activeCategory === 'active'
                  ? 'bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30 shadow-sm'
                  : 'text-[#958ea0] hover:text-[#e3e2e8]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#4edea3]" />
              <span>Active</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#4edea3]/20 text-[#4edea3]">
                {activeCount}
              </span>
            </button>

            {/* Spam Tab */}
            <button
              onClick={() => {
                setActiveCategory('spam');
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-space font-bold transition-all cursor-pointer ${
                activeCategory === 'spam'
                  ? 'bg-[#ec6a06]/15 text-[#ff8a74] border border-[#ec6a06]/40 shadow-sm'
                  : 'text-[#958ea0] hover:text-[#e3e2e8]'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">how_to_reg</span>
              <span>Spam</span>
              {spamCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#ec6a06]/30 text-[#ff8a74]">
                  {spamCount}
                </span>
              )}
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex items-center mt-3">
            <span className="material-symbols-outlined absolute left-3 text-[#958ea0] text-[16px] pointer-events-none">
              search
            </span>
            <input
              type="text"
              placeholder={activeCategory === 'active' ? 'Search active clients...' : 'Search spam by email/message...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1e1f25] border border-[#292a2e] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#e3e2e8] placeholder-[#958ea0]/70 focus:outline-none focus:border-[#ffb4a3] transition-colors"
            />
          </div>
        </div>

        {/* Client Items List */}
        <div
          className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#292a2e transparent' }}
        >
          {filteredList.map((c) => {
            const isSelected = currentSelected?.id === c.id;
            const isSpam = activeCategory === 'spam';

            return (
              <div
                key={c.id}
                ref={(el) => {
                  if (el) clientRowRefs.current.set(c.id, el);
                  else clientRowRefs.current.delete(c.id);
                }}
                onClick={() => setSelectedClientId(c.id)}
                className={`group/row w-full text-left p-3 rounded-xl transition-all cursor-pointer border ${
                  isSelected
                    ? isSpam
                      ? 'bg-[#ec6a06]/10 border-[#ec6a06]/40 shadow-sm'
                      : 'bg-[#ffb4a3]/12 border-[#ffb4a3]/40 shadow-sm'
                    : 'hover:bg-[#1f2026] border-transparent'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Initials Avatar */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-space font-bold text-xs flex-shrink-0 transition-colors ${
                      isSpam
                        ? 'bg-[#ec6a06]/20 text-[#ff8a74]'
                        : isSelected
                        ? 'bg-[#ffb4a3] text-[#3a0900]'
                        : 'bg-[#292a2e] text-[#958ea0]'
                    }`}
                  >
                    {c.initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-space font-bold text-xs text-[#e3e2e8] truncate">
                        {isSpam ? c.email || c.name : c.name}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {isSpam ? (
                          <span className="text-[9px] font-space font-bold px-1.5 py-0.2 rounded border bg-[#ec6a06]/10 text-[#ff8a74] border-[#ec6a06]/30">
                            Spam
                          </span>
                        ) : (
                          <span className="text-[9px] font-space font-bold px-1.5 py-0.2 rounded border bg-[#4edea3]/10 text-[#4edea3] border-[#4edea3]/30">
                            Active
                          </span>
                        )}
                        {/* Delete button — visible on hover */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteClient(c.id); }}
                          className="w-5 h-5 rounded flex items-center justify-center text-[#958ea0] hover:text-[#ff5449] hover:bg-[#ff5449]/15 transition-colors cursor-pointer opacity-0 group-hover/row:opacity-100"
                          title="Remove client"
                        >
                          <span className="material-symbols-outlined text-[13px]">delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Email / Message preview */}
                    <div className="text-[11px] text-[#958ea0] font-sans truncate mt-0.5">
                      {isSpam ? (c.message || 'Signup lead (no message)') : (c.company || c.email)}
                    </div>

                    {/* Quick Accept / Decline Action buttons if in Spam */}
                    {isSpam && (
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#292a2e]/40" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleAcceptClient(c.id)}
                          className="flex-1 h-7 flex items-center justify-center gap-1 rounded bg-[#4edea3]/20 hover:bg-[#4edea3]/30 text-[#4edea3] text-[10px] font-space font-bold transition-colors cursor-pointer"
                          title="Accept client"
                        >
                          <span className="material-symbols-outlined text-[13px]">check</span>
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => handleDeclineClient(c.id)}
                          className="flex-1 h-7 flex items-center justify-center gap-1 rounded bg-[#ff5449]/15 hover:bg-[#ff5449]/25 text-[#ff5449] text-[10px] font-space font-bold transition-colors cursor-pointer"
                          title="Decline lead"
                        >
                          <span className="material-symbols-outlined text-[13px]">close</span>
                          <span>Decline</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredList.length === 0 && (
            <div className="py-16 text-center text-xs text-[#958ea0] font-space">
              {activeCategory === 'active' ? 'No active clients found' : 'No spam signup inquiries'}
            </div>
          )}
        </div>
      </div>

      {/* ── VERTICAL DIVIDER COLLAPSE/EXPAND TOGGLE (ON BORDER) ── */}
      <button
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className={`hidden md:flex absolute top-6 z-20 w-5 h-8 rounded-r border border-l-0 border-[#292a2e] bg-[#141519] hover:bg-[#1e1f25] hover:border-[#ffb4a3]/60 text-[#958ea0] hover:text-[#ffdad2] items-center justify-center cursor-pointer shadow transition-all ${
          isSidebarCollapsed ? 'left-0' : 'left-80 lg:left-96'
        }`}
        title={isSidebarCollapsed ? 'Expand Clients directory' : 'Collapse Clients directory'}
      >
        <span className="material-symbols-outlined text-[14px]">
          {isSidebarCollapsed ? 'chevron_right' : 'chevron_left'}
        </span>
      </button>

      {/* ── RIGHT PANEL: PROFILE INFO ── */}
      {currentSelected ? (
        <div className="flex-1 flex flex-col bg-[#0d0e12] overflow-hidden min-w-0">
          {/* Header Banner - Fixed */}
          <div className="px-5 py-3.5 border-b border-[#292a2e]/60 bg-[#141519]/90 backdrop-blur-md flex-shrink-0 z-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Client identity */}
              <div className="flex items-center gap-3.5">
                {/* Expand Directory Pill when collapsed */}
                {isSidebarCollapsed && (
                  <button
                    onClick={() => setIsSidebarCollapsed(false)}
                    className="h-8 px-2.5 rounded-lg border border-[#292a2e] bg-[#141519] hover:bg-[#1e1f25] hover:border-[#ffb4a3]/50 text-xs font-space font-medium text-[#ffdad2] flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
                    title="Show Clients List"
                  >
                    <span className="material-symbols-outlined text-[16px]">dock_to_right</span>
                    <span className="hidden sm:inline">Clients ({activeCategory === 'active' ? activeCount : spamCount})</span>
                  </button>
                )}

                <div
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center font-space font-bold text-base flex-shrink-0 shadow-md ${
                    activeCategory === 'spam'
                      ? 'bg-[#ec6a06]/20 border-[#ec6a06]/40 text-[#ff8a74]'
                      : 'bg-[#ffb4a3]/20 border-[#ffb4a3]/40 text-[#ffdad2]'
                  }`}
                >
                  {currentSelected.initials}
                </div>

                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="font-space text-xl font-bold text-[#e3e2e8]">
                      {activeCategory === 'spam' ? (currentSelected.email || currentSelected.name) : currentSelected.name}
                    </h1>
                    {activeCategory === 'spam' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-space font-bold uppercase bg-[#ec6a06]/15 text-[#ff8a74] border border-[#ec6a06]/30 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">how_to_reg</span>
                        <span>Spam (Signup Inquiry)</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-space font-bold uppercase bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]" />
                        <span>Active Client</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#958ea0] font-sans mt-0.5">
                    {activeCategory === 'spam'
                      ? 'Inquiry received through site signup / login form'
                      : currentSelected.company}
                  </p>

                  <div className="flex items-center gap-3 mt-1.5 text-xs text-[#958ea0] font-sans flex-wrap">
                    {currentSelected.email && (
                      <span className="flex items-center gap-1 text-[#ffdad2]">
                        <span className="material-symbols-outlined text-[13px]">mail</span>
                        <span>{currentSelected.email}</span>
                      </span>
                    )}
                    
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">schedule</span>
                      <span>Last active: {currentSelected.lastActive}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons depending on category */}
              <div className="flex items-center gap-2 flex-wrap">
                {activeCategory === 'spam' ? (
                  <>
                    {/* Accept button */}
                    <button
                      onClick={() => handleAcceptClient(currentSelected.id)}
                      className="h-8 px-3.5 rounded-lg bg-[#4edea3] text-[#0d0e12] font-space font-bold text-xs hover:bg-[#6ef0b9] transition-colors cursor-pointer flex items-center gap-1.5 shadow-[0_0_12px_rgba(78,222,163,0.3)] flex-shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>Accept Client</span>
                    </button>

                    {/* Decline button */}
                    <button
                      onClick={() => handleDeclineClient(currentSelected.id)}
                      className="h-8 px-3 rounded-lg border border-[#ff5449]/30 bg-[#ff5449]/10 hover:bg-[#ff5449]/20 text-[#ff5449] font-space font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px]">cancel</span>
                      <span>Decline</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* Launch 1-on-1 Call */}
                    <button
                      onClick={() => handleLaunchVideoCall(currentSelected)}
                      className="h-8 px-3 rounded-lg bg-[#ffb4a3] text-[#3a0900] font-space font-bold text-xs hover:bg-[#ffdad2] transition-colors cursor-pointer flex items-center gap-1.5 shadow-[0_0_12px_rgba(255,180,163,0.3)] flex-shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px]">videocam</span>
                      <span>Launch Call</span>
                    </button>

                    {/* Message Client */}
                    <button
                      onClick={() => {
                        setSelectedRecipient(currentSelected.name);
                        setActiveSection('ai-messenger');
                      }}
                      className="h-8 px-3 rounded-lg border border-[#292a2e] bg-[#141519] hover:bg-[#1f2026] hover:border-[#ffb4a3]/40 text-[#e3e2e8] font-space font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px]">chat</span>
                      <span>Message</span>
                    </button>

                    {/* Retainer Settings */}
                    <button
                      onClick={() => {
                        setBillingModalClient(currentSelected);
                        setNewFeeValue(currentSelected.monthlyFeeNum);
                      }}
                      className="h-8 px-3 rounded-lg border border-[#292a2e] bg-[#141519] hover:bg-[#1f2026] hover:border-[#ffb4a3]/40 text-[#e3e2e8] font-space font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px]">payments</span>
                      <span>Retainer</span>
                    </button>

                    {/* Move to Spam Option */}
                    <button
                      onClick={() => handleMoveToSpam(currentSelected.id)}
                      className="h-8 px-2.5 rounded-lg border border-[#292a2e] bg-[#141519] hover:bg-[#ff5449]/15 hover:border-[#ff5449]/40 text-[#958ea0] hover:text-[#ff5449] text-xs font-space font-medium flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
                      title="Move client to Spam"
                    >
                      <span className="material-symbols-outlined text-[15px]">report</span>
                      <span>Move to Spam</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── SPAM VIEW: STRICTLY EMAIL & OPTIONAL MESSAGE FROM SIGNUP/LOGIN ── */}
          {activeCategory === 'spam' ? (
            <div
              className="p-6 space-y-5 flex-1 overflow-y-auto min-h-0"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#292a2e transparent' }}
            >
              {/* Inquiry Details Card */}
              <div className="p-5 rounded-2xl bg-[#141519] border border-[#ec6a06]/30 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#292a2e]/60">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#ff8a74] text-[20px]">how_to_reg</span>
                    <div>
                      <h3 className="font-space font-bold text-sm text-[#e3e2e8]">
                        Signup / Contact Lead Details
                      </h3>
                      <p className="text-[11px] text-[#958ea0] font-sans">
                        Submitted through site login/signup intake
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-space font-bold text-[#ff8a74] bg-[#ec6a06]/15 px-2.5 py-0.5 rounded-full border border-[#ec6a06]/30">
                    Pending Decision
                  </span>
                </div>

                {/* 2 Fields: Email & Optional Message */}
                <div className="space-y-4">
                  {/* Field 1: Email */}
                  <div>
                    <label className="text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] block mb-1">
                      Email Address:
                    </label>
                    <div className="p-3 rounded-xl bg-[#0d0e12] border border-[#292a2e]/60 text-sm font-space text-[#e3e2e8] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#ffdad2] text-[16px]">alternate_email</span>
                      <span>{currentSelected.email || currentSelected.name}</span>
                    </div>
                  </div>

                  {/* Field 2: Message (Optional) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0]">
                        Message:
                      </label>
                      <span className="text-[10px] text-[#958ea0] font-sans italic">Optional</span>
                    </div>
                    <div className="p-4 rounded-xl bg-[#0d0e12] border border-[#292a2e]/60 text-xs text-[#cbc3d7] font-sans leading-relaxed whitespace-pre-line min-h-[90px]">
                      {currentSelected.message ? (
                        currentSelected.message
                      ) : (
                        <span className="text-[#958ea0] italic">No additional message provided with signup.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Accept / Decline Action Bar */}
                <div className="p-4 rounded-xl bg-[#0d0e12] border border-[#292a2e]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-space font-bold text-[#e3e2e8] block">
                      Choose to Accept or Decline this client:
                    </span>
                    <span className="text-[11px] text-[#958ea0] font-sans">
                      Accepting moves this client to your Active list and activates their coaching portal.
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAcceptClient(currentSelected.id)}
                      className="h-8 px-4 rounded-xl bg-[#4edea3] text-[#0d0e12] font-space font-bold text-xs hover:bg-[#6ef0b9] transition-colors cursor-pointer shadow-[0_0_12px_rgba(78,222,163,0.3)] flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[15px]">check</span>
                      <span>Accept Client</span>
                    </button>
                    <button
                      onClick={() => handleDeclineClient(currentSelected.id)}
                      className="h-8 px-4 rounded-xl bg-[#292a2e] hover:bg-[#343439] text-[#ff5449] font-space font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[15px]">close</span>
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ── ACTIVE CLIENT VIEW (NOTES & BILLING ONLY) ── */
            <>
              {/* Clean Telemetry Cards for Active Clients - Fixed */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 px-5 pt-3 pb-1 flex-shrink-0 bg-[#0d0e12]">
                <div className="px-3.5 py-2.5 rounded-xl bg-[#141519] border border-[#292a2e]/60">
                  <span className="text-[10px] font-space uppercase text-[#958ea0] tracking-wider block">
                    Monthly Retainer
                  </span>
                  <span className="text-lg font-space font-bold text-[#e3e2e8] mt-0.5 block">
                    {currentSelected.monthlyRetainer}
                  </span>
                  <span className="text-[10px] text-[#4edea3] font-sans flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[12px]">check_circle</span>
                    <span>Subscription Active</span>
                  </span>
                </div>

                <div
                  onClick={() => handleOpenTierEdit(currentSelected)}
                  className="px-3.5 py-2.5 rounded-xl bg-[#141519] border border-[#292a2e]/60 hover:border-[#ffb4a3]/60 transition-all cursor-pointer group/tier relative shadow-sm"
                  title="Click to edit Retainer Tier Name"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-space uppercase text-[#958ea0] tracking-wider block">
                      Retainer Tier
                    </span>
                    <span className="material-symbols-outlined text-[13px] text-[#958ea0] group-hover/tier:text-[#ffb4a3] transition-colors">
                      edit
                    </span>
                  </div>
                  <span className="text-sm font-space font-bold text-[#ffdad2] mt-0.5 block truncate group-hover/tier:text-white">
                    {currentSelected.tierLabel}
                  </span>
                  <span className="text-[10px] text-[#958ea0] font-sans flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[10px] text-[#958ea0]">lock</span>
                    <span>{currentSelected.cardLast4 ? `Card ending in •••• ${currentSelected.cardLast4}` : 'No card on file'}</span>
                  </span>
                </div>

                <div className="px-3.5 py-2.5 rounded-xl bg-[#141519] border border-[#292a2e]/60">
                  <span className="text-[10px] font-space uppercase text-[#958ea0] tracking-wider block">
                    Account Status
                  </span>
                  <span className="text-sm font-space font-bold text-[#e3e2e8] mt-0.5 block">
                    {currentSelected.statusBeacon}
                  </span>
                  <span className="text-[10px] text-[#958ea0] font-sans block mt-0.5">
                    Next: {currentSelected.nextBilling}
                  </span>
                </div>

                <div className="px-3.5 py-2.5 rounded-xl bg-[#141519] border border-[#292a2e]/60">
                  <span className="text-[10px] font-space uppercase text-[#958ea0] tracking-wider block">
                    Activity
                  </span>
                  <span className="text-sm font-space font-bold text-[#e3e2e8] mt-0.5 block">
                    {currentSelected.daysInactive === 0 ? 'Active Today' : `${currentSelected.daysInactive}d inactive`}
                  </span>
                  <span className="text-[10px] text-[#958ea0] font-sans block mt-0.5">
                    {currentSelected.lastActive}
                  </span>
                </div>
              </div>

              {/* Profile Tabs: Notes, Billing, Files, Meetings - Fixed */}
              <div className="px-5 border-b border-[#292a2e]/60 flex items-center gap-5 mt-2 flex-shrink-0 bg-[#0d0e12]">
                {(
                  [
                    { id: 'notes', label: 'Coaching Journal & Notes', icon: 'edit_note' },
                    { id: 'billing', label: 'Retainer & Invoices', icon: 'receipt_long' },
                    { id: 'files', label: 'Files', icon: 'folder_open' },
                    { id: 'meetings', label: 'Meetings', icon: 'video_call' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setProfileTab(tab.id)}
                    className={`flex items-center gap-2 py-3 border-b-2 font-space text-xs font-bold transition-all cursor-pointer ${
                      profileTab === tab.id
                        ? 'border-[#ffb4a3] text-[#ffdad2]'
                        : 'border-transparent text-[#958ea0] hover:text-[#e3e2e8]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Contents - Scrollable Y independently */}
              <div
                className="p-5 flex-1 overflow-y-auto min-h-0"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#292a2e transparent' }}
              >
                {profileTab === 'notes' && (
                  <div className="space-y-4">
                    <form onSubmit={handleAddNote} className="space-y-2">
                      <label className="block text-xs font-space font-bold text-[#ffdad2]">
                        Add Coaching Note:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Log observation, session notes or updates..."
                          value={newNoteInput}
                          onChange={(e) => setNewNoteInput(e.target.value)}
                          className="flex-1 bg-[#141519] border border-[#292a2e] rounded-xl px-4 py-2 text-xs text-[#e3e2e8] placeholder-[#958ea0] focus:outline-none focus:border-[#ffb4a3]"
                        />
                        <button
                          type="submit"
                          disabled={!newNoteInput.trim()}
                          className="h-8 px-4 rounded-xl bg-[#ffb4a3] text-[#3a0900] font-space font-bold text-xs hover:bg-[#ffdad2] transition-colors cursor-pointer disabled:opacity-40"
                        >
                          Save Note
                        </button>
                      </div>
                    </form>

                    <div className="space-y-2 mt-4">
                      {(clientNotes[currentSelected.id] || [
                        { id: 'def_1', text: 'Onboarding completed. Retainer active.', date: 'Recent' }
                      ]).map((note) => (
                        <div
                          key={note.id}
                          className="p-4 rounded-xl bg-[#141519] border border-[#292a2e]/60 flex items-start justify-between gap-3 group"
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="material-symbols-outlined text-[#ffb4a3] text-[16px] mt-0.5">
                              sticky_note_2
                            </span>
                            <p className="text-xs text-[#e3e2e8] font-sans leading-relaxed">
                              {note.text}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] font-space text-[#958ea0]">
                              {note.date}
                            </span>
                            <button
                              onClick={() => handleDeleteNote(currentSelected.id, note.id)}
                              className="text-[#958ea0] hover:text-[#ff5449] transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                              title="Delete note"
                            >
                              <span className="material-symbols-outlined text-[14px]">delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profileTab === 'billing' && (
                  <div className="space-y-4">
                    {/* Stripe Subscription Banner */}
                    <div className="p-5 rounded-2xl bg-[#141519] border border-[#292a2e]/60 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="material-symbols-outlined text-[#4edea3] text-[16px]">verified</span>
                          <h4 className="font-space font-bold text-sm text-[#e3e2e8]">
                            Stripe Subscription Billing
                          </h4>
                        </div>
                        {currentSelected.cardLast4 ? (
                          <>
                            <p className="text-xs text-[#958ea0] font-sans leading-relaxed">
                              Client’s card (•••• {currentSelected.cardLast4}) is securely stored in Stripe Vault.
                              Subscription charges <span className="text-[#e3e2e8]">{currentSelected.monthlyRetainer}</span> automatically
                              on <span className="text-[#e3e2e8]">{currentSelected.nextBilling}</span> — no manual invoicing needed.
                            </p>
                            <p className="text-[10px] text-[#4edea3] font-sans mt-1.5 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[11px]">lock</span>
                              PCI compliant · Managed by Stripe · Card data never touches our servers
                            </p>
                          </>
                        ) : (
                          <div className="mt-2 p-3 rounded-xl bg-[#ec6a06]/10 border border-[#ec6a06]/30 flex items-start gap-2">
                            <span className="material-symbols-outlined text-[#ec6a06] text-[18px] flex-shrink-0 mt-0.5">credit_card_off</span>
                            <div>
                              <p className="text-xs font-space font-bold text-[#ff8a74]">No payment method on file</p>
                              <p className="text-[11px] text-[#958ea0] font-sans mt-0.5 leading-relaxed">
                                Client hasn’t added a card yet. Send them a Stripe Checkout link to collect their card securely.
                              </p>
                              <button className="mt-2 h-7 px-3 rounded-lg bg-[#ec6a06] hover:bg-[#f07d2a] text-white font-space font-bold text-[10px] transition-colors cursor-pointer flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px]">send</span>
                                Send Payment Setup Link
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setBillingModalClient(currentSelected);
                          setNewFeeValue(currentSelected.monthlyFeeNum);
                        }}
                        className="h-8 px-3 rounded-lg bg-[#ffb4a3] text-[#3a0900] font-space font-bold text-xs hover:bg-[#ffdad2] transition-colors cursor-pointer flex-shrink-0"
                      >
                        Adjust Fee
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-[#141519] border border-[#292a2e]/60 space-y-2">
                      <span className="text-xs font-space font-bold text-[#e3e2e8] block">
                        Recent Billing Receipts
                      </span>
                      <div className="flex items-center justify-between text-xs py-2 border-b border-[#292a2e]/40 text-[#958ea0]">
                        <span>Invoice #INV-2026-11</span>
                        <span>{currentSelected.monthlyRetainer}</span>
                        <span className="text-[#4edea3]">Paid</span>
                      </div>
                      <div className="flex items-center justify-between text-xs py-2 text-[#958ea0]">
                        <span>Invoice #INV-2026-10</span>
                        <span>{currentSelected.monthlyRetainer}</span>
                        <span className="text-[#4edea3]">Paid</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* FILES TAB */}
                {profileTab === 'files' && (
                  <div className="space-y-4">
                    {/* Header bar */}
                    <div className="flex items-center justify-between pb-3 border-b border-[#292a2e]/50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-space font-bold text-[#e3e2e8]">Client Documents</span>
                        <span className="text-[10px] font-space font-bold px-2 py-0.5 rounded-full bg-[#ffb4a3]/15 text-[#ffdad2] border border-[#ffb4a3]/30">
                          {(clientFiles[currentSelected.id] ?? []).length} files
                        </span>
                      </div>
                      <label className="h-8 px-3 rounded-lg bg-[#ffb4a3] text-[#3a0900] hover:bg-[#ffdad2] font-space font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm">
                        <span className="material-symbols-outlined text-[16px]">upload_file</span>
                        <span>Upload Document</span>
                        <input type="file" className="hidden" onChange={handleFileUpload} />
                      </label>
                    </div>

                    {/* Files list */}
                    {(clientFiles[currentSelected.id] ?? []).length === 0 ? (
                      <div className="border border-dashed border-[#292a2e] rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-[#141519]/40">
                        <div className="w-12 h-12 rounded-xl bg-[#292a2e]/60 flex items-center justify-center mb-2.5">
                          <span className="material-symbols-outlined text-2xl text-[#958ea0]">folder_open</span>
                        </div>
                        <p className="font-space font-bold text-xs text-[#e3e2e8]">No client files yet</p>
                        <p className="text-[11px] text-[#958ea0] font-sans mt-0.5 max-w-xs">
                          Upload intake forms, blood work, or progress photos. Files persist in this session.
                        </p>
                        <label className="mt-3 h-7 px-3 rounded-lg bg-[#292a2e] hover:bg-[#343439] text-[#e3e2e8] font-space font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px]">add</span>
                          <span>Choose File</span>
                          <input type="file" className="hidden" onChange={handleFileUpload} />
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {(clientFiles[currentSelected.id] ?? []).map((file: any) => {
                          const isPdf = file.type === 'pdf';
                          const isZip = file.type === 'zip';
                          const isSheet = file.type === 'sheet';
                          const isVideo = file.type === 'video';

                          return (
                            <div
                              key={file.id}
                              className="p-3 rounded-xl bg-[#141519] border border-[#292a2e]/60 hover:border-[#ffb4a3]/30 transition-all flex items-center gap-3.5 group"
                            >
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                                  isPdf
                                    ? 'bg-[#ff5449]/15 border-[#ff5449]/30 text-[#ff8a74]'
                                    : isSheet
                                    ? 'bg-[#4edea3]/15 border-[#4edea3]/30 text-[#4edea3]'
                                    : isZip
                                    ? 'bg-[#ffb4a3]/15 border-[#ffb4a3]/30 text-[#ffdad2]'
                                    : isVideo
                                    ? 'bg-[#d0bcff]/15 border-[#d0bcff]/30 text-[#d0bcff]'
                                    : 'bg-[#292a2e] border-[#343439] text-[#e3e2e8]'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[20px]">{file.icon}</span>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-space font-bold text-[#e3e2e8] truncate">{file.name}</p>
                                  <span className="text-[9px] font-space font-bold uppercase px-1.5 py-0.2 rounded bg-[#292a2e] text-[#958ea0]">
                                    {file.type}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#958ea0] font-sans mt-0.5">
                                  {file.size} · Uploaded {file.date}
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  onClick={() => alert(`Downloading ${file.name}...`)}
                                  className="h-7 px-2.5 rounded-lg bg-[#292a2e] hover:bg-[#343439] text-[#e3e2e8] text-[11px] font-space font-medium transition-colors cursor-pointer flex items-center gap-1"
                                  title="Download file"
                                >
                                  <span className="material-symbols-outlined text-[14px]">download</span>
                                  <span className="hidden sm:inline">Download</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteFile(currentSelected.id, file.id)}
                                  className="w-7 h-7 rounded-lg bg-[#292a2e] hover:bg-[#ff5449]/20 text-[#958ea0] hover:text-[#ff5449] transition-colors cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100"
                                  title="Delete document"
                                >
                                  <span className="material-symbols-outlined text-[15px]">delete</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* MEETINGS TAB */}
                {profileTab === 'meetings' && (() => {
                  const clientMeetingsList = allMeetings.filter(
                    (m) =>
                      (m.clientId && m.clientId === currentSelected.id) ||
                      (m.client && m.client.toLowerCase() === currentSelected.name.toLowerCase())
                  );
                  const upcoming = clientMeetingsList.filter((m) => m.status === 'upcoming');
                  const past = clientMeetingsList.filter((m) => m.status === 'completed');

                  return (
                    <div className="space-y-4">
                      {/* Header bar */}
                      <div className="flex items-center justify-between pb-3 border-b border-[#292a2e]/50">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-space font-bold text-[#e3e2e8]">Coaching Sessions</span>
                          {upcoming.length > 0 && (
                            <span className="text-[10px] font-space font-bold px-2 py-0.5 rounded-full bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30">
                              {upcoming.length} upcoming
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowScheduleModal(true)}
                            className="h-8 px-3 rounded-lg border border-[#292a2e] bg-[#141519] hover:bg-[#1f2026] text-[#e3e2e8] font-space font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[15px]">calendar_add_on</span>
                            <span>Schedule</span>
                          </button>
                          <button
                            onClick={() => handleLaunchVideoCall(currentSelected)}
                            className="h-8 px-3 rounded-lg bg-[#ffb4a3] text-[#3a0900] font-space font-bold text-xs hover:bg-[#ffdad2] transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                          >
                            <span className="material-symbols-outlined text-[15px]">videocam</span>
                            <span>Start Instant Call</span>
                          </button>
                        </div>
                      </div>

                      {/* Schedule Meeting Inline Modal */}
                      {showScheduleModal && (
                        <div className="p-4 rounded-xl bg-[#141519] border border-[#ffb4a3]/40 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-space font-bold text-[#ffdad2] flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[16px]">event</span>
                              Schedule 1-on-1 Session with {currentSelected.name}
                            </span>
                            <button
                              onClick={() => setShowScheduleModal(false)}
                              className="text-[#958ea0] hover:text-[#e3e2e8] cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          </div>
                          <form onSubmit={handleScheduleMeeting} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                            <input
                              type="text"
                              value={newMeetingTitle}
                              onChange={(e) => setNewMeetingTitle(e.target.value)}
                              placeholder="Session topic / title"
                              className="bg-[#0d0e12] border border-[#292a2e] rounded-lg px-3 py-1.5 text-xs text-[#e3e2e8] focus:border-[#ffb4a3] focus:outline-none font-sans"
                            />
                            <input
                              type="text"
                              value={newMeetingDate}
                              onChange={(e) => setNewMeetingDate(e.target.value)}
                              placeholder="Date (e.g. Nov 22, 2026)"
                              className="bg-[#0d0e12] border border-[#292a2e] rounded-lg px-3 py-1.5 text-xs text-[#e3e2e8] focus:border-[#ffb4a3] focus:outline-none font-sans"
                            />
                            <input
                              type="text"
                              value={newMeetingTime}
                              onChange={(e) => setNewMeetingTime(e.target.value)}
                              placeholder="Time (e.g. 11:00 AM)"
                              className="bg-[#0d0e12] border border-[#292a2e] rounded-lg px-3 py-1.5 text-xs text-[#e3e2e8] focus:border-[#ffb4a3] focus:outline-none font-sans"
                            />
                            <div className="flex gap-2">
                              <select
                                value={newMeetingDuration}
                                onChange={(e) => setNewMeetingDuration(e.target.value)}
                                className="bg-[#0d0e12] border border-[#292a2e] rounded-lg px-2.5 py-1.5 text-xs text-[#e3e2e8] focus:border-[#ffb4a3] focus:outline-none font-space flex-1"
                              >
                                <option value="15 min">15 min</option>
                                <option value="30 min">30 min</option>
                                <option value="45 min">45 min</option>
                                <option value="60 min">60 min</option>
                              </select>
                              <button
                                type="submit"
                                className="h-8 px-3 rounded-lg bg-[#4edea3] text-[#0d0e12] font-space font-bold text-xs hover:bg-[#6ef0b9] transition-colors cursor-pointer flex-shrink-0"
                              >
                                Save
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Meetings List */}
                      {clientMeetingsList.length === 0 ? (
                        <div className="border border-dashed border-[#292a2e] rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-[#141519]/40">
                          <div className="w-12 h-12 rounded-xl bg-[#292a2e]/60 flex items-center justify-center mb-2.5">
                            <span className="material-symbols-outlined text-2xl text-[#958ea0]">event_busy</span>
                          </div>
                          <p className="font-space font-bold text-xs text-[#e3e2e8]">No sessions scheduled</p>
                          <p className="text-[11px] text-[#958ea0] font-sans mt-0.5 max-w-xs">
                            Schedule a strategy call or launch an instant video room with this client.
                          </p>
                          <button
                            onClick={() => setShowScheduleModal(true)}
                            className="mt-3 h-7 px-3 rounded-lg bg-[#292a2e] hover:bg-[#343439] text-[#e3e2e8] font-space font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[14px]">add</span>
                            <span>Schedule Session</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Upcoming list */}
                          {upcoming.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-[10px] font-space font-bold uppercase text-[#4edea3] tracking-wider block">
                                Upcoming Sessions
                              </span>
                              {upcoming.map((m) => (
                                <div
                                  key={m.id}
                                  className="p-3.5 rounded-xl bg-[#141519] border border-[#4edea3]/30 hover:border-[#4edea3]/60 transition-all flex items-center gap-3.5 group"
                                >
                                  <div className="w-10 h-10 rounded-xl bg-[#4edea3]/15 border border-[#4edea3]/30 text-[#4edea3] flex items-center justify-center flex-shrink-0">
                                    <span className="material-symbols-outlined text-[20px]">videocam</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-xs font-space font-bold text-[#e3e2e8]">{m.type || (m as any).title}</p>
                                      <span className="text-[9px] font-space font-bold uppercase px-1.5 py-0.2 rounded bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30">
                                        Confirmed
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-[#958ea0] font-sans mt-0.5">
                                      {m.date}{m.time ? ` · ${m.time}` : ''} · {m.duration} · Cadence Video Room
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                      onClick={() => handleLaunchVideoCall(currentSelected)}
                                      className="h-7 px-3 rounded-lg bg-[#4edea3] text-[#0d0e12] font-space font-bold text-[11px] hover:bg-[#6ef0b9] transition-colors cursor-pointer flex items-center gap-1"
                                    >
                                      <span className="material-symbols-outlined text-[14px]">call</span>
                                      <span>Join</span>
                                    </button>
                                    <button
                                      onClick={() => handleToggleMeetingStatus(m)}
                                      className="h-7 px-2.5 rounded-lg bg-[#292a2e] hover:bg-[#4edea3]/20 text-[#958ea0] hover:text-[#4edea3] text-[11px] font-space transition-colors cursor-pointer flex items-center gap-1"
                                      title="Mark completed"
                                    >
                                      <span className="material-symbols-outlined text-[14px]">check</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteMeeting(m.id)}
                                      className="w-7 h-7 rounded-lg bg-[#292a2e] hover:bg-[#ff5449]/20 text-[#958ea0] hover:text-[#ff5449] transition-colors cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100"
                                      title="Cancel session"
                                    >
                                      <span className="material-symbols-outlined text-[15px]">close</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Past history */}
                          {past.length > 0 && (
                            <div className="space-y-2 pt-2">
                              <span className="text-[10px] font-space font-bold uppercase text-[#958ea0] tracking-wider block">
                                Past Call History
                              </span>
                              {past.map((m) => (
                                <div
                                  key={m.id}
                                  className="p-3 rounded-xl bg-[#141519]/70 border border-[#292a2e]/60 flex items-center gap-3.5 group"
                                >
                                  <div className="w-9 h-9 rounded-xl bg-[#292a2e] text-[#958ea0] flex items-center justify-center flex-shrink-0">
                                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-space font-semibold text-[#e3e2e8]">{m.type || (m as any).title}</p>
                                    <p className="text-[10px] text-[#958ea0] font-sans mt-0.5">
                                      {m.date}{m.time ? ` · ${m.time}` : ''} · {m.duration} · Call completed
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <button
                                      onClick={() => handleToggleMeetingStatus(m)}
                                      className="h-7 px-2.5 rounded-lg bg-[#292a2e] hover:bg-[#343439] text-[#958ea0] hover:text-[#e3e2e8] text-[11px] font-space transition-colors cursor-pointer flex items-center gap-1"
                                      title="Reopen session"
                                    >
                                      <span className="material-symbols-outlined text-[13px]">replay</span>
                                      <span>Reopen</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteMeeting(m.id)}
                                      className="w-7 h-7 rounded-lg bg-[#292a2e] hover:bg-[#ff5449]/20 text-[#958ea0] hover:text-[#ff5449] transition-colors cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100"
                                      title="Delete record"
                                    >
                                      <span className="material-symbols-outlined text-[14px]">delete</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
</div>
            </>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-[#958ea0]">
          <span className="material-symbols-outlined text-5xl mb-3">contact_page</span>
          <p className="font-space text-sm">
            {activeCategory === 'active'
              ? 'Select an active client to view Profile Info'
              : 'Select a signup lead to review'}
          </p>
        </div>
      )}


      {/* ── EDIT RETAINER TIER NAME MODAL ── */}
      {editingTierClient && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setEditingTierClient(null)}
        >
          <div
            className="w-full max-w-md bg-[#1a1b20] border border-[#ffb4a3]/40 rounded-2xl p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#292a2e]/60">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ffb4a3] text-[20px]">badge</span>
                <h3 className="font-space font-bold text-[#e3e2e8] text-sm">
                  Edit Retainer Tier — {editingTierClient.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingTierClient(null)}
                className="text-[#958ea0] hover:text-[#e3e2e8] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveTierName} className="space-y-3.5">
              {/* Field 1: Tier Name */}
              <div>
                <label className="text-[11px] font-space font-bold uppercase tracking-wider text-[#ffdad2] mb-1 block">
                  Retainer Tier Name:
                </label>
                <input
                  type="text"
                  required
                  value={newTierName}
                  onChange={(e) => setNewTierName(e.target.value)}
                  placeholder="e.g. Tier 1 Biometrics"
                  className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-xl px-3 py-2 text-xs text-[#e3e2e8] focus:border-[#ffb4a3] focus:outline-none font-space"
                />
                
                {/* Preset Tier Pills */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    'Tier 1 Biometrics',
                    'Tier 1 Elite Retainer',
                    'Tier 2 Endurance',
                    'Tier 2 Nutrition',
                    'Core Health',
                    'Core Protocol',
                    'Concierge Biomarkers',
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setNewTierName(preset)}
                      className={`text-[10px] font-space px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                        newTierName === preset
                          ? 'bg-[#ffb4a3] text-[#3a0900] border-[#ffb4a3] font-bold'
                          : 'bg-[#0d0e12] text-[#958ea0] border-[#292a2e] hover:text-[#e3e2e8]'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 2: Strategy Focus */}
              <div>
                <label className="text-[11px] font-space font-bold uppercase tracking-wider text-[#ffdad2] mb-1 block">
                  Coaching / Strategy Focus:
                </label>
                <input
                  type="text"
                  value={newFocusName}
                  onChange={(e) => setNewFocusName(e.target.value)}
                  placeholder="e.g. Endurance Optimization • Week 1"
                  className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-xl px-3 py-2 text-xs text-[#e3e2e8] focus:border-[#ffb4a3] focus:outline-none font-sans"
                />
              </div>

              {/* Credit card notice (Read-only security badge) */}
             

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#292a2e]/60">
                <button
                  type="button"
                  onClick={() => setEditingTierClient(null)}
                  className="h-8 px-3.5 rounded-xl bg-[#292a2e] hover:bg-[#343439] text-[#e3e2e8] font-space font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 rounded-xl bg-[#ffb4a3] text-[#3a0900] font-space font-bold text-xs hover:bg-[#ffdad2] transition-colors cursor-pointer shadow-sm"
                >
                  Save Tier Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
