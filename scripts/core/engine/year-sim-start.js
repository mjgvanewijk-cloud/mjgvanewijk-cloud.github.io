// scripts/core/engine/year-sim-start.js

import { getStartingBankBalance, getStartingSavingBalance } from "./year-balances.js";
import { round2 } from "./year-sim-utils.js";

function getAbsoluteStartYearFromSettings(year, settings) {
  const ys = settings?.yearStarting;
  if (!ys || typeof ys !== "object") return year;

  // yearStarting is een marker-map; we kijken naar de KEYS (waarden kunnen 0/1/true zijn)
  const years = Object.keys(ys)
    .map((k) => parseInt(k, 10))
    .filter((n) => Number.isFinite(n));

  return years.length ? Math.min(...years) : year;
}

function getLegacySavingStartMap(settings) {
  return (settings?.yearSavingStarting && typeof settings.yearSavingStarting === "object")
    ? settings.yearSavingStarting
    : {};
}

export function buildYearStartState({
  year,
  settings,
  settingsOverride,
  monthDataOverride,
  premiumActive,
  simulatePrevYear,
}) {
const absStartYear = getAbsoluteStartYearFromSettings(year, settings);

// BANK start:
// Bij simulaties met monthDataOverride (zoals preview/validatie) MOET chaining dezelfde override gebruiken.
// Daarom gebruiken we simulatePrevYear voor bank zodra we voorbij het absolute startjaar zijn.
let bankStartVal = 0;
if (year <= absStartYear) {
  bankStartVal = getStartingBankBalance(year, settingsOverride);
} else {
  const prev = simulatePrevYear(year - 1, true, monthDataOverride, settingsOverride);
  const prevEnd = Number(prev?.bankEnd);
  bankStartVal = Number.isFinite(prevEnd) ? prevEnd : 0;
}


  let savingStartVal = 0;
  let savingAccountsStart = null;
  let accountBalances = null;

  if (Array.isArray(settings?.savingAccounts) && settings.savingAccounts.length > 0) {
    const accounts = Array.isArray(settings?.savingAccounts) ? settings.savingAccounts : [];
    const absStartYearForSavings = absStartYear;
    const legacyStartMap = getLegacySavingStartMap(settings);

    accountBalances = {};

    // BELANGRIJK:
    // Voor jaren vóór het absolute startjaar (bv. 2025 < 2026) mogen we NIET terug-recurseren.
    // We initialiseren dan gewoon alsof het startjaar is (UI toont toch streepjes).
    if (year <= absStartYearForSavings) {
      for (const acc of accounts) {
        const id = String(acc?.id || "");
        if (!id) continue;

        // Legacy compat:
        // In non-premium werd het beginsaldo van de (enige) spaarrekening opgeslagen in
        // settings.yearSavingStarting[startYear]. Bij het activeren van Premium mogen we
        // dit niet kwijtraken; we gebruiken dit als startBalance voor de systeemrekening,
        // tenzij er al expliciet een startBalance op de rekening staat.
        const legacyStartRaw = legacyStartMap[String(year)];
        const legacyStart = Number(legacyStartRaw);

        const explicitStart = Number(acc?.startBalance);
        const useLegacyStart = id === "__system__" && Number.isFinite(legacyStart) && (!Number.isFinite(explicitStart) || explicitStart === 0);

        accountBalances[id] = round2(useLegacyStart ? legacyStart : (Number.isFinite(explicitStart) ? explicitStart : 0));
      }
    } else {
      const prev = simulatePrevYear(year - 1, true, monthDataOverride, settingsOverride);
      const prevEnd = prev?.savingAccountsEnd;

      for (const acc of accounts) {
        const id = String(acc?.id || "");
        if (!id) continue;

        if (prevEnd && Object.prototype.hasOwnProperty.call(prevEnd, id)) {
          accountBalances[id] = round2(prevEnd[id] || 0);
        } else {
          const legacyStartRaw = legacyStartMap[String(absStartYearForSavings)];
          const legacyStart = Number(legacyStartRaw);

          const explicitStart = Number(acc?.startBalance);
          const useLegacyStart = id === "__system__" && Number.isFinite(legacyStart) && (!Number.isFinite(explicitStart) || explicitStart === 0);

          accountBalances[id] = round2(useLegacyStart ? legacyStart : (Number.isFinite(explicitStart) ? explicitStart : 0));
        }
      }
    }

    savingAccountsStart = { ...accountBalances };
    savingStartVal = round2(Object.values(accountBalances).reduce((a, b) => a + (Number(b) || 0), 0));
  } else {
    savingStartVal = getStartingSavingBalance(year, settingsOverride);
  }

  return {
    bankStartVal,
    savingStartVal,
    savingAccountsStart,
    accountBalances,
  };
}
