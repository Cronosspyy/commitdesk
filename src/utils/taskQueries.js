/**
 * Task Query Handlers for CR-021:
 * - Query Today: overdue + due today tasks, grouped and sorted
 * - Query Quick Wins: small effort tasks only, respecting time budget
 * - Task Matcher: fuzzy matching for completing tasks with disambiguation
 */
import { getTodayISO, formatDisplayDate } from './dates.js';

const PRIORITY_ORDER = { High: 1, Medium: 2, Low: 3 };

function getDaysDifference(targetDateStr, todayStr) {
  try {
    const d1 = new Date(targetDateStr + 'T00:00:00');
    const d2 = new Date(todayStr + 'T00:00:00');
    const diffTime = d2.getTime() - d1.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

/**
 * 2. "What do I need to deliver today?"
 * Returns overdue first, then due today.
 */
export function executeQueryToday(tasks) {
  const today = getTodayISO();
  const openTasks = tasks.filter(t => t.status !== 'Done' && t.dueDate <= today);

  if (openTasks.length === 0) {
    // Find next upcoming task
    const upcoming = tasks
      .filter(t => t.status !== 'Done' && t.dueDate > today)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    if (upcoming.length > 0) {
      return `🎉 **Your plate is completely clear today!** No overdue or due-today tasks.\n\nYour next upcoming task is **${upcoming[0].title}** (Due ${formatDisplayDate(upcoming[0].dueDate)}, requested by ${upcoming[0].requester}).`;
    }
    return `🎉 **Your plate is completely clear today!** You have no overdue or due-today tasks.`;
  }

  const overdue = openTasks.filter(t => t.dueDate < today);
  const dueToday = openTasks.filter(t => t.dueDate === today);

  // Sort within groups: priority first (High -> Medium -> Low), then earliest due date
  overdue.sort((a, b) => {
    const pDiff = (PRIORITY_ORDER[a.priority] || 2) - (PRIORITY_ORDER[b.priority] || 2);
    if (pDiff !== 0) return pDiff;
    return a.dueDate.localeCompare(b.dueDate);
  });

  dueToday.sort((a, b) => {
    return (PRIORITY_ORDER[a.priority] || 2) - (PRIORITY_ORDER[b.priority] || 2);
  });

  let lines = [];

  if (overdue.length > 0) {
    lines.push(`🚨 **Overdue (${overdue.length})**`);
    overdue.forEach(t => {
      const daysOver = getDaysDifference(t.dueDate, today);
      const overText = daysOver === 1 ? '1 day overdue' : `${daysOver} days overdue`;
      lines.push(`• **${t.title}** [${t.priority}] — Due ${formatDisplayDate(t.dueDate)} (${overText}) | Req: ${t.requester}`);
    });
  }

  if (dueToday.length > 0) {
    if (lines.length > 0) lines.push('');
    lines.push(`⚡ **Due Today (${dueToday.length})**`);
    dueToday.forEach(t => {
      lines.push(`• **${t.title}** [${t.priority}] — Due Today | Req: ${t.requester}`);
    });
  }

  return lines.join('\n');
}

/**
 * 3. "I have one hour, give me the low-hanging fruit"
 * Returns ONLY tasks where effort == "Small" and status != Done.
 */
export function executeQueryQuickWins(tasks, timeBudgetMinutes = null) {
  const today = getTodayISO();
  // Return ONLY tasks where effort == "Small" and status != Done. Never include Medium or Large.
  const smallTasks = tasks.filter(t => t.effort === 'Small' && t.status !== 'Done');

  if (smallTasks.length === 0) {
    return `You have **no open tasks** with Small effort right now. All remaining open tasks are Medium or Large.`;
  }

  // Sort overdue/due-soon first, then by priority
  smallTasks.sort((a, b) => {
    // 1. Due date ascending (overdue & today come first)
    const dDiff = a.dueDate.localeCompare(b.dueDate);
    if (dDiff !== 0) return dDiff;
    // 2. Priority
    return (PRIORITY_ORDER[a.priority] || 2) - (PRIORITY_ORDER[b.priority] || 2);
  });

  const header = timeBudgetMinutes
    ? `⏱️ Here are **${smallTasks.length} low-hanging fruit task${smallTasks.length > 1 ? 's' : ''}** (Small effort) that should fit in your **${timeBudgetMinutes} minute** window:`
    : `🎯 Here are your **${smallTasks.length} low-hanging fruit task${smallTasks.length > 1 ? 's' : ''}** (Small effort only):`;

  const taskLines = smallTasks.map(t => {
    const dueLabel = t.dueDate < today ? `${formatDisplayDate(t.dueDate)} (Overdue)` : formatDisplayDate(t.dueDate);
    return `• **${t.title}** — Due: ${dueLabel} | Priority: **${t.priority}** | Req: ${t.requester}`;
  });

  return `${header}\n\n${taskLines.join('\n')}`;
}

/**
 * 4. Fuzzy Match for completing tasks
 * "I finished the vendor email"
 */
const STOP_WORDS = new Set([
  'i', 'me', 'my', 'we', 'finished', 'finish', 'completed', 'complete',
  'done', 'with', 'the', 'a', 'an', 'sent', 'send', 'shipped', 'ship',
  'wrapped', 'up', 'just', 'finally', 'did', 'off', 'task', 'ticket',
  'already', 'have', 'all'
]);

export function findTaskToComplete(tasks, rawQuery) {
  if (!rawQuery || typeof rawQuery !== 'string') {
    return { type: 'none', message: 'No task description provided to mark complete.' };
  }

  // Clean and tokenize query
  const cleanQuery = rawQuery.toLowerCase().trim();
  const tokens = cleanQuery
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOP_WORDS.has(t));

  // Check direct ID hit first (e.g. "PLAT-482", "COMMIT-103", "CD-101")
  const idMatch = cleanQuery.match(/\b([a-z]+-\d+)\b/i);
  if (idMatch) {
    const targetId = idMatch[1].toUpperCase();
    const directHit = tasks.find(t => t.id.toUpperCase() === targetId);
    if (directHit) {
      if (directHit.status === 'Done') {
        return { type: 'already_done', task: directHit };
      }
      return { type: 'exact', task: directHit };
    }
  }

  const openTasks = tasks.filter(t => t.status !== 'Done');

  // Check if query matches an already Done task
  const doneTasks = tasks.filter(t => t.status === 'Done');
  for (const doneTask of doneTasks) {
    const doneText = `${doneTask.title} ${doneTask.description}`.toLowerCase();
    const allTokensMatch = tokens.length > 0 && tokens.every(t => doneText.includes(t));
    if (allTokensMatch) {
      return { type: 'already_done', task: doneTask };
    }
  }

  if (openTasks.length === 0) {
    return { type: 'none', message: 'You have no open tasks left on your board!' };
  }

  // Score open tasks
  const scoredTasks = openTasks.map(task => {
    const titleLower = task.title.toLowerCase();
    const descLower = (task.description || '').toLowerCase();
    const reqLower = (task.requester || '').toLowerCase();
    const fullText = `${titleLower} ${descLower} ${reqLower}`;

    let score = 0;

    // 1. Exact phrase in title gets massive bonus
    if (cleanQuery.length > 4 && titleLower.includes(cleanQuery)) {
      score += 100;
    }

    // 2. Exact phrase in description
    if (cleanQuery.length > 4 && descLower.includes(cleanQuery)) {
      score += 50;
    }

    // 3. Token hits
    let matchedTokenCount = 0;
    tokens.forEach(token => {
      if (titleLower.includes(token)) {
        score += 20;
        matchedTokenCount++;
      } else if (descLower.includes(token)) {
        score += 10;
        matchedTokenCount++;
      } else if (reqLower.includes(token)) {
        score += 15;
        matchedTokenCount++;
      }
    });

    // Ratio of matched tokens
    const ratio = tokens.length > 0 ? (matchedTokenCount / tokens.length) : 0;
    score += ratio * 30;

    return { task, score, matchedTokenCount, ratio };
  });

  // Filter out zero-score tasks
  const matches = scoredTasks.filter(item => item.score > 15);
  matches.sort((a, b) => b.score - a.score);

  if (matches.length === 0) {
    // Return closest 1-2 suggestions from open tasks
    const suggestions = openTasks.slice(0, 2);
    return {
      type: 'no_match',
      suggestions: suggestions
    };
  }

  // One clear best match
  if (matches.length === 1 || (matches[0].score >= 40 && matches[0].score - matches[1].score >= 20)) {
    return {
      type: 'exact',
      task: matches[0].task
    };
  }

  // Multiple close matches (do not guess!)
  const closeCandidates = matches.slice(0, 3).map(m => m.task);
  return {
    type: 'ambiguous',
    candidates: closeCandidates
  };
}
