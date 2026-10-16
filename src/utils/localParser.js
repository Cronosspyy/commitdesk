/**
 * Local Rule-based NLP Parser (Fallback engine)
 * Guarantees zero crashes and works 100% offline without requiring an API key.
 */
import { getTodayISO, resolveRelativeDate } from './dates.js';

export function parseMeetingNotesLocal(text) {
  if (!text || typeof text !== 'string') return [];

  const rawLines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const candidateChunks = [];

  // 1. Group by bullet points or numbering if present
  rawLines.forEach(line => {
    // Ignore section headers like "Standup notes:" or "Action items:"
    if (line.endsWith(':') && line.length < 35) return;

    // Strip leading bullets (-, *, •, 1., 2), etc.)
    const cleaned = line.replace(/^[-*•\d+.)\]]+\s*/, '').trim();
    if (cleaned.length >= 8 && !cleaned.endsWith(':')) {
      candidateChunks.push(cleaned);
    }
  });

  // 2. If no multi-line bullets found, split by sentence punctuation
  if (candidateChunks.length === 0 && text.trim().length >= 8) {
    const sentences = text.match(/[^.!?\n]+[.!?]+(?:\s|$)|[^.!?\n]+$/g) || [text];
    sentences.forEach(s => {
      const clean = s.trim();
      if (clean.length >= 8) candidateChunks.push(clean);
    });
  }

  const todayStr = getTodayISO();
  const parsedTasks = [];

  candidateChunks.forEach((chunk, index) => {
    const lower = chunk.toLowerCase();

    // 1. Infer Requester / Speaker
    let requester = 'Me';
    const dateStopWords = new Set(['today', 'tomorrow', 'yesterday', 'friday', 'monday', 'tuesday', 'wednesday', 'thursday', 'saturday', 'sunday', 'next', 'eod', 'review', 'sprint', 'now', 'asap', 'end']);

    const actionByPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:asked|wants|needs|requested|told|assigned|will review)/i;
    const speakerPattern = /(?:asked by|assigned to|per|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i;
    const possessivePattern = /\b([A-Z][a-z]+)'s\s+(?:PR|deck|doc|review|task|spec|repo)/i;

    const mAction = chunk.match(actionByPattern);
    const mSpeaker = chunk.match(speakerPattern);
    const mPossessive = chunk.match(possessivePattern);

    let candidateName = null;
    if (mAction && mAction[1]) candidateName = mAction[1].trim();
    else if (mSpeaker && mSpeaker[1]) candidateName = mSpeaker[1].trim();
    else if (mPossessive && mPossessive[1]) candidateName = mPossessive[1].trim();

    if (candidateName && !dateStopWords.has(candidateName.toLowerCase().split(' ')[0])) {
      requester = candidateName;
    }

    // 2. Infer Due Date
    const dueDate = resolveRelativeDate(chunk, todayStr);

    // 3. Infer Priority ("High" | "Medium" | "Low")
    let priority = 'Medium';
    if (/\b(urgent|asap|critical|blocker|p0|p1|immediately|high priority|highest)\b/i.test(chunk)) {
      priority = 'High';
    } else if (/\b(low priority|when you can|nice to have|backlog|non-blocking|p3)\b/i.test(chunk)) {
      priority = 'Low';
    }

    // 4. Infer Effort ("Small" | "Medium" | "Large")
    let effort = 'Medium';
    if (/\b(email|ping|slack|notify|bump|verify|check|update status|quick call|schedule|forward)\b/i.test(chunk)) {
      effort = 'Small';
    } else if (/\b(architecture|redesign|migrate|migration|rewrite|overhaul|distributed|cluster|spec|rfc|audit)\b/i.test(chunk)) {
      effort = 'Large';
    }

    // 5. Title & Description
    // Clean up title to be concise
    let title = chunk;
    // Remove boilerplate introductory clauses
    title = title.replace(/^(?:please|could you|need to|we need to|i have to|action item:?|todo:?)\s+/i, '');
    if (title.length > 65) {
      // Find a clean break
      const truncated = title.substring(0, 62);
      const lastSpace = truncated.lastIndexOf(' ');
      title = (lastSpace > 30 ? truncated.substring(0, lastSpace) : truncated) + '...';
    }
    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);

    parsedTasks.push({
      id: `COMMIT-${Date.now().toString().slice(-4)}${index + 1}`,
      title,
      description: chunk.charAt(0).toUpperCase() + chunk.slice(1),
      dueDate,
      requester,
      priority,
      effort,
      status: 'To Do',
      source: 'Meeting',
      createdAt: todayStr
    });
  });

  return parsedTasks;
}
