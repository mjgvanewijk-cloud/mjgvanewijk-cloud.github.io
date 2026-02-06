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