// scripts/year/year-activation-logic.js
import { saveSettings, loadMonthData, saveMonthData } from "../core/storage/index.js";
import { resetCaches } from "../core/engine/index.js";
import { updateSavingChain, getConfiguredStartYear } from "./year-chain.js";

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj || {}));
}

/**
 * Past het nieuwe startjaar toe + start (indien nodig) de wizard (Beginsaldo bank -> Roodstaanlimiet).
 * Deze functie bevat de volledige "onConfirm" logica, zodat zowel Premium als Trial-flows identiek zijn.
 */
export function applyNewStartYear(year, settings, refreshCallback) {
  // Resolve start year BEFORE changing it (for cleanup rules)
  const currentStartYear = getConfiguredStartYear(settings);

  // 1. Maak backup
  const originalSettings = deepClone(settings);

  // Alleen wanneer het nieuwe startjaar EERDER ligt dan het huidige startjaar:
  // - spaarpotjeslijst (namen/metadata) blijft bestaan
  // - jaargebonden potdata (beginsaldi/rentes/flows) wordt vanaf het nieuwe startjaar leeggemaakt
  const isEarlierStartYear = Number.isFinite(currentStartYear) && year < currentStartYear;

  const cleanup = (obj) => {
    if (obj && typeof obj === "object") {
      Object.keys(obj).forEach((y) => { if (parseInt(y, 10) !== year) delete obj[y]; });
    }
  };

  cleanup(settings.yearBankStarting);
  cleanup(settings.yearSavingStarting);
  cleanup(settings.yearMonthlySaving);

  if (isEarlierStartYear) {
    // 2a) Reset jaar-gebonden pot-instellingen in settings (zonder lijst/metadata te slopen)
    if (Array.isArray(settings.savingAccounts)) {
      settings.savingAccounts = settings.savingAccounts.map((acc) => {
        const next = { ...(acc || {}) };
        next.startBalance = 0;

        if (next.rates && typeof next.rates === "object") {
          Object.keys(next.rates).forEach((y) => {
            const yi = parseInt(y, 10);
            if (Number.isFinite(yi) && yi >= year) delete next.rates[y];
          });
        }
        if (next.years && typeof next.years === "object") {
          Object.keys(next.years).forEach((y) => {
            const yi = parseInt(y, 10);
            if (Number.isFinite(yi) && yi >= year) delete next.years[y];
          });
        }

        return next;
      });
    }

    // 2b) Reset maanddata vanaf nieuw startjaar (flows/rente overrides/scopes)
    try {
      const monthData = loadMonthData() || {};
      if (monthData && typeof monthData === "object") {
        Object.keys(monthData).forEach((key) => {
          const entry = monthData[key];
          const y = parseInt(String(key).slice(0, 4), 10);
          if (!Number.isFinite(y) || y < year) return;

          if (entry && typeof entry === "object") {
            delete entry.manualSaving;
            delete entry.savingAccounts;
            delete entry.savingRates;
            delete entry.savingFlowScopes;
            delete entry.savingRateScopes;
          }

          if (!entry || typeof entry !== "object" || Object.keys(entry).length === 0) {
            delete monthData[key];
          }
        });
      }
      saveMonthData(monthData);
    } catch (_) {
      // no-op
    }
  }

  if (!settings.yearStarting) settings.yearStarting = {};
  settings.yearStarting[year] = 1;

  saveSettings(settings);
  resetCaches();

  const restoreToPrevious = () => {
    saveSettings(originalSettings);
    resetCaches();
    if (refreshCallback) refreshCallback();
  };

  const hasExplicit = settings.yearBankStarting && settings.yearBankStarting[year] !== undefined;

  // 3. Open Wizard indien nodig (Beginsaldo bank -> Roodstaanlimiet)
  if (!hasExplicit) {
    import("../wizard/steps.js").then((m) => {
      m.openYearSettingsWizard(
        year,
        (success) => {
          if (success) {
            updateSavingChain(year);
            if (refreshCallback) refreshCallback();
          } else {
            restoreToPrevious();
          }
        },
        { onCancel: restoreToPrevious, cancelMode: "close" }
      );
    });
  } else {
    updateSavingChain(year);
    if (refreshCallback) refreshCallback();
  }
}