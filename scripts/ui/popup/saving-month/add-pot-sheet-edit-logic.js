// scripts/ui/popup/saving-month/add-pot-sheet-edit-logic.js
import { monthKey } from "../../../year/year-edit-data.js";

export const hasMonthOverridesForYear = (yearInt, baseMd, accountId) => {
  const yi = Number(yearInt);
  if (!Number.isFinite(yi)) return false;
  for (let m = 1; m <= 12; m++) {
    const key = monthKey(yi, m);
    const entry = baseMd?.[key];
    const sa = entry?.savingAccounts;
    if (sa && typeof sa === "object" && Object.prototype.hasOwnProperty.call(sa, accountId)) {
      return true;
    }
  }
  return false;
};

export const getOverrideYearsForAccount = (baseMd, accountId) => {
  const years = new Set();
  Object.keys(baseMd || {}).forEach((k) => {
    const m = /^\s*(\d{4})-/.exec(String(k));
    if (!m) return;
    const yStr = m[1];
    const entry = baseMd?.[k];
    const sa = entry?.savingAccounts;
    if (sa && typeof sa === "object" && Object.prototype.hasOwnProperty.call(sa, accountId)) {
      years.add(String(yStr));
    }
  });
  return years;
};

export const applyWipeYearsToMonthData = (monthDataObj, yearStrs, accountId) => {
  const md = (monthDataObj && typeof monthDataObj === "object") ? monthDataObj : {};
  (Array.isArray(yearStrs) ? yearStrs : []).forEach((ys) => {
    const yi = parseInt(String(ys).trim(), 10);
    if (!Number.isFinite(yi)) return;
    for (let m = 1; m <= 12; m++) {
      const key = monthKey(yi, m);
      const entry = md?.[key];
      if (!entry || typeof entry !== "object") continue;
      const sa = entry?.savingAccounts;
      if (!sa || typeof sa !== "object") continue;

      if (Object.prototype.hasOwnProperty.call(sa, accountId)) {
        delete sa[accountId];
      }
      if (Object.keys(sa).length === 0) {
        delete entry.savingAccounts;
      }
      if (Object.keys(entry).length === 0) {
        delete md[key];
      }
    }
  });
  return md;
};