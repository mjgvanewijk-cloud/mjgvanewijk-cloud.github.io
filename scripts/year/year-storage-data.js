// scripts/year/year-storage-data.js
import { loadSettings, saveSettings } from "../core/storage/index.js";
import { resetCaches } from "../core/state/index.js";

/**
 * Zoekt het eerstvolgende jaar na 'newYear' waarvoor een startsaldo is ingesteld.
 */
export function findLaterStartYear(settings, newYear) {
  if (!settings || typeof settings !== "object") return null;

  let candidate = null;
  const consider = (y) => {
    if (Number.isNaN(y)) return;
    if (y <= newYear) return;
    if (candidate === null || y < candidate) candidate = y;
  };

  // Check startmaand en bank beginsaldi
  if (settings.startMonth) Object.keys(settings.startMonth).forEach(y => consider(parseInt(y, 10)));
  if (settings.yearBankStarting) Object.keys(settings.yearBankStarting).forEach(y => consider(parseInt(y, 10)));

  return candidate;
}

/**
 * Reset configuratie van jaren die NA het opgegeven jaar komen.
 * Wordt gebruikt bij conflictoplossing als je een nieuw startjaar kiest vóór een bestaand startjaar.
 */
export function resolveFutureConflicts(year) {
  const settings = loadSettings();
  
  // Zet het huidige jaar als startmaand 1 (actief)
  if (!settings.startMonth) settings.startMonth = {};
  settings.startMonth[year] = 1;

  const clean = (obj) => {
    if (!obj) return;
    for (const yStr of Object.keys(obj)) {
      const yNum = parseInt(yStr, 10);
      if (!Number.isNaN(yNum) && yNum > year) {
        delete obj[yNum];
      }
    }
  };

  clean(settings.startMonth);
  clean(settings.yearBankStarting);
  clean(settings.yearStarting); // Ook sparen opschonen

  saveSettings(settings);
  resetCaches();
}

export function updateSavingsStartBalance(year, value) {
  const settings = loadSettings() || {};

  if (!settings.yearSavingStarting || typeof settings.yearSavingStarting !== "object") {
    settings.yearSavingStarting = {};
  }

  const yKey = String(year);

  if (value === null || value === "" || isNaN(value)) {
    if (Object.prototype.hasOwnProperty.call(settings.yearSavingStarting, yKey)) {
      delete settings.yearSavingStarting[yKey];
    }
  } else {
    settings.yearSavingStarting[yKey] = Number(value);
  }

  // Cleanup lege objecten
  if (settings.yearSavingStarting && Object.keys(settings.yearSavingStarting).length === 0) {
    delete settings.yearSavingStarting;
  }

  saveSettings(settings);
  resetCaches();
}

export function updateBankStartBalance(year, value) {
  const settings = loadSettings();

  if (value === null || value === "" || isNaN(value)) {
    if (settings.yearBankStarting && settings.yearBankStarting[year]) {
      delete settings.yearBankStarting[year];
    }
  } else {
    if (!settings.yearBankStarting) settings.yearBankStarting = {};
    settings.yearBankStarting[year] = value;
  }

  if (settings.yearBankStarting && Object.keys(settings.yearBankStarting).length === 0) {
    delete settings.yearBankStarting;
  }

  saveSettings(settings);
  resetCaches();
}

export function updateMonthlyAndLimit(year, monthlyAmount, monthlyType, limitValue) {
  const settings = loadSettings();
  let hasChanged = false;

  // 1. Maandelijks Sparen Update
  if (!settings.yearMonthlySaving) settings.yearMonthlySaving = {};
  
  if (monthlyAmount === null || monthlyAmount <= 0 || isNaN(monthlyAmount)) {
    if (settings.yearMonthlySaving[year]) {
      delete settings.yearMonthlySaving[year];
      hasChanged = true;
    }
  } else {
    const current = settings.yearMonthlySaving[year] || {};
    if (current.amount !== monthlyAmount || current.type !== monthlyType) {
      settings.yearMonthlySaving[year] = {
        amount: monthlyAmount,
        type: monthlyType || "deposit",
      };
      hasChanged = true;
    }
  }

  if (settings.yearMonthlySaving && Object.keys(settings.yearMonthlySaving).length === 0) {
    delete settings.yearMonthlySaving;
  }

  // 2. Limiet Update
  const oldLimit = typeof settings.negativeLimit === "number" ? settings.negativeLimit : 0;
  const newLimit = (!isNaN(limitValue) && limitValue !== null) ? Math.abs(limitValue) : 0;

  if (oldLimit !== newLimit) {
    settings.negativeLimit = newLimit;
    hasChanged = true;
  }

  if (hasChanged) {
    saveSettings(settings);
    resetCaches();
  }

  return hasChanged;
}