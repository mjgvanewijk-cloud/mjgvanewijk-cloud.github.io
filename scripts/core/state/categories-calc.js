// scripts/core/state/categories-calc.js
import { cloneObj } from "./categories-store.js";
import { getYearAmountByType } from "./categories-data-helpers.js";

/* =========================
   Helpers: Month + Totals
   ========================= */

function monthKey(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function ensureMonthEntry(monthData, year, month) {
  const key = monthKey(year, month);
  const prev = monthData[key];
  if (!prev || typeof prev !== "object") {
    monthData[key] = {};
    return monthData[key];
  }
  return prev;
}

function getMonthDisplayOverrides(entry, type) {
  const cd = entry && entry._catDisplay && typeof entry._catDisplay === "object" ? entry._catDisplay : null;
  const st = cd && cd[type] && typeof cd[type] === "object" ? cd[type] : null;
  const ov = st && st.overrides && typeof st.overrides === "object" ? st.overrides : null;
  return ov || null;
}

function getCatYearAmount(cat, year, type) {
  return Number(getYearAmountByType(cat, year, type)) || 0;
}

function yearHasAnyCategoryData(cats, year, type) {
  return cats.some((c) => {
    if (!c || typeof c !== "object") return false;
    if ((c.type || "expense") !== type) return false;
    const years = c.years;
    return years && typeof years === "object" && Object.prototype.hasOwnProperty.call(years, String(year));
  });
}

function computeMonthTotalFromCategories({ cats, monthData, year, month, type }) {
  const key = monthKey(year, month);
  const entry = (monthData && monthData[key] && typeof monthData[key] === "object") ? monthData[key] : {};
  const overrides = getMonthDisplayOverrides(entry, type);

  let total = 0;

  for (const c of cats) {
    if (!c || typeof c !== "object") continue;
    const name = c.name || "";
    const cType = c.type || "expense";

    if (cType !== type) continue;

    let amt = 0;

    if (overrides && Object.prototype.hasOwnProperty.call(overrides, name)) {
      const ovVal = Number(overrides[name]) || 0;

      amt = ovVal;
    } else {
      amt = getCatYearAmount(c, year, type);
    }

    total += Number.isFinite(amt) ? amt : 0;
  }

  return total;
}

export function collectYearsFromCats(cats) {
  const set = new Set();
  for (const c of cats) {
    if (!c || typeof c !== "object") continue;
    // Overig: year-defaults kunnen per type staan
    if ((c.name || "") === "Overig" && c.yearsByType && typeof c.yearsByType === "object") {
      const yi = c.yearsByType.income;
      const ye = c.yearsByType.expense;
      if (yi && typeof yi === "object") Object.keys(yi).forEach((y) => { const n = Number(y); if (Number.isFinite(n)) set.add(n); });
      if (ye && typeof ye === "object") Object.keys(ye).forEach((y) => { const n = Number(y); if (Number.isFinite(n)) set.add(n); });
    }

    const years = c.years;
    if (years && typeof years === "object") {
      for (const y of Object.keys(years)) {
        const n = Number(y);
        if (Number.isFinite(n)) set.add(n);
      }
    }
  }
  return Array.from(set).sort((a, b) => a - b);
}

export function collectYearsFromMonthData(monthData) {
  const set = new Set();
  if (!monthData || typeof monthData !== "object") return [];
  for (const k of Object.keys(monthData)) {
    const y = Number(String(k).slice(0, 4));
    if (Number.isFinite(y)) set.add(y);
  }
  return Array.from(set).sort((a, b) => a - b);
}

export function getAbsoluteStartYear(settings) {
  const ys = Object.keys(settings?.yearStarting || {})
    .map(Number)
    .filter(Number.isFinite);
  return ys.length ? Math.min(...ys) : null;
}

/**
 * Bouwt maandtotalen (income/expense) opnieuw op op basis van categorie-inhoud.
 */
export function rebuildMonthTotalsForCats({ cats, baseMonthData, typesToRecalc, yearsToRecalc }) {
  const md = cloneObj(baseMonthData || {});
  const catsArr = Array.isArray(cats) ? cats : [];

  for (const year of yearsToRecalc) {
    for (const type of typesToRecalc) {
      if (!yearHasAnyCategoryData(catsArr, year, type)) continue;

      for (let m = 1; m <= 12; m++) {
        const entry = ensureMonthEntry(md, year, m);
        const total = computeMonthTotalFromCategories({ cats: catsArr, monthData: md, year, month: m, type });

        if (type === "expense") entry._simpleExpense = Number(total || 0);
        else if (type === "income") entry._simpleIncome = Number(total || 0);
      }
    }
  }

  return md;
}