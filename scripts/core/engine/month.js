// scripts/core/engine/month.js
import { ensureSettings } from "./settings.js";
import { loadMonthData, loadCats } from "../storage.js";

function normalizeCats(catsRaw) {
  if (Array.isArray(catsRaw)) return catsRaw;
  if (catsRaw && typeof catsRaw === "object") return Object.values(catsRaw);
  return [];
}

function buildCatTypeIndex(catsArr) {
  const idx = new Map();
  (Array.isArray(catsArr) ? catsArr : []).forEach((c) => {
    const name = (c?.name || "").toLowerCase().trim();
    if (!name) return;
    idx.set(name, (c?.type || "expense"));
  });
  if (!idx.has("overig")) idx.set("overig", "expense");
  return idx;
}

function sumCatsByType(catsObj, catTypeIndex) {
  const out = { income: 0, expense: 0 };
  if (!catsObj || typeof catsObj !== "object") return out;

  for (const [name, amount] of Object.entries(catsObj)) {
    const n = String(name || "").toLowerCase().trim();
    const val = Number(amount) || 0;
    const type =
      catTypeIndex.get(n) ||
      (n.includes("inkom") || n.includes("salaris") ? "income" : "expense");

    if (type === "income") out.income += val;
    else out.expense += val;
  }
  return out;
}

function sumDefaultCatsForYear(catsArr, year) {
  const out = { income: 0, expense: 0 };
  const y = String(year);

  (Array.isArray(catsArr) ? catsArr : []).forEach((c) => {
    const name = String(c?.name || "");

    // System category "Overig" can carry year-defaults per type (income/expense).
    // Required for Free/Trial flows (incl. premium downgrade) where
    // year defaults are stored under yearsByType instead of c.years.
    if (name === "Overig" && c?.yearsByType && typeof c.yearsByType === "object") {
      const ybi = c.yearsByType?.income;
      const ybe = c.yearsByType?.expense;

      if (ybi && typeof ybi === "object" && Object.prototype.hasOwnProperty.call(ybi, y)) {
        out.income += Number(ybi[y]) || 0;
      }
      if (ybe && typeof ybe === "object" && Object.prototype.hasOwnProperty.call(ybe, y)) {
        out.expense += Number(ybe[y]) || 0;
      }
      return;
    }

    const type = (c?.type || "expense");
    const years = c?.years;
    if (!years || typeof years !== "object") return;
    if (!Object.prototype.hasOwnProperty.call(years, y)) return;

    const val = Number(years[y]) || 0;
    if (type === "income") out.income += val;
    else out.expense += val;
  });

  return out;
}

export function computeMonthTotalsFor(year, month, monthDataOverride = null) {
  const settings = ensureSettings();
  return computeMonthTotalsForWithSettings(year, month, monthDataOverride, settings);
}

// Idem als computeMonthTotalsFor, maar gebruikt een meegegeven settings-object.
// Dit is nodig voor pre-commit simulaties (bijv. spaarrekening sheet) waarbij settings nog niet gecommit zijn.
export function computeMonthTotalsForWithSettings(year, month, monthDataOverride = null, settings) {
  const monthData = monthDataOverride || loadMonthData() || {};
  const mKey = month < 10 ? `0${month}` : `${month}`;
  const key = `${year}-${mKey}`;
  const entries = monthData[key] || {};

  const hasSimpleIncome = Object.prototype.hasOwnProperty.call(entries, "_simpleIncome");
  const hasSimpleExpense = Object.prototype.hasOwnProperty.call(entries, "_simpleExpense");

  const catsArr = normalizeCats(loadCats());
  const catTypeIndex = buildCatTypeIndex(catsArr);

  const hasCatsAllocation = !!(
    entries.cats &&
    typeof entries.cats === "object" &&
    Object.keys(entries.cats).length > 0
  );

  const allocSums = hasCatsAllocation
    ? sumCatsByType(entries.cats, catTypeIndex)
    : { income: 0, expense: 0 };

  const defaultSums = sumDefaultCatsForYear(catsArr, year);

  const income = hasSimpleIncome
    ? Number(entries._simpleIncome || 0)
    : (hasCatsAllocation ? allocSums.income : defaultSums.income);

  const expense = hasSimpleExpense
    ? Number(entries._simpleExpense || 0)
    : (hasCatsAllocation ? allocSums.expense : defaultSums.expense);

  const useSavingAccounts = Array.isArray(settings?.savingAccounts) && settings.savingAccounts.length > 0;

// Bank-cashflow must always follow savingAccounts when present.
// Premium status only affects interest computation elsewhere (year-sim-month), not deposits/withdrawals here.

  let deposits = 0;
  let withdrawals = 0;
  let hasManualSavings = false;

  if (useSavingAccounts) {
    const accounts = Array.isArray(settings?.savingAccounts) ? settings.savingAccounts : [];
    const overrides = (entries?.savingAccounts && typeof entries.savingAccounts === "object")
      ? entries.savingAccounts
      : {};

    // Legacy (non-premium) maand-override:
    // vóór Premium werd de enkele spaarflow opgeslagen in `entries.manualSaving`.
    // Na het activeren van Premium moet deze waarde NIET verloren gaan.
    // Belangrijk: zodra er per-account overrides bestaan, mag manualSaving NIET meer
    // als "systeem override" meetellen (anders kan er dubbel geteld worden).
    const legacyManualSaving =
      (typeof entries?.manualSaving === "number" && Number.isFinite(entries.manualSaving))
        ? Number(entries.manualSaving)
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

      const overrideVal = getEffectiveOverride(id);
      const hasEffectiveOverride = overrideVal !== null;

      // Legacy compat alleen als er verder geen echte per-account overrides bestaan.
      const hasLegacyOverride = !hasAnyEffectiveOverride && !hasEffectiveOverride && id === "__system__" && legacyManualSaving !== null;

      const flow = hasEffectiveOverride
        ? overrideVal
        : hasLegacyOverride
          ? legacyManualSaving
          : Number((acc?.years && acc.years[String(year)]) || 0);

      if (hasEffectiveOverride || hasLegacyOverride) hasManualSavings = true;

      if (flow >= 0) deposits += flow;
      else withdrawals += Math.abs(flow);
    }
  } else {
    const savings = Array.isArray(entries.savings) ? entries.savings : [];

    for (const s of savings) {
      if (s?.type === "deposit") deposits += Number(s.amount || 0);
      else if (s?.type === "withdrawal") withdrawals += Number(s.amount || 0);
    }

    hasManualSavings = typeof entries.manualSaving === "number" && Number.isFinite(entries.manualSaving);

    if (hasManualSavings) {
      const manual = Number(entries.manualSaving || 0);
      if (manual >= 0) deposits += manual;
      else withdrawals += Math.abs(manual);
    }
  }

  const available = income - expense - deposits + withdrawals;
  return { income, expense, deposits, withdrawals, available, hasManualSavings };
}
