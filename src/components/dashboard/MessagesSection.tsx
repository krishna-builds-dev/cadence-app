import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { ClientEntry, Conversation, ChatMessage } from '../../types/dashboard';
import initialMessagesData from '../../data/messages.json';

interface MessagesSectionProps {
  clients?: ClientEntry[];
  conversations?: Conversation[];
  onConversationsChange?: (convs: Conversation[]) => void;
  onViewClient?: (clientName: string) => void;
  onLaunchVideoCall?: (client: ClientEntry) => void;
  currentUserRole?: 'coach' | 'client';
}

const SESSION_MESSAGES_KEY = 'cadence_session_messages';
const SESSION_CLIENT_MESSAGES_KEY = 'cadence_session_client_messages';

const QUICK_REPLIES = [
  '📊 Continuous glucose review updated',
  '🥗 +25g carb re-feed target approved',
  '💧 Electrolyte & sodium protocol sent',
  '🛌 HRV recovery deload protocol active',
];

export default function MessagesSection({
  clients = [],
  conversations: propsConversations,
  onConversationsChange,
  onViewClient,
  onLaunchVideoCall,
  currentUserRole = 'coach',
}: MessagesSectionProps) {
  const isClientRole = currentUserRole === 'client';
  const activeStorageKey = isClientRole ? SESSION_CLIENT_MESSAGES_KEY : SESSION_MESSAGES_KEY;

  // Load from sessionStorage or fallback to initialMessagesData
  const getInitial = (): Conversation[] => {
    try {
      const stored = sessionStorage.getItem(activeStorageKey);
      if (stored) return JSON.parse(stored) as Conversation[];
    } catch {}
    return initialMessagesData as Conversation[];
  };

  const [localConversations, setLocalConversations] = useState<Conversation[]>(getInitial);

  // Sync with sessionStorage
  useEffect(() => {
    if (!propsConversations) {
      try {
        sessionStorage.setItem(activeStorageKey, JSON.stringify(localConversations));
      } catch {}
    }
  }, [localConversations, propsConversations, activeStorageKey]);

  const conversations = propsConversations ?? localConversations;

  const updateConversations = (newConvs: Conversation[]) => {
    if (onConversationsChange) {
      onConversationsChange(newConvs);
    } else {
      setLocalConversations(newConvs);
    }
  };

  const [activeId, setActiveId] = useState<string>(() => {
    return conversations[0]?.id || 'conv_1';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'live'>('all');
  const [inputText, setInputText] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string; type: 'pdf' | 'image' | 'file' } | null>(null);

  // Editing state for sent messages
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeId) || conversations[0];

  // Auto-mark active conversation as read when selected
  useEffect(() => {
    if (activeConversation && (activeConversation.unreadCount || 0) > 0) {
      const updated = conversations.map((c) =>
        c.id === activeConversation.id ? { ...c, unreadCount: 0 } : c
      );
      updateConversations(updated);
    }
  }, [activeId]);

  // Auto-scroll chat feed to bottom without moving parent window or page scroll
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [activeId, activeConversation?.messages?.length]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      if (filterTab === 'unread' && (c.unreadCount || 0) === 0) return false;
      if (filterTab === 'live' && c.status !== 'Live') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesClient = c.clientName.toLowerCase().includes(q);
        const matchesCompany = (c.company || '').toLowerCase().includes(q);
        const matchesLast = c.lastMessage.toLowerCase().includes(q);
        if (!matchesClient && !matchesCompany && !matchesLast) return false;
      }
      return true;
    });
  }, [conversations, filterTab, searchQuery]);

  // Total unread count
  const totalUnread = useMemo(() => {
    return conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  }, [conversations]);

  // Send new message
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !attachedFile) || !activeConversation) return;

    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const timeStr = `${hours}:${minutes} ${ampm}`;

    const newMsg: ChatMessage = {
      id: 'm_' + Date.now(),
      sender: isClientRole ? 'client' : 'coach',
      text: inputText.trim() || (attachedFile ? `Attached: ${attachedFile.name}` : ''),
      time: timeStr,
      status: 'read',
      attachment: attachedFile || undefined,
    };

    const updated = conversations.map((c) => {
      if (c.id === activeConversation.id) {
        return {
          ...c,
          lastMessage: newMsg.text,
          date: 'Just now',
          messages: [...c.messages, newMsg],
        };
      }
      return c;
    });

    updateConversations(updated);
    setInputText('');
    setAttachedFile(null);
  };

  // Edit message
  const handleSaveEditMessage = (msgId: string) => {
    if (!editingText.trim() || !activeConversation) return;

    const updated = conversations.map((c) => {
      if (c.id === activeConversation.id) {
        const updatedMsgs = c.messages.map((m) =>
          m.id === msgId ? { ...m, text: editingText.trim() } : m
        );
        const lastMsg = updatedMsgs[updatedMsgs.length - 1]?.text || c.lastMessage;
        return {
          ...c,
          lastMessage: lastMsg,
          messages: updatedMsgs,
        };
      }
      return c;
    });

    updateConversations(updated);
    setEditingMessageId(null);
    setEditingText('');
  };

  // Delete message
  const handleDeleteMessage = (msgId: string) => {
    if (!activeConversation) return;
    if (!window.confirm('Delete this message?')) return;

    const updated = conversations.map((c) => {
      if (c.id === activeConversation.id) {
        const remaining = c.messages.filter((m) => m.id !== msgId);
        const lastMsg = remaining[remaining.length - 1]?.text || 'No messages yet';
        return {
          ...c,
          lastMessage: lastMsg,
          messages: remaining,
        };
      }
      return c;
    });

    updateConversations(updated);
  };

  // Toggle mark unread
  const handleToggleUnread = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = conversations.map((c) => {
      if (c.id === convId) {
        return {
          ...c,
          unreadCount: (c.unreadCount || 0) > 0 ? 0 : 1,
        };
      }
      return c;
    });
    updateConversations(updated);
  };

  // Delete entire conversation
  const handleDeleteConversation = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this entire conversation?')) return;

    const updated = conversations.filter((c) => c.id !== convId);
    updateConversations(updated);
    if (activeId === convId) {
      setActiveId(updated[0]?.id || '');
    }
  };

  // Clear active conversation history
  const handleClearHistory = () => {
    if (!activeConversation) return;
    if (!window.confirm(`Clear chat history with ${activeConversation.clientName}?`)) return;

    const updated = conversations.map((c) => {
      if (c.id === activeConversation.id) {
        return {
          ...c,
          lastMessage: 'Chat history cleared',
          messages: [],
        };
      }
      return c;
    });
    updateConversations(updated);
  };

  // Start new conversation
  const handleStartNewChat = (client: ClientEntry) => {
    const existing = conversations.find(
      (c) =>
        (c.clientId && c.clientId === client.id) ||
        c.clientName.toLowerCase() === client.name.toLowerCase()
    );

    if (existing) {
      setActiveId(existing.id);
      setShowNewModal(false);
      return;
    }

    const newConv: Conversation = {
      id: 'conv_' + Date.now(),
      clientId: client.id,
      company: client.company || client.name,
      clientName: client.name,
      focus: client.focus || 'Bio-Individuality Coaching',
      initials:
        client.initials ||
        client.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
      lastMessage: `Hi ${client.name}, how is your recovery score today?`,
      date: 'Just now',
      status: 'Live',
      unreadCount: 0,
      messages: [
        {
          id: 'm_' + Date.now(),
          sender: 'coach',
          text: `Hi ${client.name}, how is your recovery score today? Protocol metrics are updated in your portal.`,
          time: 'Just now',
          status: 'read',
        },
      ],
    };

    const updated = [newConv, ...conversations];
    updateConversations(updated);
    setActiveId(newConv.id);
    setShowNewModal(false);
  };

  // Handle simulated file attachment
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile({
        name: file.name,
        size: `${(file.size / 1024).toFixed(0)} KB`,
        type: file.type.includes('pdf') ? 'pdf' : file.type.includes('image') ? 'image' : 'file',
      });
    }
  };

  const matchedClient = activeConversation
    ? clients.find(
        (cl) =>
          (activeConversation.clientId && cl.id === activeConversation.clientId) ||
          cl.name.toLowerCase() === activeConversation.clientName.toLowerCase()
      )
    : null;

  return (
    <div className="rounded-2xl border border-[#292a2e]/80 bg-[#1a1b20] overflow-hidden flex flex-col md:flex-row h-full max-h-full shadow-2xl relative">
      {/* ── Left Sidebar (Conversations List) ── */}
      <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-[#292a2e]/60 flex flex-col bg-[#141519] flex-shrink-0 h-full overflow-hidden">
        {/* Header: Title + Unread badge + New Chat button */}
        <div className="p-4 px-5 pb-3 flex items-center justify-between border-b border-[#292a2e]/40 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ffb4a3] text-[20px]">chat</span>
            <h2 className="font-space text-lg font-bold text-[#e3e2e8]">
              {isClientRole ? 'Message Coach' : 'Messages'}
            </h2>
            {totalUnread > 0 && (
              <span className="px-2 py-0.2 rounded-full bg-[#ffb4a3] text-[#3a0900] text-[10px] font-space font-bold shadow-sm">
                {totalUnread} new
              </span>
            )}
          </div>
          {!isClientRole && (
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#ffb4a3] text-[#3a0900] hover:bg-[#ffdad2] text-xs font-space font-bold transition-all cursor-pointer shadow-[0_0_10px_rgba(255,180,163,0.3)]"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              <span>New Chat</span>
            </button>
          )}
        </div>

        {/* Search bar */}
        <div className="p-3 pb-2 flex-shrink-0">
          <div className="relative flex items-center bg-[#0d0e12] border border-[#292a2e] rounded-xl px-3 py-1.5 focus-within:border-[#ffb4a3]/60 transition-colors">
            <span className="material-symbols-outlined text-[#958ea0] text-[16px] mr-2 pointer-events-none">
              search
            </span>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-[#e3e2e8] placeholder-[#958ea0] focus:outline-none font-sans"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-[#958ea0] hover:text-[#e3e2e8]">
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-3 pb-2 flex items-center gap-1.5 flex-shrink-0">
          {(['all', 'unread', 'live'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3 py-1 rounded-lg text-[11px] font-space font-bold capitalize transition-all cursor-pointer ${
                filterTab === tab
                  ? 'bg-[#292a2e] text-[#ffdad2] border border-[#ffb4a3]/40'
                  : 'text-[#958ea0] hover:text-[#e3e2e8]'
              }`}
            >
              {tab === 'all' ? 'All Threads' : tab === 'unread' ? `Unread (${totalUnread})` : 'Online Now'}
            </button>
          ))}
        </div>

        {/* Conversation Items List */}
        <div
          className="flex-1 overflow-y-auto px-2 py-1 space-y-1 min-h-0"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#292a2e transparent' }}
        >
          {filteredConversations.map((c) => {
            const isActive = c.id === activeConversation?.id;
            const hasUnread = (c.unreadCount || 0) > 0;

            return (
              <div
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-3 group relative ${
                  isActive
                    ? 'bg-[#1a1b20] border border-[#ffb4a3]/40 shadow-sm'
                    : 'hover:bg-[#1a1b20]/60 border border-transparent'
                }`}
              >
                {/* Avatar with Initials & Online status */}
                <div className="relative flex-shrink-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-space font-bold text-xs transition-colors border ${
                      isActive
                        ? 'bg-[#ffb4a3]/20 border-[#ffb4a3]/50 text-[#ffdad2]'
                        : 'bg-[#292a2e] border-[#343439] text-[#e3e2e8]'
                    }`}
                  >
                    {c.initials}
                  </div>
                  {c.status === 'Live' && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#4edea3] border-2 border-[#141519]" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-space font-bold text-xs text-[#e3e2e8] truncate">
                      {c.clientName}
                    </span>
                    <span className="text-[10px] text-[#958ea0] font-sans flex-shrink-0">
                      {c.date}
                    </span>
                  </div>

                  <p className="text-[10px] text-[#958ea0] font-sans truncate mt-0.5">
                    {c.company || c.focus}
                  </p>

                  <p className={`text-[11px] truncate mt-0.5 font-sans ${hasUnread ? 'text-[#ffdad2] font-semibold' : 'text-[#958ea0]/80'}`}>
                    {c.lastMessage}
                  </p>
                </div>

                {/* Unread badge & Quick actions on hover */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {hasUnread && (
                    <span className="w-5 h-5 rounded-full bg-[#ffb4a3] text-[#3a0900] text-[10px] font-space font-bold flex items-center justify-center">
                      {c.unreadCount}
                    </span>
                  )}

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                    <button
                      onClick={(e) => handleToggleUnread(c.id, e)}
                      className="w-6 h-6 rounded flex items-center justify-center text-[#958ea0] hover:text-[#ffdad2] hover:bg-[#292a2e] transition-colors"
                      title={hasUnread ? 'Mark as read' : 'Mark as unread'}
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {hasUnread ? 'drafts' : 'mark_chat_unread'}
                      </span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteConversation(c.id, e)}
                      className="w-6 h-6 rounded flex items-center justify-center text-[#958ea0] hover:text-[#ff5449] hover:bg-[#ff5449]/15 transition-colors"
                      title="Delete thread"
                    >
                      <span className="material-symbols-outlined text-[13px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredConversations.length === 0 && (
            <div className="py-12 text-center text-xs text-[#958ea0] font-space">
              <span className="material-symbols-outlined text-3xl mb-1 text-[#958ea0]/40">chat_error</span>
              <p>No conversations found</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Right Panel (Chat Thread & Composer) ── */}
      {activeConversation ? (
        <div className="flex-1 flex flex-col bg-[#0d0e12] min-w-0 h-full overflow-hidden">
          {/* Chat Header */}
          <div className="px-5 py-3.5 border-b border-[#292a2e]/60 flex items-center justify-between bg-[#141519]/90 backdrop-blur-md flex-shrink-0 z-10">
            <div
              onClick={() => onViewClient && onViewClient(activeConversation.clientId || activeConversation.clientName)}
              className="flex items-center gap-3 min-w-0 cursor-pointer group/clienthead hover:opacity-90 transition-opacity"
              title={`Open ${activeConversation.clientName}'s profile`}
            >
              <div className="w-10 h-10 rounded-xl bg-[#ffb4a3]/20 border border-[#ffb4a3]/40 text-[#ffdad2] flex items-center justify-center font-space font-bold text-xs flex-shrink-0 group-hover/clienthead:scale-105 transition-transform">
                {activeConversation.initials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-space font-bold text-sm text-[#e3e2e8] group-hover/clienthead:text-[#ffdad2] transition-colors truncate">
                    {activeConversation.clientName}
                  </h3>
                  {activeConversation.company && (
                    <span className="text-[10px] font-space px-2 py-0.5 rounded-full bg-[#292a2e] text-[#958ea0]">
                      {activeConversation.company}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1 text-[11px] font-sans text-[#4edea3] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
                    <span>{activeConversation.status}</span>
                  </span>
                  <span className="text-[#958ea0]/40 text-xs">·</span>
                  <span className="text-[11px] text-[#ffdad2] font-space truncate">
                    {activeConversation.focus || 'Bio-Individuality Coaching'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions: Video Call, View Profile, Clear History */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {onLaunchVideoCall && matchedClient && (
                <button
                  onClick={() => onLaunchVideoCall(matchedClient)}
                  className="h-8 px-3 rounded-lg bg-[#ffb4a3] text-[#3a0900] hover:bg-[#ffdad2] font-space font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-[0_0_10px_rgba(255,180,163,0.3)]"
                  title="Launch 1-on-1 video call"
                >
                  <span className="material-symbols-outlined text-[16px]">videocam</span>
                  <span className="hidden sm:inline">Start Call</span>
                </button>
              )}

              {onViewClient && !isClientRole && (
                <button
                  onClick={() => onViewClient(activeConversation.clientId || activeConversation.clientName)}
                  className="h-8 px-3 rounded-lg bg-[#292a2e] hover:bg-[#343439] text-[#e3e2e8] hover:text-[#ffdad2] font-space text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 border border-[#292a2e] hover:border-[#ffb4a3]/40"
                  title={`Open ${activeConversation.clientName}'s client profile`}
                >
                  <span className="material-symbols-outlined text-[14px]">person</span>
                  <span>Profile</span>
                </button>
              )}

              <button
                onClick={handleClearHistory}
                className="w-8 h-8 rounded-lg bg-[#292a2e] hover:bg-[#ff5449]/20 text-[#958ea0] hover:text-[#ff5449] transition-colors cursor-pointer flex items-center justify-center"
                title="Clear chat history"
              >
                <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#292a2e transparent' }}
          >
            {activeConversation.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-[#958ea0]">
                <div className="w-12 h-12 rounded-xl bg-[#292a2e]/60 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-2xl text-[#ffb4a3]">forum</span>
                </div>
                <p className="font-space font-bold text-sm text-[#e3e2e8]">No messages yet</p>
                <p className="text-xs text-[#958ea0] font-sans mt-0.5 max-w-xs text-center">
                  Send a message or prescription protocol to begin communication with {activeConversation.clientName}.
                </p>
              </div>
            ) : (
              activeConversation.messages.map((m) => {
                const isMe = isClientRole ? m.sender === 'client' : m.sender === 'coach';
                const isEditing = editingMessageId === m.id;

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 max-w-[85%] sm:max-w-md">
                      {/* Message Actions on Hover (left side) */}
                      {isMe && !isEditing && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 order-first mr-1">
                          <button
                            onClick={() => {
                              setEditingMessageId(m.id);
                              setEditingText(m.text);
                            }}
                            className="w-6 h-6 rounded bg-[#292a2e] hover:bg-[#ffb4a3]/20 text-[#958ea0] hover:text-[#ffdad2] flex items-center justify-center transition-colors cursor-pointer"
                            title="Edit message"
                          >
                            <span className="material-symbols-outlined text-[13px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(m.id)}
                            className="w-6 h-6 rounded bg-[#292a2e] hover:bg-[#ff5449]/20 text-[#958ea0] hover:text-[#ff5449] flex items-center justify-center transition-colors cursor-pointer"
                            title="Delete message"
                          >
                            <span className="material-symbols-outlined text-[13px]">delete</span>
                          </button>
                        </div>
                      )}

                      {/* Bubble */}
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed transition-all shadow-md ${
                          isMe
                            ? 'bg-[#ffb4a3] text-[#3a0900] rounded-br-xs font-sans font-medium'
                            : 'bg-[#1a1b20] border border-[#292a2e] text-[#e3e2e8] rounded-bl-xs font-sans'
                        }`}
                      >
                        {isEditing ? (
                          <div className="space-y-2 py-1">
                            <textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="w-full bg-[#141519] border border-[#ffb4a3] text-[#e3e2e8] rounded-lg p-2 text-xs focus:outline-none resize-none font-sans"
                              rows={2}
                              autoFocus
                            />
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => setEditingMessageId(null)}
                                className="px-2 py-1 rounded bg-[#292a2e] text-[#e3e2e8] text-[10px] font-space cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveEditMessage(m.id)}
                                className="px-2 py-1 rounded bg-[#3a0900] text-[#ffdad2] text-[10px] font-space font-bold cursor-pointer"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="whitespace-pre-line">{m.text}</p>

                            {/* Attachment rendering */}
                            {m.attachment && (
                              <div className={`mt-2 p-2 rounded-xl flex items-center gap-2 border ${
                                isMe ? 'bg-[#3a0900]/10 border-[#3a0900]/20 text-[#3a0900]' : 'bg-[#0d0e12] border-[#292a2e] text-[#e3e2e8]'
                              }`}>
                                <span className="material-symbols-outlined text-[18px]">
                                  {m.attachment.type === 'pdf' ? 'picture_as_pdf' : 'attachment'}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-space font-bold truncate">{m.attachment.name}</p>
                                  <p className="text-[9px] opacity-75">{m.attachment.size}</p>
                                </div>
                                <span className="material-symbols-outlined text-[15px] cursor-pointer" title="Download file">
                                  download
                                </span>
                              </div>
                            )}

                            {/* Timestamp & read receipts */}
                            <div
                              className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                                isMe ? 'text-[#3a0900]/80 font-mono font-medium' : 'text-[#958ea0] font-sans'
                              }`}
                            >
                              <span>{m.time}</span>
                              {isMe && (
                                <span className="text-[11px] tracking-tighter" title="Delivered & Read">
                                  ✓✓
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Message Actions for other party (right side copy) */}
                      {!isMe && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 ml-1">
                          <button
                            onClick={() => {
                              navigator.clipboard?.writeText(m.text);
                              alert('Message copied to clipboard');
                            }}
                            className="w-6 h-6 rounded bg-[#292a2e] hover:bg-[#343439] text-[#958ea0] hover:text-[#e3e2e8] flex items-center justify-center transition-colors cursor-pointer"
                            title="Copy text"
                          >
                            <span className="material-symbols-outlined text-[13px]">content_copy</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Action Suggestion Pills */}
          <div className="px-5 py-2 border-t border-[#292a2e]/40 bg-[#141519]/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-space font-bold text-[#958ea0] uppercase tracking-wider flex-shrink-0">
              Protocols:
            </span>
            {QUICK_REPLIES.map((reply, i) => (
              <button
                key={i}
                onClick={() => setInputText(reply)}
                className="px-2.5 py-1 rounded-full bg-[#1a1b20] hover:bg-[#ffb4a3]/20 border border-[#292a2e] hover:border-[#ffb4a3]/40 text-[11px] text-[#e3e2e8] hover:text-[#ffdad2] transition-colors cursor-pointer flex-shrink-0 font-sans shadow-sm"
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Attached File Preview Bar */}
          {attachedFile && (
            <div className="px-5 py-1.5 bg-[#141519] border-t border-[#292a2e]/40 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[#ffdad2]">
                <span className="material-symbols-outlined text-[16px] text-[#ffb4a3]">attach_file</span>
                <span className="font-space font-bold">{attachedFile.name}</span>
                <span className="text-[#958ea0] text-[10px]">({attachedFile.size})</span>
              </div>
              <button
                onClick={() => setAttachedFile(null)}
                className="text-[#958ea0] hover:text-[#ff5449] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          )}

          {/* Chat Composer Input Bar */}
          <div className="p-3.5 px-5 border-t border-[#292a2e]/60 bg-[#141519]/90 backdrop-blur-md flex-shrink-0">
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-2 bg-[#0d0e12] border border-[#292a2e] rounded-xl px-3 py-1.5 focus-within:border-[#ffb4a3]/60 transition-colors shadow-inner"
            >
              {/* Paperclip attachment trigger */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1 rounded-lg text-[#958ea0] hover:text-[#ffdad2] hover:bg-[#1a1b20] transition-colors cursor-pointer flex-shrink-0"
                title="Attach document or biomarker file"
              >
                <span className="material-symbols-outlined text-[18px]">attach_file</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />

              <input
                type="text"
                placeholder={`Write message to ${activeConversation.clientName}...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-transparent text-xs sm:text-sm text-[#e3e2e8] placeholder-[#958ea0] focus:outline-none py-1.5 font-sans"
              />

              <button
                type="submit"
                disabled={!inputText.trim() && !attachedFile}
                className="h-8 px-3 rounded-lg bg-[#ffb4a3] text-[#3a0900] hover:bg-[#ffdad2] font-space font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(255,180,163,0.3)] flex-shrink-0"
              >
                <span>Send</span>
                <span className="material-symbols-outlined text-[14px]">send</span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-[#958ea0] bg-[#0d0e12]">
          <span className="material-symbols-outlined text-4xl mb-2 text-[#958ea0]/40">forum</span>
          <p className="font-space text-sm font-bold text-[#e3e2e8]">Select a conversation to start messaging</p>
        </div>
      )}

      {/* ── Start New Conversation Modal ── */}
      {showNewModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowNewModal(false)}
        >
          <div
            className="w-full max-w-md bg-[#1a1b20] border border-[#ffb4a3]/40 rounded-2xl p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#292a2e]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ffb4a3] text-[20px]">add_comment</span>
                <h3 className="font-space font-bold text-[#e3e2e8] text-base">
                  Start New Message Thread
                </h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-[#958ea0] hover:text-[#e3e2e8] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-xs text-[#958ea0] font-sans">
              Select an active client from your roster to start a direct coaching message thread:
            </p>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {clients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleStartNewChat(c)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0d0e12] border border-[#292a2e] hover:border-[#ffb4a3]/60 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#ffb4a3]/20 border border-[#ffb4a3]/40 text-[#ffdad2] font-space font-bold text-xs flex items-center justify-center">
                      {c.initials || c.name[0]}
                    </div>
                    <div>
                      <div className="font-space font-bold text-xs text-[#e3e2e8] group-hover:text-[#ffdad2] transition-colors">
                        {c.name}
                      </div>
                      <div className="text-[10px] text-[#958ea0]">
                        {c.focus || c.company || 'Active Client'}
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[#958ea0] group-hover:text-[#ffb4a3] text-[18px] transition-colors">
                    chat
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
