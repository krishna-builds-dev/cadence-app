import React, { useState, useEffect, useRef } from 'react';
import type { AIChatThread, AIChatMessage, ClientEntry } from '../../types/dashboard';
import defaultChats from '../../data/aiChats.json';

interface AIChatSectionProps {
  clients?: ClientEntry[];
  chats?: AIChatThread[];
  setChats?: React.Dispatch<React.SetStateAction<AIChatThread[]>>;
  currentUserRole?: 'coach' | 'client';
}

const SESSION_KEY = 'cadence_session_ai_chats';
const SESSION_CLIENT_KEY = 'cadence_session_client_ai_chats';

const SUGGESTED_PROMPTS = [
  { icon: 'psychology', label: 'Re-engagement protocol', text: 'What is the best 48-hour re-engagement protocol for a ghost client who hasn\'t logged in 3 days?' },
  { icon: 'monitoring', label: 'Plateau fix', text: 'My client has been in a 12-day weight stall with 94% compliance. What is the metabolic cause and fix?' },
  { icon: 'table_chart', label: 'Carb cycling template', text: 'Create a 7-day carb cycling template for a 70kg endurance athlete training 5 days per week.' },
  { icon: 'sentiment_very_dissatisfied', label: 'Compliance drop', text: 'Client compliance dropped from 91% to 44% in 10 days. No life events reported. What is the root cause?' },
  { icon: 'science', label: 'Lab interpretation', text: 'Fasting glucose 108, HbA1c 5.7%, triglycerides 182. Interpret these for a client on a high-carb endurance protocol.' },
  { icon: 'fitness_center', label: 'Training & nutrition sync', text: 'How should I periodize nutrition around a client\'s peaking week for a powerlifting competition?' },
];

const CLIENT_SUGGESTED_PROMPTS = [
  { icon: 'restaurant', label: 'Pre-workout carbs', text: 'What should I eat 75-90 minutes before my heavy training session to maximize energy without bloating?' },
  { icon: 'egg_alt', label: 'Protein snacks', text: 'What are high-satiety protein snacks to help me hit 145g daily target with under 10g fat?' },
  { icon: 'local_drink', label: 'Hydration & electrolytes', text: 'How should I distribute my 2.5L daily hydration target around my afternoon workout?' },
  { icon: 'bedtime', label: 'Recovery & sleep', text: 'My Whoop recovery was 88% today. How should I adjust my caloric intake and training volume?' },
  { icon: 'monitor_heart', label: 'CGM glucose baseline', text: 'My morning fasting glucose was 91 mg/dL. Is this optimal for my metabolic baseline?' },
  { icon: 'flight_takeoff', label: 'Healthy dining out', text: 'I am traveling for work tomorrow. How can I stay on track with my macros at a business dinner?' },
];

const AI_THINKING_RESPONSES: Record<string, string> = {
  default: `I'm analyzing your biometric parameters and protocol targets. Here is my evidence-based recommendation:\n\n**Guidance:**\nConsistency in nutrient timing and hydration yields the highest metabolic return. Stick to your prescribed daily macro targets and log any deviations in your daily check-in.\n\n**Key Actions:**\n- Ensure protein is spaced evenly across 3–4 meals (30–40g per feeding)\n- Time the majority of complex carbohydrates around your training window\n- Hydrate with 500ml water upon waking before caffeine intake\n\nWould you like a tailored meal breakdown or recipe recommendation?`,
};

