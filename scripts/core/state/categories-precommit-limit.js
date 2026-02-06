// scripts/core/state/categories-precommit-limit.js
// Pre-commit multi-year banklimiet-check voor categorie-wijzigingen.
// Belangrijk: gebruikt EXACT dezelfde detectie als elders: bankStart + bankEnd.

import { loadSettings, loadMonthData, loadCats } from "../storage/index.js";
import { resetCaches, simulateYear } from "../engine/index.js";

function toYearInt(v) {
  const n = parseInt(String(v ?? "").trim(), 10);
  return Number.isFinite(n) ? n : null;
}

function getLimitValue(settings) {
  const raw = settings?.negativeLimit;
  if (raw === null || raw === undefined || raw === "") return null;
  const v = Number(raw);
  return Number.isFinite(v) ? v : null; // 0 is geldig
}

function getAbsoluteStartYear(settings) {
  const ys = settings?.yearStarting && typeof settings.yearStarting === "object"
    ? Object.keys(settings.yearStarting)
    : [];
  const nums = ys.map((y) => Number(y)).filter(Number.isFinite);
  return nums.length ? Math.min(...nums) : null;
}

function collectYearsFromMonthData(monthData) {
  const set = new Set();
  for (const k of Object.keys(monthData || {})) {
    const y = toYearInt(String(k).slice(0, 4));
    if (y) set.add(y);
  }
  return set;
}

function collectYearsFromCats(catsArr) {
  const set = new Set();
  (Array.isArray(catsArr) ? catsArr : []).forEach((c) => {
    // Overig: year-defaults kunnen per type staan
    if (String(c?.name || "") === "Overig" && c?.yearsByType && typeof c.yearsByType === "object") {
      [c.yearsByType.income, c.yearsByType.expense].forEach((yo) => {
        if (!yo || typeof yo !== "object") return;
        Object.keys(yo).forEach((y) => {
          const yi = toYearInt(y);
          if (yi) set.add(yi);
        });
      });
    }

    const ys = c?.years && typeof c.years === "object" ? Object.keys(c.years) : [];
    ys.forEach((y) => {
      const yi = toYearInt(y);
      if (yi) set.add(yi);
    });
  });
  return set;
}

/**
 * @returns null | { year:number, month:number, bank:number, limit:number }
 */
export function precommitFindFirstCategoryLimitViolation({
  candidateCats,
  previewMonthData = null,
} = {}) {
  const settings = loadSettings() || {};
  const limit = getLimitValue(settings);
  if (limit === null) return null;

  const md = previewMonthData || loadMonthData() || {};
  const prevCats = Array.isArray(loadCats()) ? loadCats() : [];
  const useCats = Array.isArray(candidateCats) ? candidateCats : prevCats;

  // IMPORTANT: Precommit checks must never create undo/redo history entries.
  // We previously used saveCats(...) to temporarily apply candidate categories
  // so the engine defaults matched, but that polluted the history stack
  // (reason: "saveCats"), which then showed vague undo/redo messages like
  // "Teruggezet: Categorieën".
  //
  // We now apply a temporary localStorage override WITHOUT recordSnapshot,
  // and restore the original raw string afterwards.
  const prevCatsStrRaw = localStorage.getItem("finflow_categories");

  const years = new Set();
  const absStart = getAbsoluteStartYear(settings);
  if (Number.isFinite(absStart)) years.add(absStart);

  collectYearsFromMonthData(md).forEach((y) => years.add(y));
  collectYearsFromCats(useCats).forEach((y) => years.add(y));
  years.add(new Date().getFullYear());

  const arr = Array.from(years.values()).filter(Number.isFinite).sort((a, b) => a - b);
  if (!arr.length) return null;

  const yearFrom = Number.isFinite(absStart) ? absStart : arr[0];
  const yearTo = arr[arr.length - 1];

  // Candidate cats tijdelijk toepassen zodat engine defaults exact meeneemt.
  try {
    if (useCats !== prevCats) {
      try {
        localStorage.setItem("finflow_categories", JSON.stringify(useCats || []));
      } catch {
        // If serialization fails, fall back to empty array; still restore below.
        localStorage.setItem("finflow_categories", "[]");
      }
      resetCaches();
    }

    for (let y = yearFrom; y <= yearTo; y++) {
      const sim = simulateYear(y, true, md, settings);
      const months = Array.isArray(sim?.months) ? sim.months : [];

      for (const m of months) {
        const monthNr = Number(m?.month || 1);
        const bankStart = Number(m?.bankStart);
        const bankEnd = Number(m?.bankEnd);

        if (Number.isFinite(bankStart) && bankStart < limit) {
          return { year: y, month: monthNr, bank: bankStart, limit };
        }
        if (Number.isFinite(bankEnd) && bankEnd < limit) {
          return { year: y, month: monthNr, bank: bankEnd, limit };
        }
      }
    }

    return null;
  } finally {
    if (useCats !== prevCats) {
      if (prevCatsStrRaw === null || prevCatsStrRaw === undefined) {
        localStorage.removeItem("finflow_categories");
      } else {
        localStorage.setItem("finflow_categories", prevCatsStrRaw);
      }
      resetCaches();
    }
  }
}

// Compat export: year-monthly-edit-logic verwacht deze naam.
// We delegeren 1-op-1 naar de bestaande precommit functie.
export function findFirstBankLimitViolation(opts = {}) {
  return precommitFindFirstCategoryLimitViolation(opts);
}
