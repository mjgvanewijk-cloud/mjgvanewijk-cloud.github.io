// scripts/core/history/history-internal.js
import * as stack from "./history-stack.js";
import * as logic from "./history-logic.js";

export let historyEnabled = false;
export function setHistoryEnabled(val) { historyEnabled = !!val; }

export let isRestoring = false;
export function setIsRestoring(val) { isRestoring = !!val; }

export let txDepth = 0;
export function setTxDepth(val) { txDepth = val; }

export let txCaptured = false;
export function setTxCaptured(val) { txCaptured = !!val; }

// Baseline om te voorkomen dat de begintoestand als wijziging wordt gezien
export let initialBaseline = null;
export function setInitialBaseline(val) { initialBaseline = val; }

// One-shot override reason for the next snapshot (set by UI actions)
export let nextActionReason = null;
export function setNextActionReasonInternal(val) { nextActionReason = val; }

export function isBooting() {
  const w = window;
  if (typeof w.__finflowBooting === "undefined") w.__finflowBooting = true;
  return w.__finflowBooting !== false;
}

export function notify() {
  window.dispatchEvent(new CustomEvent("finflow-history-changed"));
}

export function notifyAsync() {
  try {
    if (typeof queueMicrotask === "function") {
      queueMicrotask(() => notify());
      return;
    }
  } catch { /* ignore */ }
  Promise.resolve().then(() => notify());
}

export function pruneRedoNoOps(cur) {
  let lastEqual = null;
  while (true) {
    const top = stack.peekRedo();
    if (!top) return lastEqual;
    if (!logic.snapshotsEqual(top, cur)) return lastEqual;
    lastEqual = stack.popRedo();
  }
}

export function pruneUndoNoOps(cur) {
  let lastEqual = null;
  while (true) {
    const top = stack.peekUndo();
    if (!top) return lastEqual;
    if (!logic.snapshotsEqual(top, cur)) return lastEqual;
    lastEqual = stack.popUndo();
  }
}