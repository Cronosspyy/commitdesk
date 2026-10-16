/**
 * Local Intent Router (CR-021)
 * Classifies user chat messages into:
 * "create_tasks" | "query_today" | "query_quick_wins" | "complete_task" | "general"
 */
import { parseMeetingNotesLocal } from './localParser.js';

export function routeIntentLocal(text) {
  const trimmed = (text || '').trim();
  const lower = trimmed.toLowerCase();

  // 1. Query Today: asks what is due today / what to deliver / overdue / on my plate
  const queryTodayPattern = /\b(deliver|due today|overdue|on my plate|what('s| is) due|what do i need to (deliver|do)|today's (tasks?|agenda)|deliverables? today)\b/i;
  if (queryTodayPattern.test(lower) && !lower.includes('finished') && !lower.includes('completed')) {
    return {
      intent: 'query_today'
    };
  }

  // 2. Query Quick Wins: low-hanging fruit, small effort, quick wins, time limit
  const quickWinsPattern = /\b(low[- ]hanging|quick win|quick wins|easy task|small task|low hanging fruit)\b/i;
  const timeBudgetPattern = /\b(?:have|got|in)\s+(?:an?|one|\d+)\s*(?:hour|hours|min|minutes?)\b/i;

  if (quickWinsPattern.test(lower) || (timeBudgetPattern.test(lower) && !lower.includes('finished') && !lower.includes('completed'))) {
    let timeBudgetMinutes = null;
    const minMatch = lower.match(/(\d+)\s*(?:min|minute)/i);
    if (minMatch) {
      timeBudgetMinutes = parseInt(minMatch[1], 10);
    } else if (/\b(?:an?|1|one)\s*hour\b/i.test(lower)) {
      timeBudgetMinutes = 60;
    } else if (/(\d+)\s*hours?\b/i.test(lower)) {
      const hMatch = lower.match(/(\d+)\s*hours?/i);
      timeBudgetMinutes = parseInt(hMatch[1], 10) * 60;
    }

    return {
      intent: 'query_quick_wins',
      timeBudgetMinutes
    };
  }

  // 3. Complete Task: finished / completed / done with / sent / shipped / wrapped up
  const completePattern = /\b(finished|completed|done with|sent|shipped|wrapped up|mark as done|i have finished|i have sent)\b/i;
  if (completePattern.test(lower)) {
    // Extract completion query (e.g. "I finished the vendor email" -> "vendor email")
    let completionQuery = trimmed
      .replace(/^(?:i(?:'ve| have)?\s+)?(?:just\s+)?(?:finished|completed|done with|sent|shipped|wrapped up|mark as done)\s+(?:the\s+|my\s+|a\s+|an\s+)?/i, '')
      .trim();

    if (!completionQuery) completionQuery = trimmed;

    return {
      intent: 'complete_task',
      completionQuery
    };
  }

  // 4. General: greetings or help queries
  const generalPattern = /^(?:hi|hello|hey|help|who are you|what can you do|about|greetings)[!?. ]*$/i;
  if (generalPattern.test(lower) || lower === 'help') {
    return {
      intent: 'general'
    };
  }

  // 5. Default: create_tasks (new commitments or meeting notes)
  const tasks = parseMeetingNotesLocal(trimmed);
  return {
    intent: 'create_tasks',
    tasks
  };
}
