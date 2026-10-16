/**
 * Safe Storage utility with In-Memory fallback and strict try/catch wrapping.
 * Ensures zero crashes even in restricted iframe/incognito browser sessions.
 */

const memoryFallback = new Map();

export const Storage = {
  getItem(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch (err) {
      console.warn(`[CommitDesk Storage] localStorage.getItem('${key}') failed, using in-memory:`, err);
    }
    return memoryFallback.has(key) ? memoryFallback.get(key) : null;
  },

  setItem(key, value) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (err) {
      console.warn(`[CommitDesk Storage] localStorage.setItem('${key}') failed, using in-memory:`, err);
    }
    memoryFallback.set(key, value);
  },

  removeItem(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (err) {
      console.warn(`[CommitDesk Storage] localStorage.removeItem('${key}') failed:`, err);
    }
    memoryFallback.delete(key);
  },

  getJSON(key, defaultValue = null) {
    const raw = this.getItem(key);
    if (!raw) return defaultValue;
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.error(`[CommitDesk Storage] JSON.parse error for key '${key}':`, err);
      return defaultValue;
    }
  },

  setJSON(key, data) {
    try {
      const serialized = JSON.stringify(data);
      this.setItem(key, serialized);
    } catch (err) {
      console.error(`[CommitDesk Storage] JSON.stringify error for key '${key}':`, err);
    }
  }
};
