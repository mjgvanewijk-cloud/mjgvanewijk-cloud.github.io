// scripts/year/year-monthly-edit-amounts.js
import { loadCats, loadMonthData, loadSettings } from "../core/storage/index.js";
import { ensureSystemOther } from "../ui/popup/month-category-logic.js";
import { monthKey } from "../ui/popup/month-category-store.js";
import { cloneMonthData, ensureOverrides, setSavingValue } from "./year-edit-data.js";
import { applyRebuiltTotalsForRange } from "./year-edit-rebuild.js";
import { normalizeScope, getScopeRange, checkBankLimitOrSetInlineError } from "./year-monthly-edit-helpers.js";

export function applyIncomeChange(year, month, scope, signedInput, setInlineError) {
  const val = Math.abs(Number(signedInput) || 0);
  const type = "income";

  const baseCatsRaw = Array.isArray(loadCats()) ? loadCats() : [];
  const baseCats = ensureSystemOther(baseCatsRaw);
  const baseMonthData = loadMonthData() || {};
  const settings = loadSettings() || {};

  const previewCats = JSON.parse(JSON.stringify(baseCats));
  const previewMonthData = cloneMonthData(baseMonthData);

  const normScope = normalizeScope(scope);
  const { start, end } = getScopeRange(month, normScope);

  // Display-consistentie:
  // Wanneer de gebruiker een maandtotaal (inkomen/uitgaven) expliciet overschrijft,
  // mag dit NIET bovenop bestaande categorie-defaults geteld worden.
  // Daarom "schakelen" we voor die maand alle niet-Overig categorieën uit door
  // overrides = 0 te zetten, en plaatsen we het volledige maandtotaal in Overig.
  // Dit zorgt dat de maandkaart exact het ingevoerde bedrag toont (geen dubbel tellen).
  const zeroOutRealCats = (entry, t) => {
    const ov = ensureOverrides(entry, t);
    for (const c of previewCats) {
      const name = String(c?.name || "");
      if (!name || name === "Overig") continue;
      const cType = String(c?.type || "expense");
      if (cType !== t) continue;
      ov[name] = 0;
    }
  };

  for (let m = start; m <= end; m++) {
    const key = monthKey(year, m);
    if (!previewMonthData[key]) previewMonthData[key] = {};
    const entry = previewMonthData[key];
    entry._simpleIncome = val;
    zeroOutRealCats(entry, "income");
    entry._catDisplay.income.overrides.Overig = val;
  }

  applyRebuiltTotalsForRange({
    monthData: previewMonthData,
    disableAutoSolidify: true,
    cats: previewCats,
    year,
    type,
    startMonth: start,
    endMonth: end,
  });

  if (!checkBankLimitOrSetInlineError({ previewCats, previewMonthData, settings, type, setInlineError })) {
    return null;
  }
  return { previewCats, previewMonthData };
}

export function applyExpenseChange(year, month, scope, signedInput, setInlineError) {
  const val = Math.abs(Number(signedInput) || 0);
  const type = "expense";

  const baseCatsRaw = Array.isArray(loadCats()) ? loadCats() : [];
  const baseCats = ensureSystemOther(baseCatsRaw);
  const baseMonthData = loadMonthData() || {};
  const settings = loadSettings() || {};

  const previewCats = JSON.parse(JSON.stringify(baseCats));
  const previewMonthData = cloneMonthData(baseMonthData);

  const normScope = normalizeScope(scope);
  const { start, end } = getScopeRange(month, normScope);

  // Zelfde display-regel als bij inkomen: expliciete maand-override mag niet bovenop
  // categorie-defaults geteld worden. We zetten daarom alle niet-Overig categorieën
  // in deze kolom op override=0 en plaatsen het totale bedrag in Overig.
  const zeroOutRealCats = (entry, t) => {
    const ov = ensureOverrides(entry, t);
    for (const c of previewCats) {
      const name = String(c?.name || "");
      if (!name || name === "Overig") continue;
      const cType = String(c?.type || "expense");
      if (cType !== t) continue;
      ov[name] = 0;
    }
  };

  for (let m = start; m <= end; m++) {
    const key = monthKey(year, m);
    if (!previewMonthData[key]) previewMonthData[key] = {};
    const entry = previewMonthData[key];
    entry._simpleExpense = val;
    zeroOutRealCats(entry, "expense");
    entry._catDisplay.expense.overrides.Overig = val;
  }

  applyRebuiltTotalsForRange({
    monthData: previewMonthData,
    disableAutoSolidify: true,
    cats: previewCats,
    year,
    type,
    startMonth: start,
    endMonth: end,
  });

  if (!checkBankLimitOrSetInlineError({ previewCats, previewMonthData, settings, type, setInlineError })) {
    return null;
  }
  return { previewCats, previewMonthData };
}

export function applySavingChange(year, month, scope, signedInput, setInlineError) {
  const val = Number(signedInput) || 0;
  const type = "saving";

  const baseCatsRaw = Array.isArray(loadCats()) ? loadCats() : [];
  const baseCats = ensureSystemOther(baseCatsRaw);
  const baseMonthData = loadMonthData() || {};
  const settings = loadSettings() || {};

  const previewCats = JSON.parse(JSON.stringify(baseCats));
  const previewMonthData = cloneMonthData(baseMonthData);

  const normScope = normalizeScope(scope);
  const { start, end } = getScopeRange(month, normScope);

  for (let m = start; m <= end; m++) {
    const key = monthKey(year, m);
    if (!previewMonthData[key]) previewMonthData[key] = {};
    const entry = previewMonthData[key];
    setSavingValue(entry, val);
  }

  applyRebuiltTotalsForRange({
    monthData: previewMonthData,
    disableAutoSolidify: true,
    cats: previewCats,
    year,
    type,
    startMonth: start,
    endMonth: end,
  });

  if (typeof setInlineError === "function") setInlineError("");
  return { previewCats, previewMonthData };
}