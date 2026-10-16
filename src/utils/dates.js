/**
 * Date calculations and relative date parsing utilities.
 */

export function getTodayISO() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getRelativeDateISO(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isOverdue(dueDate, status) {
  if (!dueDate || status === 'Done') return false;
  return dueDate < getTodayISO();
}

export function isDueToday(dueDate, status) {
  if (!dueDate || status === 'Done') return false;
  return dueDate === getTodayISO();
}

export function formatDisplayDate(dateStr) {
  if (!dateStr) return 'No deadline';
  const today = getTodayISO();

  if (dateStr === today) return 'Today';
  if (dateStr === getRelativeDateISO(1)) return 'Tomorrow';
  if (dateStr === getRelativeDateISO(-1)) return 'Yesterday';

  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

/**
 * Resolves natural language date references to YYYY-MM-DD
 */
export function resolveRelativeDate(phrase, baseISO = getTodayISO()) {
  const lower = (phrase || '').toLowerCase().trim();
  const base = new Date(baseISO + 'T00:00:00');

  // Explicit YYYY-MM-DD
  const explicitMatch = lower.match(/\b(20\d\d-\d{2}-\d{2})\b/);
  if (explicitMatch) return explicitMatch[1];

  // Specific keywords
  if (lower.includes('yesterday')) {
    base.setDate(base.getDate() - 1);
    return formatDateObj(base);
  }
  if (lower.includes('today') || lower.includes('tonight') || lower.includes('eod') || lower.includes('asap')) {
    return baseISO;
  }
  if (lower.includes('tomorrow')) {
    base.setDate(base.getDate() + 1);
    return formatDateObj(base);
  }
  if (lower.includes('day after tomorrow') || lower.includes('in 2 days')) {
    base.setDate(base.getDate() + 2);
    return formatDateObj(base);
  }
  if (lower.includes('in 3 days')) {
    base.setDate(base.getDate() + 3);
    return formatDateObj(base);
  }
  if (lower.includes('end of week') || lower.includes('by friday') || lower.includes('friday')) {
    // Find next Friday
    const currentDay = base.getDay(); // 0 is Sun, 5 is Fri
    let daysUntilFriday = (5 - currentDay + 7) % 7;
    if (daysUntilFriday === 0) daysUntilFriday = 7; // next Friday if today is Friday
    base.setDate(base.getDate() + daysUntilFriday);
    return formatDateObj(base);
  }
  if (lower.includes('end of next week') || lower.includes('next week')) {
    base.setDate(base.getDate() + 7);
    return formatDateObj(base);
  }
  if (lower.includes('monday')) {
    const currentDay = base.getDay();
    let daysUntilMonday = (1 - currentDay + 7) % 7;
    if (daysUntilMonday === 0) daysUntilMonday = 7;
    base.setDate(base.getDate() + daysUntilMonday);
    return formatDateObj(base);
  }

  return baseISO;
}

function formatDateObj(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