const generateAIResponse = (userMessage: string, isClient = false): string => {
  const msg = userMessage.toLowerCase();

  if (isClient) {
    if (msg.includes('pre-workout') || msg.includes('before') || msg.includes('carb')) {
      return `**Pre-Workout Nutrition Protocol**\n\nFor high-performance sessions with your 210g daily carb ceiling:\n\n- **Optimal Timing**: 75–90 minutes prior to training\n- **Target**: 40–50g easily digestible complex carbs, 25g fast-absorbing protein, <5g fat\n\n**Quick Meal Ideas:**\n1. 50g rolled oats + 1 scoop vanilla whey isolate + 1/2 banana\n2. 2 slices sourdough toast with 1 tbsp raw honey + whey shake\n3. 150g jasmine rice + 100g sliced grilled chicken\n\nDrink 400ml water with electrolytes 45 min before training.`;
    }

    if (msg.includes('protein') || msg.includes('145g') || msg.includes('snack')) {
      return `**High-Satiety Low-Fat Protein Snacks**\n\nHere are quick ways to hit your 145g protein goal with minimal fat:\n\n1. **0% Greek Yogurt Bowl**: 200g Greek yogurt + 1 scoop whey (32g protein, 0g fat)\n2. **Smoked Turkey & Egg White Rolls**: 4 egg whites + 80g turkey breast (28g protein, 2g fat)\n3. **Cottage Cheese & Berries**: 200g 1% cottage cheese + cinnamon (26g protein, 2g fat)\n4. **Whey Isolate Iced Coffee**: 1 scoop whey shaken in black iced coffee (25g protein, 0g fat)`;
    }

    if (msg.includes('hydration') || msg.includes('water') || msg.includes('2.5l') || msg.includes('electrolyte')) {
      return `**2.5L Daily Hydration Schedule**\n\n- **Upon Waking**: 500ml room temperature water + pinch of pink Himalayan salt\n- **Mid-Morning**: 500ml water with lemon\n- **Pre/Intra-Workout**: 750ml water with electrolyte buffer\n- **Post-Workout / Evening**: 750ml water, stopping 90 minutes before bed for deep sleep quality`;
    }

    if (msg.includes('sleep') || msg.includes('whoop') || msg.includes('88%') || msg.includes('recovery')) {
      return `**High Recovery Protocol (88% Whoop)**\n\nYour autonomic nervous system is in an optimal parasympathetic state. This is the ideal window to:\n\n- Push maximum intensity on primary compound lifts\n- Absorb full training stimulus with higher carbohydrate partitioning\n- Keep caloric intake at your 2,150 kcal training target to fuel muscular glycogen synthesis`;
    }

    if (msg.includes('glucose') || msg.includes('cgm') || msg.includes('91')) {
      return `**CGM Fasting Glucose Analysis (91 mg/dL)**\n\n91 mg/dL is an **optimal fasting baseline** (normal reference: 70–99 mg/dL). It indicates excellent insulin sensitivity, healthy hepatic glucose regulation, and effective overnight glycogen management.\n\nKeep adhering to your circadian meal cut-off (no caloric intake within 2.5 hours of sleep).`;
    }

    if (msg.includes('travel') || msg.includes('dining') || msg.includes('restaurant')) {
      return `**Dining Out & Travel Strategy**\n\n- **Prioritize Protein First**: Order grilled steak, chicken breast, or white fish (ask for sauces on the side)\n- **Simple Starches**: Steamed jasmine rice, baked potato, or sourdough\n- **Zero-Calorie Buffer**: Sparkling water with lime between cocktails or business courses\n- Log estimated portions in your Cadence journal — 85% adherence during travel maintains progress!`;
    }

    return AI_THINKING_RESPONSES.default;
  }

  if (msg.includes('re-engagement') || msg.includes('ghost') || msg.includes('hasn\'t logged')) {
    return `**48-Hour Re-Engagement Sequence**\n\nFor a client who has gone dark, here's the proven protocol:\n\n**Hour 0–4: Soft Touch (No Mention of Logging)**\n- Send a WhatsApp voice note — 30 seconds, casual tone\n- Reference something personal: travel, a goal milestone, or recent win\n- Never start with "I noticed you haven't been logging"\n\n**Hour 24: Value Drop**\n- Share a personalized insight derived from their last logged data\n- Attach a 1-page updated macro or protocol summary\n- Frame it as: "I ran your numbers — here's what I adjusted for you"\n\n**Hour 36: Social Proof**\n- Share an anonymized client win story relevant to their goal\n- End with a soft CTA: "Want to lock in a check-in this week?"\n\n**Hour 48: Binary Ask**\n- If still no response: "Quick yes or no — still pushing for [their goal]?"\n- Binary questions get 73% higher response rates than open-ended ones\n\n**Key Rule**: Frame everything around their goals and momentum, never around your data or their absence.`;
  }

  if (msg.includes('plateau') || msg.includes('stall') || msg.includes('weight') || msg.includes('leptin')) {
    return `**Metabolic Plateau Analysis**\n\nA 10+ day weight stall with high compliance is almost always one of three mechanisms:\n\n**1. Leptin Downregulation (Most Likely)**\nSustained caloric deficit suppresses leptin signaling to the hypothalamus, reducing BMR by 8–12%. This is the body's famine response.\n\n**2. T3 Thyroid Conversion Reduction**\nExtended low-calorie intake reduces active T3, dropping metabolic rate. Especially pronounced with <1,500 kcal intakes.\n\n**3. Water Retention Masking Fat Loss**\nHigh cortisol from training + caloric stress causes glycogen/water retention (1–2kg range) that masks actual fat oxidation on the scale.\n\n**Fix: 2-Day Strategic Re-feed**\n- Calories: Maintenance + 10–15% for 48 hours\n- Carbs: Push to 300–350g (high-GI post-workout, low-GI at other meals)\n- Protein: Hold steady\n- Fats: Reduce to minimum during re-feed\n\nThis resets leptin, restores T3, and signals metabolic safety. Resume the deficit on day 3. Expect a 0.5–1.5kg scale spike from water during the re-feed — reassure your client this is normal.`;
  }

  if (msg.includes('carb cycling') || msg.includes('template')) {
    return `**7-Day Carb Cycling Template**\n*Endurance Athlete — Fat Loss + Performance Maintenance*\n\n| Day | Type | Calories | Carbs | Protein | Fat |\n|-----|------|----------|-------|---------|-----|\n| Monday | High (Intensity) | 2,450 | 320g | 154g | 55g |\n| Tuesday | Moderate | 2,100 | 220g | 154g | 65g |\n| Wednesday | Low / Rest | 1,850 | 120g | 154g | 80g |\n| Thursday | High (Intensity) | 2,450 | 320g | 154g | 55g |\n| Friday | Moderate | 2,100 | 220g | 154g | 65g |\n| Saturday | High (Long Run) | 2,650 | 380g | 154g | 55g |\n| Sunday | Low / Rest | 1,750 | 90g | 154g | 85g |\n\n**Rules:**\n- Protein is fixed at 2.2g/kg — non-negotiable across all days\n- High-carb days: 70% complex pre-workout, 30% fast-acting post-workout\n- Low-carb days: eliminate refined carbs, increase fibrous vegetables\n- Fat scales inversely with carbs\n- Re-evaluate every 3 weeks based on body composition trends`;
  }

  if (msg.includes('compliance') || msg.includes('adherence') || msg.includes('dropped')) {
    return `**Compliance Drop Root Cause Analysis**\n\nA sudden 40–50 point compliance drop in under 2 weeks without a reported life event is usually one of four things:\n\n**1. Protocol Fatigue (Most Common)**\nIf the plan hasn't meaningfully changed in 6+ weeks, compliance fatigue sets in. The novelty effect expires. The client is capable but uninspired.\n\n**2. Unreported Life Event**\nWork travel, social events, or household food environment changes. Often unreported because clients feel shame or don't want to "make excuses."\n\n**3. Plateau Frustration**\nIf she recently hit a stall (2–3 weeks), compliance drops as a subconscious "what's the point" response — especially in progress-focused clients.\n\n**4. Tracking App Friction**\nSometimes it's purely mechanical — a phone change, app update, or UX degradation that makes logging feel tedious.\n\n**Recovery Protocol:**\n- Send a 3-question (max) check-in — conversational, not clinical\n- Use curiosity, not accountability language: "I noticed some variance — want to tell me about your week?"\n- Offer a 1-week simplified protocol: track only protein + total calories\n- Rebuilding compliance momentum beats enforcing the full protocol`;
  }

  if (msg.includes('lab') || msg.includes('glucose') || msg.includes('hba1c') || msg.includes('triglyceride')) {
    return `**Lab Interpretation — Metabolic Panel**\n\nFor the values you've described, here's the clinical picture:\n\n**Fasting Glucose 108 mg/dL**\nThis is in the pre-diabetic range (100–125 mg/dL). For an endurance athlete on a high-carb protocol, this warrants investigation. Post-workout glucose measurements would help differentiate between chronic dysregulation and acute exercise-induced elevation.\n\n**HbA1c 5.7%**\nBorderline pre-diabetic threshold (5.7–6.4%). Combined with the fasting glucose, this suggests mild insulin resistance or insufficient carbohydrate periodization.\n\n**Triglycerides 182 mg/dL**\nElevated (normal <150 mg/dL). On a high-carb endurance protocol, this often reflects excess refined carbohydrate intake or poor carbohydrate timing — especially if the client consumes carbs outside of training windows.\n\n**Recommended Adjustments:**\n- Shift carb timing: 80% within 2-hour training window, 20% rest-of-day\n- Reduce refined carbs on rest days\n- Consider adding 2–4g omega-3 supplementation\n- Retest in 8 weeks\n- If no improvement, refer to sports medicine physician for insulin sensitivity testing`;
  }

  return AI_THINKING_RESPONSES.default;
};

