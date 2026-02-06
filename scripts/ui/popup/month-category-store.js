// scripts/ui/popup/month-category-store.js
/**
 * Centrale, modulaire store voor de month-category sheet.
 *
 * Dit is een compat/orchestrator bestand: bestaande imports kunnen dit pad blijven gebruiken.
 * Functionele inhoud zit in kleinere modules (monthdata, drafts, misc).
 */

export { monthKey, getMonthCatDisplayState, setMonthCatDisplayState, getPersistedScope, solidifyOtherIfNeeded } from "./month-category-store-monthdata.js";

export {
  getInlineDraft,
  setInlineDraft,
  deleteInlineDraft,
  clearInlineDraft,
  getAllInlineDrafts,
  clearAllInlineDrafts,
  clearInlineDrafts,
  hasInlineDrafts,
  getInlineScopeHint,
  setInlineScopeHint,
} from "./month-category-store-drafts.js";

export { saveCatsSafe, getHint, setHint, deleteHint, emitInlineError } from "./month-category-store-misc.js";
