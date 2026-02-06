// scripts/core/history/history-store.js
// Centrale opslag voor undo/redo snapshots.
//
// IMPORTANT (waterdicht):
// We gebruiken window-global stacks zodat meerdere ESM module-instances
// (door verschillende import-URLs/caching) altijd dezelfde store delen.

function getGlobalStore() {
  const w = window;
  if (!w.__finflowHistoryStore) {
    w.__finflowHistoryStore = {
      history: [],
      redo: [],
    };
  }
  return w.__finflowHistoryStore;
}

export function pushHistoryEntry(entry) {
  const s = getGlobalStore();
  s.history.push(entry);
  // Nieuwe wijziging maakt redo ongeldig
  s.redo.length = 0;
}

export function popHistoryEntry() {
  const s = getGlobalStore();
  return s.history.length ? s.history.pop() : null;
}

export function peekHistoryEntry() {
  const s = getGlobalStore();
  return s.history.length ? s.history[s.history.length - 1] : null;
}

export function pushRedoEntry(entry) {
  const s = getGlobalStore();
  s.redo.push(entry);
}

export function popRedoEntry() {
  const s = getGlobalStore();
  return s.redo.length ? s.redo.pop() : null;
}

export function peekRedoEntry() {
  const s = getGlobalStore();
  return s.redo.length ? s.redo[s.redo.length - 1] : null;
}

export function clearHistory() {
  const s = getGlobalStore();
  s.history.length = 0;
  s.redo.length = 0;
}

export function getUndoCount() {
  const s = getGlobalStore();
  return s.history.length;
}

export function getRedoCount() {
  const s = getGlobalStore();
  return s.redo.length;
}
