export type UserRole = 'coach' | 'client' | 'admin';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
}

export type SubscriptionTier = 'starter' | 'intermediate' | 'expert';

export interface CoachProfile {
  id: string;
  coach_code: string;
  tier: SubscriptionTier;
  max_clients: number;
  active_client_count: number;
  monthly_recurring_revenue: number;
}

export type ClientRiskLevel = 'healthy' | 'warning' | 'critical';

export interface ClientProfile {
  id: string;
  user: User;
  coach_code: string;
  monthly_fee: number;
  subscription_status: 'active' | 'past_due' | 'canceled';
  compliance_score: number; // 0 - 100
  last_active_at: string;
  went_dark: boolean;
  days_inactive: number;
  risk_level: ClientRiskLevel;
  current_calories: number;
  current_protein: number;
  current_carbs: number;
  current_fat: number;
}

export interface MacroPrescription {
  id: string;
  client_id: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  coach_reason: string;
  created_at: string;
}

export interface WeeklyCheckIn {
  id: string;
  client_id: string;
  weight_kg: number;
  energy_rating: number; // 1-10
  sleep_rating: number;  // 1-10
  free_text: string;
  sentiment_score?: number; // -1.0 to 1.0
  submitted_at: string;
  reviewed: boolean;
}

export interface AntiChurnAlert {
  id: string;
  client_id: string;
  client_name: string;
  type: 'went_dark' | 'metabolic_adaptation' | 'payment_failed';
  title: string;
  description: string;
  severity: 'high' | 'medium';
  created_at: string;
}
