// scripts/core/history/history-logic.js

const STORAGE_KEYS = ["finflow_settings", "finflow_categories", "finflow_monthdata"];

export function captureSnapshot(reason = "") {
  const data = {};
  for (const k of STORAGE_KEYS) data[k] = localStorage.getItem(k);
  return { type: "storage-snapshot", reason, ts: Date.now(), data };
}

export function snapshotsEqual(a, b) {
  if (!a?.data || !b?.data) return false;
  for (const k of STORAGE_KEYS) {
    const av = a.data[k] ?? null;
    const bv = b.data[k] ?? null;
    if (av !== bv) return false;
  }
  return true;
}

export function applySnapshot(snap) {
  if (!snap?.data) return false;
  // Let op: isRestoring wordt beheerd door de manager (index.js)
  for (const k of STORAGE_KEYS) {
    const v = snap.data[k];
    if (v === null || v === undefined) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  }
  return true;
}