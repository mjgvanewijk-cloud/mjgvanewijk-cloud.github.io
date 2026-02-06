// scripts/core/history/history-stack.js
// In-memory undo/redo stacks + (Option A) persistence of snapshots incl. meta.

const HISTORY_STORAGE_KEY = "finflow_history_v1";
const HISTORY_MAX_ENTRIES = 80; // cap to reduce localStorage pressure

let persistTimer = null;

export function getGlobalStore() {
  const w = window;
  if (!w.__finflowHistoryStore) {
    w.__finflowHistoryStore = { history: [], redo: [], baseline: null };
  } else {
    // Backward compatible: older store may not have baseline
    if (!("baseline" in w.__finflowHistoryStore)) w.__finflowHistoryStore.baseline = null;
    if (!Array.isArray(w.__finflowHistoryStore.history)) w.__finflowHistoryStore.history = [];
    if (!Array.isArray(w.__finflowHistoryStore.redo)) w.__finflowHistoryStore.redo = [];
  }
  return w.__finflowHistoryStore;
}

function clampStacks(s) {
  if (s.history.length > HISTORY_MAX_ENTRIES) {
    s.history.splice(0, s.history.length - HISTORY_MAX_ENTRIES);
  }
  if (s.redo.length > HISTORY_MAX_ENTRIES) {
    s.redo.splice(0, s.redo.length - HISTORY_MAX_ENTRIES);
  }
}

function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function looksLikeSnapshot(x) {
  return (
    x &&
    typeof x === "object" &&
    x.type === "storage-snapshot" &&
    x.data &&
    typeof x.data === "object"
  );
}

function normalizeSnapshot(x) {
  // Only keep known fields; preserve meta (incl. actionReason)
  const out = {
    type: "storage-snapshot",
    reason: typeof x.reason === "string" ? x.reason : "",
    ts: typeof x.ts === "number" ? x.ts : Date.now(),
    data: x.data && typeof x.data === "object" ? x.data : {},
  };
  if (x.meta && typeof x.meta === "object") out.meta = x.meta;
  return out;
}

export function schedulePersist() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    persistNow();
  }, 60);
}

export function persistNow() {
  const s = getGlobalStore();
  clampStacks(s);

  const payload = {
    v: 1,
    savedAt: Date.now(),
    baseline: s.baseline ? normalizeSnapshot(s.baseline) : null,
    history: s.history.map(normalizeSnapshot),
    redo: s.redo.map(normalizeSnapshot),
  };

  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage full / blocked -> ignore (history remains in-memory)
  }
}

export function restoreFromStorage() {
  const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
  if (!raw) return false;

  const obj = safeParse(raw);
  if (!obj || typeof obj !== "object") return false;

  const s = getGlobalStore();

  const hist = Array.isArray(obj.history) ? obj.history.filter(looksLikeSnapshot).map(normalizeSnapshot) : [];
  const redo = Array.isArray(obj.redo) ? obj.redo.filter(looksLikeSnapshot).map(normalizeSnapshot) : [];

  s.history = hist;
  s.redo = redo;

  if (obj.baseline && looksLikeSnapshot(obj.baseline)) {
    s.baseline = normalizeSnapshot(obj.baseline);
  } else {
    s.baseline = null;
  }

  clampStacks(s);
  return true;
}

export function clearStacks() {
  const s = getGlobalStore();
  s.history.length = 0;
  s.redo.length = 0;
  s.baseline = null;
  schedulePersist();
}

export function pushUndo(entry) {
  const s = getGlobalStore();
  s.history.push(entry);
  s.redo.length = 0;
  clampStacks(s);
  schedulePersist();
}

export function replaceLastUndo(entry) {
  const s = getGlobalStore();
  if (!s.history.length) {
    s.history.push(entry);
  } else {
    s.history[s.history.length - 1] = entry;
  }
  // A new change invalidates redo stack
  s.redo.length = 0;
  clampStacks(s);
  schedulePersist();
}

export function popUndo() {
  const s = getGlobalStore();
  const v = s.history.length ? s.history.pop() : null;
  schedulePersist();
  return v;
}

export function peekUndo() {
  const s = getGlobalStore();
  return s.history.length ? s.history[s.history.length - 1] : null;
}

export function pushRedo(entry) {
  const s = getGlobalStore();
  s.redo.push(entry);
  clampStacks(s);
  schedulePersist();
}

export function popRedo() {
  const s = getGlobalStore();
  const v = s.redo.length ? s.redo.pop() : null;
  schedulePersist();
  return v;
}

export function peekRedo() {
  const s = getGlobalStore();
  return s.redo.length ? s.redo[s.redo.length - 1] : null;
}

export function setBaselineSnapshot(baselineSnap) {
  const s = getGlobalStore();
  s.baseline = baselineSnap || null;
  schedulePersist();
}

export function getBaselineSnapshot() {
  const s = getGlobalStore();
  return s.baseline || null;
}
