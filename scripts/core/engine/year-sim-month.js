// scripts/core/engine/year-sim-month.js

import { computeMonthTotalsFor, computeMonthTotalsForWithSettings } from "./month.js";
import { round2 } from "./year-sim-utils.js";

function monthKey(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function calcPremiumSavingForMonth({ year, rawMonth, settings, accountBalances, computeInterest }) {
  let savingInterest = 0;
  const savingAccounts = {};
  const accounts = Array.isArray(settings?.savingAccounts) ? settings.savingAccounts : [];
  const overrides = (rawMonth?.savingAccounts && typeof rawMonth.savingAccounts === "object")
    ? rawMonth.savingAccounts
    : {};

  // Premium: optionele per-maand rente-overrides per spaarrekening.
  // rawMonth.savingRates = { "__system__": 2.1, "sa_x": 1.75 }
  const rateOverrides = (rawMonth?.savingRates && typeof rawMonth.savingRates === "object")
    ? rawMonth.savingRates
    : {};

  const doInterest = computeInterest !== false;
  
  // Legacy compat:
  // Non-premium gebruikte `rawMonth.manualSaving` voor de enkele spaarflow.
  // Als Premium net is geactiveerd, bestaan per-account overrides nog niet.
  // We gebruiken manualSaving daarom als override op de systeemrekening.
  // Belangrijk: zodra er per-account overrides bestaan, mag manualSaving NIET meer
  // als "systeem override" meetellen (anders kan er dubbel geteld worden).
  const legacyManualSaving =
    (typeof rawMonth?.manualSaving === "number" && Number.isFinite(rawMonth.manualSaving))
      ? Number(rawMonth.manualSaving)
      : null;
  
  const getEffectiveOverride = (id) => {
    if (!Object.prototype.hasOwnProperty.call(overrides, id)) return null;
    const n = Number(overrides[id]);
    if (!Number.isFinite(n)) return null;
    return n;
  };
  
  const hasAnyEffectiveOverride = (() => {
    for (const v of Object.values(overrides || {})) {
      const n = Number(v);
      if (Number.isFinite(n)) return true;
    }
    return false;
  })();
  
  for (const acc of accounts) {
    const id = String(acc?.id || "");
    if (!id) continue;
  
    const balStart = round2(accountBalances?.[id] || 0);
  
    const overrideVal = getEffectiveOverride(id);
    const hasEffectiveOverride = overrideVal !== null;
  
    // Legacy compat alleen als er verder geen echte per-account overrides bestaan.
    const hasLegacyOverride = !hasAnyEffectiveOverride && !hasEffectiveOverride && id === "__system__" && legacyManualSaving !== null;
  
    const flow = round2(
      hasEffectiveOverride
        ? overrideVal
        : hasLegacyOverride
          ? legacyManualSaving
          : Number((acc?.years && acc.years[String(year)]) || 0)
    );
  
    const rate = doInterest
      ? (() => {
          if (Object.prototype.hasOwnProperty.call(rateOverrides, id)) {
            const ov = Number(rateOverrides[id]);
            if (Number.isFinite(ov) && ov >= 0) return round2(ov);
          }
          return round2(Number((acc?.rates && acc.rates[String(year)]) || 0));
        })()
      : 0;

    const afterFlow = round2(balStart + flow);

    const interest = doInterest ? round2(afterFlow * (rate / 100) / 12) : 0;
    const balEnd = round2(afterFlow + interest);

    if (doInterest) savingInterest += interest;
    accountBalances[id] = balEnd;
  
    savingAccounts[id] = {
      id,
      name: String(acc?.name || ""),
      flow,
      rate,
      interest,
      balanceStart: balStart,
      balanceAfterFlow: afterFlow,
      balanceEnd: balEnd,
      source: (hasEffectiveOverride || hasLegacyOverride) ? "override" : "default",
    };
  }

  const saving = round2(Object.values(accountBalances || {}).reduce((a, b) => a + (Number(b) || 0), 0));
  return { saving, savingInterest, savingAccounts, accountBalances };
}

export function simulateMonth({ year, month, monthData, settings, useSettingsOverride, premiumActive, bank, saving, accountBalances }) {
  const mKey = monthKey(year, month);
  const tData = useSettingsOverride
    ? computeMonthTotalsForWithSettings(year, month, monthData, settings)
    : computeMonthTotalsFor(year, month, monthData);
  const rawMonth = monthData[mKey] || {};

  const income = Number(tData.income || 0);
  const expense = Number(tData.expense || 0);
  const deposits = Number(tData.deposits || 0);
  const withdrawals = Number(tData.withdrawals || 0);

  const savingFlow = deposits - withdrawals;
  const bankStart = bank;
  const savingStart = saving;

  bank = bank + income - expense - deposits + withdrawals;

  let savingInterest = 0;
  let savingAccounts = null;

  const hasAccounts = Array.isArray(settings?.savingAccounts) && settings.savingAccounts.length > 0;
  const canAccountSim = hasAccounts && accountBalances && typeof accountBalances === "object";

  if (canAccountSim) {
    const r = calcPremiumSavingForMonth({ year, rawMonth, settings, accountBalances, computeInterest: premiumActive });
    saving = r.saving;
    savingInterest = r.savingInterest;
    savingAccounts = r.savingAccounts;
    accountBalances = r.accountBalances;
  } else {
    // Legacy single-savings model
    saving = saving + deposits - withdrawals;
  }

  return {
    bank,
    saving,
    accountBalances,
    income,
    expense,
    deposits,
    withdrawals,
    savingFlow,
    cats: rawMonth.cats || {},
    bankStart,
    bankEnd: bank,
    savingStart,
    savingEnd: saving,
    savingInterest,
    savingAccounts,
  };
}
