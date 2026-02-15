// scripts/core/engine/year-sim.js
import { loadMonthData } from "../storage.js";
import { getCachedYear, setCachedYear, getCachedYearOverride, setCachedYearOverride } from "./cache.js";
import { ensureSettings } from "./settings.js";
import { isPremiumActiveForEngine } from "./year-sim-utils.js";
import { buildYearStartState } from "./year-sim-start.js";
import { simulateMonth } from "./year-sim-month.js";

export function simulateYear(year, isInternalCall = false, monthDataOverride = null, settingsOverride = null) {
    // Cache rules:
    // - Normal calls without overrides use the global year cache.
    // - Precommit/preview calls often pass overrides; without caching this can degrade to O(N^2) due to recursive prev-year simulation.
    //   Therefore, internal calls with overrides use a dedicated WeakMap-backed cache keyed by the override object.
  const hasOverrides = !!monthDataOverride || !!settingsOverride;
  const useOverrideCache = !!isInternalCall && hasOverrides;
  const overrideKey = useOverrideCache ? (settingsOverride || monthDataOverride) : null;

  if (useOverrideCache) {
    const cachedPrev = getCachedYearOverride(overrideKey, year);
    if (cachedPrev) return cachedPrev;
  } else if (!hasOverrides) {
    const cached = getCachedYear(year);
    if (cached) return cached;
  }

  const monthData = monthDataOverride || loadMonthData() || {};

  const settings = settingsOverride || ensureSettings();
  const premiumActive = isPremiumActiveForEngine(settings);

  const startState = buildYearStartState({
    year,
    settings,
    settingsOverride,
    monthDataOverride,
    premiumActive,
    simulatePrevYear: simulateYear,
  });

  const bankStartVal = startState.bankStartVal;
  const savingStartVal = startState.savingStartVal;
  const savingAccountsStart = startState.savingAccountsStart;
  let accountBalances = startState.accountBalances;

  let savingAccountsEnd = null;

  let bank = bankStartVal;
  let saving = savingStartVal;

  const months = [];
  let totalIncome = 0;
  let totalExpense = 0;
  let totalSavingFlow = 0;

  const useSettingsOverride = !!settingsOverride;

  for (let m = 1; m <= 12; m++) {
    const r = simulateMonth({
      year,
      month: m,
      monthData,
      settings,
      useSettingsOverride,
      premiumActive,
      bank,
      saving,
      accountBalances,
    });

    bank = r.bank;
    saving = r.saving;
    accountBalances = r.accountBalances;

    totalIncome += r.income;
    totalExpense += r.expense;
    totalSavingFlow += r.savingFlow;

    months.push({
      year,
      month: m,
      income: r.income,
      expense: r.expense,
      deposits: r.deposits,
      withdrawals: r.withdrawals,
      savingFlow: r.savingFlow,
      cats: r.cats,
      bankStart: r.bankStart,
      bankEnd: r.bankEnd,
      savingStart: r.savingStart,
      savingEnd: r.savingEnd,
      savingInterest: r.savingInterest,
      savingAccounts: r.savingAccounts,
    });
  }

  if (accountBalances && typeof accountBalances === "object") {
    savingAccountsEnd = { ...(accountBalances || {}) };
  }

  const result = {
    year,
    months,
    bankStart: bankStartVal,
    bankEnd: bank,
    savingStart: savingStartVal,
    savingEnd: saving,
    savingAccountsStart,
    savingAccountsEnd,
    totals: { income: totalIncome, expense: totalExpense, savingFlow: totalSavingFlow },
  };

  if (useOverrideCache) {
    setCachedYearOverride(overrideKey, year, result);
  } else if (!hasOverrides) {
    setCachedYear(year, result);
  }

  return result;
}