import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { AppView } from '../App';

interface UseAuthMiddlewareOptions {
  currentView: AppView;
  navigateTo: (view: AppView) => void;
}

/**
 * Auth middleware hook — runs on every view change to enforce access rules.
 *
 * Protected views (e.g. 'dashboard') redirect to 'signup' if the user
 * is not authenticated. Conversely, authenticated users hitting 'signup'
 * are bounced to the dashboard.
 */
const PROTECTED_VIEWS: AppView[] = ['dashboard'];
const AUTH_VIEWS: AppView[] = ['signup'];

export function useAuthMiddleware({ currentView, navigateTo }: UseAuthMiddlewareOptions) {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return; // wait for auth state to resolve

    // Unauthenticated user trying to access a protected view → send to signup
    if (!isAuthenticated && PROTECTED_VIEWS.includes(currentView)) {
      navigateTo('signup');
      return;
    }

    // Authenticated user hitting signup/login → send to dashboard
    if (isAuthenticated && AUTH_VIEWS.includes(currentView)) {
      navigateTo('dashboard');
      return;
    }
  }, [currentView, isAuthenticated, isLoading, navigateTo]);

  return { isAuthenticated, isLoading };
}

