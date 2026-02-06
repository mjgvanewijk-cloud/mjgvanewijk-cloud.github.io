// scripts/core/engine/year-balances.js
import { ensureSettings } from "./settings.js";
import { getUserBankStarting } from "./start.js";
import { getCachedYear } from "./cache.js";
// We importeren simulateYear later om circulaire afhankelijkheid op te lossen bij runtime
import { simulateYear } from "./year-sim.js"; 

/**
 * HELPER: Bepaalt het absolute startjaar op basis van de configuratie.
 */
function getAbsoluteStartYear(settings) {
  const allConfiguredYears = Object.keys(settings.yearStarting || {})
    .map(Number)
    .filter(Number.isFinite);
  return allConfiguredYears.length ? Math.min(...allConfiguredYears) : null;
}

/**
 * Haalt het startsaldo van de bank op.
 */
export function getStartingBankBalance(year, settingsOverride = null) {
  const settings = settingsOverride || ensureSettings();
  const absoluteStartYear = getAbsoluteStartYear(settings);

  // Jaar vóór startjaar: geen chaining (UI toont streepjes, en dit voorkomt diepe recursie)
  if (absoluteStartYear !== null && year < absoluteStartYear) {
    return 0;
  }

  // 1. Gebruik ALLEEN een harde waarde als dit het absolute startjaar is
  if (year === absoluteStartYear) {
    if (settings.yearBankStarting && typeof settings.yearBankStarting[year] === "number") {
      return settings.yearBankStarting[year];
    }
    // Fallback naar oude methode
    const explicit = getUserBankStarting(year);
    if (typeof explicit === "number") return explicit;
  }

  // 2. Chaining: kijken naar eindsaldo vorig jaar
  const prevYear = year - 1;
  if (prevYear >= 1900) {
    // Check cache of forceer een simulatie van het vorige jaar
    const prevSim = getCachedYear(prevYear) || simulateYear(prevYear, false, null, settingsOverride);
    return prevSim.bankEnd || 0;
  }

  return 0;
}

/**
 * Haalt het startsaldo van de spaarrekening op.
 */
export function getStartingSavingBalance(year, settingsOverride = null) {
  const settings = settingsOverride || ensureSettings();
  const absoluteStartYear = getAbsoluteStartYear(settings);

  // Jaar vóór startjaar: geen chaining (UI toont streepjes)
  if (absoluteStartYear !== null && year < absoluteStartYear) {
    return 0;
  }

  // 1. Gebruik ALLEEN een harde waarde als dit het absolute startjaar is
  if (year === absoluteStartYear) {
    // Nieuw model: startsaldi per spaarpot.
    // Ook zonder Premium moeten we het totaal startsaldo kunnen tonen zodra er (minstens één) spaarpot bestaat.
    if (Array.isArray(settings.savingAccounts) && settings.savingAccounts.length > 0) {
      const sum = settings.savingAccounts.reduce((acc, a) => {
        const n = Number(a?.startBalance);
        return acc + (Number.isFinite(n) ? n : 0);
      }, 0);
      if (Number.isFinite(sum)) return sum;
    }

    // Legacy fallback (oude "Beginsaldo spaar"-mapping)
    const map = settings.yearSavingStarting || {};
    const val = map[year];
    const num = Number(val);
    if (val !== undefined && val !== null && Number.isFinite(num)) {
      return num;
    }
  }
  // 2. Chaining
  const prevYear = year - 1;
  if (prevYear >= 1900) {
    const prevSim = getCachedYear(prevYear) || simulateYear(prevYear, false, null, settingsOverride);
    return prevSim.savingEnd || 0;
  }

  return 0;
}