const renderMarkdown = (text: string): React.ReactNode => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let tableBuffer: string[] = [];
  let inTable = false;

  const flushTable = (key: string) => {
    if (tableBuffer.length < 2) return;
    const headers = tableBuffer[0].split('|').filter(h => h.trim() && h.trim() !== '---' && !h.trim().match(/^-+$/));
    const rows = tableBuffer.slice(2).map(r => r.split('|').filter(c => c.trim() !== '' || r.includes('|')).map(c => c.trim()));

    elements.push(
      <div key={key} className="overflow-x-auto my-3">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#292a2e]">
              {headers.map((h, i) => (
                <th key={i} className="px-3 py-2 text-left text-[#e3e2e8] font-space font-semibold bg-[#1a1b20]">{h.trim()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="border-b border-[#292a2e]/50 hover:bg-[#1a1b20]/50">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 text-[#cbc3d7]">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableBuffer = [];
  };

  lines.forEach((line, i) => {
    if (line.trim().startsWith('|')) {
      inTable = true;
      tableBuffer.push(line);
      return;
    } else if (inTable) {
      inTable = false;
      flushTable(`table-${i}`);
    }

    if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
      elements.push(
        <p key={i} className="font-space font-bold text-[#e3e2e8] mt-3 mb-1 text-sm">
          {line.slice(2, -2)}
        </p>
      );
    } else if (line.startsWith('- ')) {
      elements.push(
        <li key={i} className="text-[#cbc3d7] text-sm leading-relaxed ml-4 list-disc">
          {line.slice(2).replace(/\*\*(.*?)\*\*/g, '$1')}
        </li>
      );
    } else if (line.startsWith('*')) {
      elements.push(
        <p key={i} className="text-[#958ea0] text-xs italic mt-1">
          {line.replace(/\*/g, '')}
        </p>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-1" />);
    } else {
      // Inline bold
      const parts = line.split(/\*\*(.*?)\*\*/g);
      elements.push(
        <p key={i} className="text-[#cbc3d7] text-sm leading-relaxed">
          {parts.map((part, pi) =>
            pi % 2 === 1
              ? <strong key={pi} className="text-[#e3e2e8] font-semibold">{part}</strong>
              : part
          )}
        </p>
      );
    }
  });

  if (inTable && tableBuffer.length > 0) flushTable('table-end');
  return elements;
};

export default function AIChatSection({
  clients = [],
  chats: propsChats,
  setChats: propsSetChats,
  currentUserRole = 'coach',
}: AIChatSectionProps) {
  const isClient = currentUserRole === 'client';
  const activeStorageKey = isClient ? SESSION_CLIENT_KEY : SESSION_KEY;

  // ── Session storage init ──
  const [internalThreads, setInternalThreads] = useState<AIChatThread[]>(() => {
    try {
      const stored = sessionStorage.getItem(activeStorageKey);
      if (stored) return JSON.parse(stored) as AIChatThread[];
    } catch {}
    return defaultChats as AIChatThread[];
  });

  const threads = propsChats ?? internalThreads;
  const setThreads = propsSetChats ?? setInternalThreads;

  useEffect(() => {
    try { sessionStorage.setItem(activeStorageKey, JSON.stringify(threads)); } catch {}
  }, [threads, activeStorageKey]);

  // ── View state ──
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeThread = threads.find(t => t.id === activeThreadId) || null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [input]);

  const filteredThreads = threads.filter(t => {
    const q = searchQuery.toLowerCase();
    return !q || t.title.toLowerCase().includes(q) || t.preview.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q));
  });

  const pinnedThreads = filteredThreads.filter(t => t.pinned);
  const recentThreads = filteredThreads.filter(t => !t.pinned);

  const handleNewChat = () => {
    const newId = 'chat_' + Date.now();
    const newThread: AIChatThread = {
      id: newId,
      title: 'New Conversation',
      preview: 'Start a new conversation with Cadence AI...',
      model: 'cadence-gpt',
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      pinned: false,
      tags: [],
      messages: [],
    };
    setThreads(prev => [newThread, ...prev]);
    setActiveThreadId(newId);
    setInput('');
  };

  const handleSend = (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isTyping) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: AIChatMessage = { id: 'm_' + Date.now(), role: 'user', content: text, timestamp: now };

    let targetId = activeThreadId;

    if (!targetId) {
      // Create new thread inline
      const newId = 'chat_' + Date.now();
      const title = text.length > 48 ? text.slice(0, 48) + '...' : text;
      const newThread: AIChatThread = {
        id: newId, title, preview: text,
        model: 'cadence-gpt',
        createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        updatedAt: now, pinned: false, tags: [],
        messages: [userMsg],
      };
      setThreads(prev => [newThread, ...prev]);
      targetId = newId;
      setActiveThreadId(newId);
    } else {
      setThreads(prev => prev.map(t =>
        t.id === targetId
          ? { ...t, messages: [...t.messages, userMsg], updatedAt: now, preview: text }
          : t
      ));
    }

    setInput('');
    setIsTyping(true);

    // Simulate AI response with realistic delay
    const delay = 1200 + Math.random() * 800;
    setTimeout(() => {
      const aiContent = generateAIResponse(text, isClient);
      const aiMsg: AIChatMessage = {
        id: 'm_ai_' + Date.now(),
        role: 'assistant',
        content: aiContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setThreads(prev => prev.map(t =>
        t.id === targetId
          ? { ...t, messages: [...t.messages, aiMsg], updatedAt: aiMsg.timestamp }
          : t
      ));
      setIsTyping(false);
    }, delay);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePinThread = (id: string) => {
    setThreads(prev => prev.map(t => t.id === id ? { ...t, pinned: !t.pinned } : t));
  };

  const handleDeleteThread = (id: string) => {
    setThreads(prev => prev.filter(t => t.id !== id));
    if (activeThreadId === id) setActiveThreadId(null);
    setShowDeleteConfirm(null);
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content).catch(() => {});
  };

  // ── RENDER ──
  return (
    <div className="flex h-full max-h-full bg-[#0d0e12] rounded-2xl border border-[#292a2e]/60 overflow-hidden shadow-2xl">

      {/* ── LEFT SIDEBAR: THREAD LIST ── */}
      {sidebarOpen && (
        <aside className="w-72 flex-shrink-0 bg-[#141519] border-r border-[#292a2e]/60 flex flex-col h-full overflow-hidden">
          {/* Sidebar Header */}
          <div className="px-4 py-4 border-b border-[#292a2e]/60 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#e85a2b] to-[#ffb4a3] flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[14px]">auto_awesome</span>
                </div>
                <span className="font-space font-bold text-[#e3e2e8] text-sm">Cadence AI</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-[#4a4855] hover:text-[#958ea0] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
            </div>

            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#e85a2b] hover:bg-[#ff6b3d] text-white text-xs font-space font-bold transition-all shadow-[0_0_16px_rgba(232,90,43,0.3)] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              New conversation
            </button>
          </div>

          {/* Search */}
          <div className="px-3 py-3 border-b border-[#292a2e]/40 flex-shrink-0">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#1a1b20] border border-[#292a2e]/60">
              <span className="material-symbols-outlined text-[15px] text-[#4a4855]">search</span>
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-[#e3e2e8] placeholder-[#4a4855] outline-none flex-1 font-sans"
              />
            </div>
          </div>

          {/* Thread List */}
          <div
            className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2 min-h-0"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#292a2e transparent' }}
          >
            {/* Pinned */}
            {pinnedThreads.length > 0 && (
              <>
                <div className="px-2 py-1.5">
                  <span className="text-[9px] font-space uppercase tracking-widest text-[#4a4855] font-semibold">Pinned</span>
                </div>
                {pinnedThreads.map(thread => (
                  <ThreadItem
                    key={thread.id}
                    thread={thread}
                    isActive={activeThreadId === thread.id}
                    onSelect={() => setActiveThreadId(thread.id)}
                    onPin={() => handlePinThread(thread.id)}
                    onDeleteRequest={() => setShowDeleteConfirm(thread.id)}
                  />
                ))}
                <div className="h-px bg-[#292a2e]/40 mx-2 my-2" />
              </>
            )}

            {/* Recent */}
            {recentThreads.length > 0 && (
              <>
                <div className="px-2 py-1.5">
                  <span className="text-[9px] font-space uppercase tracking-widest text-[#4a4855] font-semibold">Recent</span>
                </div>
                {recentThreads.map(thread => (
                  <ThreadItem
                    key={thread.id}
                    thread={thread}
                    isActive={activeThreadId === thread.id}
                    onSelect={() => setActiveThreadId(thread.id)}
                    onPin={() => handlePinThread(thread.id)}
                    onDeleteRequest={() => setShowDeleteConfirm(thread.id)}
                  />
                ))}
              </>
            )}

            {filteredThreads.length === 0 && (
              <div className="px-4 py-8 text-center">
                <span className="material-symbols-outlined text-[32px] text-[#292a2e] block mb-2">chat_bubble_outline</span>
                <p className="text-xs text-[#4a4855]">No conversations found</p>
              </div>
            )}
          </div>

          {/* Sidebar Footer: Model info */}
          <div className="px-4 py-3 border-t border-[#292a2e]/60 flex-shrink-0">
            <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[#1a1b20] border border-[#292a2e]/40">
              <div className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] font-space font-semibold text-[#e3e2e8]">Cadence GPT</div>
                <div className="text-[9px] text-[#4a4855] font-mono truncate">nutrition · coaching · telemetry</div>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* ── MAIN CHAT PANEL ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">

        {/* Chat Top Bar */}
        <header className="bg-[#141519] border-b border-[#292a2e]/60 px-5 py-3 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-[#4a4855] hover:text-[#e3e2e8] cursor-pointer transition-colors flex-shrink-0"
              >
                <span className="material-symbols-outlined text-[20px]">menu</span>
              </button>
            )}
            {activeThread ? (
              <>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#e85a2b]/30 to-[#ffb4a3]/20 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[#ffb4a3] text-[16px]">auto_awesome</span>
                </div>
                <div className="min-w-0">
                  <div className="font-space font-bold text-sm text-[#e3e2e8] truncate">{activeThread.title}</div>
                  <div className="text-[10px] text-[#4a4855] font-mono">
                    {activeThread.messages.length} messages · {activeThread.updatedAt}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#e85a2b] to-[#ffb4a3] flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[16px]">auto_awesome</span>
                </div>
                <div>
                  <div className="font-space font-bold text-sm text-[#e3e2e8]">
                    {isClient ? 'Cadence Health Assistant' : 'Cadence AI'}
                  </div>
                  <div className="text-[10px] text-[#4a4855]">
                    {isClient
                      ? 'Your personal nutrition & recovery intelligence'
                      : 'Your elite coaching intelligence layer'}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {activeThread && (
              <>
                <button
                  onClick={() => handlePinThread(activeThread.id)}
                  className="p-1.5 rounded-lg hover:bg-[#292a2e] text-[#4a4855] hover:text-[#ffb4a3] transition-colors cursor-pointer"
                  title={activeThread.pinned ? 'Unpin' : 'Pin conversation'}
                >
                  <span className="material-symbols-outlined text-[17px]">
                    {activeThread.pinned ? 'push_pin' : 'push_pin'}
                  </span>
                </button>
                <button
                  onClick={handleNewChat}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1b20] hover:bg-[#292a2e] border border-[#292a2e] text-[#cbc3d7] text-xs font-space font-semibold cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  New
                </button>
              </>
            )}
            {/* Client context pills — coach only */}
            {!isClient && clients.length > 0 && (
              <div className="hidden lg:flex items-center gap-1.5">
                {clients.slice(0, 3).map(c => (
                  <button
                    key={c.id}
                    onClick={() => setInput(prev => prev ? `${prev} [${c.name}]` : `Regarding ${c.name}: `)}
                    className="px-2 py-0.5 rounded-full bg-[#1a1b20] border border-[#292a2e]/60 text-[#958ea0] hover:text-[#e3e2e8] hover:border-[#ffb4a3]/40 text-[10px] font-space transition-colors cursor-pointer"
                  >
                    {c.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Messages Area */}
        <div
          className="flex-1 overflow-y-auto px-6 py-6 space-y-6 min-h-0"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#292a2e transparent' }}
        >
          {!activeThread ? (
            /* ── WELCOME / EMPTY STATE ── */
            <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center space-y-8">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#e85a2b] to-[#ffb4a3] flex items-center justify-center mx-auto mb-4 shadow-[0_0_40px_rgba(232,90,43,0.3)]">
                  <span className="material-symbols-outlined text-white text-[28px]">auto_awesome</span>
                </div>
                <h2 className="font-space font-bold text-2xl text-[#e3e2e8] mb-2">
                  {isClient ? 'Cadence Health Assistant' : 'Cadence AI'}
                </h2>
                <p className="text-[#958ea0] text-sm font-sans leading-relaxed">
                  {isClient
                    ? 'Your personal AI nutrition & recovery companion. Ask questions about your daily macro targets, meal timing, pre-workout fuel, and habit logging.'
                    : 'Your elite coaching intelligence layer. Ask anything about nutrition protocols, client telemetry, re-engagement strategies, lab interpretation, or macro engineering.'}
                </p>
              </div>

              {/* Suggested Prompts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {(isClient ? CLIENT_SUGGESTED_PROMPTS : SUGGESTED_PROMPTS).map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt.text)}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-[#141519] border border-[#292a2e]/60 hover:border-[#ffb4a3]/40 hover:bg-[#1a1b20] text-left transition-all group cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-[#e85a2b] flex-shrink-0 mt-0.5">{prompt.icon}</span>
                    <div>
                      <div className="text-xs font-space font-semibold text-[#e3e2e8] mb-0.5 group-hover:text-[#ffdad2] transition-colors">{prompt.label}</div>
                      <div className="text-[11px] text-[#4a4855] font-sans leading-relaxed line-clamp-2">{prompt.text}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ── MESSAGE THREAD ── */
            <>
              {activeThread.messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <span className="material-symbols-outlined text-[40px] text-[#292a2e] mb-3">chat_bubble_outline</span>
                  <p className="text-[#4a4855] text-sm">Start the conversation below</p>
                </div>
              )}

              {activeThread.messages.map((msg, idx) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isLast={idx === activeThread.messages.length - 1}
                  onCopy={() => handleCopyMessage(msg.content)}
                />
              ))}

              {/* AI Typing Indicator */}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e85a2b]/30 to-[#ffb4a3]/20 border border-[#e85a2b]/30 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[#ffb4a3] text-[14px]">auto_awesome</span>
                  </div>
                  <div className="bg-[#1a1b20] border border-[#292a2e]/60 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-[#e85a2b] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-[#e85a2b] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-[#e85a2b] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* ── INPUT BAR ── */}
        <div className="border-t border-[#292a2e]/60 bg-[#141519] px-5 py-4 flex-shrink-0">
          {/* Client quick-attach (shows when a thread is active) */}
          {activeThread && clients.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] text-[#4a4855] font-space font-semibold">Quick context:</span>
              {clients.slice(0, 5).map(c => (
                <button
                  key={c.id}
                  onClick={() => setInput(prev => prev ? `${prev} Regarding ${c.name}: ` : `Regarding ${c.name}: `)}
                  className="px-2 py-0.5 rounded-full bg-[#1a1b20] border border-[#292a2e]/60 text-[#958ea0] hover:text-[#e3e2e8] hover:border-[#ffb4a3]/40 text-[10px] font-space transition-colors cursor-pointer"
                >
                  + {c.name.split(' ')[0]}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Cadence AI anything... (Shift+Enter for new line)"
                rows={1}
                className="w-full bg-[#1a1b20] border border-[#292a2e]/80 hover:border-[#ffb4a3]/30 focus:border-[#e85a2b]/60 rounded-xl px-4 py-3 text-sm text-[#e3e2e8] placeholder-[#4a4855] outline-none resize-none font-sans transition-colors leading-relaxed"
              />
            </div>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="w-10 h-10 rounded-xl bg-[#e85a2b] hover:bg-[#ff6b3d] disabled:bg-[#292a2e] disabled:text-[#4a4855] text-white flex items-center justify-center transition-all shadow-[0_0_16px_rgba(232,90,43,0.3)] disabled:shadow-none cursor-pointer disabled:cursor-not-allowed flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </div>
          <p className="text-[9px] text-[#4a4855] mt-2 text-center font-mono">
            Cadence AI · Specialized in elite nutrition, biometric coaching & client telemetry
          </p>
        </div>
      </div>

      {/* ── DELETE CONFIRM MODAL ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(null)}>
          <div className="bg-[#1a1b20] border border-[#292a2e] rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-400 text-[20px]">delete</span>
              </div>
              <div>
                <div className="font-space font-bold text-[#e3e2e8] text-sm">Delete conversation?</div>
                <div className="text-xs text-[#958ea0]">This cannot be undone</div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2 rounded-xl bg-[#292a2e] text-[#cbc3d7] text-xs font-space font-semibold cursor-pointer hover:bg-[#343439] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteThread(showDeleteConfirm)}
                className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-space font-bold cursor-pointer transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SUB-COMPONENTS ──

interface ThreadItemProps {
  thread: AIChatThread;
  isActive: boolean;
  onSelect: () => void;
  onPin: () => void;
  onDeleteRequest: () => void;
}

function ThreadItem({ thread, isActive, onSelect, onPin, onDeleteRequest }: ThreadItemProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={`group relative flex items-start gap-2.5 px-2.5 py-2.5 rounded-lg cursor-pointer transition-all ${
        isActive ? 'bg-[#e85a2b]/15 border border-[#e85a2b]/30' : 'hover:bg-[#1a1b20] border border-transparent'
      }`}
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
        isActive ? 'bg-[#e85a2b]/20' : 'bg-[#292a2e]'
      }`}>
        <span className={`material-symbols-outlined text-[13px] ${isActive ? 'text-[#ffb4a3]' : 'text-[#4a4855]'}`}>
          chat_bubble
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <span className={`text-xs font-space font-semibold truncate ${isActive ? 'text-[#e3e2e8]' : 'text-[#cbc3d7]'}`}>
            {thread.title}
          </span>
          {thread.pinned && (
            <span className="material-symbols-outlined text-[11px] text-[#e85a2b] flex-shrink-0">push_pin</span>
          )}
        </div>
        <div className="text-[10px] text-[#4a4855] truncate font-sans mt-0.5">{thread.preview}</div>
        <div className="text-[9px] text-[#4a4855] font-mono mt-1">{thread.updatedAt}</div>
      </div>

      {/* Hover actions */}
      {showActions && (
        <div className="absolute right-2 top-2 flex items-center gap-0.5 bg-[#1a1b20] border border-[#292a2e] rounded-lg p-0.5 z-10" onClick={e => e.stopPropagation()}>
          <button
            onClick={onPin}
            className="p-1 rounded hover:bg-[#292a2e] text-[#4a4855] hover:text-[#ffb4a3] transition-colors cursor-pointer"
            title={thread.pinned ? 'Unpin' : 'Pin'}
          >
            <span className="material-symbols-outlined text-[13px]">push_pin</span>
          </button>
          <button
            onClick={onDeleteRequest}
            className="p-1 rounded hover:bg-red-500/10 text-[#4a4855] hover:text-red-400 transition-colors cursor-pointer"
            title="Delete"
          >
            <span className="material-symbols-outlined text-[13px]">delete</span>
          </button>
        </div>
      )}
    </div>
  );
}

interface MessageBubbleProps {
  msg: AIChatMessage;
  isLast: boolean;
  onCopy: () => void;
}

function MessageBubble({ msg, onCopy }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === 'user';

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end gap-3 group">
        <div className="max-w-[75%]">
          <div className="bg-[#e85a2b] text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm font-sans leading-relaxed shadow-[0_0_20px_rgba(232,90,43,0.2)]">
            {msg.content}
          </div>
          <div className="flex items-center justify-end gap-2 mt-1">
            <span className="text-[10px] text-[#4a4855] font-mono">{msg.timestamp}</span>
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 text-[#4a4855] hover:text-[#958ea0] cursor-pointer transition-all"
            >
              <span className="material-symbols-outlined text-[13px]">{copied ? 'check' : 'content_copy'}</span>
            </button>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#292a2e] border border-[#e85a2b]/30 flex items-center justify-center flex-shrink-0 self-start mt-0.5">
          <span className="material-symbols-outlined text-[14px] text-[#e85a2b]">person</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 group">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e85a2b]/30 to-[#ffb4a3]/20 border border-[#e85a2b]/30 flex items-center justify-center flex-shrink-0 self-start mt-0.5">
        <span className="material-symbols-outlined text-[#ffb4a3] text-[14px]">auto_awesome</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-[#1a1b20] border border-[#292a2e]/60 rounded-2xl rounded-tl-sm px-5 py-4">
          <div className="space-y-1">
            {renderMarkdown(msg.content)}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-[10px] text-[#4a4855] font-mono">{msg.timestamp}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 text-[#4a4855] hover:text-[#958ea0] cursor-pointer transition-all text-[10px] font-space"
          >
            <span className="material-symbols-outlined text-[13px]">{copied ? 'check' : 'content_copy'}</span>
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 text-[#4a4855] hover:text-[#4edea3] cursor-pointer transition-all text-[10px] font-space"
            title="Good response"
          >
            <span className="material-symbols-outlined text-[13px]">thumb_up</span>
          </button>
          <button
            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 text-[#4a4855] hover:text-red-400 cursor-pointer transition-all text-[10px] font-space"
            title="Needs improvement"
          >
            <span className="material-symbols-outlined text-[13px]">thumb_down</span>
          </button>
        </div>
      </div>
    </div>
  );
}
