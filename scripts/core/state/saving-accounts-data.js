// scripts/core/state/saving-accounts-data.js
import { loadSettings, saveSettings, loadMonthData, saveMonthData } from "../storage/index.js";
import { resetCaches } from "../engine/index.js";
import { precommitFindFirstSavingAccountLimitViolation } from "./saving-accounts-precommit-limit.js";

/**
 * Simplification:
 * - Geen verplichte systeem-spaarrekening meer.
 * - Alle spaarpotten zijn verwijderbaar.
 * - Premium gating (meer dan 1) wordt in de UI afgedwongen.
 *
 * settings.savingAccounts = [
 *   { id, name, startBalance, years: { "2026": 50, "2027": -25 }, rates: { "2026": 2.5 } }
 * ]
 */

function ensureSettingsStruct(settings) {
  const s = (settings && typeof settings === "object") ? settings : {};
  if (!Array.isArray(s.savingAccounts)) s.savingAccounts = [];
  return s;
}

function makeId() {
  const rand = Math.random().toString(36).slice(2, 8);
  return `sa_${Date.now()}_${rand}`;
}

/**
 * Compat export: voorheen werd hier de systeemrekening aangemaakt.
 * Nu: geen mutatie; returnt null als er geen rekeningen bestaan.
 */
export function ensureSystemSavingAccount() {
  const settings = ensureSettingsStruct(loadSettings() || {});
  saveSettings(settings);
  resetCaches?.();
  return settings.savingAccounts[0] || null;
}

export function getSavingAccounts() {
  const settings = ensureSettingsStruct(loadSettings() || {});
  return settings.savingAccounts;
}

export function getSavingAccountById(id) {
  if (!id) return null;
  const settings = ensureSettingsStruct(loadSettings() || {});
  return settings.savingAccounts.find(a => a && String(a.id) === String(id)) || null;
}

export function upsertSavingAccount(account, previousId = null) {
  const settings = ensureSettingsStruct(loadSettings() || {});
  const list = Array.isArray(settings.savingAccounts) ? settings.savingAccounts : [];

  const prev = previousId ? String(previousId) : null;
  const nextId = String(account?.id || "").trim() || makeId();

  const next = {
    id: nextId,
    name: String(account?.name || "").trim(),
    startBalance: Number(account?.startBalance || 0),
    years: (account?.years && typeof account.years === "object") ? { ...account.years } : {},
    rates: (account?.rates && typeof account.rates === "object") ? { ...account.rates } : {},
  };

  let updated = false;

  // Replace by previous id (edit) or by same id
  const out = list.map((a) => {
    if (!a || typeof a !== "object") return a;
    const aId = String(a.id || "");
    if ((prev && aId === prev) || aId === nextId) {
      updated = true;
      return next;
    }
    return a;
  });

  if (!updated) out.push(next);

  settings.savingAccounts = out;
  saveSettings(settings);
  resetCaches?.();
  return next;
}

export function deleteSavingAccount(id) {
  const did = String(id || "").trim();
  if (!did) return;

  // Remove from settings
  const settings = ensureSettingsStruct(loadSettings() || {});
  settings.savingAccounts = settings.savingAccounts.filter((a) => a && String(a.id) !== did);
  saveSettings(settings);

  // Purge monthData references (and legacy saving fields if this was the last account)
  const wipeLegacy = (Array.isArray(settings.savingAccounts) ? settings.savingAccounts.length : 0) === 0;
  const md = loadMonthData() || {};
  let changed = false;

  Object.keys(md).forEach((k) => {
    const entry = md[k];
    if (!entry || typeof entry !== "object") return;

    let entryChanged = false;

    // Remove per-account overrides/rates
    if (entry.savingAccounts && typeof entry.savingAccounts === "object" && Object.prototype.hasOwnProperty.call(entry.savingAccounts, did)) {
      delete entry.savingAccounts[did];
      entryChanged = true;
      if (Object.keys(entry.savingAccounts).length === 0) {
        delete entry.savingAccounts;
      }
    }
    if (entry.savingRates && typeof entry.savingRates === "object" && Object.prototype.hasOwnProperty.call(entry.savingRates, did)) {
      delete entry.savingRates[did];
      entryChanged = true;
      if (Object.keys(entry.savingRates).length === 0) {
        delete entry.savingRates;
      }
    }

    // If no saving accounts remain, remove legacy saving inputs so year overviews return to 0.
    if (wipeLegacy) {
      if (Object.prototype.hasOwnProperty.call(entry, "manualSaving")) {
        delete entry.manualSaving;
        entryChanged = true;
      }
      if (Object.prototype.hasOwnProperty.call(entry, "savings")) {
        delete entry.savings;
        entryChanged = true;
      }
    }

    if (entryChanged) {
      changed = true;

      // Remove empty entries
      if (Object.keys(entry).length === 0) {
        delete md[k];
      }
    }
  });

  if (changed) {
    saveMonthData(md);
  }

  resetCaches?.();
}

/**
 * Premium: zet jaarrente voor een spaarrekening voor een specifiek jaar.
 * Wordt gebruikt door de inline editor in "Spaarpotjes" (scope: hele jaar).
 */
export function setSavingAccountRateForYear(accountId, year, ratePercent) {
  const id = String(accountId || "").trim();
  if (!id) throw new Error("Invalid saving account id");
  const y = String(year);

  const rate = Number(ratePercent);
  if (!Number.isFinite(rate) || rate < 0) throw new Error("Invalid rate");

  const existing = getSavingAccountById(id);
  if (!existing) throw new Error("Saving account not found");

  const next = {
    ...existing,
    id,
    rates: { ...(existing.rates || {}), [y]: rate },
  };

  return upsertSavingAccount(next, id);
}

/**
 * Pre-commit limietcheck.
 * (Ongewijzigd gedrag; gebruikt door sheets.)
 */
export function precommitFindFirstSavingAccountLimitViolationSafe({ year, previewMonthData, premiumActive }) {
  try {
    return precommitFindFirstSavingAccountLimitViolation({ year, previewMonthData, premiumActive });
  } catch (_) {
    return null;
  }
}
