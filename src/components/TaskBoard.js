/**
 * TaskBoard Component
 * Renders Kanban columns ("To Do", "In Progress", "Done"), search bar, and priority filters.
 */
import { renderTaskCard } from './TaskCard.js';

export function renderTaskBoard(tasks, filters, newlyAddedIds = new Set(), viewMode = 'kanban') {
  // Apply Search & Filters
  const filtered = tasks.filter(task => {
    // 1. Search Query
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description.toLowerCase().includes(q);
      const matchReq = task.requester.toLowerCase().includes(q);
      const matchId = task.id.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchReq && !matchId) return false;
    }

    // 2. Priority Filter
    if (filters.priority && filters.priority !== 'All') {
      if (task.priority !== filters.priority) return false;
    }

    // 3. Source Filter
    if (filters.source && filters.source !== 'All') {
      if (task.source !== filters.source) return false;
    }

    return true;
  });

  if (viewMode === 'list') {
    return renderListView(filtered, newlyAddedIds);
  }

  // Kanban Columns
  const lanes = [
    {
      status: 'To Do',
      title: 'To Do',
      headerBadge: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
      borderColor: 'border-slate-800'
    },
    {
      status: 'In Progress',
      title: 'In Progress',
      headerBadge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      borderColor: 'border-slate-800'
    },
    {
      status: 'Done',
      title: 'Done',
      headerBadge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      borderColor: 'border-slate-800'
    }
  ];

  let html = `<div class="grid grid-cols-1 md:grid-cols-3 gap-4 h-full min-w-[700px]">`;

  lanes.forEach(lane => {
    const laneTasks = filtered.filter(t => t.status === lane.status);

    html += `
      <section
        class="kanban-lane flex flex-col bg-[#0e1420]/80 rounded-xl border ${lane.borderColor} p-3 h-full overflow-hidden shadow-inner"
        ondragover="window.CommitDeskApp.handleDragOver(event)"
        ondrop="window.CommitDeskApp.handleDrop(event, '${lane.status}')"
      >
        <!-- Lane Header -->
        <div class="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-800/80 shrink-0">
          <div class="flex items-center space-x-2">
            <h3 class="font-bold text-xs text-slate-200 tracking-wide">${lane.title}</h3>
            <span class="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold border ${lane.headerBadge}">
              ${laneTasks.length}
            </span>
          </div>
          <button
            onclick="window.CommitDeskApp.openNewTaskModal('${lane.status}')"
            class="text-slate-500 hover:text-emerald-400 p-1 rounded hover:bg-slate-800 transition"
            title="Add task in ${lane.title}"
            aria-label="Add task in ${lane.title}"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
          </button>
        </div>

        <!-- Task List Scroll Area -->
        <div class="flex-1 overflow-y-auto space-y-2.5 pr-1">
          ${laneTasks.length === 0 ? `
            <div class="h-28 flex flex-col items-center justify-center text-slate-600 text-xs text-center border border-dashed border-slate-800/80 rounded-lg">
              <span>No commitments here</span>
            </div>
          ` : laneTasks.map(task => renderTaskCard(task, newlyAddedIds.has(task.id))).join('')}
        </div>
      </section>
    `;
  });

  html += `</div>`;
  return html;
}

function renderListView(filteredTasks, newlyAddedIds) {
  if (filteredTasks.length === 0) {
    return `
      <div class="h-64 flex flex-col items-center justify-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
        <p class="font-medium text-slate-400">No tasks match your filters</p>
      </div>
    `;
  }

  return `
    <div class="bg-[#0e1420] border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80">
      ${filteredTasks.map(task => renderTaskCard(task, newlyAddedIds.has(task.id))).join('')}
    </div>
  `;
}
