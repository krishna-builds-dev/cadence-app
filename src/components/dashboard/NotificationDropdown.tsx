import { useState, useRef, useEffect } from 'react';
import type { NavSection } from '../../types/dashboard';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  type: 'urgent' | 'checkin' | 'billing' | 'meeting';
  targetSection?: NavSection;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Alexander Wright — 3 Days Dark',
    message: 'HRV dropped 22% and bio-telemetry check-in overdue.',
    time: '12m ago',
    unread: true,
    type: 'urgent',
    targetSection: 'anti-churn-radar',
  },
  {
    id: 'notif-2',
    title: 'Elena Rostova Submitted Week 7',
    message: 'Check-in submitted: HRV 64ms, Sleep 8.2h. Ready for macro review.',
    time: '45m ago',
    unread: true,
    type: 'checkin',
    targetSection: 'check-in-queue',
  },
  {
    id: 'notif-3',
    title: 'Retainer Auto-Debit Cleared',
    message: '$2,000 monthly retainer from Sophia Laurent processed via Stripe.',
    time: '2h ago',
    unread: false,
    type: 'billing',
    targetSection: 'stripe-billing',
  },
  {
    id: 'notif-4',
    title: 'Upcoming 1-on-1 Video Session',
    message: 'Marcus Kane scheduled a 1-on-1 strategy call for tomorrow at 2:00 PM.',
    time: '4h ago',
    unread: false,
    type: 'meeting',
    targetSection: 'meetings',
  },
];

interface NotificationDropdownProps {
  onNavigate?: (section: NavSection) => void;
  role?: string;
}

const INITIAL_CLIENT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'cnotif-1',
    title: 'Protocol Updated by Coach Julian',
    message: 'Coach Julian adjusted your training-day carb target to 210g.',
    time: '2h ago',
    unread: true,
    type: 'checkin',
    targetSection: 'overview',
  },
  {
    id: 'cnotif-2',
    title: 'Upcoming 1-on-1 Telehealth Session',
    message: 'Check-in call with Coach Julian Vance on Thursday, Nov 26 at 11:00 AM EST.',
    time: '1d ago',
    unread: true,
    type: 'meeting',
    targetSection: 'meetings',
  },
  {
    id: 'cnotif-3',
    title: 'New Message from Coach Julian',
    message: 'Your morning fasting glucose is solid at 91 mg/dL.',
    time: '10:15 AM',
    unread: false,
    type: 'checkin',
    targetSection: 'ai-messenger',
  },
];

const SESSION_NOTIFS_KEY = 'cadence_session_notifications';
const SESSION_CLIENT_NOTIFS_KEY = 'cadence_session_client_notifications';

function getInitialNotifications(role?: string): NotificationItem[] {
  const isClient = role === 'client';
  const key = isClient ? SESSION_CLIENT_NOTIFS_KEY : SESSION_NOTIFS_KEY;
  try {
    const stored = sessionStorage.getItem(key);
    if (stored) return JSON.parse(stored) as NotificationItem[];
  } catch {}
  return isClient ? INITIAL_CLIENT_NOTIFICATIONS : INITIAL_NOTIFICATIONS;
}

