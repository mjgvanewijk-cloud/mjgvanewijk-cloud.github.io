// scripts/ui/popup/saving-month/saving-month-store-getters.js
import { loadMonthData } from "../../core/storage/index.js";
import { monthKey } from "../../year/year-edit-data.js";
import { getSavingAccountById } from "../../core/state/saving-accounts-data.js";
import { hasYearDefaultFlow } from "./saving-month-store-helpers.js";

export function getSavingAccountRateOverrideForMonth(year, month, accountId) {
  const id = String(accountId || "").trim();
  if (!id) return { value: 0, hasOverride: false };
  const data = loadMonthData() || {};
  const key = monthKey(year, month);
  const entry = data[key];
  if (!entry || typeof entry !== "object") return { value: 0, hasOverride: false };
  const rates = entry.savingRates;
  if (!rates || typeof rates !== "object") return { value: 0, hasOverride: false };
  if (!Object.prototype.hasOwnProperty.call(rates, id)) return { value: 0, hasOverride: false };
  const v = Number(rates[id]);
  return { value: Number.isFinite(v) ? v : 0, hasOverride: true };
}

export function getSavingAccountRateScopeForMonth(year, month, accountId) {
  const id = String(accountId || "").trim();
  if (!id) return null;
  const data = loadMonthData() || {};
  const key = monthKey(year, month);
  const entry = data[key];
  if (!entry || typeof entry !== "object") return null;
  const scopes = entry.savingRateScopes;
  if (!scopes || typeof scopes !== "object") return null;
  const v = scopes[id];
  return v === "only" || v === "from" || v === "year" ? v : null;
}

export function getSavingAccountFlowScopeForMonth(year, month, accountId) {
  const id = String(accountId || "").trim();
  if (!id) return null;
  const data = loadMonthData() || {};
  const key = monthKey(year, month);
  const entry = data[key];
  if (!entry || typeof entry !== "object") return null;
  const scopes = entry.savingFlowScopes;
  if (!scopes || typeof scopes !== "object") return null;
  const v = scopes[id];
  return v === "only" || v === "from" || v === "year" ? v : null;
}

export function inferSavingAccountFlowScopeForMonth(year, month, accountId) {
  const id = String(accountId || "").trim();
  if (!id) return "only";
  const data = loadMonthData() || {};
  const yearHasDefault = hasYearDefaultFlow(year, id);
  const getOv = (m) => {
    const e = data[monthKey(year, m)];
    if (!e || typeof e !== "object") return null;
    if (id === "__system__") {
      if (!Object.prototype.hasOwnProperty.call(e, "manualSaving")) return null;
      const n = Number(e.manualSaving);
      return Number.isFinite(n) ? n : null;
    }
    const sa = e.savingAccounts;
    if (!sa || typeof sa !== "object") return null;
    if (!Object.prototype.hasOwnProperty.call(sa, id)) return null;
    const n = Number(sa[id]);
    return Number.isFinite(n) ? n : null;
  };
  const cur = getOv(month);
  if (cur === null) return yearHasDefault ? "year" : "only";
  let allSame = true;
  for (let m = 1; m <= 12; m++) {
    const v = getOv(m);
    if (v === null || v !== cur) { allSame = false; break; }
  }
  if (allSame) return "year";
  let tailSame = true;
  for (let m = month; m <= 12; m++) {
    const v = getOv(m);
    if (v === null || v !== cur) { tailSame = false; break; }
  }
  if (tailSame) {
    const prev = month > 1 ? getOv(month - 1) : null;
    if (prev === null || prev !== cur) return "from";
  }
  return "only";
}

export function inferSavingAccountRateScopeForMonth(year, month, accountId) {
  const id = String(accountId || "").trim();
  if (!id) return "only";
  const data = loadMonthData() || {};
  const getOv = (m) => {
    const e = data[monthKey(year, m)];
    if (!e || typeof e !== "object") return null;
    const r = e.savingRates;
    if (!r || typeof r !== "object") return null;
    if (!Object.prototype.hasOwnProperty.call(r, id)) return null;
    const n = Number(r[id]);
    return Number.isFinite(n) ? n : null;
  };
  const cur = getOv(month);
  if (cur === null) {
    const acc = getSavingAccountById(id);
    const rates = acc && typeof acc === "object" ? acc.rates : null;
    if (rates && typeof rates === "object" && Object.prototype.hasOwnProperty.call(rates, String(year))) {
      return "year";
    }
    return "only";
  }
  let allSame = true;
  for (let m = 1; m <= 12; m++) {
    const v = getOv(m);
    if (v === null || v !== cur) { allSame = false; break; }
  }
  if (allSame) return "year";
  let tailSame = true;
  for (let m = month; m <= 12; m++) {
    const v = getOv(m);
    if (v === null || v !== cur) { tailSame = false; break; }
  }
  if (tailSame) {
    const prev = month > 1 ? getOv(month - 1) : null;
    if (prev === null || prev !== cur) return "from";
  }
  return "only";
}