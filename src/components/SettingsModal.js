/**
 * SettingsModal Component
 * Configures Gemini API Key with password visibility toggle, safe storage, and demo reset.
 */

export function renderSettingsModal(currentKey = '', isVisible = false) {
  return `
    <div
      id="settings-modal"
      class="fixed inset-0 bg-black/75 backdrop-blur-sm ${isVisible ? 'flex' : 'hidden'} items-center justify-center z-50 p-4"
      onclick="if(event.target === this) window.CommitDeskApp.closeSettings()"
    >
      <div class="bg-[#121824] border border-slate-700 rounded-2xl max-w-md w-full p-5 shadow-2xl relative text-slate-100">
        <!-- Modal Header -->
        <div class="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div class="flex items-center space-x-2.5">
            <div class="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 class="font-bold text-sm text-slate-100">CommitDesk Settings</h3>
          </div>
          <button
            onclick="window.CommitDeskApp.closeSettings()"
            class="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
            aria-label="Close settings"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="py-4 space-y-4 text-xs">
          <div>
            <label for="gemini-key-input" class="block font-semibold text-slate-200 mb-1.5">
              Google Gemini API Key
            </label>
            <div class="relative">
              <input
                id="gemini-key-input"
                type="password"
                value="${escapeAttr(currentKey)}"
                placeholder="Paste AIzaSy... API key"
                class="w-full bg-[#0a0e16] border border-slate-700 rounded-lg pl-3 pr-10 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono transition"
              />
              <button
                type="button"
                onclick="window.CommitDeskApp.toggleKeyVisibility()"
                id="toggle-key-visibility-btn"
                class="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
                title="Show/Hide Key"
                aria-label="Toggle password visibility"
              >
                <svg id="eye-icon" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              </button>
            </div>
            <p class="mt-1.5 text-[11px] text-slate-400 leading-relaxed">
              🔒 <strong>Privacy first:</strong> Your key is never hard-coded or logged. It is stored exclusively in this browser's <code class="text-emerald-400 font-mono">localStorage</code>.
            </p>
          </div>

          <!-- Feature Breakdown Box -->
          <div class="p-3 rounded-xl bg-[#090d14] border border-slate-800 text-[11px] space-y-1.5 text-slate-300">
            <div class="font-semibold text-slate-200">How Parsing Operates:</div>
            <div class="text-slate-400 leading-relaxed">
              • <strong>Active API Key:</strong> Uses live <span class="text-emerald-400 font-mono font-medium">gemini-2.5-flash</span> with structured JSON schema for deep semantic extraction.<br>
              • <strong>No Key / Offline:</strong> Uses the built-in local rule-based NLP parser. Works 100% reliably out of the box!
            </div>
          </div>

          <!-- Demo Reset Section -->
          <div class="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div>
              <div class="font-semibold text-slate-200">Demo Commitment Data</div>
              <p class="text-[10px] text-slate-400">Restore the 12 authentic Jira + Verbal tasks</p>
            </div>
            <button
              type="button"
              onclick="window.CommitDeskApp.resetDemoData()"
              class="px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition"
            >
              Reset Data
            </button>
          </div>
        </div>

        <!-- Modal Footer Actions -->
        <div class="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            type="button"
            onclick="window.CommitDeskApp.clearApiKey()"
            class="px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs transition"
          >
            Clear Key
          </button>
          <div class="flex items-center space-x-2">
            <button
              type="button"
              onclick="window.CommitDeskApp.closeSettings()"
              class="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onclick="window.CommitDeskApp.saveApiKey()"
              class="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md shadow-emerald-700/20 transition"
            >
              Save Key
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;');
}
