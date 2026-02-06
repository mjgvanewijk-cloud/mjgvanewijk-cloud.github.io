// scripts/ui/popup/saving-month-calc.js
import { loadSettings } from "../../core/storage/index.js";
import { getConfiguredStartYear } from "../../year/year-chain.js";
import { getSavingAccountOverrideForMonth } from "./saving-month-store.js";

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function getDefaultMonthlyFlowForAccount(account, year) {
  return num(account?.years?.[String(year)]);
}

export function getAnnualRateForAccount(account, year) {
  return num(account?.rates?.[String(year)]);
}

export function getFlowForAccountMonth({ account, year, month }) {
  const id = String(account?.id || "");
  if (!id) return { value: 0, source: "default" };

  const { value, hasOverride } = getSavingAccountOverrideForMonth(year, month, id);
  if (hasOverride) return { value: num(value), source: "override" };

  return { value: getDefaultMonthlyFlowForAccount(account, year), source: "default" };
}

export function computeBalanceAfterFlowForMonth({ account, year, month }) {
  const settings = loadSettings() || {};
  const startYear = getConfiguredStartYear(settings) ?? Number(year);

  let balance = num(account?.startBalance);
  const targetYear = Number(year);
  const targetMonth = Number(month);

  for (let y = Number(startYear); y <= targetYear; y++) {
    const lastM = (y === targetYear) ? targetMonth : 12;
    for (let m = 1; m <= lastM; m++) {
      const { value } = getFlowForAccountMonth({ account, year: y, month: m });
      balance += num(value);
    }
  }

  return Math.round(balance * 100) / 100;
}

export function computeInterestForMonth({ balanceAfterFlow = 0, annualRate = 0 }) {
  const b = num(balanceAfterFlow);
  const r = num(annualRate);
  const interest = b * (r / 100) / 12;
  return Math.round(interest * 100) / 100;
}

export function getBalanceAndInterestForMonth({ account, year, month }) {
  const balance = computeBalanceAfterFlowForMonth({ account, year, month });
  const rate = getAnnualRateForAccount(account, year);
  const interest = computeInterestForMonth({ balanceAfterFlow: balance, annualRate: rate });
  return { balance, rate, interest };
}
