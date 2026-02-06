// scripts/year/year-edit-data.js
import { loadMonthData } from "../core/storage/index.js";

/**
 * Helpers
 */
export function monthKey(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function normalizeScope(scope) {
  const map = {
    month: "month",
    fromNow: "fromNow",
    future: "fromNow",
    all: "all",
    year: "all",
  };
  return map[scope] || "month";
}

export function getScopeRange(month, scope) {
  let start = month;
  let end = month;
  if (scope === "all") {
    start = 1;
    end = 12;
  } else if (scope === "fromNow") {
    start = month;
    end = 12;
  }
  return { start, end };
}

export function cloneMonthData(md) {
  return JSON.parse(JSON.stringify(md || {}));
}

/**
 * Zorgt dat _catDisplay + overrides structuren bestaan voor een maand-entry.
 * type: "income" | "expense"
 */
export function ensureOverrides(entry, type) {
  if (!entry || typeof entry !== "object") return entry;

  if (!entry._catDisplay) entry._catDisplay = {};
  if (!entry._catDisplay[type]) entry._catDisplay[type] = {};
  if (!entry._catDisplay[type].overrides) entry._catDisplay[type].overrides = {};

  return entry;
}

/**
 * Verwijdert voor een jaar de override voor één categoryName uit monthData._catDisplay[type].overrides
 */
export function clearOverridesForYear(monthData, year, type, categoryName) {
  for (let m = 1; m <= 12; m++) {
    const key = monthKey(year, m);
    const entry = monthData?.[key];
    const ov = entry?._catDisplay?.[type]?.overrides;
    if (ov && Object.prototype.hasOwnProperty.call(ov, categoryName)) {
      delete ov[categoryName];
    }
  }
}

/**
 * Saving helpers (als jouw edit-logic dit ook aanroept)
 */
export function getSavingValue(entry) {
  if (!entry || typeof entry !== "object") return 0;

  if (Array.isArray(entry.savings) && entry.savings.length) {
    return entry.savings.reduce((acc, tx) => {
      const amt = Number(tx?.amount) || 0;
      return tx?.type === "deposit" ? acc + amt : acc - amt;
    }, 0);
  }

  const v = Number(entry.manualSaving);
  return Number.isFinite(v) ? v : 0;
}

export function setSavingValue(entry, value) {
  entry.savings = [];
  entry.manualSaving = Number(value || 0);
}

/**
 * Prefill current amount (wordt gebruikt voor popup default)
 */
export function getCurrentAmount(year, month, type, override = null) {
  const overrideNum = Number(override);
  if (override !== null && !Number.isNaN(overrideNum)) return overrideNum;

  const all = loadMonthData() || {};
  const entry = all[monthKey(year, month)] || {};

  if (type === "income") return Number(entry._simpleIncome ?? entry.income?.amount ?? 0) || 0;
  if (type === "expense") return Number(entry._simpleExpense ?? entry.expense?.amount ?? 0) || 0;
  if (type === "saving") return getSavingValue(entry);

  return 0;
}
