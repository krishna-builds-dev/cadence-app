import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { User, UserRole } from '../types';
import { loginApi, registerApi, logoutApi, type LoginPayload, type RegisterPayload } from '../api/auth';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedFields: Partial<User>) => void;
  coachCode?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [coachCode, setCoachCode] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('auth_user');
      const token = localStorage.getItem('access_token');
      const storedCoachCode = localStorage.getItem('coach_code');

      if (token && storedUser) {
        setUser(JSON.parse(storedUser));
        if (storedCoachCode) setCoachCode(storedCoachCode);
      }
    } catch (e) {
      console.error('Failed to parse cached auth session', e);
      localStorage.clear();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const response = await loginApi(payload);
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
      if (response.coach_code) {
        localStorage.setItem('coach_code', response.coach_code);
        setCoachCode(response.coach_code);
      }
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      const response = await registerApi(payload);
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
      if (response.coach_code) {
        localStorage.setItem('coach_code', response.coach_code);
        setCoachCode(response.coach_code);
      }
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutApi();
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('coach_code');
      try {
        sessionStorage.clear();
      } catch {}
      setUser(null);
      setCoachCode(undefined);
      setIsLoading(false);
    }
  };

  const updateUser = (updatedFields: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const merged = { ...prev, ...updatedFields };
      localStorage.setItem('auth_user', JSON.stringify(merged));
      return merged;
    });
  };

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      logout,
      updateUser,
      coachCode,
    }),
    [user, isLoading, coachCode]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
