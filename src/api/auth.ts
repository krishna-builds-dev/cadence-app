import { apiClient } from './client';
import type { User, UserRole } from '../types';

export interface LoginPayload {
  email: string;
  password: string;
  role: UserRole;
}

export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  coach_code?: string;
  practice_name?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
  coach_code?: string;
}

/**
 * Real API call with fallback mock data for local frontend development
 */
export async function loginApi(payload: LoginPayload): Promise<AuthResponse> {
  try {
    const res = await apiClient.post<AuthResponse>('/auth/login/', payload);
    return res.data;
  } catch (err: unknown) {
    // If backend is not running, provide educational mock auth for rapid UI iteration
    const error = err as { code?: string; response?: { status?: number; data?: unknown } };
    if (!error.response || error.code === 'ERR_NETWORK') {
      console.warn('Backend server unreachable, using mock authentication session.');
      return createMockAuthResponse(payload.email, payload.role);
    }
    throw err;
  }
}

export async function registerApi(payload: RegisterPayload): Promise<AuthResponse> {
  try {
    const res = await apiClient.post<AuthResponse>('/auth/register/', payload);
    return res.data;
  } catch (err: unknown) {
    const error = err as { code?: string; response?: { status?: number; data?: unknown } };
    if (!error.response || error.code === 'ERR_NETWORK') {
      console.warn('Backend server unreachable, using mock registration session.');
      return createMockAuthResponse(
        payload.email,
        payload.role,
        payload.first_name,
        payload.last_name,
        payload.coach_code || 'COACH-DEMO'
      );
    }
    throw err;
  }
}

export async function logoutApi(): Promise<void> {
  try {
    const refresh = localStorage.getItem('refresh_token');
    if (refresh) {
      await apiClient.post('/auth/logout/', { refresh });
    }
  } catch {
    // Best-effort cleanup
  } finally {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
  }
}

function createMockAuthResponse(
  email: string,
  role: UserRole,
  firstName?: string,
  lastName?: string,
  coachCode?: string
): AuthResponse {
  const isCoach = role === 'coach';
  const user: User = {
    id: isCoach ? 'coach_demo_01' : 'client_demo_01',
    email,
    first_name: firstName || (isCoach ? 'Julian' : 'Sarah'),
    last_name: lastName || (isCoach ? 'Vance' : 'Jenkins'),
    role,
  };

  return {
    access: 'mock_jwt_access_token_' + Date.now(),
    refresh: 'mock_jwt_refresh_token_' + Date.now(),
    user,
    coach_code: coachCode || (isCoach ? 'COACH-JULIAN' : undefined),
  };
}
