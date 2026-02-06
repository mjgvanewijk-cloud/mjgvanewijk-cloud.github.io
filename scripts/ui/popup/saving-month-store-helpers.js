// scripts/ui/popup/saving-month/saving-month-store-helpers.js
import { getSavingAccountById } from "../../core/state/saving-accounts-data.js";

export function ensureMonthEntry(data, key) {
  if (!data[key] || typeof data[key] !== "object") data[key] = {};
  return data[key];
}

export function cleanupEmptyEntry(data, key) {
  const e = data[key];
  if (!e || typeof e !== "object") return;
  const keys = Object.keys(e);
  if (keys.length === 0) delete data[key];
}

export function setSystemSavingValue(entry, signedValue) {
  // LEEG/0 moet als echte 0 worden behandeld (dus niet als "unset").
  const v = Number(signedValue);
  if (!Number.isFinite(v)) {
    delete entry.manualSaving;
    return;
  }
  entry.manualSaving = v;
}

export function setAccountSavingValue(entry, accountId, signedValue) {
  const id = String(accountId || "").trim();
  if (!id) return;
  if (!entry.savingAccounts || typeof entry.savingAccounts !== "object") {
    entry.savingAccounts = {};
  }
  // LEEG/0 moet als echte 0 worden behandeld (dus niet als "unset").
  const v = Number(signedValue);
  if (!Number.isFinite(v)) {
    delete entry.savingAccounts[id];
  } else {
    entry.savingAccounts[id] = v;
  }
  if (entry.savingAccounts && Object.keys(entry.savingAccounts).length === 0) {
    delete entry.savingAccounts;
  }
}

export function setAccountRateValue(entry, accountId, ratePercent) {
  const id = String(accountId || "").trim();
  if (!id) return;
  if (!entry.savingRates || typeof entry.savingRates !== "object") {
    entry.savingRates = {};
  }
  const v = Number(ratePercent);
  if (!Number.isFinite(v) || v < 0) return;
  entry.savingRates[id] = v;
  if (entry.savingRates && Object.keys(entry.savingRates).length === 0) {
    delete entry.savingRates;
  }
}

export function setAccountRateScope(entry, accountId, uiScope) {
  const id = String(accountId || "").trim();
  if (!id) return;
  const v = String(uiScope || "");
  if (v !== "only" && v !== "from" && v !== "year") return;
  if (!entry.savingRateScopes || typeof entry.savingRateScopes !== "object") {
    entry.savingRateScopes = {};
  }
  entry.savingRateScopes[id] = v;
  if (entry.savingRateScopes && Object.keys(entry.savingRateScopes).length === 0) {
    delete entry.savingRateScopes;
  }
}

export function setAccountFlowScope(entry, accountId, uiScope) {
  const id = String(accountId || "").trim();
  if (!id) return;
  const v = String(uiScope || "");
  if (v !== "only" && v !== "from" && v !== "year") return;
  if (!entry.savingFlowScopes || typeof entry.savingFlowScopes !== "object") {
    entry.savingFlowScopes = {};
  }
  entry.savingFlowScopes[id] = v;
  if (entry.savingFlowScopes && Object.keys(entry.savingFlowScopes).length === 0) {
    delete entry.savingFlowScopes;
  }
}

export function deleteAccountFlowScope(entry, accountId) {
  const id = String(accountId || "").trim();
  if (!id) return;
  if (!entry.savingFlowScopes || typeof entry.savingFlowScopes !== "object") return;
  delete entry.savingFlowScopes[id];
  if (Object.keys(entry.savingFlowScopes).length === 0) delete entry.savingFlowScopes;
}

export function deleteAccountRateScope(entry, accountId) {
  const id = String(accountId || "").trim();
  if (!id) return;
  if (!entry.savingRateScopes || typeof entry.savingRateScopes !== "object") return;
  delete entry.savingRateScopes[id];
  if (Object.keys(entry.savingRateScopes).length === 0) delete entry.savingRateScopes;
}

export function deleteAccountRateOverride(entry, accountId) {
  const id = String(accountId || "").trim();
  if (!id) return;
  if (!entry.savingRates || typeof entry.savingRates !== "object") return;
  delete entry.savingRates[id];
  if (Object.keys(entry.savingRates).length === 0) delete entry.savingRates;
}

export function hasYearDefaultFlow(year, accountId) {
  const acc = getSavingAccountById(accountId);
  const years = acc && acc.years && typeof acc.years === "object" ? acc.years : null;
  if (!years) return false;
  const yKey = String(year);
  return Object.prototype.hasOwnProperty.call(years, yKey);
}