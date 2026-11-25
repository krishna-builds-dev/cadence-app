import { useState, useMemo, useEffect } from 'react';
import type { MeetingItem, ClientEntry } from '../../types/dashboard';
import defaultMeetingsData from '../../data/meetings.json';

interface MeetingsSectionProps {
  clients: ClientEntry[];
  onLaunchVideoCall: (client: ClientEntry) => void;
  meetings?: MeetingItem[];
  onAddMeeting?: (m: MeetingItem) => void;
  onUpdateMeeting?: (m: MeetingItem) => void;
  onDeleteMeeting?: (id: string) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]; // 8 AM – 5 PM
const SLOT_HEIGHT = 56; // px per hour row
const SESSION_MEETINGS_KEY = 'cadence_session_meetings';

function formatHour(h: number): string {
  if (h === 12) return '12 PM';
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

/** Returns the Sunday of the week containing `date`. */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Parse "Nov 16, 2026" → Date */
function parseMeetingDate(dateStr: string): Date | null {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

/** Parse "10:00 AM" or "02:00 PM" → fractional hours (e.g. 10.0, 14.0) */
function parseTimeToHour(timeStr: string): number | null {
  const m = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const period = m[3].toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h + min / 60;
}

/** Parse "45 min" / "30 min" / "60 min" → hours */
function parseDurationHours(dur: string): number {
  const m = dur.match(/(\d+)/);
  return m ? parseInt(m[1], 10) / 60 : 0.75;
}

function formatWeekRange(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  const startStr = weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const endStr = end.toLocaleDateString('en-GB', opts);
  return `${startStr} – ${endStr}`;
}

function toDateInputValue(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toTimeInputValue(timeStr: string): string {
  const m = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return '10:00';
  let h = parseInt(m[1], 10);
  const min = m[2];
  const period = m[3].toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${min}`;
}

const today = new Date();
today.setHours(0, 0, 0, 0);

// Event colour palette
const EVENT_COLORS = [
  { bg: 'bg-[#ffb4a3]/20', text: 'text-[#ffdad2]', agendaText: 'text-[#ffb4a3]', border: 'border-[#ff8a74]/60', indicatorBg: 'bg-[#ffb4a3]' },
  { bg: 'bg-[#4edea3]/20', text: 'text-[#4edea3]', agendaText: 'text-[#4edea3]', border: 'border-[#4edea3]/50', indicatorBg: 'bg-[#4edea3]' },
  { bg: 'bg-[#cbc3d7]/15', text: 'text-[#cbc3d7]', agendaText: 'text-[#cbc3d7]', border: 'border-[#cbc3d7]/30', indicatorBg: 'bg-[#cbc3d7]' },
  { bg: 'bg-[#ec6a06]/20', text: 'text-[#ec6a06]', agendaText: 'text-[#ec6a06]', border: 'border-[#ec6a06]/40', indicatorBg: 'bg-[#ec6a06]' },
];

const SESSION_TYPES = [
  '1-on-1 Strategy',
  'Progress Review',
  'Quarterly Strategy',
  'Re-engagement Call',
  'Onboarding Call',
  'Biometrics Review',
];

// ── Sub-components ─────────────────────────────────────────────────────────

interface ScheduleModalProps {
  clients: ClientEntry[];
  onClose: () => void;
  onAdd: (m: MeetingItem) => void;
}

function ScheduleModal({ clients, onClose, onAdd }: ScheduleModalProps) {
  const defaultClient = clients[0]?.name || '';
  const [form, setForm] = useState({
    client: defaultClient,
    type: '1-on-1 Strategy',
    date: toDateInputValue(today.toISOString()),
    time: '10:00',
    duration: '45 min',
    notes: '',
  });

  function handleSubmit() {
    if (!form.client || !form.date) return;
    const [hStr, mStr] = form.time.split(':');
    let h = parseInt(hStr, 10);
    const min = mStr ?? '00';
    const period = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    const timeFormatted = `${h}:${min} ${period}`;

    const dateObj = new Date(form.date + 'T00:00:00');
    const dateFormatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const matchedClient = clients.find((c) => c.name.toLowerCase() === form.client.toLowerCase());

    onAdd({
      id: 'mt_' + Date.now(),
      clientId: matchedClient?.id,
      client: form.client,
      type: form.type,
      date: dateFormatted,
      time: timeFormatted,
      duration: form.duration,
      status: 'upcoming',
      notes: form.notes || '1-on-1 strategy coaching session.',
    });
    onClose();
  }

  const inputCls = 'w-full bg-[#0d0e12] border border-[#292a2e] rounded-lg px-3 py-2 text-sm text-[#e3e2e8] focus:border-[#ffb4a3] focus:outline-none';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#1a1b20] border border-[#ffb4a3]/30 rounded-2xl p-6 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-[#292a2e]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ffb4a3] text-[20px]">calendar_add_on</span>
            <h3 className="font-space font-bold text-[#e3e2e8] text-base">Schedule New Session</h3>
          </div>
          <button onClick={onClose} className="text-[#958ea0] hover:text-[#e3e2e8] cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="text-xs font-space font-bold text-[#ffdad2] mb-1 block">Client</label>
            <select
              value={form.client}
              onChange={(e) => setForm({ ...form, client: e.target.value })}
              className={inputCls}
            >
              <option value="">Select client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-space font-bold text-[#ffdad2] mb-1 block">Session Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className={inputCls}
            >
              {SESSION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-space font-bold text-[#ffdad2] mb-1 block">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-xs font-space font-bold text-[#ffdad2] mb-1 block">Time</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-space font-bold text-[#ffdad2] mb-1 block">Duration</label>
            <select
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              className={inputCls}
            >
              {['15 min', '30 min', '45 min', '60 min', '90 min'].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-space font-bold text-[#ffdad2] mb-1 block">Session Prep / Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Session objectives, protocol review notes..."
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!form.client || !form.date}
          className="w-full py-2.5 rounded-lg bg-[#ffb4a3] text-[#3a0900] font-space font-bold text-sm hover:bg-[#ffdad2] transition-colors cursor-pointer shadow-[0_0_12px_rgba(255,180,163,0.4)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Confirm & Schedule Session
        </button>
      </div>
    </div>
  );
}

// ── Edit Meeting Modal ──────────────────────────────────────────────────────

interface EditMeetingModalProps {
  meeting: MeetingItem;
  clients: ClientEntry[];
  onClose: () => void;
  onSave: (m: MeetingItem) => void;
  onDelete: (id: string) => void;
  onLaunchVideoCall?: (client: ClientEntry) => void;
}

function EditMeetingModal({ meeting, clients, onClose, onSave, onDelete, onLaunchVideoCall }: EditMeetingModalProps) {
  const [form, setForm] = useState({
    client: meeting.client,
    type: meeting.type,
    date: toDateInputValue(meeting.date),
    time: toTimeInputValue(meeting.time),
    duration: meeting.duration,
    status: meeting.status,
    notes: meeting.notes || '',
  });

  function handleSave() {
    const [hStr, mStr] = form.time.split(':');
    let h = parseInt(hStr, 10);
    const min = mStr ?? '00';
    const period = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    const timeFormatted = `${h}:${min} ${period}`;

    const dateObj = new Date(form.date + 'T00:00:00');
    const dateFormatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const matchedClient = clients.find((c) => c.name.toLowerCase() === form.client.toLowerCase());

    onSave({
      ...meeting,
      clientId: matchedClient?.id || meeting.clientId,
      client: form.client,
      type: form.type,
      date: dateFormatted,
      time: timeFormatted,
      duration: form.duration,
      status: form.status,
      notes: form.notes,
    });
    onClose();
  }

  const matchedClient = clients.find((c) => c.name.toLowerCase() === form.client.toLowerCase());
  const inputCls = 'w-full bg-[#0d0e12] border border-[#292a2e] rounded-lg px-3 py-2 text-sm text-[#e3e2e8] focus:border-[#ffb4a3] focus:outline-none';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#1a1b20] border border-[#ffb4a3]/30 rounded-2xl p-6 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-[#292a2e]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ffb4a3] text-[20px]">edit_calendar</span>
            <h3 className="font-space font-bold text-[#e3e2e8] text-base">Edit Session Details</h3>
          </div>
          <button onClick={onClose} className="text-[#958ea0] hover:text-[#e3e2e8] cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="text-xs font-space font-bold text-[#ffdad2] mb-1 block">Client</label>
            <select
              value={form.client}
              onChange={(e) => setForm({ ...form, client: e.target.value })}
              className={inputCls}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-space font-bold text-[#ffdad2] mb-1 block">Session Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className={inputCls}
            >
              {SESSION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-space font-bold text-[#ffdad2] mb-1 block">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-xs font-space font-bold text-[#ffdad2] mb-1 block">Time</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-space font-bold text-[#ffdad2] mb-1 block">Duration</label>
              <select
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className={inputCls}
              >
                {['15 min', '30 min', '45 min', '60 min', '90 min'].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-space font-bold text-[#ffdad2] mb-1 block">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as 'upcoming' | 'completed' })}
                className={inputCls}
              >
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-space font-bold text-[#ffdad2] mb-1 block">Session Prep / Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Session notes or agenda..."
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-[#292a2e]/60">
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 py-2 rounded-lg bg-[#ffb4a3] text-[#3a0900] font-space font-bold text-xs hover:bg-[#ffdad2] transition-colors cursor-pointer shadow-[0_0_12px_rgba(255,180,163,0.3)]"
            >
              Save Changes
            </button>
            {matchedClient && form.status === 'upcoming' && onLaunchVideoCall && (
              <button
                onClick={() => {
                  onClose();
                  onLaunchVideoCall(matchedClient);
                }}
                className="px-3.5 py-2 rounded-lg bg-[#4edea3] text-[#0d0e12] font-space font-bold text-xs hover:bg-[#6ef0b9] transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[15px]">videocam</span>
                <span>Launch</span>
              </button>
            )}
          </div>

          <button
            onClick={() => {
              if (window.confirm(`Are you sure you want to cancel the session with ${meeting.client}?`)) {
                onDelete(meeting.id);
                onClose();
              }
            }}
            className="w-full py-2 rounded-lg bg-[#ff5449]/15 border border-[#ff5449]/30 text-[#ff8a74] hover:bg-[#ff5449]/25 font-space font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[14px]">delete</span>
            <span>Cancel / Delete Session</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Agenda view ────────────────────────────────────────────────────────────

interface AgendaViewProps {
  meetings: MeetingItem[];
  clients: ClientEntry[];
  onLaunchVideoCall: (c: ClientEntry) => void;
  onEdit: (m: MeetingItem) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (m: MeetingItem) => void;
}

function AgendaView({ meetings, clients, onLaunchVideoCall, onEdit, onDelete, onToggleStatus }: AgendaViewProps) {
  const sorted = [...meetings].sort((a, b) => {
    const da = parseMeetingDate(a.date);
    const db = parseMeetingDate(b.date);
    if (!da || !db) return 0;
    return da.getTime() - db.getTime();
  });

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#958ea0] bg-[#1a1b20] rounded-xl border border-[#292a2e]/60 mt-4">
        <span className="material-symbols-outlined text-5xl mb-3 text-[#958ea0]/40">event_busy</span>
        <p className="font-space text-sm font-bold text-[#e3e2e8]">No sessions scheduled</p>
        <p className="text-xs text-[#958ea0] mt-1 font-sans">Use "+ Schedule Session" above to add a 1-on-1 coaching session.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-4">
      {sorted.map((m, i) => {
        const color = EVENT_COLORS[i % EVENT_COLORS.length];
        const clientObj = clients.find((c) => c.name.toLowerCase() === m.client.toLowerCase());
        const isUpcoming = m.status === 'upcoming';

        return (
          <div
            key={m.id}
            className={`p-4 rounded-xl bg-[#1a1b20] border border-[#292a2e]/60 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#ffb4a3]/40 transition-all group`}
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${isUpcoming ? color.indicatorBg : 'bg-[#292a2e]'}`} />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-space font-bold text-sm text-[#e3e2e8]">{m.client}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-space font-bold ${
                      isUpcoming
                        ? 'bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30'
                        : 'bg-[#292a2e] text-[#958ea0]'
                    }`}
                  >
                    {m.status.toUpperCase()}
                  </span>
                  <span className="text-[11px] font-space text-[#958ea0]">·</span>
                  <span className={`text-xs font-space font-semibold ${color.agendaText}`}>{m.type}</span>
                </div>
                <div className="text-xs text-[#958ea0] font-sans mt-1 line-clamp-2">{m.notes}</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 md:flex-shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-[#292a2e]/40">
              <div className="text-left md:text-right">
                <div className="font-space text-xs font-bold text-[#e3e2e8]">{m.date}</div>
                <div className="text-[11px] text-[#958ea0] font-sans">
                  {m.time} · {m.duration}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {isUpcoming && (
                  <button
                    onClick={() => {
                      if (clientObj) onLaunchVideoCall(clientObj);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#ffb4a3] text-[#3a0900] text-xs font-space font-bold hover:bg-[#ffdad2] transition-colors cursor-pointer flex items-center gap-1 shadow-[0_0_10px_rgba(255,180,163,0.3)]"
                    title="Launch video session"
                  >
                    <span className="material-symbols-outlined text-[14px]">videocam</span>
                    <span>Start</span>
                  </button>
                )}

                {/* Status toggle button */}
                <button
                  onClick={() => onToggleStatus(m)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                    isUpcoming
                      ? 'bg-[#292a2e] hover:bg-[#4edea3]/20 text-[#958ea0] hover:text-[#4edea3]'
                      : 'bg-[#4edea3]/15 text-[#4edea3] hover:bg-[#292a2e] hover:text-[#958ea0]'
                  }`}
                  title={isUpcoming ? 'Mark session as completed' : 'Re-open session as upcoming'}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isUpcoming ? 'check_circle' : 'replay'}
                  </span>
                </button>

                {/* Edit button */}
                <button
                  onClick={() => onEdit(m)}
                  className="w-8 h-8 rounded-lg bg-[#292a2e] hover:bg-[#ffb4a3]/20 text-[#958ea0] hover:text-[#ffdad2] transition-colors cursor-pointer flex items-center justify-center"
                  title="Edit session details"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>

                {/* Delete button */}
                <button
                  onClick={() => {
                    if (window.confirm(`Delete coaching session with ${m.client}?`)) {
                      onDelete(m.id);
                    }
                  }}
                  className="w-8 h-8 rounded-lg bg-[#292a2e] hover:bg-[#ff5449]/20 text-[#958ea0] hover:text-[#ff5449] transition-colors cursor-pointer flex items-center justify-center"
                  title="Cancel & delete session"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Week grid view ─────────────────────────────────────────────────────────

interface WeekViewProps {
  meetings: MeetingItem[];
  weekStart: Date;
  today: Date;
  onEdit: (m: MeetingItem) => void;
}

function WeekView({ meetings, weekStart, today: todayDate, onEdit }: WeekViewProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const meetingsByDay = useMemo(() => {
    const map: Record<number, MeetingItem[]> = {};
    for (let i = 0; i < 7; i++) map[i] = [];
    meetings.forEach((m) => {
      const d = parseMeetingDate(m.date);
      if (!d) return;
      for (let i = 0; i < 7; i++) {
        if (isSameDay(d, addDays(weekStart, i))) {
          map[i].push(m);
        }
      }
    });
    return map;
  }, [meetings, weekStart]);

  const gridStart = HOURS[0];
  const gridEnd = HOURS[HOURS.length - 1] + 1;
  const totalHours = gridEnd - gridStart;

  return (
    <div className="mt-4 rounded-xl border border-[#292a2e]/60 overflow-hidden bg-[#1a1b20]">
      {/* Day header row */}
      <div
        className="grid border-b border-[#292a2e]/60"
        style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}
      >
        <div className="border-r border-[#292a2e]/40" />
        {DAY_LABELS.map((label, i) => {
          const day = addDays(weekStart, i);
          const isToday = isSameDay(day, todayDate);
          return (
            <div
              key={label}
              className={`flex flex-col items-center py-3 text-center ${i < 6 ? 'border-r border-[#292a2e]/40' : ''}`}
            >
              <span className="text-[10px] font-space font-bold text-[#958ea0] tracking-widest">
                {label}
              </span>
              <span
                className={`mt-1 w-7 h-7 flex items-center justify-center rounded-full text-sm font-space font-bold transition-colors ${
                  isToday
                    ? 'bg-[#ffb4a3] text-[#3a0900]'
                    : 'text-[#e3e2e8]'
                }`}
              >
                {day.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Scrollable time + event grid */}
      <div className="overflow-y-auto" style={{ maxHeight: '480px' }}>
        <div
          className="relative grid"
          style={{
            gridTemplateColumns: '56px repeat(7, 1fr)',
            height: `${totalHours * SLOT_HEIGHT}px`,
          }}
        >
          {/* Time gutter */}
          <div className="relative border-r border-[#292a2e]/40">
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 flex items-start justify-end pr-2"
                style={{ top: `${(h - gridStart) * SLOT_HEIGHT}px`, height: `${SLOT_HEIGHT}px` }}
              >
                <span className="text-[10px] text-[#958ea0] font-space ">{formatHour(h)}</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {Array.from({ length: 7 }, (_, dayIdx) => {
            const isToday = isSameDay(addDays(weekStart, dayIdx), todayDate);
            const dayMeetings = meetingsByDay[dayIdx] ?? [];

            return (
              <div
                key={dayIdx}
                className={`relative ${dayIdx < 6 ? 'border-r border-[#292a2e]/40' : ''} ${isToday ? 'bg-[#ffb4a3]/[0.03]' : ''}`}
              >
                {/* Hour grid lines */}
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-[#292a2e]/30"
                    style={{ top: `${(h - gridStart) * SLOT_HEIGHT}px` }}
                  />
                ))}

                {/* Meeting event blocks */}
                {dayMeetings.map((m, mIdx) => {
                  const startH = parseTimeToHour(m.time);
                  if (startH === null || startH < gridStart || startH >= gridEnd) return null;

                  const durationH = parseDurationHours(m.duration);
                  const topPx = (startH - gridStart) * SLOT_HEIGHT;
                  const heightPx = Math.max(durationH * SLOT_HEIGHT, 28);
                  const color = EVENT_COLORS[mIdx % EVENT_COLORS.length];
                  const isHovered = hoveredId === m.id;

                  return (
                    <div
                      key={m.id}
                      onClick={() => onEdit(m)}
                      onMouseEnter={() => setHoveredId(m.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className={`absolute left-1 right-1 rounded-md border px-2 py-1 cursor-pointer transition-all z-10 select-none ${color.bg} ${color.border} ${
                        isHovered ? 'shadow-lg scale-[1.02] z-20 ring-1 ring-[#ffb4a3]' : ''
                      }`}
                      style={{ top: `${topPx + 2}px`, height: `${heightPx - 4}px` }}
                      title="Click to edit session"
                    >
                      <p className={`text-[11px] font-space font-bold leading-tight truncate ${color.text}`}>
                        {m.type}
                      </p>
                      {heightPx > 32 && (
                        <p className={`text-[10px] font-sans truncate opacity-90 ${color.text}`}>
                          {m.client}
                        </p>
                      )}

                      {/* Hover tooltip */}
                      {isHovered && (
                        <div className="absolute left-0 top-full mt-1 z-30 w-52 bg-[#0d0e12] border border-[#292a2e] rounded-xl p-3 shadow-2xl pointer-events-none">
                          <p className="font-space font-bold text-xs text-[#e3e2e8]">{m.client}</p>
                          <p className="text-[11px] text-[#ffdad2] font-space mt-0.5">{m.type}</p>
                          <p className="text-[11px] text-[#958ea0] font-sans mt-1">
                            {m.time} · {m.duration}
                          </p>
                          {m.notes && (
                            <p className="text-[10px] text-[#958ea0] font-sans mt-1 leading-snug line-clamp-2">
                              {m.notes}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#292a2e]/60">
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[9px] font-space font-bold ${
                                m.status === 'upcoming'
                                  ? 'bg-[#4edea3]/15 text-[#4edea3]'
                                  : 'bg-[#292a2e] text-[#958ea0]'
                              }`}
                            >
                              {m.status.toUpperCase()}
                            </span>
                            <span className="text-[9px] text-[#ffb4a3] font-space">Click to edit</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Month mini-calendar view ───────────────────────────────────────────────

interface MonthViewProps {
  meetings: MeetingItem[];
  today: Date;
  onEdit: (m: MeetingItem) => void;
}

function MonthView({ meetings, today: todayDate, onEdit }: MonthViewProps) {
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date(todayDate);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [selectedDayDate, setSelectedDayDate] = useState<Date>(todayDate);

  const daysInMonth = useMemo(() => {
    const days: Date[] = [];
    const firstDay = new Date(viewMonth);
    const startOffset = firstDay.getDay(); // 0 = Sun
    for (let i = 0; i < startOffset; i++) {
      days.push(addDays(firstDay, -(startOffset - i)));
    }
    const totalDays = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    for (let i = 0; i < totalDays; i++) {
      days.push(addDays(firstDay, i));
    }
    while (days.length % 7 !== 0) {
      days.push(addDays(days[days.length - 1], 1));
    }
    return days;
  }, [viewMonth]);

  const meetingDates = useMemo(() => {
    const map = new Map<string, MeetingItem[]>();
    meetings.forEach((m) => {
      const d = parseMeetingDate(m.date);
      if (d) {
        const key = d.toDateString();
        const existing = map.get(key) || [];
        existing.push(m);
        map.set(key, existing);
      }
    });
    return map;
  }, [meetings]);

  const selectedDayMeetings = meetingDates.get(selectedDayDate.toDateString()) || [];
  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const isCurrentMonth = viewMonth.getMonth() === todayDate.getMonth() && viewMonth.getFullYear() === todayDate.getFullYear();

  function prevMonth() {
    setViewMonth((p) => {
      const d = new Date(p);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  }
  function nextMonth() {
    setViewMonth((p) => {
      const d = new Date(p);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  }
  function goToday() {
    const d = new Date(todayDate);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    setViewMonth(d);
    setSelectedDayDate(todayDate);
  }

  return (
    <div className="mt-4 rounded-xl border border-[#292a2e]/60 bg-[#1a1b20] overflow-hidden">
      {/* Month nav */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#292a2e]/60">
        <span className="font-space font-bold text-sm text-[#e3e2e8]">{monthLabel}</span>
        <div className="flex items-center gap-2">
          {!isCurrentMonth && (
            <button
              onClick={goToday}
              className="px-2.5 py-1 rounded-lg border border-[#292a2e] text-[10px] font-space text-[#958ea0] hover:text-[#e3e2e8] hover:border-[#ffb4a3]/40 transition-colors cursor-pointer"
            >
              Today
            </button>
          )}
          <button
            onClick={prevMonth}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#292a2e] text-[#958ea0] hover:text-[#e3e2e8] hover:border-[#ffb4a3]/40 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          </button>
          <button
            onClick={nextMonth}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#292a2e] text-[#958ea0] hover:text-[#e3e2e8] hover:border-[#ffb4a3]/40 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center py-2 text-[10px] font-space font-bold text-[#958ea0] tracking-widest">
            {d}
          </div>
        ))}
        {daysInMonth.map((day, idx) => {
          const inMonth = day.getMonth() === viewMonth.getMonth();
          const isToday = isSameDay(day, todayDate);
          const isSelected = isSameDay(day, selectedDayDate);
          const dayMeetingsList = meetingDates.get(day.toDateString()) || [];
          const hasMeeting = dayMeetingsList.length > 0;

          return (
            <div
              key={idx}
              onClick={() => setSelectedDayDate(day)}
              className={`flex flex-col items-center py-2.5 border-t border-[#292a2e]/30 cursor-pointer transition-colors ${
                !inMonth ? 'opacity-25' : 'hover:bg-[#292a2e]/30'
              } ${isSelected ? 'bg-[#ffb4a3]/10 ring-1 ring-inset ring-[#ffb4a3]/40' : ''}`}
            >
              <span
                className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-space font-bold transition-colors ${
                  isToday
                    ? 'bg-[#ffb4a3] text-[#3a0900]'
                    : inMonth
                    ? 'text-[#e3e2e8]'
                    : 'text-[#958ea0]'
                }`}
              >
                {day.getDate()}
              </span>
              {hasMeeting && inMonth && (
                <div className="flex gap-0.5 mt-1">
                  {dayMeetingsList.slice(0, 3).map((_, dotIdx) => (
                    <span key={dotIdx} className="w-1.5 h-1.5 rounded-full bg-[#ffb4a3]" />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Day Agenda Drawer */}
      <div className="p-4 border-t border-[#292a2e] bg-[#141519]">
        <div className="flex items-center justify-between mb-2.5">
          <span className="font-space font-bold text-xs text-[#ffdad2]">
            Sessions on {selectedDayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="text-[10px] font-space text-[#958ea0]">
            {selectedDayMeetings.length} session{selectedDayMeetings.length === 1 ? '' : 's'}
          </span>
        </div>

        {selectedDayMeetings.length === 0 ? (
          <p className="text-xs text-[#958ea0] font-sans italic py-2">No coaching sessions scheduled on this date.</p>
        ) : (
          <div className="space-y-2">
            {selectedDayMeetings.map((m) => (
              <div
                key={m.id}
                onClick={() => onEdit(m)}
                className="p-3 rounded-lg bg-[#1a1b20] border border-[#292a2e] hover:border-[#ffb4a3]/40 flex items-center justify-between gap-3 cursor-pointer transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-space font-bold text-[#e3e2e8]">{m.client}</span>
                    <span className="text-[10px] font-space text-[#ffdad2]">{m.type}</span>
                  </div>
                  <p className="text-[11px] text-[#958ea0] font-sans mt-0.5">{m.time} · {m.duration} · {m.notes}</p>
                </div>
                <span className="material-symbols-outlined text-[#958ea0] text-[16px]">edit</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

type ViewMode = 'agenda' | 'week' | 'month';

export default function MeetingsSection({
  clients,
  onLaunchVideoCall,
  meetings: propsMeetings,
  onAddMeeting,
  onUpdateMeeting,
  onDeleteMeeting,
}: MeetingsSectionProps) {
  // Load from sessionStorage if available, otherwise fallback to defaultMeetingsData
  const getInitial = (): MeetingItem[] => {
    try {
      const stored = sessionStorage.getItem(SESSION_MEETINGS_KEY);
      if (stored) return JSON.parse(stored) as MeetingItem[];
    } catch {}
    return defaultMeetingsData as MeetingItem[];
  };

  const [localMeetings, setLocalMeetings] = useState<MeetingItem[]>(getInitial);

  // Sync local meetings with sessionStorage whenever it changes
  useEffect(() => {
    if (!propsMeetings) {
      try {
        sessionStorage.setItem(SESSION_MEETINGS_KEY, JSON.stringify(localMeetings));
      } catch {}
    }
  }, [localMeetings, propsMeetings]);

  const meetings = propsMeetings ?? localMeetings;

  const handleAdd = (m: MeetingItem) => {
    if (onAddMeeting) {
      onAddMeeting(m);
    } else {
      setLocalMeetings((prev) => [m, ...prev]);
    }
  };

  const handleUpdate = (updated: MeetingItem) => {
    if (onUpdateMeeting) {
      onUpdateMeeting(updated);
    } else {
      setLocalMeetings((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    }
  };

  const handleDelete = (id: string) => {
    if (onDeleteMeeting) {
      onDeleteMeeting(id);
    } else {
      setLocalMeetings((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const handleToggleStatus = (meeting: MeetingItem) => {
    const updated: MeetingItem = {
      ...meeting,
      status: meeting.status === 'upcoming' ? 'completed' : 'upcoming',
    };
    handleUpdate(updated);
  };

  const [viewMode, setViewMode] = useState<ViewMode>('agenda');
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(today));
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<MeetingItem | null>(null);

  // Filter
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesClient = m.client.toLowerCase().includes(q);
        const matchesType = m.type.toLowerCase().includes(q);
        const matchesNotes = m.notes.toLowerCase().includes(q);
        if (!matchesClient && !matchesType && !matchesNotes) return false;
      }
      return true;
    });
  }, [meetings, statusFilter, searchQuery]);

  function prevWeek() {
    setWeekStart((w) => addDays(w, -7));
  }
  function nextWeek() {
    setWeekStart((w) => addDays(w, 7));
  }
  function goToday() {
    setWeekStart(getWeekStart(today));
  }

  const isCurrentWeek = isSameDay(weekStart, getWeekStart(today));
  const rangeLabel = formatWeekRange(weekStart);

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Title */}
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ffb4a3] text-[22px]">calendar_month</span>
            <h2 className="font-space text-xl font-bold text-[#e3e2e8]">Meetings & Sessions</h2>
            <span className="px-2 py-0.5 rounded-full bg-[#ffb4a3]/15 text-[#ffdad2] border border-[#ffb4a3]/30 text-[11px] font-space font-bold">
              {meetings.filter((m) => m.status === 'upcoming').length} Upcoming
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 ml-7 flex-wrap">
            <span className="text-xs text-[#958ea0] font-sans">
              Your schedule in <span className="font-semibold text-[#e3e2e8]">Asia/Kathmandu</span>
            </span>
            <span className="text-[#958ea0]/40 text-xs hidden sm:inline">·</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#4edea3]/10 border border-[#4edea3]/25 text-[11px] font-space font-medium text-[#4edea3]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
              <span>Synced Google Calendar</span>
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggles */}
          <div className="flex items-center bg-[#1a1b20] border border-[#292a2e] rounded-lg p-0.5 gap-0.5">
            {(['agenda', 'week', 'month'] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-3 py-1 rounded-md text-xs font-space font-bold capitalize transition-all cursor-pointer ${
                  viewMode === v
                    ? 'bg-[#ffb4a3] text-[#3a0900] shadow'
                    : 'text-[#958ea0] hover:text-[#e3e2e8]'
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          {/* + Schedule */}
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#ffb4a3] text-[#3a0900] font-space font-bold text-xs hover:bg-[#ffdad2] transition-colors cursor-pointer shadow-[0_0_12px_rgba(255,180,163,0.3)]"
          >
            <span className="material-symbols-outlined text-[15px]">add</span>
            <span>Schedule Session</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar for Agenda View */}
      {viewMode === 'agenda' && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#141519] border border-[#292a2e]/60">
          <div className="flex items-center gap-1.5 bg-[#0d0e12] border border-[#292a2e] rounded-lg px-3 py-1.5 flex-1 max-w-sm">
            <span className="material-symbols-outlined text-[16px] text-[#958ea0]">search</span>
            <input
              type="text"
              placeholder="Search meetings by client, topic or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-[#e3e2e8] placeholder-[#958ea0] focus:outline-none w-full"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-[#958ea0] hover:text-[#e3e2e8]">
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 self-end sm:self-auto">
            {(['all', 'upcoming', 'completed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-space font-bold capitalize transition-all cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-[#292a2e] text-[#ffdad2] border border-[#ffb4a3]/40'
                    : 'text-[#958ea0] hover:text-[#e3e2e8]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Week nav row (only for week view) ── */}
      {viewMode === 'week' && (
        <div className="flex items-center justify-between mt-4 mb-0">
          <span className="font-space font-bold text-sm text-[#e3e2e8]">{rangeLabel}</span>
          <div className="flex items-center gap-2">
            {!isCurrentWeek && (
              <button
                onClick={goToday}
                className="px-2.5 py-1 rounded-lg border border-[#292a2e] text-[11px] font-space text-[#958ea0] hover:text-[#e3e2e8] hover:border-[#ffb4a3]/40 transition-colors cursor-pointer"
              >
                Today
              </button>
            )}
            <button
              onClick={prevWeek}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#292a2e] text-[#958ea0] hover:text-[#e3e2e8] hover:border-[#ffb4a3]/40 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            <button
              onClick={nextWeek}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#292a2e] text-[#958ea0] hover:text-[#e3e2e8] hover:border-[#ffb4a3]/40 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>
      )}

      {/* ── View content ── */}
      {viewMode === 'agenda' && (
        <AgendaView
          meetings={filteredMeetings}
          clients={clients}
          onLaunchVideoCall={onLaunchVideoCall}
          onEdit={(m) => setEditingMeeting(m)}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
        />
      )}
      {viewMode === 'week' && (
        <WeekView
          meetings={meetings}
          weekStart={weekStart}
          today={today}
          onEdit={(m) => setEditingMeeting(m)}
        />
      )}
      {viewMode === 'month' && (
        <MonthView
          meetings={meetings}
          today={today}
          onEdit={(m) => setEditingMeeting(m)}
        />
      )}

      {/* ── Schedule modal ── */}
      {showScheduleModal && (
        <ScheduleModal
          clients={clients}
          onClose={() => setShowScheduleModal(false)}
          onAdd={handleAdd}
        />
      )}

      {/* ── Edit modal ── */}
      {editingMeeting && (
        <EditMeetingModal
          meeting={editingMeeting}
          clients={clients}
          onClose={() => setEditingMeeting(null)}
          onSave={handleUpdate}
          onDelete={handleDelete}
          onLaunchVideoCall={onLaunchVideoCall}
        />
      )}
    </div>
  );
}
