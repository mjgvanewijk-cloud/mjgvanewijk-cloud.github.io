// scripts/ui/popup/saving-month/add-pot-sheet-logic.js
import * as Helpers from "./saving-pot-helpers.js";

export function isNameDuplicateExcludingId(name, existingAccounts, excludeId) {
  const n = Helpers.normalizeName(name).toLowerCase();
  const ex = excludeId ? String(excludeId) : null;
  return (Array.isArray(existingAccounts) ? existingAccounts : []).some((a) => {
    if (!a || typeof a !== "object") return false;
    if (ex && String(a.id || "") === ex) return false;
    const an = Helpers.normalizeName(a?.name).toLowerCase();
    return !!an && an === n;
  });
}