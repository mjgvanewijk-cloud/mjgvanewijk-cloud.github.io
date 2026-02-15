// scripts/core/state/saving-accounts-precommit-limit.js
import { loadSettings, loadMonthData, loadCats } from "../storage/index.js";
import { resetCachesFromYear, simulateYear } from "../engine/index.js";
import { 
  getLimitValue, 
  getAbsoluteStartYear, 
  collectYearsFromMonthData, 
  collectYearsFromCats 
} from "./saving-accounts-precommit-helpers.js";
import { removeFromSavingAccounts } from "./saving-accounts-precommit-data.js";
import { 
  precommitFindFirstSavingAccountLimitViolation, 
  precommitFindFirstSavingAccountNegativeBalance,
  precommitFindFirstSavingAccountBankNegative,
} from "./saving-accounts-precommit-core.js";

// Her-export de bestaande functies voor compatibiliteit
export { precommitFindFirstSavingAccountLimitViolation, precommitFindFirstSavingAccountNegativeBalance, precommitFindFirstSavingAccountBankNegative };

/**
 * Banklimiet-check voor het verwijderen van een spaarpot.
 */
export function precommitFindFirstSavingAccountLimitViolationAfterDelete({ deleteId } = {}) {
  const did = String(deleteId || "").trim();
  if (!did) return null;

  const settings = loadSettings() || {};
  const limit = getLimitValue(settings);
  if (limit === null) return null;

  const monthData = loadMonthData() || {};
  const cats = loadCats();

  const previewSettings = (typeof structuredClone === "function")
    ? structuredClone(settings)
    : JSON.parse(JSON.stringify(settings));

  previewSettings.savingAccounts = removeFromSavingAccounts(previewSettings.savingAccounts, did);

  const years = new Set();
  const absStart = getAbsoluteStartYear(previewSettings);
  if (Number.isFinite(absStart)) years.add(absStart);
  years.add(new Date().getFullYear());
  collectYearsFromMonthData(monthData).forEach((y) => years.add(y));
  collectYearsFromCats(cats).forEach((y) => years.add(y));

  const arr = Array.from(years.values()).filter(Number.isFinite).sort((a, b) => a - b);
  if (!arr.length) return null;

  const yearFrom = Number.isFinite(absStart) ? absStart : arr[0];
  const yearTo = arr[arr.length - 1];

  resetCachesFromYear(yearFrom);

  for (let y = yearFrom; y <= yearTo; y++) {
    const sim = simulateYear(y, true, monthData, previewSettings);
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
}

/**
 * Detecteer negatief saldo na delete.
 */
export function precommitFindFirstSavingAccountNegativeBalanceAfterDelete({ deleteId } = {}) {
  const did = String(deleteId || "").trim();
  if (!did) return null;

  const settings = loadSettings() || {};
  const monthData = loadMonthData() || {};

  const previewSettings = (typeof structuredClone === "function")
    ? structuredClone(settings)
    : JSON.parse(JSON.stringify(settings));

  previewSettings.savingAccounts = removeFromSavingAccounts(previewSettings.savingAccounts, did);

  const years = new Set();
  const absStart = getAbsoluteStartYear(previewSettings);
  if (Number.isFinite(absStart)) years.add(absStart);
  years.add(new Date().getFullYear());
  collectYearsFromMonthData(monthData).forEach((y) => years.add(y));

  const arr = Array.from(years.values()).filter(Number.isFinite).sort((a, b) => a - b);
  if (!arr.length) return null;

  const yearFrom = Number.isFinite(absStart) ? absStart : arr[0];
  const yearTo = arr[arr.length - 1];

  resetCachesFromYear(yearFrom);

  for (let y = yearFrom; y <= yearTo; y++) {
    const sim = simulateYear(y, true, monthData, previewSettings);
    const months = Array.isArray(sim?.months) ? sim.months : [];

    for (const m of months) {
      const monthNr = Number(m?.month || 1);
      const sa = m?.savingAccounts;
      if (!sa || typeof sa !== "object") continue;

      for (const v of Object.values(sa)) {
        const end = Number(v?.balanceEnd);
        if (Number.isFinite(end) && end < 0) {
          return { year: y, month: monthNr, saving: end };
        }
      }
    }
  }
  return null;
}