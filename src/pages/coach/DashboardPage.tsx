import { useState, useEffect, useId } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { AppView } from '../../App';
import type { UserRole } from '../../types';
import { INITIAL_COACH_PROFILE } from '../../data/mockDashboardData';

// Modular Dashboard Sections
import OverviewDashboardSection from '../../components/dashboard/OverviewDashboardSection';
import ClientRosterSection from '../../components/dashboard/ClientRosterSection';
import RetainersSection from '../../components/dashboard/RetainersSection';
import PrescriptiveStudioSection from '../../components/dashboard/PrescriptiveStudioSection';
import AntiChurnRadarSection from '../../components/dashboard/AntiChurnRadarSection';
import AIChatSection from '../../components/dashboard/AIChatSection';
import MeetingsSection from '../../components/dashboard/MeetingsSection';
import MessagesSection from '../../components/dashboard/MessagesSection';
import TasksSection from '../../components/dashboard/TasksSection';
import DocumentsSection from '../../components/dashboard/DocumentsSection';
import SettingsSection from '../../components/dashboard/SettingsSection';
import NotificationDropdown from '../../components/dashboard/NotificationDropdown';
import GlobalSearchHUD from '../../components/dashboard/GlobalSearchHUD';
import ClientOverviewSection from '../../components/client/ClientOverviewSection';
import ClientSettingsSection, { type ClientSettingsTab } from '../../components/client/ClientSettingsSection';
import clientsData from '../../data/clients.json';
import meetingsData from '../../data/meetings.json';
import messagesData from '../../data/messages.json';
import tasksData from '../../data/tasks.json';
import documentsData from '../../data/documents.json';
import retainersData from '../../data/retainers.json';
import prescriptionsData from '../../data/prescriptions.json';
import churnAlertsData from '../../data/churnAlerts.json';
import aiChatsData from '../../data/aiChats.json';
import clientMeetingsData from '../../data/clientMeetings.json';
import clientMessagesData from '../../data/clientMessages.json';
import clientTasksData from '../../data/clientTasks.json';
import clientDocumentsData from '../../data/clientDocuments.json';
import clientAiChatsData from '../../data/clientAiChats.json';

import type { ClientEntry, NavSection, SettingsTab, MeetingItem, Conversation, TaskItem, DocumentItem, ChatMessage, RetainerItem, PrescriptionItem, ChurnAlert, AIChatThread } from '../../types/dashboard';

interface DashboardPageProps {
  onNavigate: (view: AppView) => void;
}

const ROSTER_CLIENTS: ClientEntry[] = clientsData as ClientEntry[];
const SESSION_CLIENTS_KEY = 'cadence_session_clients';

// Load from sessionStorage if available (persists across page refresh within the same tab session)
function getInitialClients(): ClientEntry[] {
  try {
    const stored = sessionStorage.getItem(SESSION_CLIENTS_KEY);
    if (stored) return JSON.parse(stored) as ClientEntry[];
  } catch {}
  return ROSTER_CLIENTS;
}

const INITIAL_MEETINGS: MeetingItem[] = meetingsData as MeetingItem[];
const SESSION_MEETINGS_KEY = 'cadence_session_meetings';

function getInitialMeetings(): MeetingItem[] {
  try {
    const stored = sessionStorage.getItem(SESSION_MEETINGS_KEY);
    if (stored) return JSON.parse(stored) as MeetingItem[];
  } catch {}
  return INITIAL_MEETINGS;
}

const INITIAL_CONVERSATIONS: Conversation[] = messagesData as Conversation[];
const SESSION_MESSAGES_KEY = 'cadence_session_messages';

function getInitialConversations(): Conversation[] {
  try {
    const stored = sessionStorage.getItem(SESSION_MESSAGES_KEY);
    if (stored) return JSON.parse(stored) as Conversation[];
  } catch {}
  return INITIAL_CONVERSATIONS;
}

const INITIAL_TASKS: TaskItem[] = tasksData as TaskItem[];
const SESSION_TASKS_KEY = 'cadence_session_tasks';

function getInitialTasks(): TaskItem[] {
  try {
    const stored = sessionStorage.getItem(SESSION_TASKS_KEY);
    if (stored) return JSON.parse(stored) as TaskItem[];
  } catch {}
  return INITIAL_TASKS;
}

const INITIAL_DOCUMENTS: DocumentItem[] = documentsData as DocumentItem[];
const SESSION_DOCUMENTS_KEY = 'cadence_session_documents';

function getInitialDocuments(): DocumentItem[] {
  try {
    const stored = sessionStorage.getItem(SESSION_DOCUMENTS_KEY);
    if (stored) return JSON.parse(stored) as DocumentItem[];
  } catch {}
  return INITIAL_DOCUMENTS;
}

const INITIAL_RETAINERS: RetainerItem[] = retainersData as RetainerItem[];
const SESSION_RETAINERS_KEY = 'cadence_session_retainers';

function getInitialRetainers(): RetainerItem[] {
  try {
    const stored = sessionStorage.getItem(SESSION_RETAINERS_KEY);
    if (stored) return JSON.parse(stored) as RetainerItem[];
  } catch {}
  return INITIAL_RETAINERS;
}

const INITIAL_PRESCRIPTIONS: PrescriptionItem[] = prescriptionsData as PrescriptionItem[];
const SESSION_PRESCRIPTIONS_KEY = 'cadence_session_prescriptions';

function getInitialPrescriptions(): PrescriptionItem[] {
  try {
    const stored = sessionStorage.getItem(SESSION_PRESCRIPTIONS_KEY);
    if (stored) return JSON.parse(stored) as PrescriptionItem[];
  } catch {}
  return INITIAL_PRESCRIPTIONS;
}

const INITIAL_CHURN_ALERTS: ChurnAlert[] = churnAlertsData as ChurnAlert[];
const SESSION_CHURN_KEY = 'cadence_session_churn_alerts';

function getInitialChurnAlerts(): ChurnAlert[] {
  try {
    const stored = sessionStorage.getItem(SESSION_CHURN_KEY);
    if (stored) return JSON.parse(stored) as ChurnAlert[];
  } catch {}
  return INITIAL_CHURN_ALERTS;
}


const INITIAL_AI_CHATS: AIChatThread[] = aiChatsData as AIChatThread[];
const SESSION_AI_CHATS_KEY = 'cadence_session_ai_chats';

function getInitialAIChats(): AIChatThread[] {
  try {
    const stored = sessionStorage.getItem(SESSION_AI_CHATS_KEY);
    if (stored) return JSON.parse(stored) as AIChatThread[];
  } catch {}
  return INITIAL_AI_CHATS;
}

const COACH_CALL_PARTNER: ClientEntry = {
  id: 'coach_jv',
  name: 'Julian Vance',
  email: 'julian.vance@cadence.health',
  company: 'Cadence Performance',
  focus: 'Lead Performance & Longevity Coach',
  initials: 'JV',
  compliance: 100,
  complianceLabel: 'Optimal',
  monthlyRetainer: '$1,500/mo',
  monthlyFeeNum: 1500,
  tierLabel: 'Tier 1 Metabolic & Biometrics',
  status: 'approved',
  statusBeacon: 'Lead Coach',
  lastActive: 'Online now',
  riskStatus: 'healthy',
  riskLabel: 'Active Coach',
  daysInactive: 0,
  nextBilling: 'Dec 15, 2026',
};

const INITIAL_CLIENT_MEETINGS: MeetingItem[] = clientMeetingsData as MeetingItem[];
const SESSION_CLIENT_MEETINGS_KEY = 'cadence_session_client_meetings';
function getInitialClientMeetings(): MeetingItem[] {
  try {
    const stored = sessionStorage.getItem(SESSION_CLIENT_MEETINGS_KEY);
    if (stored) return JSON.parse(stored) as MeetingItem[];
  } catch {}
  return INITIAL_CLIENT_MEETINGS;
}

const INITIAL_CLIENT_CONVERSATIONS: Conversation[] = clientMessagesData as Conversation[];
const SESSION_CLIENT_MESSAGES_KEY = 'cadence_session_client_messages';
function getInitialClientConversations(): Conversation[] {
  try {
    const stored = sessionStorage.getItem(SESSION_CLIENT_MESSAGES_KEY);
    if (stored) return JSON.parse(stored) as Conversation[];
  } catch {}
  return INITIAL_CLIENT_CONVERSATIONS;
}

