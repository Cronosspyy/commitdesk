/**
 * TaskCard Component
 * Displays individual task details with status controls, badges, and indicator pills.
 */
import { formatDisplayDate, isDueToday, isOverdue } from '../utils/dates.js';

export function renderTaskCard(task, isNewlyAdded = false) {
  const isOver = isOverdue(task.dueDate, task.status);
  const isToday = isDueToday(task.dueDate, task.status);

  // Badges classes
  const priorityClass = {
    High: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
    Medium: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
    Low: 'bg-slate-500/15 text-slate-300 border-slate-500/30'
  }[task.priority] || 'bg-slate-500/15 text-slate-300 border-slate-500/30';

  const sourceClass = task.source === 'Jira'
    ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40'
    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';

  const initial = (task.requester || 'M').charAt(0).toUpperCase();

  return `
    <article
      class="task-card bg-[#121824] rounded-xl border border-slate-800/80 p-3.5 flex flex-col space-y-3 relative group transition shadow-sm hover:border-slate-700 hover:shadow-md ${isNewlyAdded ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-[#0b0f17] animate-pulse' : ''}"
      data-task-id="${escapeHtml(task.id)}"
    >
      <!-- Header Row: ID, Source, Priority, Due Alert -->
      <div class="flex items-center justify-between gap-1.5 flex-wrap">
        <div class="flex items-center space-x-1.5">
          <span class="font-mono text-[10px] font-semibold text-slate-500">${escapeHtml(task.id)}</span>
          <span class="px-1.5 py-0.5 rounded text-[9px] font-semibold border ${sourceClass}">
            ${escapeHtml(task.source)}
          </span>
          <span class="px-1.5 py-0.5 rounded text-[9px] font-bold border ${priorityClass}">
            ${escapeHtml(task.priority)}
          </span>
        </div>

        <div class="flex items-center space-x-1">
          ${isOver ? `
            <span class="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50 flex items-center space-x-1 animate-pulse">
              <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              <span>OVERDUE</span>
            </span>
          ` : ''}
          ${isToday ? `
            <span class="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center space-x-1">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
              <span>DUE TODAY</span>
            </span>
          ` : ''}
        </div>
      </div>

      <!-- Title & Short Description -->
      <div class="space-y-1">
        <h4 class="text-xs font-semibold text-slate-100 group-hover:text-emerald-300 transition leading-snug">
          ${escapeHtml(task.title)}
        </h4>
        <p class="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
          ${escapeHtml(task.description)}
        </p>
      </div>

      <!-- Requester & Effort -->
      <div class="pt-2 border-t border-slate-800/70 flex items-center justify-between text-[11px] text-slate-400">
        <div class="flex items-center space-x-1.5 min-w-0" title="Requester">
          <div class="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] text-slate-300 font-semibold shrink-0">
            ${initial}
          </div>
          <span class="truncate text-slate-300 text-[11px]">${escapeHtml(task.requester)}</span>
        </div>

        <div class="flex items-center space-x-2 shrink-0">
          <span class="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono border border-slate-700/60" title="Estimated Effort">
            Effort: ${escapeHtml(task.effort)}
          </span>
        </div>
      </div>

      <!-- Footer: Due Date & Actions -->
      <div class="flex items-center justify-between pt-1 text-[11px] text-slate-400">
        <div class="flex items-center space-x-1 text-[11px]">
          <svg class="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span class="${isOver ? 'text-rose-400 font-semibold' : (isToday ? 'text-amber-300 font-semibold' : 'text-slate-400')}">
            ${formatDisplayDate(task.dueDate)}
          </span>
        </div>

        <div class="flex items-center space-x-1.5">
          <!-- Status Dropdown -->
          <select
            onchange="window.CommitDeskApp.updateTaskStatus('${escapeHtml(task.id)}', this.value)"
            class="bg-[#182030] border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="To Do" ${task.status === 'To Do' ? 'selected' : ''}>To Do</option>
            <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Done" ${task.status === 'Done' ? 'selected' : ''}>Done</option>
          </select>

          <!-- Edit Button -->
          <button
            onclick="window.CommitDeskApp.openEditModal('${escapeHtml(task.id)}')"
            class="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition"
            title="Edit task"
            aria-label="Edit task"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
            </svg>
          </button>

          <!-- Delete Button -->
          <button
            onclick="window.CommitDeskApp.deleteTask('${escapeHtml(task.id)}')"
            class="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
            title="Delete task"
            aria-label="Delete task"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </div>
    </article>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}
