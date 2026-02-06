// scripts/core/state/premium-downgrade-transform.js
import { saveSettings, saveCats, saveMonthData } from "../storage.js";
import { simulateYear } from "../engine/index.js";
import {
  collectYears,
  writeBackup,
  extractPremiumBackup,
} from "./premium-downgrade-backup.js";

const UIFLAG_PROMPT_SHOWN = "trialExpiryDowngradePromptShown";
const UIFLAG_DOWNGRADE_APPLIED = "trialExpiryDowngradeApplied";

function forcePremiumForComputation(settings) {
  const clone = JSON.parse(JSON.stringify(settings || {}));
  if (!clone.premium || typeof clone.premium !== "object") clone.premium = {};
  clone.premium.active = true;
  clone.premium.trialStart = null;
  clone.isPremium = true;
  return clone;
}

function mergeSavingAccountsToSingle(settings, monthData) {
  if (!settings || typeof settings !== "object") return;
  const list = Array.isArray(settings.savingAccounts) ? settings.savingAccounts : [];
  if (list.length <= 1) {
    // Also clear interest rates for free mode
    if (list[0] && typeof list[0] === "object") list[0].rates = {};
    return;
  }

  const keep = (list[0] && typeof list[0] === "object") ? { ...list[0] } : null;
  if (!keep) {
    settings.savingAccounts = [];
    return;
  }

  keep.startBalance = Number(keep.startBalance || 0);
  keep.years = (keep.years && typeof keep.years === "object") ? { ...keep.years } : {};
  keep.rates = {}; // free: no interest

  const keepId = String(keep.id || "").trim();
  const removedIds = [];

  for (let i = 1; i < list.length; i++) {
    const a = list[i];
    if (!a || typeof a !== "object") continue;
    const id = String(a.id || "").trim();
    if (id) removedIds.push(id);

    keep.startBalance += Number(a.startBalance || 0);

    const yrs = (a.years && typeof a.years === "object") ? a.years : {};
    for (const [y, v] of Object.entries(yrs)) {
      const n = Number(v);
      if (!Number.isFinite(n)) continue;
      keep.years[y] = Number(keep.years[y] || 0) + n;
    }
  }

  // Merge per-month overrides into the kept account and remove old ids.
  if (monthData && typeof monthData === "object" && keepId && removedIds.length) {
    for (const [mk, entry] of Object.entries(monthData)) {
      if (!entry || typeof entry !== "object") continue;

      // Remove per-account interest overrides entirely in free mode
      if (entry.savingRates && typeof entry.savingRates === "object") delete entry.savingRates;

      const ov = (entry.savingAccounts && typeof entry.savingAccounts === "object") ? entry.savingAccounts : null;
      if (!ov) continue;

      let sumToKeep = 0;
      for (const rid of removedIds) {
        if (!Object.prototype.hasOwnProperty.call(ov, rid)) continue;
        const n = Number(ov[rid]);
        if (Number.isFinite(n)) sumToKeep += n;
        delete ov[rid];
      }

      if (sumToKeep !== 0) {
        const cur = Number(ov[keepId] || 0);
        ov[keepId] = (Number.isFinite(cur) ? cur : 0) + sumToKeep;
      }

      // If after removal only keepId remains empty object, keep as is.
      entry.savingAccounts = ov;
    }
  }

  settings.savingAccounts = [keep];
}

function enforceSingleSavingAccountMonthlyOverrides(settings, monthData) {
  // Critical: in free mode, bank cashflow must keep following the historical saving flow.
  // The bank-cashflow computation prioritizes entries.savingAccounts when saving accounts exist.
  // Our downgrade writes the historical flow into entries.manualSaving (via simulation), but
  // manualSaving is only used as a legacy override for id "__system__". To avoid any "saving stops"
  // scenarios (especially after multi-year restores), we therefore mirror manualSaving into a
  // per-month override for the single remaining saving account.
  const list = Array.isArray(settings?.savingAccounts) ? settings.savingAccounts : [];
  const keep = list[0];
  const keepId = String(keep?.id || "").trim();
  if (!keepId) return;
  if (!monthData || typeof monthData !== "object") return;

  for (const entry of Object.values(monthData)) {
    if (!entry || typeof entry !== "object") continue;
    const flow = Number(entry.manualSaving);
    if (!Number.isFinite(flow)) continue;
    entry.savingAccounts = { [keepId]: flow };
    // Interest is premium-only.
    if (entry.savingRates && typeof entry.savingRates === "object") delete entry.savingRates;
  }
}

