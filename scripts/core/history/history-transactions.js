// scripts/core/history/history-transactions.js
import * as internal from "./history-internal.js";

export function beginHistoryTransaction() {
  const userInteracted = (typeof window !== "undefined" && window.__finflowUserInteracted === true);
  if (!internal.historyEnabled || internal.isRestoring || (internal.isBooting() && !userInteracted)) return;
  internal.setTxDepth(internal.txDepth + 1);
  if (internal.txDepth === 1) internal.setTxCaptured(false);
}

export function endHistoryTransaction() {
  if (internal.txDepth <= 0) return;
  internal.setTxDepth(internal.txDepth - 1);
  if (internal.txDepth === 0) internal.setTxCaptured(false);
}