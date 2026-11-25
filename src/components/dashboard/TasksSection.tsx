import React, { useState, useEffect } from 'react';
import type { TaskItem, TaskStatus, TaskPriority, ClientEntry } from '../../types/dashboard';
import defaultTasksData from '../../data/tasks.json';

interface TasksSectionProps {
  clients: ClientEntry[];
  tasks?: TaskItem[];
  setTasks?: React.Dispatch<React.SetStateAction<TaskItem[]>>;
}

const SESSION_TASKS_KEY = 'cadence_session_tasks';

const STAGES: { id: TaskStatus; label: string; dotColor: string }[] = [
  { id: 'backlog', label: 'Backlog', dotColor: 'bg-[#958ea0]' },
  { id: 'todo', label: 'To do', dotColor: 'bg-[#3b82f6]' },
  { id: 'in-progress', label: 'In progress', dotColor: 'bg-[#f59e0b]' },
  { id: 'in-review', label: 'In review', dotColor: 'bg-[#8b5cf6]' },
  { id: 'done', label: 'Done', dotColor: 'bg-[#10b981]' },
];

export default function TasksSection({
  clients,
  tasks: propsTasks,
  setTasks: propsSetTasks,
}: TasksSectionProps) {
  // Session storage sync
  const [internalTasks, setInternalTasks] = useState<TaskItem[]>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_TASKS_KEY);
      if (stored) return JSON.parse(stored) as TaskItem[];
    } catch {}
    return defaultTasksData as TaskItem[];
  });

  const tasks = propsTasks || internalTasks;
  const setTasks = propsSetTasks || setInternalTasks;

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_TASKS_KEY, JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  // View state: 'board' | 'list' | 'calendar'
  const [activeView, setActiveView] = useState<'board' | 'list' | 'calendar'>('board');

  // Drag and drop state
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<'stage' | 'priority' | 'client'>('stage');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [sortAscending, setSortAscending] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalClient, setModalClient] = useState('Admin');
  const [modalPriority, setModalPriority] = useState<TaskPriority>('medium');
  const [modalStatus, setModalStatus] = useState<TaskStatus>('todo');
  const [modalDue, setModalDue] = useState('Today');
  const [modalDescription, setModalDescription] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const handleOpenAddModal = (initialStatus: TaskStatus = 'todo') => {
    setEditingTask(null);
    setModalTitle('');
    setModalClient('Admin');
    setModalPriority('medium');
    setModalStatus(initialStatus);
    setModalDue('Today');
    setModalDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (t: TaskItem) => {
    setEditingTask(t);
    setModalTitle(t.title);
    setModalClient(t.client);
    setModalPriority(t.priority);
    setModalStatus(t.status);
    setModalDue(t.due);
    setModalDescription(t.description || '');
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim()) return;

    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                title: modalTitle.trim(),
                client: modalClient,
                priority: modalPriority,
                status: modalStatus,
                due: modalDue.trim() || 'No due date',
                description: modalDescription.trim(),
              }
            : t
        )
      );
    } else {
      const newTask: TaskItem = {
        id: 't_' + Date.now(),
        title: modalTitle.trim(),
        client: modalClient,
        priority: modalPriority,
        status: modalStatus,
        due: modalDue.trim() || 'Today',
        description: modalDescription.trim(),
      };
      setTasks((prev) => [newTask, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (editingTask?.id === taskId) {
      setIsModalOpen(false);
    }
  };

  const handleClearCompleted = () => {
    if (window.confirm('Delete all tasks in the "Done" stage?')) {
      setTasks((prev) => prev.filter((t) => t.status !== 'done'));
    }
  };

  // ── Drag & Drop Handlers ──
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggingTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverCol(null);
    setDragOverCardId(null);
  };

  const handleDragOverColumn = (e: React.DragEvent, colId: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  };

  const handleDropOnColumn = (e: React.DragEvent, colId: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    if (!taskId) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: colId } : t))
    );
    setDraggingTaskId(null);
    setDragOverCol(null);
    setDragOverCardId(null);
  };

  const handleDropOnCard = (e: React.DragEvent, targetCardId: string, targetColId: TaskStatus) => {
    e.preventDefault();
    e.stopPropagation();
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    if (!taskId || taskId === targetCardId) return;

    setTasks((prev) => {
      const taskToMove = prev.find((t) => t.id === taskId);
      if (!taskToMove) return prev;

      const remaining = prev.filter((t) => t.id !== taskId);
      const targetIdx = remaining.findIndex((t) => t.id === targetCardId);

      const updatedTask = { ...taskToMove, status: targetColId };
      if (targetIdx === -1) {
        return [...remaining, updatedTask];
      }
      const newTasks = [...remaining];
      newTasks.splice(targetIdx, 0, updatedTask);
      return newTasks;
    });

    setDraggingTaskId(null);
    setDragOverCol(null);
    setDragOverCardId(null);
  };

  // Filter tasks based on search, priority, client
  const filteredTasks = tasks
    .filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.client.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q));
      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      const matchesClient = clientFilter === 'all' || t.client === clientFilter;
      return matchesSearch && matchesPriority && matchesClient;
    })
    .sort((a, b) => {
      if (sortAscending) {
        return a.title.localeCompare(b.title);
      }
      return b.title.localeCompare(a.title);
    });

  const getPriorityBadgeClass = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-[#ff5449]/20 text-[#ff8a74] border border-[#ff5449]/40';
      case 'high':
        return 'bg-[#ffb4a3]/20 text-[#ffb4a3] border border-[#ffb4a3]/30';
      case 'medium':
        return 'bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30';
      case 'low':
      default:
        return 'bg-[#292a2e] text-[#958ea0] border border-[#343439]';
    }
  };

  return (
    <div className="space-y-4 pb-12 font-sans">
      {/* ── TOP CONTROL BAR ── */}
      <div className="bg-[#141519] border border-[#292a2e]/60 rounded-2xl p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        {/* Left: View Tabs + Stage dropdown */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Segmented View Switcher: Board | List | Calendar */}
          <div className="flex items-center bg-[#0d0e12] border border-[#292a2e] rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setActiveView('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-space font-medium transition-all cursor-pointer ${
                activeView === 'board'
                  ? 'bg-[#1e1f25] text-[#e3e2e8] shadow-sm font-semibold'
                  : 'text-[#958ea0] hover:text-[#e3e2e8]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">view_kanban</span>
              <span>Board</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-space font-medium transition-all cursor-pointer ${
                activeView === 'list'
                  ? 'bg-[#1e1f25] text-[#e3e2e8] shadow-sm font-semibold'
                  : 'text-[#958ea0] hover:text-[#e3e2e8]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">format_list_bulleted</span>
              <span>List</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-space font-medium transition-all cursor-pointer ${
                activeView === 'calendar'
                  ? 'bg-[#1e1f25] text-[#e3e2e8] shadow-sm font-semibold'
                  : 'text-[#958ea0] hover:text-[#e3e2e8]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">calendar_month</span>
              <span>Calendar</span>
            </button>
          </div>

          {/* Group By Stage Dropdown */}
          <div className="relative">
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'stage' | 'priority' | 'client')}
              aria-label="Group tasks by attribute"
              className="appearance-none bg-[#0d0e12] border border-[#292a2e] text-[#e3e2e8] text-xs font-space rounded-xl pl-3 pr-8 py-2 focus:outline-none focus:border-[#ffb4a3] cursor-pointer"
            >
              <option value="stage">By stage</option>
              <option value="priority">By priority</option>
              <option value="client">By client</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-2.5 text-[16px] text-[#958ea0] pointer-events-none">
              expand_more
            </span>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <span className="material-symbols-outlined absolute left-3 top-2 text-[17px] text-[#958ea0]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks"
              className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-xl pl-9 pr-7 py-1.5 text-xs text-[#e3e2e8] placeholder-[#958ea0] focus:outline-none focus:border-[#ffb4a3] transition-colors font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-[#958ea0] hover:text-[#e3e2e8] text-xs cursor-pointer"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Right: Filter, Sort, Clear, + New Task Button */}
        <div className="flex items-center gap-2">
          {/* Filter Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                priorityFilter !== 'all' || clientFilter !== 'all'
                  ? 'bg-[#ffb4a3]/20 border-[#ffb4a3] text-[#ffdad2]'
                  : 'bg-[#0d0e12] border-[#292a2e] text-[#958ea0] hover:text-[#e3e2e8]'
              }`}
              title="Filter tasks"
            >
              <span className="material-symbols-outlined text-[17px]">filter_list</span>
            </button>

            {/* Filter Dropdown Menu */}
            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-[#1a1b20] border border-[#292a2e] rounded-xl p-3 shadow-2xl z-30 space-y-3 font-space text-xs">
                <div className="flex items-center justify-between border-b border-[#292a2e] pb-1.5">
                  <span className="font-bold text-[#e3e2e8]">Filter Tasks</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPriorityFilter('all');
                      setClientFilter('all');
                    }}
                    className="text-[10px] text-[#ffb4a3] hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                </div>

                <div>
                  <label className="text-[10px] uppercase text-[#958ea0] font-bold block mb-1">
                    Priority
                  </label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value as any)}
                    className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-lg px-2 py-1.5 text-xs text-[#e3e2e8] focus:border-[#ffb4a3] focus:outline-none"
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase text-[#958ea0] font-bold block mb-1">
                    Client
                  </label>
                  <select
                    value={clientFilter}
                    onChange={(e) => setClientFilter(e.target.value)}
                    className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-lg px-2 py-1.5 text-xs text-[#e3e2e8] focus:border-[#ffb4a3] focus:outline-none"
                  >
                    <option value="all">All Clients</option>
                    <option value="Admin">Admin / General</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Sort Asc/Desc Button */}
          <button
            type="button"
            onClick={() => setSortAscending(!sortAscending)}
            className="w-8 h-8 rounded-xl bg-[#0d0e12] border border-[#292a2e] text-[#958ea0] hover:text-[#e3e2e8] flex items-center justify-center transition-colors cursor-pointer"
            title={sortAscending ? 'Sorted A-Z (Click for Z-A)' : 'Sorted Z-A (Click for A-Z)'}
          >
            <span className="material-symbols-outlined text-[17px]">swap_vert</span>
          </button>

          {/* Clear Completed Trash Button */}
          <button
            type="button"
            onClick={handleClearCompleted}
            className="w-8 h-8 rounded-xl bg-[#0d0e12] border border-[#292a2e] text-[#958ea0] hover:text-[#ff5449] hover:border-[#ff5449]/40 flex items-center justify-center transition-colors cursor-pointer"
            title="Clear all tasks in 'Done' stage"
          >
            <span className="material-symbols-outlined text-[17px]">delete_outline</span>
          </button>

          {/* + New Task Button */}
          <button
            type="button"
            onClick={() => handleOpenAddModal('todo')}
            className="h-8 sm:h-9 px-3.5 sm:px-4 rounded-xl bg-[#e85a2b] hover:bg-[#ff6b3d] text-white font-space font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-[0_0_16px_rgba(232,90,43,0.35)] cursor-pointer flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[17px] font-bold">add</span>
            <span>New task</span>
          </button>
        </div>
      </div>

      {/* ── BOARD VIEW (Drag-and-Drop Enabled Kanban Columns) ── */}
      {activeView === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3.5 items-start">
          {STAGES.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            const isColHovered = dragOverCol === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOverColumn(e, col.id)}
                onDrop={(e) => handleDropOnColumn(e, col.id)}
                className={`bg-[#141519] rounded-2xl flex flex-col min-h-[540px] shadow-sm transition-all border ${
                  isColHovered
                    ? 'border-[#e85a2b] ring-2 ring-[#e85a2b]/30 bg-[#e85a2b]/5'
                    : 'border-[#292a2e]/70'
                }`}
              >
                {/* Column Header */}
                <div className="px-3.5 py-3 border-b border-[#292a2e]/60 flex items-center justify-between bg-[#1a1b20]/60 rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                    <span className="font-space font-bold text-xs text-[#e3e2e8]">
                      {col.label}
                    </span>
                    <span className="text-xs font-space text-[#958ea0] ml-0.5">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenAddModal(col.id)}
                      className="text-[#958ea0] hover:text-[#e3e2e8] p-0.5 transition-colors cursor-pointer flex items-center justify-center"
                      title={`Add task to ${col.label}`}
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                    </button>
                  </div>
                </div>

                {/* Column Body / Droppable Cards Container */}
                <div className="p-3 flex-1 flex flex-col gap-3 overflow-y-auto max-h-[720px]">
                  {colTasks.length === 0 ? (
                    <div
                      className={`flex-1 flex flex-col items-center justify-center py-24 text-xs transition-colors rounded-xl border border-dashed ${
                        isColHovered
                          ? 'border-[#e85a2b] text-[#e85a2b] bg-[#e85a2b]/10'
                          : 'border-transparent text-[#4a4855]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[24px] mb-1 opacity-60">
                        {isColHovered ? 'download' : 'inbox'}
                      </span>
                      <span>{isColHovered ? 'Drop task here' : 'No tasks'}</span>
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const isDragging = draggingTaskId === task.id;
                      const isOverThisCard = dragOverCardId === task.id;

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverCardId(task.id);
                          }}
                          onDragLeave={() => setDragOverCardId(null)}
                          onDrop={(e) => handleDropOnCard(e, task.id, col.id)}
                          onClick={() => handleOpenEditModal(task)}
                          className={`p-3.5 rounded-xl bg-[#1a1b20] hover:bg-[#1e1f26] border transition-all cursor-grab active:cursor-grabbing shadow-sm group flex flex-col gap-2.5 relative ${
                            isDragging
                              ? 'opacity-40 scale-[0.98] border-dashed border-[#e85a2b]'
                              : isOverThisCard
                              ? 'border-[#e85a2b] ring-1 ring-[#e85a2b]/50 shadow-md translate-y-[-2px]'
                              : 'border-[#292a2e]/80 hover:border-[#ffb4a3]/50'
                          }`}
                        >
                          {/* ── ACTION BUTTONS & METADATA ABOVE THE CARD BODY ── */}
                          <div
                            className="flex items-center justify-between pb-2 border-b border-[#292a2e]/60"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Priority Badge on Left */}
                            <span
                              className={`text-[9px] font-space font-bold uppercase px-1.5 py-0.5 rounded tracking-wide ${getPriorityBadgeClass(
                                task.priority
                              )}`}
                            >
                              {task.priority}
                            </span>

                            {/* Action Buttons: Edit + Delete (Compact, smaller icons, only on hover) */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(task)}
                                className="text-[#958ea0] hover:text-[#ffb4a3] p-0.5 flex items-center justify-center cursor-pointer transition-colors"
                                title="Edit task"
                              >
                                <span className="material-symbols-outlined text-[12px]">edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-[#958ea0] hover:text-[#ff5449] p-0.5 flex items-center justify-center cursor-pointer transition-colors"
                                title="Delete task"
                              >
                                <span className="material-symbols-outlined text-[12px]">delete</span>
                              </button>
                            </div>
                          </div>

                          {/* ── CARD BODY: TITLE & DESCRIPTION ── */}
                          <div className="space-y-1">
                            <h4
                              className={`text-xs font-semibold leading-relaxed tracking-normal ${
                                task.status === 'done'
                                  ? 'line-through text-[#6e6a78]'
                                  : 'text-[#e3e2e8] group-hover:text-white transition-colors'
                              }`}
                            >
                              {task.title}
                            </h4>

                            {task.description && (
                              <p className="text-[11px] text-[#958ea0] line-clamp-2 leading-relaxed font-sans">
                                {task.description}
                              </p>
                            )}
                          </div>

                          {/* ── CARD FOOTER: CLIENT ASSOCIATION & DUE DATE ── */}
                          <div className="flex items-center justify-between pt-2 border-t border-[#292a2e]/40 text-[10px]">
                            <div className="flex items-center gap-1.5 truncate max-w-[65%]">
                              <span className="material-symbols-outlined text-[12px] text-[#ffb4a3]">
                                person
                              </span>
                              <span className="font-space text-[#cbc3d7] truncate">
                                {task.client}
                              </span>
                            </div>

                            <span className="font-sans text-[#958ea0] flex items-center gap-1 flex-shrink-0">
                              <span className="material-symbols-outlined text-[11px]">event</span>
                              <span>{task.due}</span>
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {activeView === 'list' && (
        <div className="bg-[#141519] border border-[#292a2e]/60 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#1a1b20] border-b border-[#292a2e]/60 text-[#958ea0] font-space uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Task</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#292a2e]/40">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#4a4855]">
                      No tasks found. Click &quot;+ New task&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => handleOpenEditModal(t)}
                      className="hover:bg-[#1a1b20]/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#e3e2e8] group-hover:text-[#ffdad2] transition-colors">
                          {t.title}
                        </div>
                        {t.description && (
                          <div className="text-[11px] text-[#958ea0] truncate max-w-md mt-0.5">
                            {t.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-space px-2 py-0.5 rounded bg-[#0d0e12] border border-[#292a2e] text-[#cbc3d7]">
                          {t.client}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-space font-medium capitalize text-[#e3e2e8]">
                          {t.status.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-space font-bold uppercase text-[9px] px-2 py-0.5 rounded ${getPriorityBadgeClass(
                            t.priority
                          )}`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#958ea0] font-space">{t.due}</td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(t)}
                            className="p-1 rounded text-[#958ea0] hover:text-[#ffb4a3] transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(t.id)}
                            className="p-1 rounded text-[#958ea0] hover:text-[#ff5449] transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CALENDAR VIEW ── */}
      {activeView === 'calendar' && (
        <div className="bg-[#141519] border border-[#292a2e]/60 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#292a2e]">
            <h3 className="font-space font-bold text-sm text-[#e3e2e8]">
              Coaching Schedule &amp; Task Timeline
            </h3>
            <span className="text-xs font-space text-[#958ea0]">November 2026</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => handleOpenEditModal(t)}
                className="p-3 rounded-xl bg-[#0d0e12] border border-[#292a2e] hover:border-[#ffb4a3]/50 transition-all cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-space font-bold text-[#ffb4a3] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">schedule</span>
                    {t.due}
                  </span>
                  <span
                    className={`text-[9px] font-space font-bold uppercase px-1.5 py-0.2 rounded ${getPriorityBadgeClass(
                      t.priority
                    )}`}
                  >
                    {t.priority}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-[#e3e2e8] line-clamp-1">{t.title}</h4>
                <div className="flex items-center justify-between text-[11px] text-[#958ea0]">
                  <span>{t.client}</span>
                  <span className="capitalize">{t.status.replace('-', ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE OR EDIT TASK (CRUD) ── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-[#1a1b20] border border-[#ffb4a3]/40 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#292a2e]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#e85a2b] text-[20px]">
                  {editingTask ? 'edit_note' : 'add_task'}
                </span>
                <h3 className="font-space font-bold text-sm text-[#e3e2e8]">
                  {editingTask ? 'Edit Task' : 'Create New Task'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#958ea0] hover:text-[#e3e2e8] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3.5 text-xs font-sans">
              <div>
                <label className="text-[11px] font-space font-bold uppercase tracking-wider text-[#ffdad2] block mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="e.g. Prescribe carb refeed micro-cycle..."
                  className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-xl px-3 py-2 text-xs text-[#e3e2e8] focus:border-[#ffb4a3] focus:outline-none font-sans"
                />
              </div>

              <div>
                <label className="text-[11px] font-space font-bold uppercase tracking-wider text-[#ffdad2] block mb-1">
                  Description / Clinical Rationale
                </label>
                <textarea
                  rows={2}
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  placeholder="Notes, parameters, or instructions for this task..."
                  className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-xl px-3 py-2 text-xs text-[#e3e2e8] focus:border-[#ffb4a3] focus:outline-none resize-none font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-space font-bold uppercase tracking-wider text-[#ffdad2] block mb-1">
                    Client Association
                  </label>
                  <select
                    value={modalClient}
                    onChange={(e) => setModalClient(e.target.value)}
                    className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-xl px-3 py-2 text-xs text-[#e3e2e8] focus:border-[#ffb4a3] focus:outline-none font-space cursor-pointer"
                  >
                    <option value="Admin">Admin / General</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-space font-bold uppercase tracking-wider text-[#ffdad2] block mb-1">
                    Stage (Status)
                  </label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value as TaskStatus)}
                    className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-xl px-3 py-2 text-xs text-[#e3e2e8] focus:border-[#ffb4a3] focus:outline-none font-space cursor-pointer"
                  >
                    <option value="backlog">Backlog</option>
                    <option value="todo">To do</option>
                    <option value="in-progress">In progress</option>
                    <option value="in-review">In review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-space font-bold uppercase tracking-wider text-[#ffdad2] block mb-1">
                    Priority
                  </label>
                  <select
                    value={modalPriority}
                    onChange={(e) => setModalPriority(e.target.value as TaskPriority)}
                    className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-xl px-3 py-2 text-xs text-[#e3e2e8] focus:border-[#ffb4a3] focus:outline-none font-space cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-space font-bold uppercase tracking-wider text-[#ffdad2] block mb-1">
                    Due Date / Window
                  </label>
                  <input
                    type="text"
                    value={modalDue}
                    onChange={(e) => setModalDue(e.target.value)}
                    placeholder="e.g. Today, Nov 24, End of week"
                    className="w-full bg-[#0d0e12] border border-[#292a2e] rounded-xl px-3 py-2 text-xs text-[#e3e2e8] focus:border-[#ffb4a3] focus:outline-none font-space"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#292a2e]">
                {editingTask ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(editingTask.id)}
                    className="text-xs text-[#ff5449] hover:underline font-space font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">delete</span>
                    <span>Delete Task</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="h-8 px-3.5 rounded-xl bg-[#292a2e] hover:bg-[#343439] text-[#e3e2e8] font-space font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-8 px-4 rounded-xl bg-[#e85a2b] hover:bg-[#ff6b3d] text-white font-space font-bold text-xs transition-colors cursor-pointer shadow-sm flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    <span>{editingTask ? 'Save Changes' : 'Create Task'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── HELP BUTTON ── */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="h-9 px-3.5 rounded-full bg-[#e85a2b] hover:bg-[#ff6b3d] text-white font-space font-bold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(232,90,43,0.45)] cursor-pointer transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">help</span>
          <span>Help</span>
        </button>

        {showHelp && (
          <div className="absolute bottom-12 right-0 w-72 bg-[#1a1b20] border border-[#292a2e] rounded-2xl p-4 shadow-2xl space-y-2 text-xs font-sans">
            <div className="flex items-center justify-between pb-1 border-b border-[#292a2e]">
              <span className="font-space font-bold text-[#ffdad2]">Task Board Tips</span>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="text-[#958ea0] hover:text-[#e3e2e8] text-xs cursor-pointer"
              >
                ×
              </button>
            </div>
            <ul className="space-y-1.5 text-[11px] text-[#cbc3d7]">
              <li>• Drag and drop any card between columns to change its stage.</li>
              <li>• Click any card to edit its details, rationale, or priority.</li>
              <li>• Quick action buttons (move, edit, delete) are located at the top of each card.</li>
              <li>• All changes persist immediately to your active browser session.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
