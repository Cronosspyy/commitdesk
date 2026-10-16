/**
 * ChatPanel Component
 * Handles message stream, prompt quick-fills, typing state, and keyboard shortcuts.
 */

export function renderChatMessages(messages, isTyping = false) {
  if (!messages || messages.length === 0) {
    return `<div class="p-4 text-center text-xs text-slate-500">No messages yet. Try typing or selecting an example below.</div>`;
  }

  let html = messages.map(msg => {
    if (msg.role === 'user') {
      return `
        <div class="flex justify-end">
          <div class="chat-bubble-user p-3 max-w-[85%] text-slate-100 shadow-sm text-xs">
            <p class="whitespace-pre-wrap leading-relaxed">${escapeHtml(msg.text)}</p>
            <div class="text-[9px] text-slate-400 text-right mt-1.5 font-mono">${msg.timestamp || ''}</div>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="flex justify-start items-start space-x-2">
          <div class="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
            CD
          </div>
          <div class="chat-bubble-ai p-3 max-w-[90%] text-slate-200 shadow-sm text-xs">
            <div class="whitespace-pre-wrap leading-relaxed">${formatMarkdown(msg.text)}</div>
            ${msg.createdTasks && msg.createdTasks.length > 0 ? renderCreatedTasksPill(msg.createdTasks) : ''}
            <div class="text-[9px] text-slate-500 mt-2 font-mono flex items-center justify-between">
              <span>${msg.timestamp || ''}</span>
              ${msg.sourceUsed ? `<span class="text-[9px] text-emerald-400/80 uppercase font-mono">${msg.sourceUsed === 'gemini' ? 'Gemini 2.5 Flash' : 'Rule Parser'}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }
  }).join('');

  if (isTyping) {
    html += `
      <div class="flex justify-start items-start space-x-2 animate-pulse">
        <div class="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
          CD
        </div>
        <div class="chat-bubble-ai px-3 py-2 text-slate-400 text-xs flex items-center space-x-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce"></span>
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]"></span>
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]"></span>
          <span class="ml-1 text-[11px] text-slate-400">Extracting commitments...</span>
        </div>
      </div>
    `;
  }

  return html;
}

function renderCreatedTasksPill(tasks) {
  return `
    <div class="mt-2.5 p-2 rounded-lg bg-[#0b101a] border border-emerald-500/30">
      <div class="text-[10px] font-bold text-emerald-400 flex items-center space-x-1 mb-1.5 pb-1 border-b border-slate-800">
        <svg class="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
        </svg>
        <span>Added to Task Board:</span>
      </div>
      <div class="space-y-1">
        ${tasks.map(t => `
          <div class="flex items-center justify-between text-[10px] bg-[#121927] p-1.5 rounded border border-slate-800/80">
            <div class="truncate mr-2 font-medium text-slate-200">
              <span class="text-emerald-400 font-mono mr-1">${t.id}</span>
              ${escapeHtml(t.title)}
            </div>
            <div class="flex items-center space-x-1.5 shrink-0 text-[9px] font-mono">
              <span class="text-slate-400">${t.dueDate}</span>
              <span class="text-amber-300 font-semibold">${t.priority}</span>
              <span class="text-slate-300">(${t.effort})</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
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

function formatMarkdown(text) {
  if (!text) return '';
  let escaped = escapeHtml(text);
  // Bold **text**
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-100">$1</strong>');
  return escaped;
}
