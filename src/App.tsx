import { useState, useEffect, useCallback } from 'react';
import LandingPage from './pages/landing/LandingPage';
import SignupPage from './pages/auth/SignupPage';
import DashboardPage from './pages/coach/DashboardPage';
import CustomCursor from './components/common/CustomCursor';
import StarCanvas from './components/common/StarCanvas';
import ScrollProgressBar from './components/common/ScrollProgressBar';
import { useAuthMiddleware } from './middleware/useAuthMiddleware';
import PageLoader from './components/common/PageLoader';

export type AppView = 'landing' | 'signup' | 'dashboard';

const HASH_TO_VIEW: Record<string, AppView> = {
  '#signup': 'signup',
  '#login': 'signup',
  '#dashboard': 'dashboard',
};

function hashToView(hash: string): AppView {
  const normalized = hash.toLowerCase();
  for (const [key, view] of Object.entries(HASH_TO_VIEW)) {
    if (normalized.startsWith(key)) return view;
  }
  return 'landing';
}

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(() => hashToView(window.location.hash));

  // Stable navigate function for the middleware
  const navigateTo = useCallback((view: AppView) => {
    setCurrentView(view);
    window.location.hash = view === 'landing' ? '' : view;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Auth middleware — guards protected views and redirects authenticated users
  useAuthMiddleware({ currentView, navigateTo });

  // Synchronize router state with browser URL hash
  useEffect(() => {
    const handleHashChange = () => setCurrentView(hashToView(window.location.hash));
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <>
      {/* ── CUSTOM MOUSE CURSOR WITH CIRCLE FOLLOWER ── */}
      <CustomCursor />

      {/* ── INITIAL EDITORIAL ENTRANCE LOADER ── */}
      <PageLoader />

      {/* ── FIXED STARFIELD + BOTTOM LIGHT RAYS (behind landing/signup, excluded from executive dashboard) ── */}
      {currentView !== 'dashboard' && <StarCanvas />}

      {/* ── SCROLL PROGRESS HAIRLINE (above header, z-60) ── */}
      <ScrollProgressBar />

      {/* ── APP VIEWS ── */}
      {currentView === 'signup' && (
        <SignupPage onNavigate={navigateTo} onSuccess={() => navigateTo('dashboard')} />
      )}
      {currentView === 'dashboard' && (
        <DashboardPage onNavigate={navigateTo} />
      )}
      {currentView === 'landing' && (
        <LandingPage onNavigate={navigateTo} />
      )}
    </>
  );
}
