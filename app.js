/**
 * CommitDesk — Main Application Orchestrator
 * High-performance, front-end-only work commitment tracker.
 */
import { Storage } from './src/utils/storage.js';
import { getTodayISO, getRelativeDateISO } from './src/utils/dates.js';
import { parseMeetingNotesWithAI } from './src/utils/geminiParser.js';
import { renderSummaryStrip } from './src/components/SummaryStrip.js';
import { renderTaskBoard } from './src/components/TaskBoard.js';
import { renderChatMessages } from './src/components/ChatPanel.js';
import { renderSettingsModal } from './src/components/SettingsModal.js';

// Storage Key Constants
const STORAGE_KEYS = {
  TASKS: 'commitdesk_tasks_v3',
  CHAT: 'commitdesk_chat_v3',
  GEMINI_KEY: 'commitdesk_gemini_api_key'
};

// 12 Authentic, realistic pre-loaded commitments (Jira + Verbal meeting tasks)
function createDefaultSeedTasks() {
  return [
    {
      id: 'PLAT-482',
      title: 'Fix token refresh race condition in mobile auth',
      description: 'Concurrent refresh calls with expired JWT cause 401 logout spikes on iOS client.',
      dueDate: getRelativeDateISO(-1), // Overdue by 1 day
      requester: 'Meera Iyer (VP Eng)',
      priority: 'High',
      effort: 'Medium',
      status: 'To Do',
      source: 'Jira',
      createdAt: getRelativeDateISO(-3)
    },
    {
      id: 'SEC-109',
      title: 'Patch OpenSSL CVE-2026-2189 base container vulnerability',
      description: 'Upgrade distroless Docker image across microservices and re-trigger Trivy security audit pipeline.',
      dueDate: getRelativeDateISO(-2), // Overdue by 2 days
      requester: 'Arjun Nair (SecOps Lead)',
      priority: 'High',
      effort: 'Small',
      status: 'In Progress',
      source: 'Jira',
      createdAt: getRelativeDateISO(-4)
    },
    {
      id: 'COMMIT-103',
      title: "Send revised Q4 enterprise pricing deck to Meera's team",
      description: 'Incorporate volume discounting tiers and annual upfront payment incentives discussed in product sync.',
      dueDate: getTodayISO(), // Due Today
      requester: 'Sofia Alvarez (Head of Product)',
      priority: 'High',
      effort: 'Small',
      status: 'To Do',
      source: 'Meeting',
      createdAt: getRelativeDateISO(-1)
    },
    {
      id: 'COMMIT-104',
      title: "Review Arjun's PR on distributed rate limiter",
      description: 'Validate sliding window Redis counter implementation and fallback Sentinel failover logic.',
      dueDate: getTodayISO(), // Due Today
      requester: 'Daniel Kim (Staff Architect)',
      priority: 'High',
      effort: 'Medium',
      status: 'In Progress',
      source: 'Meeting',
      createdAt: getRelativeDateISO(-1)
    },
    {
      id: 'BILL-319',
      title: 'Handle Stripe invoice webhook retry idempotency',
      description: 'Ensure customer.subscription.updated events do not duplicate ledger entries on transient 500s.',
      dueDate: getTodayISO(), // Due Today
      requester: 'Elena Rostova (Payments Lead)',
      priority: 'Medium',
      effort: 'Medium',
      status: 'To Do',
      source: 'Jira',
      createdAt: getRelativeDateISO(-2)
    },
    {
      id: 'COMMIT-106',
      title: 'Draft architecture doc for the notifications service',
      description: 'Define SQS queue topology, dead-letter redrive policies, and webhook fan-out guarantees.',
      dueDate: getRelativeDateISO(2), // Upcoming
      requester: 'Marcus Vance (CTO)',
      priority: 'High',
      effort: 'Large',
      status: 'In Progress',
      source: 'Meeting',
      createdAt: getRelativeDateISO(-1)
    },
    {
      id: 'DATA-204',
      title: 'Mask sensitive PII in staging DB sanitization script',
      description: 'Scramble user phone numbers, tax IDs, and physical addresses prior to vendor QA testing.',
      dueDate: getRelativeDateISO(3), // Upcoming
      requester: 'Priya Sharma (Data Governance)',
      priority: 'Medium',
      effort: 'Medium',
      status: 'To Do',
      source: 'Jira',
      createdAt: getRelativeDateISO(-2)
    },
    {
      id: 'COMMIT-108',
      title: 'Schedule customer feedback interview with Acme Corp',
      description: 'Coordinate 30-min discovery call regarding multi-region latency SLA requirements.',
      dueDate: getRelativeDateISO(5), // Upcoming
      requester: 'Rachel Green (Chief of Staff)',
      priority: 'Low',
      effort: 'Small',
      status: 'To Do',
      source: 'Meeting',
      createdAt: getRelativeDateISO(-1)
    },
    {
      id: 'FRONT-891',
      title: 'Implement virtualized list for audit log export viewer',
      description: 'Render 10,000+ row compliance tables smoothly without DOM frame dropping.',
      dueDate: getRelativeDateISO(7), // Upcoming
      requester: 'Siddharth Nair (UI Lead)',
      priority: 'Medium',
      effort: 'Large',
      status: 'To Do',
      source: 'Jira',
      createdAt: getRelativeDateISO(-3)
    },
    {
      id: 'COMMIT-110',
      title: 'Send recap email with Datadog contract renegotiation numbers',
      description: 'Summarize APM custom metrics retention discount agreed upon with account rep.',
      dueDate: getRelativeDateISO(4), // Upcoming
      requester: 'Daniel Kim (Staff Architect)',
      priority: 'Low',
      effort: 'Small',
      status: 'To Do',
      source: 'Meeting',
      createdAt: getRelativeDateISO(-2)
    },
    {
      id: 'COMMIT-111',
      title: 'Align on GraphQL cursor pagination spec with iOS team',
      description: 'Agreed on Relay-compatible connection schema for feed query endpoints.',
      dueDate: getRelativeDateISO(-3), // Done task (no overdue alert)
      requester: 'Sofia Alvarez (Head of Product)',
      priority: 'Medium',
      effort: 'Medium',
      status: 'Done',
      source: 'Meeting',
      createdAt: getRelativeDateISO(-5)
    },
    {
      id: 'OPS-512',
      title: 'Provision production Redis ElastiCache cluster with multi-AZ failover',
      description: 'Configured Terraform module with in-transit TLS encryption and automatic snapshot lifecycle.',
      dueDate: getRelativeDateISO(-4), // Done task (no overdue alert)
      requester: 'Arjun Nair (SecOps Lead)',
      priority: 'High',
      effort: 'Large',
      status: 'Done',
      source: 'Jira',
      createdAt: getRelativeDateISO(-7)
    }
  ];
}