export default function NotificationDropdown({ onNavigate, role = 'coach' }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => getInitialNotifications(role));

  // Re-sync notifications if role changes
  useEffect(() => {
    setNotifications(getInitialNotifications(role));
  }, [role]);

  // Persist notifications to sessionStorage on every change
  useEffect(() => {
    const key = role === 'client' ? SESSION_CLIENT_NOTIFS_KEY : SESSION_NOTIFS_KEY;
    try {
      sessionStorage.setItem(key, JSON.stringify(notifications));
    } catch {}
  }, [notifications, role]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Open immediately on mouse enter
  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  // Close with brief grace period to allow cursor to travel from button into dropdown menu
  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 220);
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  // Dismiss a single notification
  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Clear all notifications
  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications([]);
  };

  // Mark all as read
  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleNotificationClick = (item: NotificationItem) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
    );
    if (item.targetSection && onNavigate) {
      onNavigate(item.targetSection);
      setIsOpen(false);
    }
  };

  const getTypeIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'urgent':
        return { icon: 'warning', color: 'text-[#ffb4a3] bg-[#ffb4a3]/10 border-[#ffb4a3]/30' };
      case 'checkin':
        return { icon: 'assignment_turned_in', color: 'text-[#4edea3] bg-[#4edea3]/10 border-[#4edea3]/30' };
      case 'billing':
        return { icon: 'payments', color: 'text-[#a078ff] bg-[#a078ff]/10 border-[#a078ff]/30' };
      case 'meeting':
        return { icon: 'videocam', color: 'text-[#d0bcff] bg-[#d0bcff]/10 border-[#d0bcff]/30' };
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative"
    >
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative flex items-center justify-center p-2 rounded-lg transition-all cursor-pointer border ${
          isOpen
            ? 'bg-[#292a2e] text-[#e3e2e8] border-[#ffb4a3]/40 shadow-[0_0_12px_rgba(255,180,163,0.2)]'
            : 'bg-[#1a1b20] text-[#cbc3d7] hover:text-[#e3e2e8] hover:bg-[#292a2e] border-[#292a2e]/60'
        }`}
        title="Notifications"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined text-[18px]">notifications</span>

        {/* Unread indicator */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[17px] h-[17px] px-1 rounded-full bg-[#ffb4a3] text-[#3a0900] font-space font-bold text-[10px] shadow-[0_0_8px_rgba(255,180,163,0.6)] animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[#1a1b20]/95 backdrop-blur-xl border border-[#292a2e] shadow-[0_12px_40px_rgba(0,0,0,0.7)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-[#292a2e]/60 flex items-center justify-between bg-[#121317]/50">
            <div className="flex items-center gap-2">
              <span className="font-space font-bold text-xs text-[#e3e2e8] tracking-wide">
                Notifications
              </span>
              {notifications.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#292a2e] text-[#ffdad2] text-[10px] font-space font-semibold">
                  {notifications.length}
                </span>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-[11px] font-space text-[#958ea0] hover:text-[#ffdad2] transition-colors cursor-pointer"
                  >
                    Mark read
                  </button>
                )}
                <span className="text-[#292a2e]">•</span>
                <button
                  onClick={handleClearAll}
                  className="text-[11px] font-space text-[#958ea0] hover:text-[#ffb4a3] transition-colors cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* List of Notification Items */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-[#292a2e]/40 scrollbar-thin scrollbar-thumb-[#292a2e]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-[#292a2e]/50 flex items-center justify-center text-[#958ea0] mb-2">
                  <span className="material-symbols-outlined text-[20px]">notifications_off</span>
                </div>
                <p className="text-xs font-space font-semibold text-[#e3e2e8]">
                  All caught up!
                </p>
                <p className="text-[11px] text-[#958ea0] font-sans mt-0.5">
                  No pending alerts or notifications.
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const badge = getTypeIcon(item.type);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`group relative p-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                      item.unread
                        ? 'bg-[#ffb4a3]/5 hover:bg-[#ffb4a3]/10'
                        : 'hover:bg-[#292a2e]/50'
                    }`}
                  >
                    {/* Unread indicator bar */}
                    {item.unread && (
                      <span className="absolute left-0 top-3 bottom-3 w-0.5 bg-[#ffb4a3] rounded-r" />
                    )}

                    {/* Icon Badge */}
                    <div
                      className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border ${badge.color}`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {badge.icon}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h4
                          className={`font-space text-xs truncate ${
                            item.unread
                              ? 'text-[#e3e2e8] font-bold'
                              : 'text-[#cbc3d7] font-medium'
                          }`}
                        >
                          {item.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-[#958ea0] font-sans line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-space text-[#958ea0]">
                        {item.time}
                      </span>
                    </div>

                    {/* Cross Dismiss Button */}
                    <button
                      onClick={(e) => handleDismiss(e, item.id)}
                      className="absolute right-2.5 top-2.5 w-6 h-6 rounded-md flex items-center justify-center text-[#958ea0] hover:text-[#ffdad2] hover:bg-[#292a2e] opacity-80 group-hover:opacity-100 transition-all cursor-pointer"
                      title="Dismiss notification"
                      aria-label="Dismiss notification"
                    >
                      <span className="material-symbols-outlined text-[15px]">close</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 border-t border-[#292a2e]/60 bg-[#121317]/40 text-center">
              <span className="text-[10px] font-space text-[#958ea0]">
                Click an alert to navigate • Click ✕ to dismiss
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
