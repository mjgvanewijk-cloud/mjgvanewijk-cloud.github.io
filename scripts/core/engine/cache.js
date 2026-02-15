// scripts/core/engine/cache.js
// ---------------------------------------------------------
// Cachebeheer voor jaar-simulaties + resetCaches.
// Doel: alle caching op één plek, zodat simulateYear schoon blijft.
// [i18n geadapteerd 2025-12-22]
// ---------------------------------------------------------

import { loadSettings, saveSettings } from "../storage.js";

/** @type {Record<number, any>} */
let yearCache = {};

/**
 * Haal een gecachte jaar-simulatie op (of null).
 * @param {number} year
 */
export function getCachedYear(year) {
  return yearCache[year] || null;
}

/**
 * Sla een jaar-simulatie op in cache.
 * @param {number} year
 * @param {any} sim
 */
export function setCachedYear(year, sim) {
  yearCache[year] = sim;
}

/**
 * Wis de volledige jaarcache.
 */
export function clearYearCache() {
  yearCache = {};
}

/**
 * Wis alle cache-items vanaf een startjaar (inclusief).
 * Wordt gebruikt bij chaining naar vorige jaren om “hardnekkige” cache te breken.
 * @param {number} startYear
 */
export function invalidateFutureCaches(startYear) {
  for (const y of Object.keys(yearCache)) {
    const yNum = Number(y);
    if (yNum >= startYear) {
      delete yearCache[yNum];
    }
  }
}

/**
 * Reset caches en valideer (defensief) settings.startMonth.
 *
 * Belangrijk voor Undo/Redo:
 * - resetCaches() mag géén persist-write doen die niet expliciet door de gebruiker
 *   is veroorzaakt. Anders wordt de redo-stack onterecht gewist.
 *
 * Daarom:
 * - We valideren uitsluitend bestaande startMonth entries.
 * - We creëren géén lege startMonth-map als deze ontbreekt.
 * - We schrijven alleen terug als we daadwerkelijk ongeldige entries verwijderen.
 */
export function resetCaches() {
  const settings = loadSettings() || {};

  let changed = false;
  if (settings.startMonth && typeof settings.startMonth === "object") {
    for (const yStr of Object.keys(settings.startMonth)) {
      const sm = settings.startMonth[yStr];
      if (typeof sm !== "number" || sm < 1 || sm > 12) {
        delete settings.startMonth[yStr];
        changed = true;
      }
    }
  }

  if (changed) {
    saveSettings(settings);
  }
  yearCache = {};
}

/**
 * Reset caches vanaf een startjaar (inclusief) en valideer (defensief) settings.startMonth.
 *
 * Performance:
 * - behoudt cache voor jaren < startYear
 * - wist alleen jaren >= startYear
 *
 * Undo/Redo:
 * - doet géén persist-write tenzij er daadwerkelijk ongeldige startMonth entries verwijderd worden.
 *
 * @param {number} startYear
 */
export function resetCachesFromYear(startYear) {
  const settings = loadSettings() || {};

  let changed = false;
  if (settings.startMonth && typeof settings.startMonth === "object") {
    for (const yStr of Object.keys(settings.startMonth)) {
      const sm = settings.startMonth[yStr];
      if (typeof sm !== "number" || sm < 1 || sm > 12) {
        delete settings.startMonth[yStr];
        changed = true;
      }
    }
  }

  if (changed) {
    saveSettings(settings);
  }

  const y0 = Number(startYear);
  if (Number.isFinite(y0)) invalidateFutureCaches(y0);
  else yearCache = {};
}

// ===== Override (preview) cache =====
// We use a WeakMap keyed by the settingsOverride object (or monthDataOverride) to avoid O(N^2)
// recursive re-simulation during precommit/preview loops.
const _ffOverrideCaches = new WeakMap();

/**
 * @param {object} keyObj settingsOverride/monthDataOverride object used for preview.
 * @param {number} year
 */
export function getCachedYearOverride(keyObj, year) {
  try {
    if (!keyObj || typeof keyObj !== "object") return null;
    const m = _ffOverrideCaches.get(keyObj);
    if (!m) return null;
    return m.get(Number(year)) || null;
  } catch (_) {
    return null;
  }
}

/**
 * @param {object} keyObj settingsOverride/monthDataOverride object used for preview.
 * @param {number} year
 * @param {any} value
 */
export function setCachedYearOverride(keyObj, year, value) {
  try {
    if (!keyObj || typeof keyObj !== "object") return;
    let m = _ffOverrideCaches.get(keyObj);
    if (!m) {
      m = new Map();
      _ffOverrideCaches.set(keyObj, m);
    }
    m.set(Number(year), value);
  } catch (_) {}
}

/**
 * Optional: clear preview cache for a given override key.
 * (Usually not needed because previewSettings is a fresh clone.)
 */
export function clearCachedYearOverride(keyObj) {
  try {
    if (!keyObj || typeof keyObj !== "object") return;
    _ffOverrideCaches.delete(keyObj);
  } catch (_) {}
}