const DEFAULT_WELCOME_CHAT = [
  {
    id: 'msg-welcome',
    role: 'assistant',
    text: "👋 Welcome to **CommitDesk**!\n\nI capture verbally assigned meeting commitments that normally get lost before reaching Jira. Type or paste any meeting notes, bullet points, or raw Slack chat. I will parse them into structured tasks on your live board with deadlines, owners, and effort ratings.",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
];

// Sample prompt templates for 1-click testing
const SAMPLE_PROMPTS = {
  standup: `Sprint standup notes:
- Meera asked me to send the revised Q4 pricing deck by today EOD (high priority)
- Need to review Arjun's PR on rate limiter before tomorrow morning
- Draft architecture doc for the notifications service by Friday (Daniel Kim will review)`,

  incident: `Urgent incident response items:
- Rotate all database root credentials immediately (requested by Arjun Nair)
- Elena Rostova wants an updated Stripe webhook retry test by today
- Write post-mortem customer incident review by tomorrow EOD`,

  planning: `Quarterly alignment sync:
- Sofia requested a 30-min customer interview with Acme Corp by next week
- Patch the CVE vulnerability in authentication proxy before Friday (Priya Sharma requested)
- Check in with iOS team regarding GraphQL cursor pagination by tomorrow`
};

// Application State
class CommitDeskState {
  constructor() {
    this.tasks = [];
    this.chatMessages = [];
    this.geminiApiKey = '';
    this.filters = {
      search: '',
      priority: 'All',
      source: 'All'
    };
    this.viewMode = 'kanban'; // 'kanban' | 'list'
    this.activeMobileTab = 'board'; // 'chat' | 'board'
    this.newlyAddedIds = new Set();
    this.isParsing = false;
    this.isSettingsOpen = false;
  }

  init() {
    this.loadState();
    this.setupEventListeners();
    this.render();
  }

  loadState() {
    // 1. Tasks
    const storedTasks = Storage.getJSON(STORAGE_KEYS.TASKS);
    if (storedTasks && Array.isArray(storedTasks) && storedTasks.length > 0) {
      this.tasks = storedTasks;
    } else {
      this.tasks = createDefaultSeedTasks();
      this.saveTasks();
    }

    // 2. Chat
    const storedChat = Storage.getJSON(STORAGE_KEYS.CHAT);
    if (storedChat && Array.isArray(storedChat) && storedChat.length > 0) {
      this.chatMessages = storedChat;
    } else {
      this.chatMessages = [...DEFAULT_WELCOME_CHAT];
      this.saveChat();
    }

    // 3. API Key
    this.geminiApiKey = Storage.getItem(STORAGE_KEYS.GEMINI_KEY) || '';
  }

  saveTasks() {
    Storage.setJSON(STORAGE_KEYS.TASKS, this.tasks);
  }

  saveChat() {
    Storage.setJSON(STORAGE_KEYS.CHAT, this.chatMessages);
  }

  setupEventListeners() {
    // ESC key closes modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeSettings();
        this.closeEditModal();
      }
    });
  }

  // Render all active UI zones
  render() {
    this.renderHeader();
    this.renderSummaryStrip();
    this.renderBoard();
    this.renderChat();
    this.renderModals();
    this.renderMobileTabs();
  }

  renderHeader() {
    const apiIndicator = document.getElementById('api-key-indicator');
    if (apiIndicator) {
      const hasKey = this.geminiApiKey && this.geminiApiKey.trim().length > 5;
      apiIndicator.innerHTML = `
        <span class="w-2 h-2 rounded-full ${hasKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}"></span>
        <span class="text-xs ${hasKey ? 'text-emerald-300' : 'text-slate-400'}">${hasKey ? 'Gemini 2.5 Flash' : 'Rule Parser (Local)'}</span>
      `;
    }
  }

  renderSummaryStrip() {
    const container = document.getElementById('summary-strip-container');
    if (container) {
      container.innerHTML = renderSummaryStrip(this.tasks);
    }
  }

  renderBoard() {
    const container = document.getElementById('board-container');
    if (container) {
      container.innerHTML = renderTaskBoard(this.tasks, this.filters, this.newlyAddedIds, this.viewMode);
    }
  }

  renderChat() {
    const container = document.getElementById('chat-messages-container');
    if (container) {
      container.innerHTML = renderChatMessages(this.chatMessages, this.isParsing);
      // Auto-scroll to bottom
      container.scrollTop = container.scrollHeight;
    }
  }

  renderModals() {
    const modalHost = document.getElementById('settings-modal-host');
    if (modalHost) {
      modalHost.innerHTML = renderSettingsModal(this.geminiApiKey, this.isSettingsOpen);
    }
  }

  renderMobileTabs() {
    const chatPanel = document.getElementById('chat-panel-container');
    const boardPanel = document.getElementById('board-panel-container');
    const tabChatBtn = document.getElementById('tab-btn-chat');
    const tabBoardBtn = document.getElementById('tab-btn-board');

    if (!chatPanel || !boardPanel) return;

    if (window.innerWidth < 1024) {
      if (this.activeMobileTab === 'chat') {
        chatPanel.classList.remove('hidden');
        boardPanel.classList.add('hidden');
        if (tabChatBtn) tabChatBtn.className = 'flex-1 py-2 text-center text-xs font-semibold text-emerald-400 border-b-2 border-emerald-400 bg-slate-900/60';
        if (tabBoardBtn) tabBoardBtn.className = 'flex-1 py-2 text-center text-xs font-semibold text-slate-400 border-b-2 border-transparent';
      } else {
        chatPanel.classList.add('hidden');
        boardPanel.classList.remove('hidden');
        if (tabBoardBtn) tabBoardBtn.className = 'flex-1 py-2 text-center text-xs font-semibold text-emerald-400 border-b-2 border-emerald-400 bg-slate-900/60';
        if (tabChatBtn) tabChatBtn.className = 'flex-1 py-2 text-center text-xs font-semibold text-slate-400 border-b-2 border-transparent';
      }
    } else {
      chatPanel.classList.remove('hidden');
      boardPanel.classList.remove('hidden');
    }
  }

  setMobileTab(tab) {
    this.activeMobileTab = tab;
    this.renderMobileTabs();
  }

  // User sends text in chat
  async submitChatMessage(text) {
    const cleanText = (text || '').trim();
    if (!cleanText || this.isParsing) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Add user message to chat stream
    this.chatMessages.push({
      id: `user-${Date.now()}`,
      role: 'user',
      text: cleanText,
      timestamp: timeStr
    });
    this.saveChat();

    this.isParsing = true;
    this.renderChat();

    try {
      // Call Gemini 2.5 Flash (with automatic fallback to local heuristic engine)
      const parseResult = await parseMeetingNotesWithAI(cleanText, this.geminiApiKey);
      const createdTasks = parseResult.tasks || [];

      if (createdTasks.length > 0) {
        // Prepend new tasks to board
        this.tasks = [...createdTasks, ...this.tasks];
        this.saveTasks();

        // Highlight newly created tasks
        this.newlyAddedIds = new Set(createdTasks.map(t => t.id));
        setTimeout(() => {
          this.newlyAddedIds.clear();
          this.renderBoard();
        }, 3500);

        // Assistant reply with details of created commitments
        this.chatMessages.push({
          id: `ai-${Date.now()}`,
          role: 'assistant',
          text: `Extracted **${createdTasks.length} task${createdTasks.length === 1 ? '' : 's'}** and placed on your live board:\n\n${createdTasks.map(t => `• **${t.title}** (Due: ${t.dueDate}, ${t.priority} Priority, ${t.effort} Effort, Req: ${t.requester})`).join('\n')}\n\n_${parseResult.message}_`,
          createdTasks: createdTasks,
          sourceUsed: parseResult.sourceUsed,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });

        this.showToast(`Created ${createdTasks.length} task${createdTasks.length === 1 ? '' : 's'} on board!`, 'success');
      } else {
        this.chatMessages.push({
          id: `ai-${Date.now()}`,
          role: 'assistant',
          text: `I couldn't identify explicit commitments or actionable deliverables in that text. Try mentioning an action verb (e.g. "Draft RFC", "Review PR"), an owner, or a deadline like "by Friday" or "today".`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    } catch (err) {
      console.error('[CommitDesk] Chat processing error:', err);
      this.chatMessages.push({
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: `⚠️ Error parsing input: ${err.message}. Your data remains safe.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      this.showToast('Encountered an issue while parsing', 'error');
    } finally {
      this.isParsing = false;
      this.saveChat();
      this.render();
    }
  }

  // Quick prompt injection
  insertSamplePrompt(sampleKey) {
    const prompt = SAMPLE_PROMPTS[sampleKey];
    const textarea = document.getElementById('chat-input-textarea');
    if (textarea && prompt) {
      textarea.value = prompt;
      textarea.focus();
      // Auto-resize
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
    }
  }

  // Board actions
  updateTaskStatus(taskId, newStatus) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.status = newStatus;
    this.saveTasks();
    this.renderSummaryStrip();
    this.renderBoard();
    this.showToast(`Updated ${task.id} to ${newStatus}`, 'info');
  }

  deleteTask(taskId) {
    if (confirm(`Delete task ${taskId}?`)) {
      this.tasks = this.tasks.filter(t => t.id !== taskId);
      this.saveTasks();
      this.renderSummaryStrip();
      this.renderBoard();
      this.showToast(`Task ${taskId} removed`, 'info');
    }
  }

  // Drag & drop support
  handleDragOver(e) {
    e.preventDefault();
  }

  handleDrop(e, targetStatus) {
    e.preventDefault();
    const taskId = e.dataTransfer?.getData('text/plain');
    if (taskId) {
      this.updateTaskStatus(taskId, targetStatus);
    }
  }

  // Modals & Settings
  openSettings() {
    this.isSettingsOpen = true;
    this.renderModals();
    setTimeout(() => {
      const input = document.getElementById('gemini-key-input');
      if (input) input.focus();
    }, 50);
  }

  closeSettings() {
    this.isSettingsOpen = false;
    this.renderModals();
  }

  saveApiKey() {
    const input = document.getElementById('gemini-key-input');
    if (input) {
      const val = input.value.trim();
      this.geminiApiKey = val;
      if (val) {
        Storage.setItem(STORAGE_KEYS.GEMINI_KEY, val);
        this.showToast('Gemini API key saved in localStorage', 'success');
      } else {
        Storage.removeItem(STORAGE_KEYS.GEMINI_KEY);
        this.showToast('Key cleared; local parser enabled', 'info');
      }
      this.closeSettings();
      this.renderHeader();
    }
  }

  clearApiKey() {
    this.geminiApiKey = '';
    Storage.removeItem(STORAGE_KEYS.GEMINI_KEY);
    const input = document.getElementById('gemini-key-input');
    if (input) input.value = '';
    this.closeSettings();
    this.renderHeader();
    this.showToast('Gemini API key removed. Using local parser.', 'info');
  }

  toggleKeyVisibility() {
    const input = document.getElementById('gemini-key-input');
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
    } else {
      input.type = 'password';
    }
  }

  resetDemoData() {
    if (confirm('Restore the 12 authentic demo commitments (Jira + Verbal)?')) {
      this.tasks = createDefaultSeedTasks();
      this.saveTasks();
      this.renderSummaryStrip();
      this.renderBoard();
      this.closeSettings();
      this.showToast('Reset to 12 authentic mock commitments', 'info');
    }
  }

  clearChatHistory() {
    this.chatMessages = [...DEFAULT_WELCOME_CHAT];
    this.saveChat();
    this.renderChat();
    this.showToast('Chat history cleared', 'info');
  }

  // Filter updates
  setPriorityFilter(priority) {
    this.filters.priority = priority;
    this.renderBoard();
  }

  setSourceFilter(source) {
    this.filters.source = source;
    this.renderBoard();
  }

  setSearchQuery(q) {
    this.filters.search = q.trim();
    this.renderBoard();
  }

  setViewMode(mode) {
    this.viewMode = mode;
    const kanbanBtn = document.getElementById('btn-view-kanban');
    const listBtn = document.getElementById('btn-view-list');
    if (kanbanBtn && listBtn) {
      if (mode === 'kanban') {
        kanbanBtn.className = 'px-2.5 py-1 text-xs rounded-md font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
        listBtn.className = 'px-2.5 py-1 text-xs rounded-md font-medium text-slate-400 hover:text-slate-200';
      } else {
        listBtn.className = 'px-2.5 py-1 text-xs rounded-md font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
        kanbanBtn.className = 'px-2.5 py-1 text-xs rounded-md font-medium text-slate-400 hover:text-slate-200';
      }
    }
    this.renderBoard();
  }

  // Inline Task Edit / Create Modal
  openEditModal(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    const modal = document.getElementById('task-edit-modal');
    if (!modal) return;

    document.getElementById('edit-task-modal-title').textContent = `Edit Task (${task.id})`;
    document.getElementById('edit-task-id').value = task.id;
    document.getElementById('edit-task-title').value = task.title;
    document.getElementById('edit-task-desc').value = task.description;
    document.getElementById('edit-task-requester').value = task.requester;
    document.getElementById('edit-task-duedate').value = task.dueDate;
    document.getElementById('edit-task-priority').value = task.priority;
    document.getElementById('edit-task-effort').value = task.effort;
    document.getElementById('edit-task-status').value = task.status;
    document.getElementById('edit-task-source').value = task.source;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  openNewTaskModal(defaultStatus = 'To Do') {
    const modal = document.getElementById('task-edit-modal');
    if (!modal) return;

    document.getElementById('edit-task-modal-title').textContent = 'Create New Task Commitment';
    document.getElementById('edit-task-id').value = '';
    document.getElementById('edit-task-title').value = '';
    document.getElementById('edit-task-desc').value = '';
    document.getElementById('edit-task-requester').value = 'Me';
    document.getElementById('edit-task-duedate').value = getTodayISO();
    document.getElementById('edit-task-priority').value = 'Medium';
    document.getElementById('edit-task-effort').value = 'Medium';
    document.getElementById('edit-task-status').value = defaultStatus;
    document.getElementById('edit-task-source').value = 'Meeting';

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  closeEditModal() {
    const modal = document.getElementById('task-edit-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  saveTaskForm(e) {
    if (e && e.preventDefault) e.preventDefault();
    const id = document.getElementById('edit-task-id').value;
    const title = document.getElementById('edit-task-title').value.trim();
    const description = document.getElementById('edit-task-desc').value.trim();
    const requester = document.getElementById('edit-task-requester').value.trim();
    const dueDate = document.getElementById('edit-task-duedate').value;
    const priority = document.getElementById('edit-task-priority').value;
    const effort = document.getElementById('edit-task-effort').value;
    const status = document.getElementById('edit-task-status').value;
    const source = document.getElementById('edit-task-source').value;

    if (!title) {
      alert('Title is required');
      return;
    }

    if (id) {
      const task = this.tasks.find(t => t.id === id);
      if (task) {
        task.title = title;
        task.description = description;
        task.requester = requester || 'Me';
        task.dueDate = dueDate || getTodayISO();
        task.priority = priority;
        task.effort = effort;
        task.status = status;
        task.source = source;
        this.showToast(`Updated ${task.id}`, 'success');
      }
    } else {
      const newId = `COMMIT-${Date.now().toString().slice(-4)}`;
      this.tasks.unshift({
        id: newId,
        title,
        description,
        requester: requester || 'Me',
        dueDate: dueDate || getTodayISO(),
        priority,
        effort,
        status,
        source,
        createdAt: getTodayISO()
      });
      this.showToast(`Created task ${newId}`, 'success');
    }

    this.saveTasks();
    this.renderSummaryStrip();
    this.renderBoard();
    this.closeEditModal();
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-root');
    if (!container) return;

    const toast = document.createElement('div');
    const colorClass = type === 'success'
      ? 'bg-emerald-950 border-emerald-500/50 text-emerald-200'
      : type === 'error'
      ? 'bg-rose-950 border-rose-500/50 text-rose-200'
      : 'bg-slate-900 border-slate-700 text-slate-200';

    toast.className = `px-3.5 py-2.5 rounded-xl border text-xs shadow-2xl flex items-center space-x-2 transition-all transform duration-300 pointer-events-auto ${colorClass}`;
    toast.innerHTML = `<span>${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }
}

// Instantiate and expose globally for inline HTML event handlers
window.CommitDeskApp = new CommitDeskState();

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.CommitDeskApp.init();

  // Resize listener for mobile tab view
  window.addEventListener('resize', () => {
    window.CommitDeskApp.renderMobileTabs();
  });
});
