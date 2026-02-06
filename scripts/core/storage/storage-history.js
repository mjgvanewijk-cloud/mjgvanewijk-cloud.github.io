// scripts/core/storage/storage-history.js

import { beginHistoryTransaction, endHistoryTransaction } from "../history/index.js";

// Option A (transaction batching):
// Bundel alle persist-calls die door één gebruikersactie getriggerd worden tot één undo-stap.
let historyBatchOpen = false;

export function ensureHistoryBatch() {
  if (historyBatchOpen) return;
  historyBatchOpen = true;
  beginHistoryTransaction();

  // setTimeout(0) bundelt alle synchronous writes binnen dezelfde UI-actie.
  setTimeout(() => {
    endHistoryTransaction();
    historyBatchOpen = false;
  }, 0);
}