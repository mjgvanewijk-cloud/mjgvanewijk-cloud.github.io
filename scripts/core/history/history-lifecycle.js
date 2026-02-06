// scripts/core/history/history-lifecycle.js
import * as stack from "./history-stack.js";
import * as logic from "./history-logic.js";
import * as internal from "./history-internal.js";

// enableHistory
// Requirement:
// - Bij elke (re)start: Undo/Redo moet clean DISABLED zijn.
// - Daarna moeten nieuwe acties (bv. delete category) wél undo/redo-baar zijn.
// Daarom: standaard géén restore van persisted stacks bij enable.
// (Optioneel restore kan nog expliciet aangezet worden.)
export function enableHistory({ reset = true, forceReset = false, restore = false } = {}) {
  const wasEnabled = internal.historyEnabled;
  internal.setHistoryEnabled(true);

  if (forceReset) {
    stack.clearStacks();
    internal.setInitialBaseline(logic.captureSnapshot("baseline"));
    stack.setBaselineSnapshot(internal.initialBaseline);
    internal.notify();
    return;
  }

  if (reset && !wasEnabled) {
    // Default: start elke sessie met een schone stack (Undo/Redo disabled).
    // Optioneel: restore=true kan gebruikt worden voor debug/doelbewust herstel.
    if (restore) {
      const restored = stack.restoreFromStorage();
      if (restored) {
        internal.setInitialBaseline(stack.getBaselineSnapshot());
        if (!internal.initialBaseline) {
          internal.setInitialBaseline(logic.captureSnapshot("baseline"));
          stack.setBaselineSnapshot(internal.initialBaseline);
        }
      } else {
        stack.clearStacks();
        internal.setInitialBaseline(logic.captureSnapshot("baseline"));
        stack.setBaselineSnapshot(internal.initialBaseline);
      }
    } else {
      // Forceer clean start: verwijder persisted stacks en zet een nieuwe baseline.
      stack.clearStacks();
      internal.setInitialBaseline(logic.captureSnapshot("baseline"));
      stack.setBaselineSnapshot(internal.initialBaseline);
    }
  }

  internal.notify();
}

export function disableHistory() {
  internal.setHistoryEnabled(false);
  internal.notify();
}