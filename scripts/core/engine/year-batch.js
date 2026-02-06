// scripts/core/engine/year-batch.js
import { simulateYear } from "./year-sim.js";
import { setCachedYear, invalidateFutureCaches } from "./cache.js";

export function computeYearEndState(year) {
  if (year < 1900) return { bankEnd: 0, savingEnd: 0 };
  const sim = simulateYear(year);
  return { bankEnd: sim.bankEnd, savingEnd: sim.savingEnd };
}

/**
 * Herbouwt de ketting startYear → ... → endYear
 * Handig na het wijzigen van een startsaldo in het verleden.
 */
export function rebuildYearsFrom(startYear, endYear) {
  const startY = Number(startYear);
  const endY = Number(endYear);

  if (!Number.isFinite(startY) || !Number.isFinite(endY)) return;

  invalidateFutureCaches(startY);

  for (let y = startY; y <= endY; y++) {
    // Forceer herberekening (true als 2e argument)
    const sim = simulateYear(y, true, null, null);
    setCachedYear(y, sim);
  }
}