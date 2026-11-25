export type NavSection =
  | 'overview'
  | 'client-roster'
  | 'retainers'
  | 'payments'
  | 'payroll'
  | 'anti-churn-radar'
  | 'prescriptive-studio'
  | 'video-studio'
  | 'stripe-billing'
  | 'check-in-queue'
  | 'ai-messenger'
  | 'meetings'
  | 'tasks'
  | 'documents'
  | 'ai-chat'
  | 'settings';

// ── OVERVIEW DASHBOARD TYPES ──
export type DashboardTimeRange = '7D' | '30D' | '90D' | 'YTD';
export type ClientFilterState = 'all' | 'healthy' | 'warning' | 'risk';

export interface KPISummary {
  monthlyRevenue: number;
  revenueGrowth: string;
  avgRetainer: string;
  activeRetainers: number;
  maxRetainers: number;
  retentionRate: string;
  netGrowth: string;
  healthIndex: number;
  healthBenchmark: string;
  urgentAlertsCount: number;
  urgentAlertsSummary: string;
}

export interface ChartPoint {
  label: string;
  value: number;
  active: number;
}

export interface TimeRangeMetrics {
  revenue: string;
  growth: string;
  compliance: string;
  chartPoints: ChartPoint[];
}

export interface TierDistributionItem {
  tier: string;
  price: string;
  count: number;
  percentage: number;
  color: string;
}

export interface HeatmapDay {
  day: string;
  activeIndices: number[];
  peak: boolean;
}

export interface CopilotQA {
  trigger: string;
  query: string;
  response: string;
}

export interface DashboardOverviewConfig {
  kpiSummary: KPISummary;
  timeRangeData: Record<DashboardTimeRange, TimeRangeMetrics>;
  tierDistribution: TierDistributionItem[];
  checkinHeatmap: HeatmapDay[];
  copilotQAs: CopilotQA[];
}

// ── AI CHAT TYPES ──
export type AIChatRole = 'user' | 'assistant';

export interface AIChatMessage {
  id: string;
  role: AIChatRole;
  content: string;
  timestamp: string;
}

export interface AIChatThread {
  id: string;
  title: string;
  preview: string;
  model: string;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  tags: string[];
  messages: AIChatMessage[];
}

export type ChurnRiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'resolved';
export type ChurnAnomalyType = 'ghost' | 'plateau' | 'compliance_drop' | 'sentiment_drop' | 'billing_risk';
export type ChurnInterventionStatus = 'pending' | 'nudged' | 'resolved' | 'escalated';

export interface ChurnAlert {
  id: string;
  clientId: string;
  clientName: string;
  initials: string;
  focus: string;
  retainer: string;
  riskLevel: ChurnRiskLevel;
  anomalyType: ChurnAnomalyType;
  anomalyLabel: string;
  hoursInactive: number;
  daysInactive: number;
  churnProbability: number;
  complianceDrop: number;
  lastActive: string;
  sentimentScore: number;
  weightDelta: number | null;
  logStreakBroken: boolean;
  interventionStatus: ChurnInterventionStatus;
  nudgesSent: number;
  summary: string;
  suggestedIntervention: string;
  resolvedAt: string | null;
  resolvedNote: string | null;
}

export type SettingsTab = 'profile' | 'coaching' | 'billing' | 'integrations' | 'security';

export interface ClientEntry {
  id: string;
  name: string;
  focus: string;
  initials: string;
  compliance: number;
  complianceLabel: string;
  riskStatus: 'healthy' | 'plateau' | 'dark';
  riskLabel: string;
  statusBeacon: string;
  monthlyRetainer: string;
  monthlyFeeNum: number;
  tierLabel: string;
  lastActive: string;
  daysInactive: number;
  cardLast4?: string;
  nextBilling: string;
  status: 'approved' | 'waitlist' | 'unapproved';
  phone?: string;
  email?: string;
  company?: string;
  source?: 'Website' | 'Cold Call' | 'Instagram' | 'Referral' | 'Other';
  stage?: 'new' | 'contacted' | 'qualified' | 'won';
  clientType?: 'active' | 'spam';
  message?: string;
}

export type PrescriptionCategory =
  | 'macro_shift'
  | 'refeed_buffer'
  | 'metabolic_reset'
  | 'deload_recovery'
  | 'peak_week';

export type PrescriptionStatus =
  | 'active'
  | 'scheduled'
  | 'acknowledged'
  | 'archived';

export interface PrescriptionItem {
  id: string;
  clientId: string;
  clientName: string;
  timestamp: string;
  shiftTag: string;
  statusText: string;
  status: PrescriptionStatus;
  category: PrescriptionCategory;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  deltaTag?: string;
  rationale: string;
  publishedToMobile: boolean;
  notes?: string;
}

export interface TimelineShift {
  id: string;
  clientName?: string;
  timestamp: string;
  shiftTag: string;
  statusText: string;
  rationale: string;
}

export interface ClientMacroTarget {
  target: number;
  consumed: number;
  unit: string;
  note?: string;
}

