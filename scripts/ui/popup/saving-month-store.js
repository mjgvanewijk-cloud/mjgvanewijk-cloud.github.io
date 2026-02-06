// scripts/ui/popup/saving-month/saving-month-store.js
import { loadMonthData, saveMonthData } from "../../core/storage/index.js";
import { getScopeRange, monthKey } from "../../year/year-edit-data.js";
import * as Helpers from "./saving-month-store-helpers.js";

export * from "./saving-month-store-getters.js";

export function setSavingAccountFlowScopeForScope(year, month, scope, accountId, uiScope) {
  const id = String(accountId || "").trim();
  if (!id) return;
  const v = String(uiScope || "");
  if (v !== "only" && v !== "from" && v !== "year") return;
  const data = loadMonthData() || {};
  const { start, end } = getScopeRange(month, scope);
  for (let m = start; m <= end; m++) {
    const key = monthKey(year, m);
    const entry = Helpers.ensureMonthEntry(data, key);
    Helpers.setAccountFlowScope(entry, id, v);
    Helpers.cleanupEmptyEntry(data, key);
  }
  saveMonthData(data);
}

export function setSavingAccountRateScopeForScope(year, month, scope, accountId, uiScope) {
  const id = String(accountId || "").trim();
  if (!id) return;
  const v = String(uiScope || "");
  if (v !== "only" && v !== "from" && v !== "year") return;
  const data = loadMonthData() || {};
  const { start, end } = getScopeRange(month, scope);
  for (let m = start; m <= end; m++) {
    const key = monthKey(year, m);
    const entry = Helpers.ensureMonthEntry(data, key);
    Helpers.setAccountRateScope(entry, id, v);
    Helpers.cleanupEmptyEntry(data, key);
  }
  saveMonthData(data);
}

export function clearSavingAccountRateOverridesForYear(year, accountId) {
  const id = String(accountId || "").trim();
  if (!id) return;
  const data = loadMonthData() || {};
  for (let m = 1; m <= 12; m++) {
    const key = monthKey(year, m);
    const entry = data[key];
    if (!entry || typeof entry !== "object") continue;
    Helpers.deleteAccountRateOverride(entry, id);
    Helpers.deleteAccountRateScope(entry, id);
    Helpers.cleanupEmptyEntry(data, key);
  }
  saveMonthData(data);
}

export function setSystemSavingFlowForScope(year, month, scope, signedFlow) {
  const data = loadMonthData() || {};
  const { start, end } = getScopeRange(month, scope);
  for (let m = start; m <= end; m++) {
    const key = monthKey(year, m);
    const entry = Helpers.ensureMonthEntry(data, key);
    Helpers.setSystemSavingValue(entry, signedFlow);
    Helpers.cleanupEmptyEntry(data, key);
  }
  saveMonthData(data);
}

export function setSavingAccountFlowForScope(year, month, scope, accountId, signedFlow) {
  const id = String(accountId || "").trim();
  if (!id) return;
  const data = loadMonthData() || {};
  const { start, end } = getScopeRange(month, scope);
  for (let m = start; m <= end; m++) {
    const key = monthKey(year, m);
    const entry = Helpers.ensureMonthEntry(data, key);
    Helpers.setAccountSavingValue(entry, id, signedFlow);
    Helpers.cleanupEmptyEntry(data, key);
  }
  saveMonthData(data);
}

export function setSavingAccountRateForScope(year, month, scope, accountId, ratePercent) {
  const id = String(accountId || "").trim();
  if (!id) return;
  const data = loadMonthData() || {};
  const { start, end } = getScopeRange(month, scope);
  for (let m = start; m <= end; m++) {
    const key = monthKey(year, m);
    const entry = Helpers.ensureMonthEntry(data, key);
    Helpers.setAccountRateValue(entry, id, ratePercent);
    Helpers.cleanupEmptyEntry(data, key);
  }
  saveMonthData(data);
}