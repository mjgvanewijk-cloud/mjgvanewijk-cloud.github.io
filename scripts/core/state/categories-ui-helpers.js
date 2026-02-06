// scripts/core/state/categories-ui-helpers.js

import { loadSettings, loadMonthData } from "../storage/index.js";
import { simulateYear, resetCaches } from "../engine/index.js";
import { t } from "../../i18n.js";

/** Helpers voor data */
export function monthName(monthNr) {
  return t(`months.${monthNr}`);
}

export function getAbsoluteStartYear(settings) {
  const years = Object.keys(settings?.yearStarting || {})
    .map(Number)
    .filter(Number.isFinite);
  return years.length ? Math.min(...years) : null;
}

export function collectYearsFromCats(catsArr) {
  const set = new Set();
  (Array.isArray(catsArr) ? catsArr : []).forEach((c) => {
    const yearsObj = c?.years;
    if (!yearsObj || typeof yearsObj !== "object") return;
    Object.keys(yearsObj).forEach((y) => {
      const n = Number(y);
      if (Number.isFinite(n)) set.add(n);
    });
  });
  return set;
}

export function collectYearsFromMonthData(monthData) {
  const set = new Set();
  if (!monthData || typeof monthData !== "object") return set;
  for (const key of Object.keys(monthData)) {
    const y = Number(String(key).slice(0, 4));
    if (Number.isFinite(y)) set.add(y);
  }
  return set;
}

/**
 * Bouwt een "candidate" cats-array zonder te saven,
 * zodat we vooraf kunnen valideren (limietcheck).
 */
export function applyUpsertPreview(prevCats, updatedCat, originalName) {
  const base = Array.isArray(prevCats) ? prevCats.map((c) => ({ ...c })) : [];

  if (!updatedCat || !updatedCat.name) return base;

  // Ensure years object exists (defensive)
  const next = { ...updatedCat };
  if (!next.years || typeof next.years !== "object") next.years = {};

  if (originalName) {
    const idxByOriginal = base.findIndex((c) => (c?.name || "") === originalName);
    if (idxByOriginal >= 0) {
      base[idxByOriginal] = next;
      return base;
    }
  }

  // Upsert by name (match persist behavior: replace if exists)
  const idxByName = base.findIndex((c) => (c?.name || "") === next.name);
  if (idxByName >= 0) base[idxByName] = next;
  else base.push(next);

  return base;
}

/**
 * Zoekt eerste limiet-overschrijding in jaar-range.
 * Return null of { year, month, balance, limit }
 */
export function findLimitViolation({ limitValue, minYear, maxYear }) {
  if (!Number.isFinite(limitValue)) return null;
  if (!Number.isFinite(minYear) || !Number.isFinite(maxYear)) return null;

  for (let y = minYear; y <= maxYear; y++) {
    const sim = simulateYear(y);
    const months = Array.isArray(sim?.months) ? sim.months : [];
    for (let i = 0; i < months.length; i++) {
      const m = months[i] || {};
      const monthNr = i + 1;

      const bs = Number(m.bankStart);
      const be = Number(m.bankEnd);

      if (Number.isFinite(bs) && bs < limitValue) {
        return { year: y, month: monthNr, balance: bs, limit: limitValue };
      }
      if (Number.isFinite(be) && be < limitValue) {
        return { year: y, month: monthNr, balance: be, limit: limitValue };
      }
    }
  }
  return null;
}

/**
 * HARD BLOCK: test kandidaat-categories (zoals bij aanmaken/opslaan in sheet)
 * en blokkeer wanneer de bankketen onder de limiet zakt.
 */
export function checkLimitWithCandidateCats(prevCats, candidateCats) {
  const settings = loadSettings() || {};

  const raw = settings.negativeLimit;
  // Geen limiet ingesteld => niet blokkeren
  if (raw === null || raw === undefined || raw === "") return null;

  const limitValue = Number(raw);
  // Let op: 0 is een geldige limiet (banksaldo mag dan niet < 0).
  if (!Number.isFinite(limitValue)) return null;

  const absStart = getAbsoluteStartYear(settings);

  const yearsCats = collectYearsFromCats(candidateCats);
  const yearsMonth = collectYearsFromMonthData(loadMonthData());
  const yearsStart = new Set(
    Object.keys(settings.yearStarting || {}).map(Number).filter(Number.isFinite)
  );

  const allYears = new Set([...yearsCats, ...yearsMonth, ...yearsStart]);
  const nowY = new Date().getFullYear();
  allYears.add(nowY);

  const minYearFallback = Math.min(...Array.from(allYears));
  const minYear = Number.isFinite(absStart)
    ? absStart
    : (Number.isFinite(minYearFallback) ? minYearFallback : nowY);

  const maxYear = Math.max(...Array.from(allYears));

  // IMPORTANT: This is a *preview* check. It must never create undo/redo history entries.
  // Do NOT use saveCats(...) here because that records snapshots (reason: "saveCats")
  // and can cause vague undo/redo feedback like "Teruggezet: Categorieën".
  const prevCatsStrRaw = localStorage.getItem("finflow_categories");

  try {
    try {
      localStorage.setItem("finflow_categories", JSON.stringify(candidateCats || []));
    } catch {
      localStorage.setItem("finflow_categories", "[]");
    }
    resetCaches();
    return findLimitViolation({ limitValue, minYear, maxYear });
  } finally {
    if (prevCatsStrRaw === null || prevCatsStrRaw === undefined) {
      localStorage.removeItem("finflow_categories");
    } else {
      localStorage.setItem("finflow_categories", prevCatsStrRaw);
    }
    resetCaches();
  }
}
