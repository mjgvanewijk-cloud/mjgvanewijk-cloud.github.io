// scripts/ui/popup/saving-month/sheet-commit-shared.js
import { getSavingAccounts } from "../../../core/state/saving-accounts-data.js";

export const DRAFT_TYPE = "saving";
export const SCOPE_MAP = { only: "month", from: "fromNow", year: "all" };

export function getPrimaryAccountId() {
  const accs = getSavingAccounts();
  const first = accs && accs.length ? accs[0] : null;
  const id = first ? String(first.id || "").trim() : "";
  return id;
}

export function isRateDraftId(rowId) {
  return String(rowId || "").startsWith("rate:");
}

export function getAccountIdFromRowId(rowId) {
  const s = String(rowId || "");
  return isRateDraftId(s) ? s.slice(5) : s;
}