const INITIAL_CLIENT_TASKS: TaskItem[] = clientTasksData as TaskItem[];
const SESSION_CLIENT_TASKS_KEY = 'cadence_session_client_tasks';
function getInitialClientTasks(): TaskItem[] {
  try {
    const stored = sessionStorage.getItem(SESSION_CLIENT_TASKS_KEY);
    if (stored) return JSON.parse(stored) as TaskItem[];
  } catch {}
  return INITIAL_CLIENT_TASKS;
}

const INITIAL_CLIENT_DOCUMENTS: DocumentItem[] = clientDocumentsData as DocumentItem[];
const SESSION_CLIENT_DOCUMENTS_KEY = 'cadence_session_client_documents';
function getInitialClientDocuments(): DocumentItem[] {
  try {
    const stored = sessionStorage.getItem(SESSION_CLIENT_DOCUMENTS_KEY);
    if (stored) return JSON.parse(stored) as DocumentItem[];
  } catch {}
  return INITIAL_CLIENT_DOCUMENTS;
}

const INITIAL_CLIENT_AI_CHATS: AIChatThread[] = clientAiChatsData as AIChatThread[];
const SESSION_CLIENT_AI_CHATS_KEY = 'cadence_session_client_ai_chats';
function getInitialClientAIChats(): AIChatThread[] {
  try {
    const stored = sessionStorage.getItem(SESSION_CLIENT_AI_CHATS_KEY);
    if (stored) return JSON.parse(stored) as AIChatThread[];
  } catch {}
  return INITIAL_CLIENT_AI_CHATS;
}

