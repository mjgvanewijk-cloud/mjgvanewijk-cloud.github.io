// scripts/core/state/saving-accounts-ui-guards.js
import { loadMonthData } from "../storage/index.js";

/**
 * Controleert of er handmatige overrides zijn voor een specifiek jaar.
 */
export const hasMonthOverridesForYear = (yearInt, accId) => {
  const yi = Number(yearInt);
  if (!Number.isFinite(yi)) return false;
  const md = loadMonthData() || {};
  const targetId = String(accId || "").trim();
  if (!targetId) return false;
  
  for (let m = 1; m <= 12; m++) {
    const key = `${yi}-${String(m).padStart(2, "0")}`;
    const entry = md?.[key];
    const sa = entry?.savingAccounts;
    if (sa && typeof sa === "object" && Object.prototype.hasOwnProperty.call(sa, targetId)) {
      return true;
    }
  }
  return false;
};