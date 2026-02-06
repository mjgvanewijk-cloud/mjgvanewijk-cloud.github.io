// scripts/core/state/categories/year-defaults.js

import { isSystemOther, ensureOtherYearsByType, ensureYearsObj } from "./system-other.js";

export function getYearAmountByType(cat, year, type) {
  if (!cat || typeof cat !== "object") return 0;
  const y = String(year);
  const t = String(type || "expense");

  if (isSystemOther(cat)) {
    ensureOtherYearsByType(cat);
    const yearsObj = cat.yearsByType?.[t];
    const v = Number(yearsObj?.[y]);
    return Number.isFinite(v) ? v : 0;
  }

  return getYearAmount(cat, year);
}

export function setYearAmountByType(cat, year, type, val) {
  if (!cat || typeof cat !== "object") return;
  const y = String(year);
  const t = String(type || "expense");
  const v = Number(val || 0) || 0;

  if (isSystemOther(cat)) {
    ensureOtherYearsByType(cat);
    if (!cat.yearsByType[t] || typeof cat.yearsByType[t] !== "object") cat.yearsByType[t] = {};
    cat.yearsByType[t][y] = v;
    // legacy: keep `years` aligned with the stored category-type so older readers stay consistent
    const legacyType = String(cat.type || "expense") === "income" ? "income" : "expense";
    cat.years = cat.yearsByType[legacyType];
    return;
  }

  setYearAmount(cat, year, v);
}

export function getYearAmount(cat, year) {
  if (!cat) return 0;
  ensureYearsObj(cat);
  return Number(cat.years[String(year)] ?? 0) || 0;
}

export function setYearAmount(cat, year, val) {
  if (!cat) return;
  ensureYearsObj(cat);
  cat.years[String(year)] = Number(val || 0) || 0;
}