export interface ClientLoggedMeal {
  id: string;
  time: string;
  title: string;
  items: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface ClientDailyHabit {
  id: string;
  label: string;
  type: 'input' | 'counter' | 'metric' | 'check';
  value?: string;
  unit?: string;
  current?: number;
  target?: number;
  completed: boolean;
  delta?: string;
  sub?: string;
}

export interface ClientDashboardData {
  clientProfile: {
    id: string;
    name: string;
    email: string;
    initials: string;
    streakDays: number;
    tierLabel: string;
    monthlyFee: string;
    status: string;
    nextBilling: string;
    coach: {
      name: string;
      title: string;
      initials: string;
      avatar?: string;
      coachCode: string;
    };
    nextSession: {
      title: string;
      date: string;
      time: string;
      duration: string;
      zoomUrl: string;
    };
  };
  todayTargets: {
    calories: ClientMacroTarget;
    protein: ClientMacroTarget;
    carbs: ClientMacroTarget;
    fat: ClientMacroTarget;
  };
  loggedMeals: ClientLoggedMeal[];
  habits: ClientDailyHabit[];
  timelineShifts: TimelineShift[];
}

export type TaskStatus = 'backlog' | 'todo' | 'in-progress' | 'in-review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskItem {
  id: string;
  title: string;
  client: string;
  priority: TaskPriority;
  status: TaskStatus;
  due: string;
  description?: string;
}

export interface MeetingItem {
  id: string;
  clientId?: string;
  client: string;
  type: string;
  date: string;
  time: string;
  duration: string;
  status: 'upcoming' | 'completed';
  notes: string;
}

export interface ChatMessage {
  id: string;
  sender: 'coach' | 'client';
  text: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
  attachment?: {
    name: string;
    size: string;
    type: 'pdf' | 'image' | 'file';
  };
}

export interface Conversation {
  id: string;
  clientId?: string;
  clientName: string;
  company?: string;
  focus?: string;
  initials: string;
  lastMessage: string;
  date: string;
  status: 'Live' | 'Offline' | 'Active';
  unreadCount?: number;
  messages: ChatMessage[];
}

export type RetainerStatus = 'active' | 'paused' | 'overdue' | 'cancelled';
export type RetainerBillingCycle = 'monthly' | 'quarterly' | 'bi-weekly' | 'annual';

export interface RetainerPlan {
  id: string;
  name: string;
  tierLabel: string;
  defaultAmount: number;
  currency: string;
  billingCycle: RetainerBillingCycle;
  description: string;
  deliverables: string[];
  badgeColor?: string;
  isArchived?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface RetainerItem {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientAvatar: string;
  tierLabel: string;
  planName: string;
  amount: number;
  currency: string;
  billingCycle: RetainerBillingCycle;
  status: RetainerStatus;
  nextBillingDate: string;
  startDate: string;
  cardBrand: string;
  cardLast4: string;
  stripeSubscriptionId: string;
  deliverables?: string[];
  notes?: string;
  lastChargedAmount?: number;
  lastChargedDate?: string;
}

export interface PaymentItem {
  id: string;
  client: string;
  amount: number;
  status: string;
  date: string;
  method: string;
  invoice: string;
}

export interface PayrollItem {
  id: string;
  name: string;
  role: string;
  salary: number;
  status: string;
  paid: string;
  next: string;
}

export type DocumentType = 'contract' | 'proposal' | 'invoice' | 'protocol';
export type DocumentStatus = 'signed' | 'pending' | 'paid' | 'sent' | 'draft';

export interface DocumentSignature {
  signedBy: string;
  signedAt: string;
  signatureType: 'draw' | 'type' | 'upload';
  signatureData: string; // canvas dataURL or cursive typed name
  certificateHash?: string;
  ipAddress?: string;
}

export interface DocumentPayment {
  paidAt: string;
  amount: string;
  method: 'card' | 'apple_pay' | 'google_pay' | 'ach';
  cardLast4?: string;
  transactionId: string;
  receiptNumber?: string;
  status: 'succeeded' | 'processing';
}

export interface DocumentItem {
  id: string;
  name: string;
  type: DocumentType;
  client: string;
  clientId?: string;
  date: string;
  status: DocumentStatus;
  size: string;
  amount?: string;
  content?: string;
  notes?: string;
  lastSentAt?: string;
  blocks?: DocumentBlock[];
  accentColor?: string;
  selectedFont?: string;
  updatedAt?: string;
  signature?: DocumentSignature;
  payment?: DocumentPayment;
}

export interface DocumentBlock {
  id: string;
  type: 'heading' | 'text' | 'pricing' | 'payment' | 'table' | 'divider' | 'box' | 'image';
  content?: string;
  imageUrl?: string;
  imageCaption?: string;
  tableData?: { headers: string[]; rows: string[][] };
  items?: { desc: string; qty: number; rate: number; total: number }[];
  style?: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  type: DocumentType;
  category: string;
  description: string;
  isPreset?: boolean;
  createdAt: string;
  defaultAmount?: string;
  blocks: DocumentBlock[];
}

export interface ProfileFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  bio: string;
  hourlyRate: number;
  currency: string;
  timezone: string;
  instagram: string;
  twitter: string;
  linkedin: string;
}

export interface SecurityFormState {
  currentPass: string;
  newPass: string;
  confirmPass: string;
  twoFactor: boolean;
  sessionTimeout: string;
}
