import React, { useState, useEffect } from 'react';
import type {
  ClientDashboardData,
  ClientLoggedMeal,
} from '../../types/dashboard';
import initialClientData from '../../data/clientDashboard.json';

interface ClientOverviewSectionProps {
  onJoinCall?: () => void;
  onMessageCoach?: () => void;
}

const SESSION_CLIENT_OVERVIEW_KEY = 'cadence_session_client_overview';

export default function ClientOverviewSection({
  onJoinCall,
  onMessageCoach,
}: ClientOverviewSectionProps) {
  // Sync state with sessionStorage
  const [data, setData] = useState<ClientDashboardData>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_CLIENT_OVERVIEW_KEY);
      if (stored) return JSON.parse(stored) as ClientDashboardData;
    } catch {}
    return initialClientData as ClientDashboardData;
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_CLIENT_OVERVIEW_KEY, JSON.stringify(data));
    } catch {}
  }, [data]);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Quick Log Meal Modal State
  const [showLogMealModal, setShowLogMealModal] = useState(false);
  const [mealTitle, setMealTitle] = useState('Snack / Intra-Workout');
  const [mealItems, setMealItems] = useState('');
  const [mealCalories, setMealCalories] = useState<number>(250);
  const [mealProtein, setMealProtein] = useState<number>(25);
  const [mealCarbs, setMealCarbs] = useState<number>(30);
  const [mealFat, setMealFat] = useState<number>(5);

  // Quick weight input
  const [weightInput, setWeightInput] = useState(
    data.habits.find((h) => h.id === 'h1')?.value || '64.2'
  );
  const [isEditingWeight, setIsEditingWeight] = useState(false);

  // CGM Input
  const [cgmInput, setCgmInput] = useState(
    data.habits.find((h) => h.id === 'h2')?.value || '91'
  );
  const [isEditingCgm, setIsEditingCgm] = useState(false);

  // Toggle shift history accordion
  const [showShiftHistory, setShowShiftHistory] = useState(false);

  // Toggle meal log list
  const [showMealHistory, setShowMealHistory] = useState(false);

  // ── Handlers ──
  const handleSaveWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(weightInput);
    if (isNaN(val) || val <= 0) return;

    setData((prev) => ({
      ...prev,
      habits: prev.habits.map((h) =>
        h.id === 'h1'
          ? {
              ...h,
              value: val.toFixed(1),
              completed: true,
              delta: `${(val - 64.5).toFixed(1)}kg vs 7d baseline`,
            }
          : h
      ),
    }));
    setIsEditingWeight(false);
    showToast(`✓ Morning weight logged: ${val.toFixed(1)} kg`);
  };

  const handleSaveCgm = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(cgmInput, 10);
    if (isNaN(val) || val <= 0) return;

    setData((prev) => ({
      ...prev,
      habits: prev.habits.map((h) =>
        h.id === 'h2'
          ? {
              ...h,
              value: val.toString(),
              completed: true,
              delta: val <= 99 ? 'Optimal baseline' : 'Slight elevation',
            }
          : h
      ),
    }));
    setIsEditingCgm(false);
    showToast(`✓ CGM fasting glucose logged: ${val} mg/dL`);
  };

  const handleUpdateWater = (delta: number) => {
    setData((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => {
        if (h.id === 'h3') {
          const current = Math.max(0, Math.min(12, (h.current || 0) + delta));
          return {
            ...h,
            current,
            completed: current >= (h.target || 8),
          };
        }
        return h;
      }),
    }));
  };

  const handleToggleHabit = (habitId: string) => {
    setData((prev) => ({
      ...prev,
      habits: prev.habits.map((h) =>
        h.id === habitId ? { ...h, completed: !h.completed } : h
      ),
    }));
  };

  const handleAddMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealItems.trim()) {
      alert('Please describe what you consumed.');
      return;
    }

    const newMeal: ClientLoggedMeal = {
      id: 'm_' + Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: mealTitle.trim(),
      items: mealItems.trim(),
      calories: Number(mealCalories) || 0,
      protein: Number(mealProtein) || 0,
      carbs: Number(mealCarbs) || 0,
      fat: Number(mealFat) || 0,
    };

    setData((prev) => ({
      ...prev,
      todayTargets: {
        calories: {
          ...prev.todayTargets.calories,
          consumed: prev.todayTargets.calories.consumed + newMeal.calories,
        },
        protein: {
          ...prev.todayTargets.protein,
          consumed: prev.todayTargets.protein.consumed + newMeal.protein,
        },
        carbs: {
          ...prev.todayTargets.carbs,
          consumed: prev.todayTargets.carbs.consumed + newMeal.carbs,
        },
        fat: {
          ...prev.todayTargets.fat,
          consumed: prev.todayTargets.fat.consumed + newMeal.fat,
        },
      },
      loggedMeals: [newMeal, ...prev.loggedMeals],
    }));

    setShowLogMealModal(false);
    setMealItems('');
    setMealCalories(250);
    setMealProtein(25);
    setMealCarbs(30);
    setMealFat(5);
    showToast(`✓ Logged ${newMeal.title} (+${newMeal.calories} kcal)`);
  };

  const handleDeleteMeal = (mealId: string) => {
    const meal = data.loggedMeals.find((m) => m.id === mealId);
    if (!meal) return;

    setData((prev) => ({
      ...prev,
      todayTargets: {
        calories: {
          ...prev.todayTargets.calories,
          consumed: Math.max(0, prev.todayTargets.calories.consumed - meal.calories),
        },
        protein: {
          ...prev.todayTargets.protein,
          consumed: Math.max(0, prev.todayTargets.protein.consumed - meal.protein),
        },
        carbs: {
          ...prev.todayTargets.carbs,
          consumed: Math.max(0, prev.todayTargets.carbs.consumed - meal.carbs),
        },
        fat: {
          ...prev.todayTargets.fat,
          consumed: Math.max(0, prev.todayTargets.fat.consumed - meal.fat),
        },
      },
      loggedMeals: prev.loggedMeals.filter((m) => m.id !== mealId),
    }));
    showToast(`Meal removed from log.`);
  };

  // Helper for Circular Ring Gauge
  const renderCircleGauge = (
    consumed: number,
    target: number,
    color: string,
    radius = 32,
    stroke = 6
  ) => {
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const percentage = Math.min(100, Math.round((consumed / target) * 100));
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
        <circle
          stroke="#292a2e"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
    );
  };

  const { clientProfile, todayTargets, loggedMeals, habits, timelineShifts } = data;
  const currentShift = timelineShifts[0];
  const waterHabit = habits.find((h) => h.id === 'h3');

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-[#003824] border border-[#4edea3]/40 text-[#4edea3] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 font-space text-xs animate-bounce">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── HERO BANNER: CLIENT WELCOME & COACH CONNECTION ── */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#141519] via-[#1a1b20] to-[#141519] border border-[#292a2e]/70 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden">
        {/* Subtle ambient glow in corner */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#ffb4a3]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start sm:items-center gap-4 z-10">
          {/* Avatar with Streak Badge */}
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#e85a2b] via-[#ffb4a3] to-[#ffdad2] text-[#3a0900] flex items-center justify-center font-space font-bold text-xl shadow-md">
              {clientProfile.initials}
            </div>
            <div
              className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-[#121317] border border-[#4edea3]/50 text-[#4edea3] font-mono text-[10px] font-bold flex items-center gap-0.5 shadow"
              title="14-Day Consecutive Protocol Compliance"
            >
              <span>🔥</span>
              <span>{clientProfile.streakDays}d</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-space text-2xl font-bold text-[#e3e2e8]">
                Welcome back, {clientProfile.name.split(' ')[0]}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-space font-bold uppercase tracking-wider bg-[#003824] text-[#4edea3] border border-[#4edea3]/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
                <span>Protocol Active</span>
              </span>
            </div>

            <p className="text-xs text-[#958ea0] font-sans mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>Coached 1-on-1 by</span>
              <span className="font-semibold text-[#ffdad2]">{clientProfile.coach.name}</span>
              <span className="text-[#958ea0]/40">·</span>
              <span className="text-[11px] font-mono text-[#cbc3d7]">
                Pairing Code: {clientProfile.coach.coachCode}
              </span>
            </p>

            <div className="flex items-center gap-3 mt-2 text-xs font-space text-[#958ea0] flex-wrap">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-[#ffb4a3]">calendar_today</span>
                <span>Next Session: {clientProfile.nextSession.date}</span>
              </span>
              <span className="text-[#958ea0]/40">·</span>
              <span className="text-[#4edea3] font-semibold">{clientProfile.tierLabel}</span>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap z-10">
          <button
            type="button"
            onClick={onJoinCall}
            className="h-10 px-4 rounded-xl bg-[#ffb4a3] text-[#3a0900] hover:bg-[#ffdad2] font-space font-bold text-xs flex items-center gap-2 transition-all shadow-[0_0_16px_rgba(255,180,163,0.35)] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">videocam</span>
            <span>Join 1-on-1 Call</span>
          </button>

          <button
            type="button"
            onClick={onMessageCoach}
            className="h-10 px-3.5 rounded-xl border border-[#292a2e] bg-[#0d0e12] hover:bg-[#1f2026] hover:border-[#ffb4a3]/40 text-[#e3e2e8] font-space font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px] text-[#ffb4a3]">chat</span>
            <span>Message Coach</span>
          </button>

          
        </div>
      </div>

      {/* ── SECTION 1: TODAY'S PRESCRIBED TARGETS (PROGRESS GAUGES) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ffb4a3] text-[18px]">nutrition</span>
            <h2 className="font-space text-sm font-bold text-[#e3e2e8] uppercase tracking-wider">
              Today&apos;s Prescribed Targets
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowMealHistory(!showMealHistory)}
            className="text-xs font-space font-semibold text-[#ffb4a3] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{showMealHistory ? 'Hide Meal Ledger' : 'View Today&apos;s Meals'}</span>
            <span className="material-symbols-outlined text-[15px]">
              {showMealHistory ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>

        {/* 4 Macro Cards with Circular Ring Gauges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Calories Card */}
          <div className="p-4 rounded-xl bg-[#141519] border border-[#292a2e]/60 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[10px] font-space uppercase text-[#958ea0] tracking-wider font-bold">
                Calories
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-space text-2xl font-bold text-[#e3e2e8]">
                  {todayTargets.calories.consumed.toLocaleString()}
                </span>
                <span className="text-xs text-[#958ea0] font-mono">
                  / {todayTargets.calories.target.toLocaleString()} kcal
                </span>
              </div>
              <div className="text-[11px] text-[#4edea3] font-space mt-1">
                {Math.max(0, todayTargets.calories.target - todayTargets.calories.consumed)} kcal remaining
              </div>
            </div>
            <div className="relative flex items-center justify-center">
              {renderCircleGauge(
                todayTargets.calories.consumed,
                todayTargets.calories.target,
                '#ffb4a3'
              )}
              <span className="absolute font-space text-[11px] font-bold text-[#ffdad2]">
                {Math.round((todayTargets.calories.consumed / todayTargets.calories.target) * 100)}%
              </span>
            </div>
          </div>

          {/* Protein Card */}
          <div className="p-4 rounded-xl bg-[#141519] border border-[#292a2e]/60 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[10px] font-space uppercase text-[#958ea0] tracking-wider font-bold">
                Protein
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-space text-2xl font-bold text-[#ffdad2]">
                  {todayTargets.protein.consumed}g
                </span>
                <span className="text-xs text-[#958ea0] font-mono">
                  / {todayTargets.protein.target}g
                </span>
              </div>
              <div className="text-[11px] text-[#ffdad2] font-space mt-1">
                {todayTargets.protein.note || 'High Satiety Target'}
              </div>
            </div>
            <div className="relative flex items-center justify-center">
              {renderCircleGauge(
                todayTargets.protein.consumed,
                todayTargets.protein.target,
                '#e85a2b'
              )}
              <span className="absolute font-space text-[11px] font-bold text-[#ffdad2]">
                {Math.round((todayTargets.protein.consumed / todayTargets.protein.target) * 100)}%
              </span>
            </div>
          </div>

          {/* Carbs Card */}
          <div className="p-4 rounded-xl bg-[#141519] border border-[#292a2e]/60 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[10px] font-space uppercase text-[#958ea0] tracking-wider font-bold">
                Carbohydrates
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-space text-2xl font-bold text-[#4edea3]">
                  {todayTargets.carbs.consumed}g
                </span>
                <span className="text-xs text-[#958ea0] font-mono">
                  / {todayTargets.carbs.target}g
                </span>
              </div>
              <div className="text-[11px] text-[#4edea3] font-space mt-1">
                {todayTargets.carbs.note || 'Fueling Window Active'}
              </div>
            </div>
            <div className="relative flex items-center justify-center">
              {renderCircleGauge(
                todayTargets.carbs.consumed,
                todayTargets.carbs.target,
                '#4edea3'
              )}
              <span className="absolute font-space text-[11px] font-bold text-[#4edea3]">
                {Math.round((todayTargets.carbs.consumed / todayTargets.carbs.target) * 100)}%
              </span>
            </div>
          </div>

          {/* Fat Card */}
          <div className="p-4 rounded-xl bg-[#141519] border border-[#292a2e]/60 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[10px] font-space uppercase text-[#958ea0] tracking-wider font-bold">
                Healthy Fats
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-space text-2xl font-bold text-[#60a5fa]">
                  {todayTargets.fat.consumed}g
                </span>
                <span className="text-xs text-[#958ea0] font-mono">
                  / {todayTargets.fat.target}g
                </span>
              </div>
              <div className="text-[11px] text-[#60a5fa] font-space mt-1">
                {todayTargets.fat.note || 'Essential Lipids'}
              </div>
            </div>
            <div className="relative flex items-center justify-center">
              {renderCircleGauge(
                todayTargets.fat.consumed,
                todayTargets.fat.target,
                '#60a5fa'
              )}
              <span className="absolute font-space text-[11px] font-bold text-[#60a5fa]">
                {Math.round((todayTargets.fat.consumed / todayTargets.fat.target) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Collapsible Logged Meals List */}
        {showMealHistory && (
          <div className="p-4 rounded-xl bg-[#141519] border border-[#292a2e]/60 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#292a2e]/60">
              <span className="text-xs font-space font-bold text-[#e3e2e8]">
                Logged Meals Today ({loggedMeals.length})
              </span>
              <button
                type="button"
                onClick={() => setShowLogMealModal(true)}
                className="text-xs font-space text-[#ffb4a3] hover:underline"
              >
                + Add Another Meal
              </button>
            </div>
            <div className="space-y-2">
              {loggedMeals.map((meal) => (
                <div
                  key={meal.id}
                  className="p-3 rounded-lg bg-[#0d0e12] border border-[#292a2e]/50 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-space font-bold text-[#e3e2e8]">{meal.title}</span>
                      <span className="text-[10px] font-mono text-[#958ea0]">{meal.time}</span>
                    </div>
                    <p className="text-[11px] text-[#cbc3d7] font-sans truncate mt-0.5">
                      {meal.items}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px] flex-shrink-0">
                    <span className="text-[#ffdad2] font-bold">{meal.calories} kcal</span>
                    <span className="text-[#958ea0] hidden sm:inline">
                      P: {meal.protein}g · C: {meal.carbs}g · F: {meal.fat}g
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteMeal(meal.id)}
                      className="text-[#958ea0] hover:text-[#ff5449] p-1 rounded transition-colors cursor-pointer"
                      title="Delete meal"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 2: PILLAR 4 COACH REASONING FEED ("WHY MY PLAN CHANGED") ── */}
      {currentShift && (
        <div className="p-5 rounded-2xl bg-[#141519] border border-[#ffb4a3]/30 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#292a2e]/60">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ffb4a3] text-[20px]">
                tips_and_updates
              </span>
              <div>
                <h3 className="font-space font-bold text-sm text-[#e3e2e8]">
                  Why My Plan Changed
                </h3>
                <span className="text-[11px] text-[#958ea0] font-sans">
                  Direct clinical rationale from Coach {clientProfile.coach.name}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-space font-bold uppercase bg-[#ffb4a3]/15 text-[#ffdad2] border border-[#ffb4a3]/30">
                {currentShift.shiftTag}
              </span>
              <button
                type="button"
                onClick={() => setShowShiftHistory(!showShiftHistory)}
                className="text-xs font-space font-semibold text-[#958ea0] hover:text-[#e3e2e8] underline cursor-pointer"
              >
                {showShiftHistory ? 'Hide History' : 'View Shift Log'}
              </button>
            </div>
          </div>

          {/* Current Rationale Card */}
          <div className="p-4 rounded-xl bg-[#0d0e12] border-l-4 border-[#ffb4a3] space-y-2">
            <div className="flex items-center justify-between text-xs text-[#958ea0] font-space">
              <span className="text-[#ffdad2] font-bold">{currentShift.statusText}</span>
              <span>{currentShift.timestamp}</span>
            </div>
            <p className="text-xs text-[#e3e2e8] font-sans leading-relaxed italic">
              &quot;{currentShift.rationale}&quot;
            </p>
          </div>

          {/* Historical shifts accordion */}
          {showShiftHistory && (
            <div className="space-y-2.5 pt-2 border-t border-[#292a2e]/60">
              <span className="text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] block">
                Previous Protocol Shifts
              </span>
              {timelineShifts.slice(1).map((shift) => (
                <div
                  key={shift.id}
                  className="p-3 rounded-lg bg-[#0d0e12] border border-[#292a2e]/50 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between text-[11px] font-space text-[#958ea0]">
                    <span className="text-[#cbc3d7] font-semibold">{shift.shiftTag}</span>
                    <span>{shift.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-[#cbc3d7] font-sans italic leading-relaxed">
                    &quot;{shift.rationale}&quot;
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SECTION 3: DAILY HABIT & BIOMETRICS TELEMETRY CHECKLIST ── */}
      <div className="p-5 rounded-2xl bg-[#141519] border border-[#292a2e]/60 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#292a2e]/60">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4edea3] text-[20px]">
              checklist_rtl
            </span>
            <div>
              <h3 className="font-space font-bold text-sm text-[#e3e2e8]">
                Daily Habit &amp; Biometrics Telemetry
              </h3>
              <p className="text-[11px] text-[#958ea0]">
                Sync daily biometrics so Coach {clientProfile.coach.name} can detect recovery shifts
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-[#4edea3] font-bold">
            {habits.filter((h) => h.completed).length}/{habits.length} Completed Today
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Habit 1: Scale Weight */}
          <div className="p-3.5 rounded-xl bg-[#0d0e12] border border-[#292a2e] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleToggleHabit('h1')}
                className={`w-6 h-6 rounded-lg border flex items-center justify-center cursor-pointer transition-colors ${
                  habits.find((h) => h.id === 'h1')?.completed
                    ? 'bg-[#4edea3] border-[#4edea3] text-[#0d0e12]'
                    : 'border-[#292a2e] text-transparent hover:border-[#4edea3]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] font-bold">check</span>
              </button>
              <div>
                <span className="font-space font-semibold text-[#e3e2e8] block">
                  Morning Fasting Scale Weight
                </span>
                <span className="text-[10px] text-[#958ea0] font-sans">
                  {habits.find((h) => h.id === 'h1')?.delta || 'Enter today&apos;s morning scale value'}
                </span>
              </div>
            </div>

            {isEditingWeight ? (
              <form onSubmit={handleSaveWeight} className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.1"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="w-16 px-2 py-1 bg-[#1a1b20] border border-[#ffb4a3] text-center font-mono font-bold text-xs text-[#e3e2e8] rounded-lg focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-2 py-1 bg-[#ffb4a3] text-[#3a0900] text-[10px] font-space font-bold rounded-lg cursor-pointer"
                >
                  Save
                </button>
              </form>
            ) : (
              <div
                onClick={() => setIsEditingWeight(true)}
                className="font-mono font-bold text-sm text-[#4edea3] cursor-pointer hover:underline flex items-center gap-1"
                title="Click to edit weight"
              >
                <span>{habits.find((h) => h.id === 'h1')?.value} kg</span>
                <span className="material-symbols-outlined text-[13px] text-[#958ea0]">edit</span>
              </div>
            )}
          </div>

          {/* Habit 2: CGM Fasting Glucose */}
          <div className="p-3.5 rounded-xl bg-[#0d0e12] border border-[#292a2e] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleToggleHabit('h2')}
                className={`w-6 h-6 rounded-lg border flex items-center justify-center cursor-pointer transition-colors ${
                  habits.find((h) => h.id === 'h2')?.completed
                    ? 'bg-[#4edea3] border-[#4edea3] text-[#0d0e12]'
                    : 'border-[#292a2e] text-transparent hover:border-[#4edea3]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] font-bold">check</span>
              </button>
              <div>
                <span className="font-space font-semibold text-[#e3e2e8] block">
                  CGM Fasting Blood Glucose
                </span>
                <span className="text-[10px] text-[#958ea0] font-sans">
                  Target: 70–99 mg/dL
                </span>
              </div>
            </div>

            {isEditingCgm ? (
              <form onSubmit={handleSaveCgm} className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={cgmInput}
                  onChange={(e) => setCgmInput(e.target.value)}
                  className="w-16 px-2 py-1 bg-[#1a1b20] border border-[#ffb4a3] text-center font-mono font-bold text-xs text-[#e3e2e8] rounded-lg focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-2 py-1 bg-[#ffb4a3] text-[#3a0900] text-[10px] font-space font-bold rounded-lg cursor-pointer"
                >
                  Save
                </button>
              </form>
            ) : (
              <div
                onClick={() => setIsEditingCgm(true)}
                className="font-mono font-bold text-sm text-[#4edea3] cursor-pointer hover:underline flex items-center gap-1"
                title="Click to edit CGM value"
              >
                <span>{habits.find((h) => h.id === 'h2')?.value} mg/dL</span>
                <span className="material-symbols-outlined text-[13px] text-[#958ea0]">edit</span>
              </div>
            )}
          </div>

          {/* Habit 3: Hydration Target */}
          <div className="p-3.5 rounded-xl bg-[#0d0e12] border border-[#292a2e] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px] text-[#60a5fa]">
                water_drop
              </span>
              <div>
                <span className="font-space font-semibold text-[#e3e2e8] block">
                  Hydration Target (2.5L)
                </span>
                <span className="text-[10px] text-[#958ea0] font-sans">
                  {waterHabit?.current || 6} of {waterHabit?.target || 8} glasses logged
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleUpdateWater(-1)}
                className="w-6 h-6 rounded bg-[#1a1b20] hover:bg-[#292a2e] text-[#e3e2e8] font-bold text-xs flex items-center justify-center cursor-pointer"
              >
                -
              </button>
              <span className="font-mono font-bold text-xs text-[#60a5fa] px-1.5">
                {waterHabit?.current || 6} / {waterHabit?.target || 8}
              </span>
              <button
                type="button"
                onClick={() => handleUpdateWater(1)}
                className="w-6 h-6 rounded bg-[#1a1b20] hover:bg-[#292a2e] text-[#e3e2e8] font-bold text-xs flex items-center justify-center cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Habit 4: Sleep & Recovery */}
          <div className="p-3.5 rounded-xl bg-[#0d0e12] border border-[#292a2e] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px] text-[#c084fc]">
                bedtime
              </span>
              <div>
                <span className="font-space font-semibold text-[#e3e2e8] block">
                  Sleep &amp; Wearable Telemetry
                </span>
                <span className="text-[10px] text-[#958ea0] font-sans">
                  {habits.find((h) => h.id === 'h4')?.sub || 'Whoop / Oura Synced'}
                </span>
              </div>
            </div>
            <span className="font-mono font-bold text-xs text-[#c084fc]">
              {habits.find((h) => h.id === 'h4')?.value || '7.9 hrs'}
            </span>
          </div>

          {/* Habit 5: Workout Intra-Fueling Checkbox */}
          <div className="p-3.5 rounded-xl bg-[#0d0e12] border border-[#292a2e] flex items-center justify-between gap-3 md:col-span-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleToggleHabit('h5')}
                className={`w-6 h-6 rounded-lg border flex items-center justify-center cursor-pointer transition-colors ${
                  habits.find((h) => h.id === 'h5')?.completed
                    ? 'bg-[#4edea3] border-[#4edea3] text-[#0d0e12]'
                    : 'border-[#292a2e] text-transparent hover:border-[#4edea3]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] font-bold">check</span>
              </button>
              <div>
                <span className="font-space font-semibold text-[#e3e2e8] block">
                  Workout Intra-Fueling &amp; Electrolyte Protocol
                </span>
                <span className="text-[10px] text-[#958ea0] font-sans">
                  Sodium buffer + cyclic dextrin consumed during high-output sessions
                </span>
              </div>
            </div>
            <span
              className={`text-[10px] font-space font-bold uppercase px-2 py-0.5 rounded-full ${
                habits.find((h) => h.id === 'h5')?.completed
                  ? 'bg-[#4edea3]/15 text-[#4edea3]'
                  : 'bg-[#292a2e] text-[#958ea0]'
              }`}
            >
              {habits.find((h) => h.id === 'h5')?.completed ? 'Completed' : 'Pending Training'}
            </span>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: NEXT 1-ON-1 MEETING & RETAINER CARD ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Next Strategy Call */}
        <div className="p-5 rounded-2xl bg-[#141519] border border-[#292a2e]/60 space-y-3 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-space uppercase text-[#958ea0] tracking-wider font-bold">
                Upcoming Strategy Consultation
              </span>
              <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-ping" />
            </div>
            <h4 className="font-space font-bold text-base text-[#e3e2e8] mt-1">
              {clientProfile.nextSession.title}
            </h4>
            <div className="flex items-center gap-2 mt-2 text-xs text-[#cbc3d7] font-space">
              <span className="material-symbols-outlined text-[16px] text-[#ffb4a3]">event</span>
              <span>{clientProfile.nextSession.date}</span>
              <span className="text-[#958ea0]">·</span>
              <span>{clientProfile.nextSession.time}</span>
            </div>
            <p className="text-[11px] text-[#958ea0] font-sans mt-2">
              Agenda: Review biometrics trends, DEXA progress, and next cycle carb periodization.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-[#292a2e]/60">
            <span className="text-[11px] font-mono text-[#958ea0]">Duration: 45 min</span>
            <button
              type="button"
              onClick={onJoinCall}
              className="px-3.5 py-1.5 rounded-xl bg-[#ffb4a3] text-[#3a0900] hover:bg-[#ffdad2] font-space font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[15px]">videocam</span>
              <span>Join Room</span>
            </button>
          </div>
        </div>

        {/* Retainer & Agreement Status */}
        <div className="p-5 rounded-2xl bg-[#141519] border border-[#292a2e]/60 space-y-3 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-space uppercase text-[#958ea0] tracking-wider font-bold">
                Active Agreement &amp; Invoicing
              </span>
              <span className="material-symbols-outlined text-[16px] text-[#4edea3]">verified</span>
            </div>
            <h4 className="font-space font-bold text-base text-[#e3e2e8] mt-1">
              {clientProfile.tierLabel}
            </h4>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono font-bold text-xl text-[#4edea3]">
                {clientProfile.monthlyFee}
              </span>
              <span className="text-xs text-[#958ea0] font-space">Automated Stripe Subscription</span>
            </div>
            <p className="text-[11px] text-[#958ea0] font-sans mt-2">
              Next scheduled auto-debit: <span className="text-[#e3e2e8]">{clientProfile.nextBilling}</span>. Includes 24/7 async messaging and weekly protocol adjustments.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-[#292a2e]/60">
            <span className="text-[11px] font-mono text-[#4edea3]">Status: Active</span>
            <span className="text-[10px] text-[#958ea0] font-space">Visa •••• 8831</span>
          </div>
        </div>
      </div>

      {/* ── MODAL: QUICK LOG MEAL ── */}
      {showLogMealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans animate-fade-in">
          <div className="bg-[#141519] border border-[#292a2e] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[#292a2e] flex items-center justify-between bg-[#1a1b20]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#e85a2b]/20 border border-[#e85a2b]/40 flex items-center justify-center text-[#e85a2b]">
                  <span className="material-symbols-outlined text-[18px]">restaurant</span>
                </div>
                <div>
                  <h3 className="font-space font-bold text-sm text-[#e3e2e8]">Log Meal / Snack</h3>
                  <p className="text-[11px] text-[#958ea0]">Track today&apos;s macronutrient intake</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLogMealModal(false)}
                className="text-[#958ea0] hover:text-white p-1 rounded-lg hover:bg-[#25262c] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAddMeal} className="p-6 space-y-4 text-xs">
              {/* Meal Category */}
              <div>
                <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                  Meal Category
                </label>
                <select
                  value={mealTitle}
                  onChange={(e) => setMealTitle(e.target.value)}
                  className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-3 py-2 text-xs text-[#e3e2e8] focus:outline-none font-space cursor-pointer"
                >
                  <option value="Breakfast / Pre-Fuel">Breakfast / Pre-Fuel</option>
                  <option value="Lunch / Re-Feed">Lunch / Re-Feed</option>
                  <option value="Dinner / Restoration">Dinner / Restoration</option>
                  <option value="Pre-Workout Fuel">Pre-Workout Fuel</option>
                  <option value="Post-Workout Recovery">Post-Workout Recovery</option>
                  <option value="Snack / Intra-Workout">Snack / Intra-Workout</option>
                </select>
              </div>

              {/* Meal Description */}
              <div>
                <label className="block text-[11px] font-space font-bold uppercase tracking-wider text-[#958ea0] mb-1.5">
                  What did you eat? *
                </label>
                <textarea
                  rows={2}
                  required
                  value={mealItems}
                  onChange={(e) => setMealItems(e.target.value)}
                  placeholder="e.g. 180g salmon, sweet potato, avocado & asparagus"
                  className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-3.5 py-2 text-xs text-[#e3e2e8] focus:outline-none font-sans resize-none"
                />
              </div>

              {/* Macros 4-column input */}
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] font-space font-bold uppercase text-[#958ea0] mb-1">
                    Calories
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={mealCalories}
                    onChange={(e) => setMealCalories(Number(e.target.value))}
                    className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-2 py-1.5 text-center font-mono font-bold text-xs text-[#ffdad2] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-space font-bold uppercase text-[#958ea0] mb-1">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={mealProtein}
                    onChange={(e) => setMealProtein(Number(e.target.value))}
                    className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-2 py-1.5 text-center font-mono font-bold text-xs text-[#ffdad2] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-space font-bold uppercase text-[#958ea0] mb-1">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={mealCarbs}
                    onChange={(e) => setMealCarbs(Number(e.target.value))}
                    className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-2 py-1.5 text-center font-mono font-bold text-xs text-[#4edea3] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-space font-bold uppercase text-[#958ea0] mb-1">
                    Fat (g)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={mealFat}
                    onChange={(e) => setMealFat(Number(e.target.value))}
                    className="w-full bg-[#0d0e12] border border-[#292a2e] focus:border-[#ffb4a3] rounded-xl px-2 py-1.5 text-center font-mono font-bold text-xs text-[#60a5fa] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogMealModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#292a2e] text-xs font-space font-semibold text-[#958ea0] hover:text-[#e3e2e8] hover:bg-[#1a1b20] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#e85a2b] hover:bg-[#ff6b3d] text-white text-xs font-space font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Add to Today&apos;s Log</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
