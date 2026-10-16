/**
 * SummaryStrip Component
 * Displays live counters: Open (not Done), Due Today, Overdue, Completed (Done).
 */
import { isDueToday, isOverdue } from '../utils/dates.js';

export function renderSummaryStrip(tasks) {
  const openCount = tasks.filter(t => t.status !== 'Done').length;
  const dueTodayCount = tasks.filter(t => isDueToday(t.dueDate, t.status)).length;
  const overdueCount = tasks.filter(t => isOverdue(t.dueDate, t.status)).length;
  const completedCount = tasks.filter(t => t.status === 'Done').length;

  return `
    <div class="summary-strip flex flex-wrap items-center gap-2.5">
      <!-- Open Metric -->
      <div class="metric-pill flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
        <span class="w-2 h-2 rounded-full bg-sky-400"></span>
        <span class="text-slate-400">Open:</span>
        <span class="font-bold text-sky-400 font-mono">${openCount}</span>
      </div>

      <!-- Due Today Metric -->
      <div class="metric-pill flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-xs">
        <span class="w-2 h-2 rounded-full bg-amber-400 ${dueTodayCount > 0 ? 'animate-pulse' : ''}"></span>
        <span class="text-amber-300">Due Today:</span>
        <span class="font-bold text-amber-400 font-mono">${dueTodayCount}</span>
      </div>

      <!-- Overdue Metric -->
      <div class="metric-pill flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-xs">
        <span class="w-2 h-2 rounded-full bg-rose-500 ${overdueCount > 0 ? 'animate-ping opacity-80' : ''}"></span>
        <span class="text-rose-300">Overdue:</span>
        <span class="font-bold text-rose-400 font-mono">${overdueCount}</span>
      </div>

      <!-- Completed Metric -->
      <div class="metric-pill flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs">
        <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
        <span class="text-emerald-300">Completed:</span>
        <span class="font-bold text-emerald-400 font-mono">${completedCount}</span>
      </div>
    </div>
  `;
}