function buildSystemOtherCatForType(cats, type) {
  const wantType = type === "income" ? "income" : "expense";
  const arr = Array.isArray(cats) ? cats : [];

  // Prefer an existing Overig of the right type.
  const existingSameType = arr.find((c) => c && c.name === "Overig" && (c.type || "expense") === wantType);
  if (existingSameType && typeof existingSameType === "object") {
    return { ...existingSameType, name: "Overig", type: wantType, system: true };
  }

  // Fallback: reuse any existing Overig but force type + id.
  const existingAny = arr.find((c) => c && c.name === "Overig");
  if (existingAny && typeof existingAny === "object") {
    const forcedId = wantType === "income" ? (existingAny.id === "sys_other" ? "sys_other_income" : (existingAny.id || "sys_other_income")) : "sys_other";
    return { ...existingAny, id: forcedId, name: "Overig", type: wantType, system: true };
  }

  return {
    id: wantType === "income" ? "sys_other_income" : "sys_other",
    name: "Overig",
    type: wantType,
    yearsByType: { income: {}, expense: {} },
    years: {},
    labels: {},
    system: true,
  };
}



export function applyDowngradeTransform(settings, cats, monthData) {
  writeBackup(extractPremiumBackup({ settings, cats, monthData }));

  const savingAccounts = Array.isArray(settings.savingAccounts) ? settings.savingAccounts : [];
  const years = collectYears({ settings, monthData, cats, savingAccounts });

  // Recompute year simulation using forced-premium (consistent totals)
  const forced = forcePremiumForComputation(settings);
  const sims = new Map();
  years.forEach((y) => sims.set(y, simulateYear(y, true, monthData, forced)));

  // Downgrade (free): consolideer alle categorieën naar "Overig" en bewaar totals in _catDisplay overrides.
  const otherCatExpense = buildSystemOtherCatForType(cats, "expense");
  const otherCatIncome = buildSystemOtherCatForType(cats, "income");
  saveCats([otherCatExpense, otherCatIncome]);
  // Houd legacy settings.categories in sync (sommige UI's lezen dit).
  settings.categories = {
    Overig: { label: "Overig", type: otherCatExpense.type || "expense" },
  };

  years.forEach((year) => {
    const sim = sims.get(year);
    const months = Array.isArray(sim?.months) ? sim.months : [];
    for (let m = 1; m <= 12; m++) {
      const mk = `${year}-${String(m).padStart(2, "0")}`;
      if (!monthData[mk] || typeof monthData[mk] !== "object") monthData[mk] = {};
      const entry = monthData[mk];
      const snap = months[m - 1] || {};

      const inc = Number(snap.income || 0);
      const exp = Number(snap.expense || 0);
      entry._simpleIncome = inc;
      entry._simpleExpense = exp;

      if (!entry._catDisplay || typeof entry._catDisplay !== "object") entry._catDisplay = {};
      entry._catDisplay.income = { overrides: { Overig: inc }, scopes: {}, solidified: false };
      entry._catDisplay.expense = { overrides: { Overig: exp }, scopes: {}, solidified: false };

      entry.manualSaving = Number(snap.savingFlow || 0);
      delete entry.savings;
      // keep entry.savingAccounts (free: single account) - merged later
    }
  });

  // Spaarpotjes: geen auto-creation; laat bestaande staan maar schakel premium uit.
  if (!settings.premium || typeof settings.premium !== "object") settings.premium = {};
  settings.premium.active = false;
  settings.isPremium = false;

  if (!settings.uiFlags) settings.uiFlags = {};
  settings.uiFlags[UIFLAG_DOWNGRADE_APPLIED] = true;
  settings.uiFlags[UIFLAG_PROMPT_SHOWN] = true;

  mergeSavingAccountsToSingle(settings, monthData);
  enforceSingleSavingAccountMonthlyOverrides(settings, monthData);
  enforceSingleSavingAccountMonthlyOverrides(settings, monthData);

  saveSettings(settings);
  saveMonthData(monthData);
}
