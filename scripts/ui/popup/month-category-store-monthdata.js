// scripts/ui/popup/month-category-store-monthdata.js
import { loadMonthData, saveMonthData } from "../../core/storage/index.js";

/**
 * Persisted month display state (finflow_monthdata)
 * - _catDisplay (overrides / scopes / solidified)
 */

const __CAT_DISPLAY_KEY = "_catDisplay";

export function monthKey(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function __ensureMonthEntry(md, year, month) {
  const key = monthKey(year, month);
  if (!md[key] || typeof md[key] !== "object") md[key] = {};
  return md[key];
}

function __ensureCatDisplay(entry) {
  if (!entry[__CAT_DISPLAY_KEY] || typeof entry[__CAT_DISPLAY_KEY] !== "object") {
    entry[__CAT_DISPLAY_KEY] = { income: { overrides: {}, scopes: {} }, expense: { overrides: {}, scopes: {} } };
  }
  if (!entry[__CAT_DISPLAY_KEY].income) entry[__CAT_DISPLAY_KEY].income = { overrides: {}, scopes: {} };
  if (!entry[__CAT_DISPLAY_KEY].expense) entry[__CAT_DISPLAY_KEY].expense = { overrides: {}, scopes: {} };

  // Normaliseer vorm
  for (const k of ["income", "expense"]) {
    const obj = entry[__CAT_DISPLAY_KEY][k];
    if (!obj || typeof obj !== "object") entry[__CAT_DISPLAY_KEY][k] = { overrides: {}, scopes: {} };
    if (!entry[__CAT_DISPLAY_KEY][k].overrides || typeof entry[__CAT_DISPLAY_KEY][k].overrides !== "object") {
      entry[__CAT_DISPLAY_KEY][k].overrides = {};
    }
    if (!entry[__CAT_DISPLAY_KEY][k].scopes || typeof entry[__CAT_DISPLAY_KEY][k].scopes !== "object") {
      entry[__CAT_DISPLAY_KEY][k].scopes = {};
    }
    if (typeof entry[__CAT_DISPLAY_KEY][k].solidified !== "boolean") {
      entry[__CAT_DISPLAY_KEY][k].solidified = false;
    }
  }
  return entry[__CAT_DISPLAY_KEY];
}

export function getMonthCatDisplayState(year, month, type) {
  const md = loadMonthData() || {};
  const entry = md[monthKey(year, month)];
  if (!entry || typeof entry !== "object") return { overrides: {}, solidified: false };
  const cd = __ensureCatDisplay(entry);
  const t = type === "income" ? "income" : "expense";
  const st = cd[t] || { overrides: {}, solidified: false };
  return {
    overrides: { ...(st.overrides || {}) },
    scopes: { ...(st.scopes || {}) },
    solidified: !!st.solidified,
  };
}

export function setMonthCatDisplayState(year, month, type, state) {
  const md = loadMonthData() || {};
  const entry = __ensureMonthEntry(md, year, month);
  const cd = __ensureCatDisplay(entry);
  const t = type === "income" ? "income" : "expense";

  const next = state && typeof state === "object" ? state : {};
  cd[t] = {
    overrides: { ...(next.overrides || {}) },
    scopes: { ...(next.scopes || {}) },
    solidified: !!next.solidified,
  };

  saveMonthData(md);
  return true;
}

// In finflow_monthdata:<year-mm>._catDisplay[type].scopes[catName] = 'only'|'from'|'year'
export function getPersistedScope(year, month, type, catName) {
  const name = String(catName || "");
  if (!name) return null;
  const md = loadMonthData() || {};
  const entry = md[monthKey(year, month)];
  if (!entry || typeof entry !== "object") return null;
  const cd = __ensureCatDisplay(entry);
  const t = type === "income" ? "income" : "expense";
  const scopes = cd?.[t]?.scopes;
  const v = scopes && Object.prototype.hasOwnProperty.call(scopes, name) ? scopes[name] : null;
  return v === "only" || v === "from" || v === "year" ? v : null;
}

// Optional: solidify helper (uitgeschakeld in nieuwe structuur)
export function solidifyOtherIfNeeded(year, month, type, totalAbs) {
  return false;
}
