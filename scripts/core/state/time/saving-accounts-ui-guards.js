import { loadMonthData } from "../storage/index.js";

/**
 * Controleert of er handmatige aanpassingen zijn voor een specifiek jaar.
 */
export const hasMonthOverridesForYear = (yearInt, accId) => {
  const yi = Number(yearInt);
  if (!Number.isFinite(yi)) return false;
  const md = loadMonthData() || {};
  const targetAccId = String(accId || "").trim();
  if (!targetAccId) return false;
  for (let m = 1; m <= 12; m++) {
    const key = `${yi}-${String(m).padStart(2, "0")}`;
    const entry = md?.[key];
    const sa = entry?.savingAccounts;
    if (sa && typeof sa === "object" && Object.prototype.hasOwnProperty.call(sa, targetAccId)) {
      return true;
    }
  }
  return false;
};