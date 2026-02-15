// scripts/year/year-chain.js
import { loadSettings } from "../core/storage/index.js";
import { simulateYear, resetCachesFromYear } from "../core/engine/index.js";
import { resetAdapterCache } from "../core/adapter.js";

/**
 * Berekent de spaarketen (carry-over) opnieuw voor een reeks jaren.
 */
export function updateSavingChain(startYear, endYear = null) {
  try {
    loadSettings(); // Ensure storage is initialized

    const currentYearToCalc = parseInt(startYear, 10);
    const finalYear = endYear || (currentYearToCalc + 3);

    // IMPORTANT:
    // We rebuild the chain by simulating years into the in-memory cache.
    // We do NOT persist computed "carry-over" starting balances into settings.
    resetCachesFromYear(currentYearToCalc);

    for (let y = currentYearToCalc; y <= finalYear; y++) {
      const sim = simulateYear(y, false);
      if (!sim) break;
    }

    if (typeof resetAdapterCache === "function") resetAdapterCache();
  } catch (err) {
    console.error("Error updating saving chain:", err);
  }
}

/**
 * Bepaalt wat het vroegst geconfigureerde jaar is in de settings.
 */
export function getConfiguredStartYear(settings) {
  if (!settings || typeof settings !== "object") return null;
  let minYear = null;

  const consider = (y) => {
    const yearNum = parseInt(y, 10);
    if (!Number.isFinite(yearNum)) return;
    if (minYear === null || yearNum < minYear) minYear = yearNum;
  };

  if (settings.yearStarting) Object.keys(settings.yearStarting).forEach(consider);
  if (settings.yearBankStarting) Object.keys(settings.yearBankStarting).forEach(consider);

  return minYear;
}
