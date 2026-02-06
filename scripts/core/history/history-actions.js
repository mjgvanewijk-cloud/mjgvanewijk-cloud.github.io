// scripts/core/history/history-actions.js
import * as stack from "./history-stack.js";
import * as logic from "./history-logic.js";
import * as internal from "./history-internal.js";

function _ffUserInteracted() {
  return (typeof window !== "undefined" && window.__finflowUserInteracted === true);
}

// Minimal marker builder for user-intent history steps.
// We keep a compact reason format to support merge-groups (for typing, etc.)
// without any user-facing detail payload.
//
// Format: "user|g=<group>&m=<0|1>"
export function buildUserReason(group = "", merge = false) {
  const g = String(group || "").trim();
  const m = merge ? 1 : 0;
  if (!g) return `user|m=${m}`;
  return `user|g=${encodeURIComponent(g)}&m=${m}`;
}

// Minimal parser:
// - supports legacy "ffh:<detailKey>|g=<group>&m=<merge>" (kept for safety)
// - supports new "user|g=<group>&m=<merge>"
// - does NOT parse/keep any detail params for user-facing messages
function parseHistoryMeta(reasonRaw) {
  const r = String(reasonRaw || "");

  // New minimal user marker
  if (r.startsWith("user|")) {
    const qs = r.slice(5); // after "user|"
    let group = "";
    let merge = false;

    for (const chunk of qs.split("&")) {
      if (!chunk) continue;
      const [kRaw, vRaw] = chunk.split("=");
      const k = decodeURIComponent(String(kRaw || ""));
      const v = decodeURIComponent(String(vRaw || ""));
      if (!k) continue;
      if (k === "g") group = v;
      else if (k === "m") merge = (v === "1" || v === "true");
    }
    return { raw: r, isUserMarker: true, detailKey: "", group, merge };
  }

  // Legacy marker (kept so older reasons don't break)
  if (r.startsWith("ffh:")) {
    const rest = r.slice(4); // after "ffh:"
    const parts = rest.split("|");
    const detailKey = String(parts[0] || "").trim();
    const qs = String(parts[1] || "");

    let group = "";
    let merge = false;

    for (const chunk of qs.split("&")) {
      if (!chunk) continue;
      const [kRaw, vRaw] = chunk.split("=");
      const k = decodeURIComponent(String(kRaw || ""));
      const v = decodeURIComponent(String(vRaw || ""));
      if (!k) continue;
      if (k === "g") group = v;
      else if (k === "m") merge = (v === "1" || v === "true");
    }

    return { raw: r, isUserMarker: true, detailKey, group, merge };
  }

  return { raw: r, isUserMarker: false, detailKey: "", group: "", merge: false };
}

export function setNextActionReason(reason = "") {
  internal.setNextActionReasonInternal(String(reason || ""));
}

export function recordSnapshot(reason = "") {
  const userInteracted =
    (typeof window !== "undefined" && window.__finflowUserInteracted === true);

  // Core guards: do not capture while restoring or when history is disabled.
  if (!internal.historyEnabled || internal.isRestoring) return;

  const inTx = internal.txDepth > 0;
  if (inTx && internal.txCaptured) return;

  const effectiveReason =
    (internal.nextActionReason !== null &&
      internal.nextActionReason !== undefined &&
      String(internal.nextActionReason).length)
      ? String(internal.nextActionReason)
      : String(reason || "");

  // Consume nextActionReason exactly once.
  internal.setNextActionReasonInternal(null);

  let parsed = parseHistoryMeta(effectiveReason);

  // Boot guard:
  // - During boot we normally ignore snapshots.
  // - But if the caller explicitly marked the action as a user action (user|... / ffh:...),
  //   we must allow it even if the global "userInteracted" flag is not yet set.
  // This prevents the first real user action after clean start (e.g. first category create)
  // from being swallowed as baseline/boot noise.
  if (internal.isBooting() && userInteracted !== true && !parsed.isUserMarker) return;

  const store = stack.getGlobalStore();

  // Clean-start protection:
  // ignore the very first init seed entry for settings ONLY,
  // while the user has NOT interacted yet.
  const isFirstInitSettingsSeed =
    (store.history.length === 0 &&
      parsed.detailKey === "history.detail.settings" &&
      userInteracted !== true);

  // Only user-marked steps are undoable (and we do not even store non-user steps).
  const isUserUndoable = parsed.isUserMarker && !isFirstInitSettingsSeed;

  if (!isUserUndoable) return;

  const snap = logic.captureSnapshot(parsed.raw);

  // Minimal meta (no user-facing detail keys/params anymore)
  snap.meta = {
    group: parsed.group || "",
    merge: !!parsed.merge,
    isUser: true,
  };

  const last = stack.peekUndo() || internal.initialBaseline;

  // IMPORTANT: For the first user action of a session (history empty), we must
  // store the current snapshot even if it equals the baseline. Otherwise Undo
  // would remain unavailable after the first change.
  if (store.history.length > 0 && last && logic.snapshotsEqual(last, snap)) return;

  // Merge consecutive snapshots that share the same merge-group
  if (parsed.merge && parsed.group) {
    const top = stack.peekUndo();
    if (top && top.meta && top.meta.group === parsed.group) {
      store.redo.length = 0;
      store.history[store.history.length - 1] = snap;
      stack.schedulePersist();
      internal.notifyAsync();
      if (inTx) internal.setTxCaptured(true);
      return;
    }
  }

  stack.pushUndo(snap);
  if (inTx) internal.setTxCaptured(true);
  internal.notifyAsync();
}

export function undo() {
  if (!internal.historyEnabled || (internal.isBooting() && !_ffUserInteracted())) return false;

  const prev = stack.popUndo();
  if (!prev) {
    internal.notify();
    return false;
  }

  const cur = logic.captureSnapshot("undo-current");
  // Align redo enablement with user step
  cur.meta = { isUser: true };
  stack.pushRedo(cur);

  internal.setIsRestoring(true);
  const ok = logic.applySnapshot(prev);
  internal.setIsRestoring(false);

  internal.notify();
  if (!ok) return false;

  // UI uses fixed generic message
  return { ok: true, op: "undo" };
}

export function redo() {
  if (!internal.historyEnabled || (internal.isBooting() && !_ffUserInteracted())) return false;

  const next = stack.popRedo();
  if (!next) {
    internal.notify();
    return false;
  }

  const cur = logic.captureSnapshot("redo-current");
  cur.meta = { isUser: true };

  const store = stack.getGlobalStore();
  store.history.push(cur);
  stack.schedulePersist();

  internal.setIsRestoring(true);
  try {
    const ok = logic.applySnapshot(next);
    if (!ok) return false;
    return { ok: true, op: "redo" };
  } finally {
    setTimeout(() => {
      internal.setIsRestoring(false);
      internal.notify();
    }, 50);
  }
}

export function canUndo() {
  if (!internal.historyEnabled || (internal.isBooting() && !_ffUserInteracted())) return false;
  return stack.getGlobalStore().history.length > 0;
}

export function canRedo() {
  if (!internal.historyEnabled || (internal.isBooting() && !_ffUserInteracted())) return false;
  return stack.getGlobalStore().redo.length > 0;
}

export function __dbgGetState() {
  const store = stack.getGlobalStore();
  return {
    historyEnabled: internal.historyEnabled,
    isRestoring: internal.isRestoring,
    txDepth: internal.txDepth,
    txCaptured: internal.txCaptured,
    undoCount: store.history.length,
    redoCount: store.redo.length,
  };
}