interface AgendaItem { id: string; text: string; done: boolean; }
const DEFAULT_AGENDA: AgendaItem[] = [
  { id: 'a1', text: 'Review sleep recovery & HRV trendline', done: true },
  { id: 'a2', text: 'Address metabolic plateau & re-feed buffer', done: true },
  { id: 'a3', text: 'Prescribe 7-day micro-cycle protocol', done: false },
  { id: 'a4', text: 'Confirm next week check-in time', done: false },
];
export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { user, logout, updateUser } = useAuth();
  const retainerInputId = useId();

  // Active role driven by authenticated user — no manual toggle
  const [activeRole, setActiveRole] = useState<UserRole>(user?.role || 'coach');
  const [activeSection, setActiveSection] = useState<NavSection>('overview');

  // Sync role whenever the logged-in user changes (login / logout cycle)
  useEffect(() => {
    if (user?.role) setActiveRole(user.role);
  }, [user?.role]);

  // Filter state
  const [clientFilter, setClientFilter] = useState<'all' | 'approved' | 'waitlist' | 'unapproved'>('all');

  // Interactive data
  const [clients, setClients] = useState<ClientEntry[]>(getInitialClients);
  // Persist client list to sessionStorage on every change (session-scoped, not permanent)
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_CLIENTS_KEY, JSON.stringify(clients));
    } catch {}
  }, [clients]);

  // Interactive meetings data backed by meetings.json & sessionStorage
  const [meetings, setMeetings] = useState<MeetingItem[]>(getInitialMeetings);
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_MEETINGS_KEY, JSON.stringify(meetings));
    } catch {}
  }, [meetings]);

  const handleAddMeeting = (newMeeting: MeetingItem) => {
    setMeetings((prev) => [newMeeting, ...prev]);
  };

  const handleUpdateMeeting = (updated: MeetingItem) => {
    setMeetings((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  };

  const handleDeleteMeeting = (meetingId: string) => {
    setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
  };

  // Interactive conversations data backed by messages.json & sessionStorage
  const [conversations, setConversations] = useState<Conversation[]>(getInitialConversations);
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_MESSAGES_KEY, JSON.stringify(conversations));
    } catch {}
  }, [conversations]);

  // Interactive tasks data backed by tasks.json & sessionStorage
  const [tasks, setTasks] = useState<TaskItem[]>(getInitialTasks);
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_TASKS_KEY, JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  // Interactive documents data backed by documents.json & sessionStorage
  const [documents, setDocuments] = useState<DocumentItem[]>(getInitialDocuments);
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_DOCUMENTS_KEY, JSON.stringify(documents));
    } catch {}
  }, [documents]);

  // Interactive retainers data backed by retainers.json & sessionStorage
  const [retainers, setRetainers] = useState<RetainerItem[]>(getInitialRetainers);
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_RETAINERS_KEY, JSON.stringify(retainers));
    } catch {}
  }, [retainers]);

  // Interactive prescriptions data backed by prescriptions.json & sessionStorage
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>(getInitialPrescriptions);
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_PRESCRIPTIONS_KEY, JSON.stringify(prescriptions));
    } catch {}
  }, [prescriptions]);

  // Interactive churn alerts backed by churnAlerts.json & sessionStorage
  const [churnAlerts, setChurnAlerts] = useState<ChurnAlert[]>(getInitialChurnAlerts);
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_CHURN_KEY, JSON.stringify(churnAlerts));
    } catch {}
  }, [churnAlerts]);

  // AI Chat threads backed by aiChats.json & sessionStorage
  const [aiChats, setAiChats] = useState<AIChatThread[]>(getInitialAIChats);
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_AI_CHATS_KEY, JSON.stringify(aiChats));
    } catch {}
  }, [aiChats]);

  // Client-specific isolated data backed by client JSON & sessionStorage
  const [clientMeetings, setClientMeetings] = useState<MeetingItem[]>(getInitialClientMeetings);
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_CLIENT_MEETINGS_KEY, JSON.stringify(clientMeetings));
    } catch {}
  }, [clientMeetings]);

  const [clientConversations, setClientConversations] = useState<Conversation[]>(getInitialClientConversations);
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_CLIENT_MESSAGES_KEY, JSON.stringify(clientConversations));
    } catch {}
  }, [clientConversations]);

  const [clientTasks, setClientTasks] = useState<TaskItem[]>(getInitialClientTasks);
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_CLIENT_TASKS_KEY, JSON.stringify(clientTasks));
    } catch {}
  }, [clientTasks]);

  const [clientDocuments, setClientDocuments] = useState<DocumentItem[]>(getInitialClientDocuments);
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_CLIENT_DOCUMENTS_KEY, JSON.stringify(clientDocuments));
    } catch {}
  }, [clientDocuments]);

  const [clientAiChats, setClientAiChats] = useState<AIChatThread[]>(getInitialClientAIChats);
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_CLIENT_AI_CHATS_KEY, JSON.stringify(clientAiChats));
    } catch {}
  }, [clientAiChats]);

  // Security guard: Ensure client cannot access coach-only sections
  useEffect(() => {
    const COACH_ONLY_SECTIONS: NavSection[] = [
      'client-roster',
      'retainers',
      'stripe-billing',
      'prescriptive-studio',
      'anti-churn-radar',
      'check-in-queue',
    ];
    if (activeRole === 'client' && COACH_ONLY_SECTIONS.includes(activeSection)) {
      setActiveSection('overview');
    }
  }, [activeRole, activeSection]);

  const handleClientRetainerUpdated = (clientId: string, newFee: number) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              monthlyFeeNum: newFee,
              monthlyRetainer: `$${newFee.toLocaleString()}/mo`,
            }
          : c
      )
    );
  };

  const handleSendDocumentToClient = (doc: DocumentItem) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, status: d.status === 'signed' ? 'signed' : 'sent', lastSentAt: 'Just now' } : d))
    );

    const targetClientName = doc.client;
    setConversations((prev) => {
      const existing = prev.find((c) => c.clientName.toLowerCase() === targetClientName.toLowerCase());
      const newMsg: ChatMessage = {
        id: 'm_' + Date.now(),
        sender: 'coach',
        text: `Hello ${targetClientName.split(' ')[0]}, I've generated and dispatched your ${doc.type}: "${doc.name}". Please review and confirm in your portal.`,
        time: 'Just now',
        status: 'sent',
        attachment: {
          name: `${doc.name}.pdf`,
          size: doc.size || '98 KB',
          type: 'pdf',
        },
      };

      if (existing) {
        return prev.map((c) =>
          c.id === existing.id
            ? {
                ...c,
                lastMessage: `Document shared: ${doc.name}`,
                date: 'Just now',
                messages: [...c.messages, newMsg],
              }
            : c
        );
      }
      return prev;
    });
  };

  const [selectedRecipient, setSelectedRecipient] = useState<string>('Elena Rostova');
  // Default to first active client (c3 = Imran Sheikh) so the top of the list is highlighted on load
  const [selectedClientId, setSelectedClientId] = useState<string>('c3');

  // Prescription Initial Pre-fill State (from Overview/Radar shortcuts)
  const [calInput, setCalInput] = useState('2,150');
  const [carbsInput, setCarbsInput] = useState('210');
  const [reasonInput, setReasonInput] = useState(
    'Elena Rostova’s metabolic plateaus across 12 consecutive days suggest chronic glycogen depletion. Increasing carbohydrate allocation by +25g daily will restore leptin dynamics and baseline metabolic rate.'
  );


  // 1-on-1 Video Call State (Agora Modal & Pro Telehealth Preview)
  const [activeVideoCallClient, setActiveVideoCallClient] = useState<ClientEntry | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callNotes, setCallNotes] = useState('');
  const [callDuration, setCallDuration] = useState('14:28');
  const [isVideoWaitlistJoined, setIsVideoWaitlistJoined] = useState(false);
  const [isEditingCallFocus, setIsEditingCallFocus] = useState(false);
  const [callFocusInput, setCallFocusInput] = useState('');
  const [callTierInput, setCallTierInput] = useState('');

  // Session Agenda Checklist (per active call)
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>(DEFAULT_AGENDA);
  const [newAgendaText, setNewAgendaText] = useState('');

  // Curated client portraits for video call simulation
  const CLIENT_PORTRAITS: Record<string, string> = {
    c1: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80',
    c2: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&auto=format&fit=crop&q=80',
    c3: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
    c4: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80',
    c5: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    c6: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&auto=format&fit=crop&q=80',
    c7: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&auto=format&fit=crop&q=80',
    c8: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=800&auto=format&fit=crop&q=80',
    c9: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    c10: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80',
  };

  // Payment Retainer Modal State
  const [billingModalClient, setBillingModalClient] = useState<ClientEntry | null>(null);
  const [newFeeValue, setNewFeeValue] = useState<number>(1500);
  const [paymentSuccessToast, setPaymentSuccessToast] = useState<string | null>(null);

  // Copilot State

  // Settings & Edit Profile State — Persisted to sessionStorage
  const SESSION_PROFILE_KEY = 'cadence_session_profile';
  const DEFAULT_PROFILE = {
    firstName: user?.first_name || 'Coach',
    lastName: user?.last_name || 'Vance',
    title: 'Lead Performance & Longevity Coach',
    email: user?.email || 'julian.vance@cadence.health',
    phone: '+1 (555) 019-2834',
    handle: 'julian-vance',
    bio: 'Coaching 28 high-output founders and competitive endurance athletes. Specializing in metabolic flexibility, HRV recovery architecture, and bio-individuality.',
    timezone: 'America/New_York (EST, UTC-5)',
    coachCode: INITIAL_COACH_PROFILE.coach_code,
  };

  const getInitialProfile = () => {
    try {
      const stored = sessionStorage.getItem(SESSION_PROFILE_KEY);
      if (stored) return JSON.parse(stored) as typeof DEFAULT_PROFILE;
    } catch {}
    return DEFAULT_PROFILE;
  };

  const [settingsTab, setSettingsTab] = useState<SettingsTab>('profile');
  const [clientSettingsTab, setClientSettingsTab] = useState<ClientSettingsTab>('profile');
  const [profileForm, setProfileForm] = useState(getInitialProfile);

  // Auto-route coach to billing package checkout if a plan was selected before login
  useEffect(() => {
    try {
      const pendingPlan = sessionStorage.getItem('cadence_selected_coach_plan');
      if (pendingPlan && activeRole === 'coach') {
        setActiveSection('settings');
        setSettingsTab('billing');
      }
    } catch {}
  }, [activeRole]);

  // Persist profileForm updates to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_PROFILE_KEY, JSON.stringify(profileForm));
    } catch {}
  }, [profileForm]);
  const [settingsSuccessNotice, setSettingsSuccessNotice] = useState<string | null>(null);

  // Security Credentials
  const [securityState, setSecurityState] = useState({
    currentPass: '',
    newPass: '',
    confirmPass: '',
    twoFactorEnabled: true,
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      first_name: profileForm.firstName,
      last_name: profileForm.lastName,
      email: profileForm.email,
    });
    setSettingsSuccessNotice('Profile and public coach handle saved successfully!');
    setTimeout(() => setSettingsSuccessNotice(null), 3500);
  };

  const handleSaveBillingSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccessNotice('Stripe billing rules & retainer defaults saved!');
    setTimeout(() => setSettingsSuccessNotice(null), 3500);
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (securityState.newPass && securityState.newPass !== securityState.confirmPass) {
      alert('New passwords do not match.');
      return;
    }
    setSettingsSuccessNotice('Security credentials and 2FA preferences updated!');
    setSecurityState((prev) => ({ ...prev, currentPass: '', newPass: '', confirmPass: '' }));
    setTimeout(() => setSettingsSuccessNotice(null), 3500);
  };

  // Copy Coach ID Feedback
  const [copiedCode, setCopiedCode] = useState(false);

  const coachCode = INITIAL_COACH_PROFILE.coach_code;

  const handleCopyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/#signup?coach=${coachCode}`;
    navigator.clipboard?.writeText(inviteUrl);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2400);
  };


  const handleLaunchVideoCall = (client: ClientEntry) => {
    setActiveVideoCallClient(client);
    setCallDuration('00:00');
    setAgendaItems(DEFAULT_AGENDA);
    setNewAgendaText('');
    setCallNotes('');
    setIsEditingCallFocus(false);
  };

  const handleUpdateMonthlyFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingModalClient) return;

    setClients((prev) =>
      prev.map((c) =>
        c.id === billingModalClient.id
          ? { ...c, monthlyRetainer: `$${newFeeValue.toLocaleString()}/mo`, monthlyFeeNum: newFeeValue }
          : c
      )
    );
    setPaymentSuccessToast(`Retainer updated to $${newFeeValue.toLocaleString()}/mo with Stripe Auto-Debit.`);
    setTimeout(() => {
      setPaymentSuccessToast(null);
      setBillingModalClient(null);
    }, 2000);
  };


  // Filtered clients list for Client Roster
  const filteredClients = clients.filter((c) => {
    if (clientFilter !== 'all' && c.status !== clientFilter) return false;
    return true;
  });

  // ── Shared nav helpers (single coral theme for both roles) ──
  const navCls = (active: boolean) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-all cursor-pointer text-left w-full ${
      active
        ? 'bg-[#ffb4a3] text-[#3a0900] font-bold shadow-[0_0_16px_-2px_rgba(255,180,163,0.4)]'
        : 'text-[#cbc3d7] hover:bg-[#292a2e] hover:text-[#e3e2e8]'
    }`;
  const badgeCls = (active: boolean) =>
    `ml-auto text-[10px] font-space font-bold px-1.5 py-0.5 rounded-full ${
      active ? 'bg-[#3a0900]/20 text-[#3a0900]' : 'bg-[#292a2e] text-[#ffb4a3]'
    }`;

  const isCoach = activeRole === 'coach';

  /* ── Section label map (coach + client) ── */
  const sectionLabel =
    isCoach
      ? ({
          overview: 'Overview',
          'client-roster': 'Clients',
          meetings: 'Meetings',
          'ai-messenger': 'Messages',
          tasks: 'Tasks',
          documents: 'Documents',
          'stripe-billing': 'Retainers',
          retainers: 'Retainers',
          'prescriptive-studio': 'Prescriptive Studio',
          'anti-churn-radar': 'Anti-Churn Radar',
          'ai-chat': 'AI Chat',
          settings: 'Settings',
        } as Record<string, string>)[activeSection] ?? 'Dashboard'
      : ({
          overview: 'My Dashboard',
          meetings: 'My Meetings',
          'ai-messenger': 'Message Coach',
          tasks: 'My Tasks',
          documents: 'My Files',
          'ai-chat': 'AI Assistant',
          settings: 'Settings',
        } as Record<string, string>)[activeSection] ?? 'Client Portal';

  return (
    <div className="min-h-screen bg-[#121317] text-[#e3e2e8] font-sans antialiased selection:bg-[#ffdad2] selection:text-[#3a0900]">
      {/* ── FIXED LEFT SIDEBAR ── */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#0d0e12]/95 backdrop-blur-xl z-50 flex flex-col p-4 shadow-[0_1px_8px_rgba(0,0,0,0.5)] border-r border-[#292a2e]/60">
        <div
          className="flex flex-col gap-5 flex-1 overflow-y-auto min-h-0 pb-2"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#292a2e transparent' }}
        >
          {/* Logo */}
          <div
            onClick={() => setActiveSection('overview')}
            className="flex items-center gap-3 px-1 py-1 cursor-pointer hover:opacity-90 transition-all group"
            title="Cadence Home"
          >
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm font-medium tracking-tight text-[#fafafa] leading-none group-hover:text-primary transition-colors">
                Cadence
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                <span className="font-label-sm text-[10px] uppercase tracking-wider text-secondary font-medium">
                  For 1-on-1 Professionals
                </span>
              </div>
            </div>
          </div>

          {/* ── COACH NAV ── */}
          {isCoach ? (
            <nav className="flex flex-col gap-1">
              <div className="px-3 pt-1 pb-0.5">
                <span className="text-[9px] font-space uppercase tracking-widest text-[#4a4855] font-semibold">Core</span>
              </div>

              <button onClick={() => setActiveSection('overview')} className={navCls(activeSection === 'overview')}>
                <span className="material-symbols-outlined text-[20px]">space_dashboard</span>
                <span>Overview</span>
              </button>

              <button onClick={() => setActiveSection('client-roster')} className={navCls(activeSection === 'client-roster')}>
                <span className="material-symbols-outlined text-[20px]">group</span>
                <span>Clients</span>
                <span className={badgeCls(activeSection === 'client-roster')}>
                  {clients.filter(c => (c.clientType ?? (c.status === 'unapproved' ? 'spam' : 'active')) === 'active').length}
                </span>
              </button>

              <button onClick={() => setActiveSection('meetings')} className={navCls(activeSection === 'meetings')}>
                <span className="material-symbols-outlined text-[20px]">video_call</span>
                <span>Meetings</span>
                <span className={badgeCls(activeSection === 'meetings')}>
                  {meetings.filter(m => m.status === 'upcoming').length}
                </span>
              </button>

              <button onClick={() => setActiveSection('ai-messenger')} className={navCls(activeSection === 'ai-messenger')}>
                <span className="material-symbols-outlined text-[20px]">chat</span>
                <span>Messages</span>
                {conversations.reduce((s, c) => s + (c.unreadCount || 0), 0) > 0 && (
                  <span className={badgeCls(activeSection === 'ai-messenger')}>
                    {conversations.reduce((s, c) => s + (c.unreadCount || 0), 0)}
                  </span>
                )}
              </button>

              <button onClick={() => setActiveSection('tasks')} className={navCls(activeSection === 'tasks')}>
                <span className="material-symbols-outlined text-[20px]">task_alt</span>
                <span>Tasks</span>
                <span className={badgeCls(activeSection === 'tasks')}>
                  {tasks.filter(t => t.status !== 'done').length}
                </span>
              </button>

              <button onClick={() => setActiveSection('documents')} className={navCls(activeSection === 'documents')}>
                <span className="material-symbols-outlined text-[20px]">description</span>
                <span>Documents</span>
                <span className={badgeCls(activeSection === 'documents')}>{documents.length}</span>
              </button>

              <div className="px-3 pt-3 pb-0.5">
                <span className="text-[9px] font-space uppercase tracking-widest text-[#4a4855] font-semibold">Finance</span>
              </div>

              <button
                onClick={() => setActiveSection('stripe-billing')}
                className={navCls((activeSection as string) === 'retainers' || activeSection === 'stripe-billing')}
              >
                <span className="material-symbols-outlined text-[20px]">credit_card</span>
                <span>Retainers</span>
                <span className={badgeCls((activeSection as string) === 'retainers' || activeSection === 'stripe-billing')}>
                  {retainers.filter(r => r.status === 'active').length}
                </span>
              </button>

              <div className="px-3 pt-3 pb-0.5">
                <span className="text-[9px] font-space uppercase tracking-widest text-[#4a4855] font-semibold">Cadence AI</span>
              </div>

              <button onClick={() => setActiveSection('prescriptive-studio')} className={navCls(activeSection === 'prescriptive-studio')}>
                <span className="material-symbols-outlined text-[20px]">tune</span>
                <span>Prescriptive Studio</span>
                <span className={badgeCls(activeSection === 'prescriptive-studio')}>
                  {prescriptions.filter(p => p.status === 'active').length}
                </span>
              </button>

              <button onClick={() => setActiveSection('anti-churn-radar')} className={navCls(activeSection === 'anti-churn-radar')}>
                <span className="material-symbols-outlined text-[20px]">radar</span>
                <span>Anti-Churn Radar</span>
                {churnAlerts.filter(a => a.riskLevel === 'critical' || a.riskLevel === 'high').length > 0 && (
                  <span className={badgeCls(activeSection === 'anti-churn-radar')}>
                    {churnAlerts.filter(a => a.riskLevel === 'critical' || a.riskLevel === 'high').length}
                  </span>
                )}
              </button>

              <button onClick={() => setActiveSection('ai-chat')} className={navCls(activeSection === 'ai-chat')}>
                <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                <span>AI Chat</span>
                <span className={badgeCls(activeSection === 'ai-chat')}>{aiChats.length}</span>
              </button>
            </nav>
          ) : (
            /* ── CLIENT NAV — same coral design ── */
            <nav className="flex flex-col gap-1">
              <div className="px-3 pt-1 pb-0.5">
                <span className="text-[9px] font-space uppercase tracking-widest text-[#4a4855] font-semibold">My Portal</span>
              </div>

              <button onClick={() => setActiveSection('overview')} className={navCls(activeSection === 'overview')}>
                <span className="material-symbols-outlined text-[20px]">space_dashboard</span>
                <span>My Dashboard</span>
              </button>

              <button onClick={() => setActiveSection('meetings')} className={navCls(activeSection === 'meetings')}>
                <span className="material-symbols-outlined text-[20px]">video_call</span>
                <span>My Meetings</span>
                <span className={badgeCls(activeSection === 'meetings')}>
                  {meetings.filter(m => m.status === 'upcoming').length}
                </span>
              </button>

              <button onClick={() => setActiveSection('ai-messenger')} className={navCls(activeSection === 'ai-messenger')}>
                <span className="material-symbols-outlined text-[20px]">chat</span>
                <span>Message Coach</span>
                {conversations.reduce((s, c) => s + (c.unreadCount || 0), 0) > 0 && (
                  <span className={badgeCls(activeSection === 'ai-messenger')}>
                    {conversations.reduce((s, c) => s + (c.unreadCount || 0), 0)}
                  </span>
                )}
              </button>

              <button onClick={() => setActiveSection('tasks')} className={navCls(activeSection === 'tasks')}>
                <span className="material-symbols-outlined text-[20px]">task_alt</span>
                <span>My Tasks</span>
                <span className={badgeCls(activeSection === 'tasks')}>
                  {tasks.filter(t => t.status !== 'done').length}
                </span>
              </button>

              <button onClick={() => setActiveSection('documents')} className={navCls(activeSection === 'documents')}>
                <span className="material-symbols-outlined text-[20px]">folder_shared</span>
                <span>My Files</span>
                <span className={badgeCls(activeSection === 'documents')}>{documents.length}</span>
              </button>

              <button onClick={() => setActiveSection('ai-chat')} className={navCls(activeSection === 'ai-chat')}>
                <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                <span>AI Assistant</span>
                <span className={badgeCls(activeSection === 'ai-chat')}>{aiChats.length}</span>
              </button>

              {/* <div className="px-3 pt-3 pb-0.5">
                <span className="text-[9px] font-space uppercase tracking-widest text-[#4a4855] font-semibold">Account</span>
              </div> */}

              {/* <button onClick={() => setActiveSection('settings')} className={navCls(activeSection === 'settings')}>
                <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
                <span>Settings</span>
              </button> */}
            </nav>
          )}
        </div>
      </aside>

      {/* ── MAIN LAYOUT WRAPPER ── */}
      <div className="pl-64 flex flex-col min-h-screen">
        {/* ── FIXED TOP HEADER ── */}
        <header className="fixed top-0 left-64 right-0 h-16 bg-[#0d0e12]/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.35)] border-b border-[#292a2e]/50 z-40 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Page title */}
            <div className="hidden sm:flex flex-col">
              <span className="font-space font-bold text-sm leading-none text-[#e3e2e8]">
                {sectionLabel}
              </span>
              <span className="text-[10px] text-[#4a4855] font-sans mt-0.5">
                {isCoach
                  ? `Coach · ${profileForm.firstName} ${profileForm.lastName}`
                  : `Client · ${user?.first_name ?? 'Sarah'} ${user?.last_name ?? 'Jenkins'}`}
              </span>
            </div>

            {/* Search — coach only */}
            {isCoach && (
              <GlobalSearchHUD
                clients={clients}
                onNavigateSection={setActiveSection}
                onSelectClient={(clientName) => {
                  setSelectedRecipient(clientName);
                  setActiveSection('prescriptive-studio');
                }}
                onExportCSV={() => alert('Exporting 28 client telemetry records to CSV...')}
                onCopyInviteLink={handleCopyInviteLink}
              />
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Coach: invite code */}
            {isCoach && (
              <div className="hidden xl:flex items-center gap-2 bg-[#1a1b20] px-3 py-1 rounded-lg text-xs border border-[#292a2e]/50">
                <span className="text-[11px] font-space text-[#958ea0]">Invite Code:</span>
                <span className="font-mono text-[#ffdad2] font-bold">{coachCode}</span>
                <button
                  onClick={handleCopyInviteLink}
                  className="text-[#958ea0] hover:text-[#e3e2e8] transition-colors flex items-center justify-center cursor-pointer ml-0.5"
                  title="Copy client invite link"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {copiedCode ? 'check' : 'content_copy'}
                  </span>
                </button>
              </div>
            )}

            {/* Client: retainer status */}
            {!isCoach && (
              <div className="hidden xl:flex items-center gap-2 bg-[#1a1b20] px-3 py-1 rounded-lg text-xs border border-[#292a2e]/50">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse flex-shrink-0" />
                <span className="font-space text-[#e3e2e8] font-semibold">Tier 1 Biometrics · $1,500/mo</span>
              </div>
            )}

            {/* Notifications */}
            <NotificationDropdown
              onNavigate={setActiveSection}
              role={activeRole}
            />

            {/* Profile */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-[#292a2e]/60">
              <div
                onClick={() => setActiveSection('settings')}
                className="flex flex-col text-right hidden sm:flex cursor-pointer hover:opacity-85 transition-opacity"
              >
                <span className="font-space font-semibold text-xs text-[#e3e2e8] leading-none">
                  {isCoach
                    ? `${profileForm.firstName} ${profileForm.lastName}`
                    : `${user?.first_name ?? 'Sarah'} ${user?.last_name ?? 'Jenkins'}`}
                </span>
                <span className="text-[10px] text-[#958ea0] font-sans mt-0.5">
                  {isCoach ? profileForm.title : 'Active Client'}
                </span>
              </div>

              {/* Avatar */}
              <div className="relative group">
                <div
                  onClick={() => setActiveSection('settings')}
                  className="w-8 h-8 rounded-full bg-[#ffdad2] text-[#3a0900] flex items-center justify-center font-bold text-xs font-space shadow-sm cursor-pointer hover:ring-2 hover:ring-[#ffdad2]/40 transition-all"
                  title="Settings"
                >
                  {isCoach
                    ? `${profileForm.firstName[0]}${profileForm.lastName[0]}`
                    : `${(user?.first_name ?? 'S')[0]}${(user?.last_name ?? 'J')[0]}`}
                </div>

                {/* Hover dropdown */}
                <div className="absolute right-0 top-full pt-2 w-48 z-50 invisible opacity-0 translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
                  <div className="bg-[#1c1b20] border border-[#36343b] rounded-xl shadow-2xl p-1.5 space-y-0.5">
                    <button
                      onClick={() => {
                        setActiveSection('settings');
                        if (isCoach) setSettingsTab('profile');
                        else setClientSettingsTab('profile');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-space font-semibold text-[#e3e2e8] hover:bg-[#302e35] hover:text-[#ffdad2] transition-colors cursor-pointer text-left"
                    >
                      <span className="material-symbols-outlined text-[17px] text-[#ffb4a3]">person</span>
                      <span>Edit Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveSection('settings');
                        if (isCoach) setSettingsTab('security');
                        else setClientSettingsTab('security');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-space font-semibold text-[#e3e2e8] hover:bg-[#302e35] hover:text-[#ffdad2] transition-colors cursor-pointer text-left"
                    >
                      <span className="material-symbols-outlined text-[17px] text-[#ffb4a3]">shield</span>
                      <span>Security &amp; 2FA</span>
                    </button>
                    {isCoach && (
                      <button
                        onClick={() => {
                          setActiveSection('settings');
                          setSettingsTab('billing');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-space font-semibold text-[#e3e2e8] hover:bg-[#302e35] hover:text-[#ffdad2] transition-colors cursor-pointer text-left"
                      >
                        <span className="material-symbols-outlined text-[17px] text-[#ffb4a3]">workspace_premium</span>
                        <span>Plans &amp; Payments</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={async () => { await logout(); onNavigate('landing'); }}
                className="p-1 text-[#958ea0] hover:text-[#ffb4ab] transition-colors cursor-pointer"
                title="Log out"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* ── MAIN CONTENT WORKSPACE ── */}
        <main
          className={`w-full pt-20 px-4 sm:px-6 md:px-8 ${
            activeSection === 'client-roster' || activeSection === 'ai-chat' || activeSection === 'ai-messenger'
              ? 'pb-3 h-screen overflow-hidden'
              : 'pb-16'
          } bg-[#121317] flex-1`}
        >
          <div
            className={`flex flex-col w-full ${
              activeSection === 'client-roster' || activeSection === 'ai-chat' || activeSection === 'ai-messenger'
                ? 'h-[calc(100vh-5.75rem)] overflow-hidden'
                : 'gap-6'
            } max-w-7xl mx-auto`}
          >
            {activeRole === 'coach' ? (
              <>
                {/* ── SECTION VIEWS BASED ON ACTIVE SECTION ── */}
                {activeSection === 'overview' && (
                  <OverviewDashboardSection
                    clients={clients}
                    retainers={retainers}
                    setActiveSection={setActiveSection}
                    onLaunchVideoCall={handleLaunchVideoCall}
                    setSelectedRecipient={setSelectedRecipient}
                    setCalInput={setCalInput}
                    setCarbsInput={setCarbsInput}
                    setReasonInput={setReasonInput}
                    setBillingModalClient={setBillingModalClient}
                    setNewFeeValue={setNewFeeValue}
                    onExportCSV={() => alert('Exporting 28 client telemetry records to CSV...')}
                  />
                )}

                {/* ── CLIENT ROSTER VIEW ── */}
                {activeSection === 'client-roster' && (
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <ClientRosterSection
                      clients={clients}
                      filteredClients={filteredClients}
                      clientFilter={clientFilter}
                      setClientFilter={setClientFilter}
                      setClients={setClients}
                      setSelectedRecipient={setSelectedRecipient}
                      setActiveSection={setActiveSection}
                      handleLaunchVideoCall={handleLaunchVideoCall}
                      setBillingModalClient={setBillingModalClient}
                      setNewFeeValue={setNewFeeValue}
                      meetings={meetings}
                      onAddMeeting={handleAddMeeting}
                      onUpdateMeeting={handleUpdateMeeting}
                      onDeleteMeeting={handleDeleteMeeting}
                      selectedClientId={selectedClientId}
                      setSelectedClientId={setSelectedClientId}
                    />
                  </div>
                )}

                {/* -- ANTI-CHURN RADAR VIEW -- */}
                {activeSection === 'anti-churn-radar' && (
                  <AntiChurnRadarSection
                    clients={clients}
                    alerts={churnAlerts}
                    setAlerts={setChurnAlerts}
                    onNavigateToPrescriptive={(clientName) => {
                      setSelectedRecipient(clientName);
                      setActiveSection('prescriptive-studio');
                    }}
                    onLaunchVideoCall={handleLaunchVideoCall}
                  />
                )}

                {/* ── PRESCRIPTIVE STUDIO VIEW ── */}
                {activeSection === 'prescriptive-studio' && (
                  <PrescriptiveStudioSection
                    clients={clients}
                    prescriptions={prescriptions}
                    setPrescriptions={setPrescriptions}
                    initialRecipient={selectedRecipient}
                    initialCal={calInput}
                    initialCarbs={carbsInput}
                    initialReason={reasonInput}
                  />
                )}

                {/* -- AI CHAT VIEW -- */}
                {activeSection === 'ai-chat' && (
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <AIChatSection
                      clients={clients}
                      chats={aiChats}
                      setChats={setAiChats}
                    />
                  </div>
                )}


                {/* ── RETAINERS & STRIPE BILLING VIEW ── */}
                {(activeSection === 'stripe-billing' || (activeSection as string) === 'retainers') && (
                  <RetainersSection
                    clients={clients}
                    retainers={retainers}
                    setRetainers={setRetainers}
                    onClientRetainerUpdated={handleClientRetainerUpdated}
                  />
                )}

                {/* ── MESSAGES VIEW ── */}
                {activeSection === 'ai-messenger' && (
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <MessagesSection
                      clients={clients}
                      conversations={conversations}
                      onConversationsChange={setConversations}
                      onViewClient={(clientIdentifier: string) => {
                        const match = clients.find(
                          (c) =>
                            c.id === clientIdentifier ||
                            c.name.toLowerCase() === clientIdentifier.toLowerCase()
                        );
                        if (match) {
                          setSelectedClientId(match.id);
                          setSelectedRecipient(match.name);
                        }
                        setActiveRole('coach');
                        setActiveSection('client-roster');
                      }}
                      onLaunchVideoCall={handleLaunchVideoCall}
                    />
                  </div>
                )}


                {/* ── MEETINGS SECTION ── */}
                {activeSection === 'meetings' && (
                  <MeetingsSection
                    clients={clients}
                    meetings={meetings}
                    onAddMeeting={handleAddMeeting}
                    onUpdateMeeting={handleUpdateMeeting}
                    onDeleteMeeting={handleDeleteMeeting}
                    onLaunchVideoCall={handleLaunchVideoCall}
                  />
                )}

                {/* ── TASKS SECTION ── */}
                {activeSection === 'tasks' && (
                  <TasksSection clients={clients} tasks={tasks} setTasks={setTasks} />
                )}

                {/* ── DOCUMENTS SECTION ── */}
                {activeSection === 'documents' && (
                  <DocumentsSection
                    clients={clients}
                    documents={documents}
                    setDocuments={setDocuments}
                    conversations={conversations}
                    setConversations={setConversations}
                    onSendDocumentToClient={handleSendDocumentToClient}
                    currentUserRole="coach"
                  />
                )}

                {/* ── SETTINGS & EDIT PROFILE VIEW ── */}
                {activeSection === 'settings' && (
                  <SettingsSection
                    settingsTab={settingsTab}
                    setSettingsTab={setSettingsTab}
                    profileForm={profileForm}
                    setProfileForm={setProfileForm}
                    handleSaveProfile={handleSaveProfile}
                    handleSaveBillingSettings={handleSaveBillingSettings}
                    handleSaveSecurity={handleSaveSecurity}
                    securityState={securityState}
                    handleCopyInviteLink={handleCopyInviteLink}
                    setSecurityState={setSecurityState}
                    settingsSuccessNotice={settingsSuccessNotice}
                    setSettingsSuccessNotice={setSettingsSuccessNotice}
                  />
                )}
              </> 
            ) : (
              /* ── CLIENT PORTAL: role-based multi-section routing ── */
              <>
                {/* Overview → ClientOverviewSection */}
                {activeSection === 'overview' && (
                  <ClientOverviewSection
                    onJoinCall={() => handleLaunchVideoCall(COACH_CALL_PARTNER)}
                    onMessageCoach={() => {
                      setSelectedRecipient('Julian Vance');
                      setActiveSection('ai-messenger');
                    }}
                  />
                )}

                {/* Meetings → client's own meetings with coach */}
                {activeSection === 'meetings' && (
                  <MeetingsSection
                    clients={[COACH_CALL_PARTNER]}
                    meetings={clientMeetings}
                    onAddMeeting={(m) => setClientMeetings((prev) => [m, ...prev])}
                    onUpdateMeeting={(m) => setClientMeetings((prev) => prev.map((item) => item.id === m.id ? m : item))}
                    onDeleteMeeting={(id) => setClientMeetings((prev) => prev.filter((m) => m.id !== id))}
                    onLaunchVideoCall={() => handleLaunchVideoCall(COACH_CALL_PARTNER)}
                  />
                )}

                {/* Message Coach → client's dedicated channel with coach */}
                {activeSection === 'ai-messenger' && (
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <MessagesSection
                      clients={[COACH_CALL_PARTNER]}
                      conversations={clientConversations}
                      onConversationsChange={setClientConversations}
                      onViewClient={() => {}}
                      onLaunchVideoCall={() => handleLaunchVideoCall(COACH_CALL_PARTNER)}
                      currentUserRole="client"
                    />
                  </div>
                )}

                {/* Tasks → client's personal protocol tasks */}
                {activeSection === 'tasks' && (
                  <TasksSection
                    clients={[COACH_CALL_PARTNER]}
                    tasks={clientTasks}
                    setTasks={setClientTasks}
                  />
                )}

                {/* Files → client's personal files & protocol agreements */}
                {activeSection === 'documents' && (
                  <DocumentsSection
                    clients={[COACH_CALL_PARTNER]}
                    documents={clientDocuments}
                    setDocuments={setClientDocuments}
                    conversations={clientConversations}
                    setConversations={setClientConversations}
                    onSendDocumentToClient={handleSendDocumentToClient}
                    currentUserRole="client"
                  />
                )}

                {/* AI Assistant → client's personalized nutrition AI companion */}
                {activeSection === 'ai-chat' && (
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <AIChatSection
                      clients={[COACH_CALL_PARTNER]}
                      chats={clientAiChats}
                      setChats={setClientAiChats}
                      currentUserRole="client"
                    />
                  </div>
                )}

                {/* Settings → Dedicated ClientSettingsSection */}
                {activeSection === 'settings' && (
                  <ClientSettingsSection
                    activeTab={clientSettingsTab}
                    setActiveTab={setClientSettingsTab}
                    onMessageCoach={() => {
                      setSelectedRecipient('Julian Vance');
                      setActiveSection('ai-messenger');
                    }}
                    onNavigateSection={(sec) => setActiveSection(sec as any)}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* ── MODAL 1: 1-ON-1 VIDEO CALL SESSION (PRO TELEHEALTH PREVIEW) ── */}
      {activeVideoCallClient && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="w-full max-w-5xl bg-[#141519] border border-[#ffb4a3]/40 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col my-auto">
            
            {/* ── PRO TIER ANNOUNCEMENT BANNER ── */}
            <div className="bg-gradient-to-r from-[#ffb4a3]/20 via-[#1a1b20] to-[#4edea3]/15 border-b border-[#ffb4a3]/30 px-5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#ffb4a3] text-[#3a0900] font-space text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm flex-shrink-0">
                  <span className="material-symbols-outlined text-[13px]">workspace_premium</span>
                  Pro Feature Preview
                </span>
                <p className="text-xs text-[#e3e2e8] font-sans">
                  <span className="font-semibold text-[#ffdad2]">1-on-1 Telehealth Video Rooms</span> is available in future release <span className="text-[#4edea3] font-bold">v2.0</span>. Experience the live interactive interface below.
                </p>
              </div>
              <button
                onClick={() => setIsVideoWaitlistJoined(!isVideoWaitlistJoined)}
                className={`h-7 px-3 rounded-lg text-xs font-space font-bold transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
                  isVideoWaitlistJoined
                    ? 'bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/40 shadow-[0_0_10px_rgba(78,222,163,0.2)]'
                    : 'bg-[#ffb4a3] text-[#3a0900] hover:bg-[#ffdad2] shadow-sm'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {isVideoWaitlistJoined ? 'check_circle' : 'notifications_active'}
                </span>
                <span>{isVideoWaitlistJoined ? "You're on Early Access List!" : 'Join Pro Waitlist'}</span>
              </button>
            </div>

            {/* Modal Header */}
            <div className="px-5 py-3 bg-[#0d0e12] border-b border-[#292a2e]/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4edea3] animate-pulse" />
                  <span className="font-space font-bold text-sm text-[#e3e2e8]">
                    1-on-1 Strategy Session with {activeVideoCallClient.name}
                  </span>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#292a2e] text-[#4edea3] font-space text-[10px] font-bold">
                  <span className="material-symbols-outlined text-[12px]">lock</span>
                  End-to-End Encrypted
                </span>
              </div>
              <button
                onClick={() => setActiveVideoCallClient(null)}
                className="w-7 h-7 rounded-lg text-[#958ea0] hover:text-[#e3e2e8] hover:bg-[#292a2e] transition-colors cursor-pointer flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Body: Video Stage (8 cols) + Coaching HUD (4 cols) */}
            <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 bg-[#0d0e12]">
              
              {/* ── LEFT: VIDEO CALL STAGE ── */}
              <div className="lg:col-span-8 flex flex-col justify-between rounded-2xl bg-[#141519] border border-[#292a2e] overflow-hidden relative min-h-[380px] sm:min-h-[440px] shadow-inner">
                
                {/* Main Client Video Feed: Realistic Video Loop Stream with Photo Fallback */}
                <div className="absolute inset-0 z-0 overflow-hidden bg-black">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    poster={
                      CLIENT_PORTRAITS[activeVideoCallClient.id] ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80'
                    }
                    className="w-full h-full object-cover opacity-90 filter brightness-95"
                    src="https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/head-pose-face-detection-female.mp4"
                  >
                    <source
                      src="https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/head-pose-face-detection-female.mp4"
                      type="video/mp4"
                    />
                    <img
                      src={
                        CLIENT_PORTRAITS[activeVideoCallClient.id] ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80'
                      }
                      alt={activeVideoCallClient.name}
                      className="w-full h-full object-cover"
                    />
                  </video>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e12] via-black/20 to-black/50 pointer-events-none" />
                </div>

                {/* Top Overlay Stats */}
                <div className="relative z-10 p-3.5 flex items-center justify-between text-xs font-space text-[#e3e2e8]">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-[#4edea3] border border-[#4edea3]/30 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-ping" />
                      LIVE HD 1080p
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-[#958ea0] border border-[#292a2e]">
                      Room: Cadence-{activeVideoCallClient.initials}
                    </span>
                  </div>
                  <div className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-bold text-[#e3e2e8] border border-[#292a2e] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[13px] text-[#4edea3]">timer</span>
                    <span>{callDuration} / 45:00</span>
                  </div>
                </div>

                {/* Bottom Overlay: Client Identity + Floating Coach Self-View PiP */}
                <div className="relative z-10 p-4 flex items-end justify-between gap-4 mt-auto">
                  
                  {/* Client Info Pill */}
                  <div className="p-2.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 max-w-xs space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-space font-bold text-sm text-[#e3e2e8]">{activeVideoCallClient.name}</span>
                      {/* Audio visualizer spectrum */}
                      <span className="flex items-end gap-0.5 h-3">
                        <span className="w-0.5 h-3 bg-[#4edea3] rounded-full animate-pulse" />
                        <span className="w-0.5 h-2 bg-[#4edea3] rounded-full animate-pulse delay-75" />
                        <span className="w-0.5 h-3.5 bg-[#4edea3] rounded-full animate-pulse delay-150" />
                      </span>
                    </div>
                    <p className="text-[11px] text-[#ffdad2] font-sans truncate">{activeVideoCallClient.focus}</p>
                    <p className="text-[10px] text-[#958ea0] font-sans">Audio input active · High-fidelity stream</p>
                  </div>

                  {/* Coach Self-View Picture-in-Picture (PiP) */}
                  <div className="w-32 h-24 sm:w-40 sm:h-28 rounded-xl bg-[#141519] border-2 border-[#ffb4a3]/60 overflow-hidden relative shadow-2xl flex-shrink-0">
                    {isVideoOff ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-[#1a1b20] text-[#958ea0] p-2 text-center">
                        <span className="material-symbols-outlined text-2xl text-[#ff5449]">videocam_off</span>
                        <span className="text-[9px] font-space mt-1">Camera Off</span>
                      </div>
                    ) : (
                      <>
                        <video
                          autoPlay
                          loop
                          muted
                          playsInline
                          poster="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
                          className="w-full h-full object-cover filter contrast-105"
                          src="https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/head-pose-face-detection-male.mp4"
                        >
                          <source
                            src="https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/head-pose-face-detection-male.mp4"
                            type="video/mp4"
                          />
                        </video>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                      </>
                    )}
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between text-[9px] font-space font-bold text-[#e3e2e8]">
                      <span className="bg-black/60 px-1 py-0.2 rounded truncate">Coach Vance (You)</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${isMuted ? 'bg-[#ff5449]' : 'bg-[#4edea3]'}`} />
                    </div>
                  </div>
                </div>

                {/* ── CALL CONTROLS DOCK ── */}
                <div className="relative z-10 px-4 py-3 bg-[#0d0e12]/95 border-t border-[#292a2e]/60 flex items-center justify-center gap-3">
                  {/* Mute button */}
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`h-9 px-3.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 font-space text-xs font-bold ${
                      isMuted
                        ? 'bg-[#ff5449] text-white shadow-[0_0_12px_rgba(255,84,73,0.4)]'
                        : 'bg-[#292a2e] hover:bg-[#343439] text-[#e3e2e8]'
                    }`}
                    title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                  >
                    <span className="material-symbols-outlined text-[17px]">
                      {isMuted ? 'mic_off' : 'mic'}
                    </span>
                    <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Mute'}</span>
                  </button>

                  {/* Video toggle */}
                  <button
                    onClick={() => setIsVideoOff(!isVideoOff)}
                    className={`h-9 px-3.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 font-space text-xs font-bold ${
                      isVideoOff
                        ? 'bg-[#ff5449] text-white shadow-[0_0_12px_rgba(255,84,73,0.4)]'
                        : 'bg-[#292a2e] hover:bg-[#343439] text-[#e3e2e8]'
                    }`}
                    title={isVideoOff ? 'Start video' : 'Stop video'}
                  >
                    <span className="material-symbols-outlined text-[17px]">
                      {isVideoOff ? 'videocam_off' : 'videocam'}
                    </span>
                    <span className="hidden sm:inline">{isVideoOff ? 'Camera Off' : 'Camera'}</span>
                  </button>

                  {/* Screen Share (Pro teaser) */}
                  <button
                    onClick={() => alert('Screen share will be available in Cadence v2.0!')}
                    className="h-9 px-3 rounded-xl bg-[#292a2e] hover:bg-[#343439] text-[#958ea0] hover:text-[#e3e2e8] transition-colors cursor-pointer flex items-center gap-1 text-xs font-space font-medium"
                    title="Screen Share (Pro)"
                  >
                    <span className="material-symbols-outlined text-[17px]">screen_share</span>
                    <span className="hidden sm:inline">Share</span>
                  </button>

                  {/* End Session */}
                  <button
                    onClick={() => {
                      alert('Session concluded. Call summary saved to client timeline.');
                      setActiveVideoCallClient(null);
                    }}
                    className="h-9 px-4 rounded-xl bg-[#ff5449] hover:bg-[#ff7065] text-white font-space font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(255,84,73,0.4)] transition-all ml-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">call_end</span>
                    <span>End Call</span>
                  </button>
                </div>
              </div>

              {/* ── RIGHT: SESSION NOTES & CLIENT PROTOCOL ── */}
              <div className="lg:col-span-4 bg-[#141519] border border-[#292a2e]/60 rounded-2xl p-4 flex flex-col justify-between space-y-4">
                
                {/* Client Focus & Tier Summary with Edit Option */}
                <div className="p-3.5 rounded-xl bg-[#0d0e12] border border-[#292a2e]/60 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-space uppercase text-[#958ea0] tracking-wider font-bold">
                      Current Strategy Focus
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-space font-bold text-[#4edea3] bg-[#4edea3]/10 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                      <button
                        onClick={() => {
                          setCallFocusInput(activeVideoCallClient.focus || '');
                          setCallTierInput(activeVideoCallClient.tierLabel || 'Tier 1 Protocol');
                          setIsEditingCallFocus(!isEditingCallFocus);
                        }}
                        className="text-[#958ea0] hover:text-[#ffb4a3] transition-colors cursor-pointer p-0.5 rounded hover:bg-[#292a2e]"
                        title="Edit Strategy Focus & Tier"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                      </button>
                    </div>
                  </div>

                  {isEditingCallFocus ? (
                    <div className="space-y-2 pt-1 border-t border-[#292a2e]/60">
                      <div>
                        <label className="text-[9px] font-space text-[#ffdad2] uppercase block mb-0.5 font-bold">
                          Strategy Focus
                        </label>
                        <input
                          type="text"
                          value={callFocusInput}
                          onChange={(e) => setCallFocusInput(e.target.value)}
                          placeholder="e.g. Endurance Optimization • Week 1"
                          className="w-full bg-[#141519] border border-[#ffb4a3]/60 rounded-lg px-2.5 py-1 text-xs text-[#e3e2e8] focus:outline-none font-sans"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-space text-[#ffdad2] uppercase block mb-0.5 font-bold">
                          Retainer Tier
                        </label>
                        <select
                          value={callTierInput}
                          onChange={(e) => setCallTierInput(e.target.value)}
                          className="w-full bg-[#141519] border border-[#292a2e] rounded-lg px-2 py-1 text-xs text-[#e3e2e8] focus:border-[#ffb4a3] focus:outline-none font-space cursor-pointer"
                        >
                          <option value="Tier 1 Biometrics">Tier 1 Biometrics</option>
                          <option value="Tier 1 Elite Retainer">Tier 1 Elite Retainer</option>
                          <option value="Tier 2 Endurance">Tier 2 Endurance</option>
                          <option value="Tier 2 Nutrition">Tier 2 Nutrition</option>
                          <option value="Core Health">Core Health</option>
                          <option value="Core Protocol">Core Protocol</option>
                          <option value="Concierge Biomarkers">Concierge Biomarkers</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[9px] text-[#958ea0] flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[10px] text-[#4edea3]">lock</span>
                          Card protected
                        </span>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setIsEditingCallFocus(false)}
                            className="h-6 px-2.5 rounded bg-[#292a2e] text-[10px] font-space text-[#958ea0] hover:text-[#e3e2e8] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const newFocus = callFocusInput.trim() || activeVideoCallClient.focus;
                              const newTier = callTierInput.trim() || activeVideoCallClient.tierLabel;
                              setActiveVideoCallClient({
                                ...activeVideoCallClient,
                                focus: newFocus,
                                tierLabel: newTier,
                              });
                              setClients((prev) =>
                                prev.map((c) =>
                                  c.id === activeVideoCallClient.id
                                    ? { ...c, focus: newFocus, tierLabel: newTier }
                                    : c
                                )
                              );
                              setIsEditingCallFocus(false);
                            }}
                            className="h-6 px-3 rounded bg-[#ffb4a3] text-[10px] font-space font-bold text-[#3a0900] hover:bg-[#ffdad2] cursor-pointer shadow-sm"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs font-space font-bold text-[#ffdad2]">{activeVideoCallClient.focus}</p>
                      <div className="flex items-center justify-between text-[11px] text-[#958ea0] font-sans pt-0.5">
                        <span>Retainer Tier: <strong className="text-[#e3e2e8]">{activeVideoCallClient.tierLabel}</strong></span>
                        <span className="text-[10px] text-[#4edea3] flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[10px]">lock</span>
                          Stripe Protected
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* ── SESSION AGENDA CHECKLIST ── */}
                <div className="p-3.5 rounded-xl bg-[#0d0e12] border border-[#292a2e]/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-space uppercase text-[#958ea0] tracking-wider font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[13px] text-[#ffb4a3]">checklist</span>
                      Session Agenda
                    </span>
                    <span className="text-[10px] font-space text-[#4edea3]">
                      {agendaItems.filter(a => a.done).length}/{agendaItems.length} done
                    </span>
                  </div>

                  {/* Items */}
                  <ul className="space-y-1.5">
                    {agendaItems.map((item) => (
                      <li key={item.id} className="flex items-center gap-2 group/ag">
                        <button
                          type="button"
                          onClick={() =>
                            setAgendaItems((prev) =>
                              prev.map((a) => a.id === item.id ? { ...a, done: !a.done } : a)
                            )
                          }
                          className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-all cursor-pointer ${
                            item.done
                              ? 'bg-[#4edea3] border-[#4edea3] text-[#0d0e12]'
                              : 'border-[#292a2e] hover:border-[#ffb4a3] bg-transparent'
                          }`}
                        >
                          {item.done && <span className="material-symbols-outlined text-[11px] font-bold">check</span>}
                        </button>
                        <span className={`text-[11px] font-sans flex-1 leading-tight transition-all ${
                          item.done ? 'line-through text-[#4a4855]' : 'text-[#cbc3d7]'
                        }`}>
                          {item.text}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setAgendaItems((prev) => prev.filter((a) => a.id !== item.id))
                          }
                          className="opacity-0 group-hover/ag:opacity-100 text-[#4a4855] hover:text-[#ff5449] transition-all cursor-pointer"
                          title="Remove item"
                        >
                          <span className="material-symbols-outlined text-[13px]">close</span>
                        </button>
                      </li>
                    ))}
                  </ul>

                  {/* Add new item */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const text = newAgendaText.trim();
                      if (!text) return;
                      setAgendaItems((prev) => [
                        ...prev,
                        { id: `a${Date.now()}`, text, done: false },
                      ]);
                      setNewAgendaText('');
                    }}
                    className="flex gap-1.5 pt-1 border-t border-[#292a2e]/60"
                  >
                    <input
                      type="text"
                      value={newAgendaText}
                      onChange={(e) => setNewAgendaText(e.target.value)}
                      placeholder="Add agenda item…"
                      className="flex-1 bg-[#141519] border border-[#292a2e] rounded-lg px-2.5 py-1 text-[11px] text-[#e3e2e8] placeholder-[#4a4855] focus:outline-none focus:border-[#ffb4a3] font-sans"
                    />
                    <button
                      type="submit"
                      className="h-6 w-6 rounded-lg bg-[#ffb4a3] text-[#3a0900] flex items-center justify-center cursor-pointer hover:bg-[#ffdad2] transition-colors flex-shrink-0"
                    >
                      <span className="material-symbols-outlined text-[14px] font-bold">add</span>
                    </button>
                  </form>
                </div>

                {/* Session Clinical Notes */}
                <div className="space-y-1.5 flex-1 flex flex-col min-h-[180px]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-space uppercase text-[#e3e2e8] font-bold tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-[#ffb4a3]">edit_note</span>
                      Clinical Session Notes
                    </span>
                    <span className="text-[10px] text-[#4edea3] font-sans">Session-saved</span>
                  </div>
                  <textarea
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    placeholder="Document client cues, observations, dietary recommendations, and immediate adjustments during this call..."
                    className="flex-1 w-full bg-[#0d0e12] border border-[#292a2e] rounded-xl p-3 text-xs text-[#e3e2e8] placeholder-[#958ea0]/60 focus:border-[#ffb4a3] focus:outline-none resize-none font-sans leading-relaxed"
                  />
                </div>

                {/* Save and End button */}
                <button
                  onClick={() => {
                    alert('Clinical note saved and pushed to client profile!');
                    setActiveVideoCallClient(null);
                  }}
                  className="w-full h-9 rounded-xl bg-[#ffb4a3] text-[#3a0900] font-space font-bold text-xs hover:bg-[#ffdad2] transition-colors cursor-pointer shadow-[0_0_12px_rgba(255,180,163,0.3)] flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">save_as</span>
                  <span>Save Notes & End Call</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: MANAGE CLIENT RETAINER & STRIPE BILLING ── */}
      {billingModalClient && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#1a1b20] border border-[#292a2e]/60 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 bg-[#0d0e12] border-b border-[#292a2e]/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-space font-bold text-sm text-[#e3e2e8]">
                  Cadence Retainer Billing — {billingModalClient.name}
                </span>
              </div>
              <button
                onClick={() => setBillingModalClient(null)}
                className="p-1 rounded text-[#958ea0] hover:text-[#e3e2e8] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleUpdateMonthlyFee} className="p-6 space-y-4 text-xs font-sans">
              {paymentSuccessToast && (
                <div className="p-3 rounded bg-[#003824] text-[#4edea3] font-space text-xs flex items-center gap-1.5 border border-[#4edea3]/30">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>{paymentSuccessToast}</span>
                </div>
              )}

              <div className="p-3.5 rounded-lg bg-[#0d0e12] border border-[#292a2e]/50 space-y-1">
                <div className="text-[#958ea0]">Stripe Customer Profile:</div>
                <div className="font-mono font-bold text-[#e3e2e8]">cus_O9281920B71</div>
                <div className="text-[#cbc3d7]">Card on File: Visa ending in •••• {billingModalClient.cardLast4}</div>
                <div className="text-[#4edea3] font-space font-bold mt-1">✓ Automated Card Debit Active</div>
              </div>

              <div>
                <label htmlFor={retainerInputId} className="block text-[#958ea0] mb-1 font-space font-medium">
                  Monthly Retainer Fee ($ USD)
                </label>
                <input
                  id={retainerInputId}
                  type="number"
                  step="50"
                  value={newFeeValue}
                  onChange={(e) => setNewFeeValue(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[#0d0e12] border border-[#292a2e] text-base font-bold font-space text-[#e3e2e8] focus:outline-none focus:border-[#ffdad2]"
                  required
                />
                <span className="text-[10px] text-[#958ea0] mt-1 block font-sans">
                  Next charge on {billingModalClient.nextBilling} will bill this updated amount.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3 font-space">
                {/* <button
                  type="button"
                  onClick={() => alert(`Retry debit of $${newFeeValue} queued with Stripe Webhook.`)}
                  className="px-3 py-2 rounded-lg bg-[#292a2e] text-[#e3e2e8] font-semibold hover:bg-[#343439] transition-colors cursor-pointer"
                >
                  Charge Card Now
                </button> */}
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#ffb4a3] text-[#3a0900] font-bold hover:bg-[#ffdad2] transition-colors cursor-pointer shadow-[0_0_12px_rgba(255,180,163,0.4)]"
                >
                  Update Retainer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}