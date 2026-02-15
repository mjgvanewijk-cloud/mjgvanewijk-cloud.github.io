// scripts/core/state/saving-accounts-precommit-core.js
import { loadSettings, loadMonthData, loadCats } from "../storage/index.js";
import { resetCachesFromYear, simulateYear } from "../engine/index.js";
import { 
  getLimitValue, 
  getAbsoluteStartYear, 
  collectYearsFromMonthData, 
  collectYearsFromCats, 
  collectYearsFromSavingAccount 
} from "./saving-accounts-precommit-helpers.js";
import { upsertIntoSavingAccounts, removeFromSavingAccounts } from "./saving-accounts-precommit-data.js";

/**
 * @returns null | { year:number, month:number, bank:number, limit:number }
 */
export function precommitFindFirstSavingAccountLimitViolation({ updatedAccount, replaceId = null, monthDataOverride = null } = {}) {
  const settings = loadSettings() || {};
  const limit = getLimitValue(settings);
  if (limit === null) return null;

  const monthData = (monthDataOverride && typeof monthDataOverride === "object") ? monthDataOverride : (loadMonthData() || {});
  const cats = loadCats();

  const previewSettings = (typeof structuredClone === "function")
    ? structuredClone(settings)
    : JSON.parse(JSON.stringify(settings));

  previewSettings.savingAccounts = upsertIntoSavingAccounts(
    previewSettings.savingAccounts,
    updatedAccount,
    replaceId
  );

  const years = new Set();
  const absStart = getAbsoluteStartYear(previewSettings);
  if (Number.isFinite(absStart)) years.add(absStart);
  years.add(new Date().getFullYear());

  collectYearsFromMonthData(monthData).forEach((y) => years.add(y));
  collectYearsFromCats(cats).forEach((y) => years.add(y));
  collectYearsFromSavingAccount(updatedAccount).forEach((y) => years.add(y));

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
 * Detecteer de eerste maand waarin een specifieke spaarpot onder 0 komt.
 */
export function precommitFindFirstSavingAccountNegativeBalance({ updatedAccount, replaceId = null, monthDataOverride = null } = {}) {
  const settings = loadSettings() || {};
  const monthData = (monthDataOverride && typeof monthDataOverride === "object") ? monthDataOverride : (loadMonthData() || {});

  const previewSettings = (typeof structuredClone === "function")
    ? structuredClone(settings)
    : JSON.parse(JSON.stringify(settings));

  // New accounts (id=null) must still be validated. During preview we assign a stable
  // temporary id so the simulator produces a per-account balance we can inspect.
  const rid = replaceId ? String(replaceId) : "";
  const hasExplicitId = String(updatedAccount?.id || "").trim();
  const tmpId = (!rid && !hasExplicitId)
    ? `tmp_pre_${Date.now()}_${Math.random().toString(16).slice(2)}`
    : null;
  const ua = tmpId ? { ...updatedAccount, id: tmpId } : updatedAccount;

  previewSettings.savingAccounts = upsertIntoSavingAccounts(
    previewSettings.savingAccounts,
    ua,
    replaceId
  );

  const years = new Set();
  const absStart = getAbsoluteStartYear(previewSettings);
  if (Number.isFinite(absStart)) years.add(absStart);
  years.add(new Date().getFullYear());
  collectYearsFromMonthData(monthData).forEach((y) => years.add(y));
  collectYearsFromSavingAccount(updatedAccount).forEach((y) => years.add(y));

  const arr = Array.from(years.values()).filter(Number.isFinite).sort((a, b) => a - b);
  if (!arr.length) return null;

  const yearFrom = Number.isFinite(absStart) ? absStart : arr[0];
  const yearTo = arr[arr.length - 1];
  const targetId = String(ua?.id || replaceId || "").trim();
  if (!targetId) return null;

  resetCachesFromYear(yearFrom);

  for (let y = yearFrom; y <= yearTo; y++) {
    const sim = simulateYear(y, true, monthData, previewSettings);
    const months = Array.isArray(sim?.months) ? sim.months : [];

    for (const m of months) {
      const monthNr = Number(m?.month || 1);
      const sa = m?.savingAccounts;
      if (!sa || typeof sa !== "object") continue;

      const found = sa[targetId] || Object.values(sa).find((x) => String(x?.id || "") === targetId);
      const end = Number(found?.balanceEnd);
      if (Number.isFinite(end) && end < 0) {
        return { year: y, month: monthNr, saving: end };
      }
    }
  }
  return null;
}

/**
 * Detecteer de eerste maand waarin het banksaldo (start of eind) onder 0 komt.
 * Wordt gebruikt voor de spaarpot-config sheet (maandbedrag per jaar).
 *
 * @returns null | { year:number, month:number, bank:number }
 */
export function precommitFindFirstSavingAccountBankNegative({ updatedAccount, replaceId = null, monthDataOverride = null } = {}) {
  const settings = loadSettings() || {};
  const monthData = (monthDataOverride && typeof monthDataOverride === "object") ? monthDataOverride : (loadMonthData() || {});
  const cats = loadCats();

  const previewSettings = (typeof structuredClone === "function")
    ? structuredClone(settings)
    : JSON.parse(JSON.stringify(settings));

  previewSettings.savingAccounts = upsertIntoSavingAccounts(
    previewSettings.savingAccounts,
    updatedAccount,
    replaceId
  );

  const years = new Set();
  const absStart = getAbsoluteStartYear(previewSettings);
  if (Number.isFinite(absStart)) years.add(absStart);
  years.add(new Date().getFullYear());

  collectYearsFromMonthData(monthData).forEach((y) => years.add(y));
  collectYearsFromCats(cats).forEach((y) => years.add(y));
  collectYearsFromSavingAccount(updatedAccount).forEach((y) => years.add(y));

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

      if (Number.isFinite(bankStart) && bankStart < -0.00001) {
        return { year: y, month: monthNr, bank: bankStart };
      }
      if (Number.isFinite(bankEnd) && bankEnd < -0.00001) {
        return { year: y, month: monthNr, bank: bankEnd };
      }
    }
  }

  return null;
}