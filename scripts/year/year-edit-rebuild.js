// scripts/year/year-edit-rebuild.js
import { loadMonthData, loadCats, saveMonthData } from "../core/storage/index.js";
import { resetCaches } from "../core/engine/index.js";
import { monthKey } from "./year-edit-data.js";
import {
  ensureOverrides,
  getOverrideAmount,
  getDefaultCatAmount,
  computeMonthTotalFromCats,
} from "./year-edit-helpers.js";

export function applyRebuiltTotalsForRange({
  monthData,
  cats,
  year,
  type,
  startMonth,
  endMonth,
  disableAutoSolidify = false,
}) {
  const sumRealCats = (entry) => {
    let sum = 0;
    for (const c of cats) {
      const name = String(c?.name || "");
      if (!name || name === "Overig") continue;

      const cType = String(c?.type || "expense");
      if (cType !== type) continue;

      const ov = getOverrideAmount(entry, type, name);
      const val = ov !== null ? Math.abs(Number(ov) || 0) : Math.abs(getDefaultCatAmount(c, year, type) || 0);
      sum += Number(val) || 0;
    }
    return sum;
  };

  const getOtherCat = () => cats.find((c) => String(c?.name || "") === "Overig");

  for (let m = startMonth; m <= endMonth; m++) {
    const key = monthKey(year, m);
    if (!monthData[key] || typeof monthData[key] !== "object") monthData[key] = {};
    const entry = monthData[key];

    // 1) Bestaand maandtotaal (legacy, vóór categorieën) behouden als 'blok' in Overig,
    //    zodra er categorieën in beeld komen.
    const currentTotalRaw =
      type === "income" ? Number(entry._simpleIncome) : Number(entry._simpleExpense);
    const currentTotalAbs = Math.abs(Number.isFinite(currentTotalRaw) ? currentTotalRaw : 0);

    const otherCat = getOtherCat();
    const otherDefault = otherCat ? Math.abs(getDefaultCatAmount(otherCat, year, type)) : 0;
    const otherOverride = getOverrideAmount(entry, type, "Overig");
    const hasSolidifiedFlag = !!entry?._catDisplay?.[type]?.solidified;

    const sumCatsWithoutOverig = sumRealCats(entry);

    // Solidify (1x): alleen als Overig nog leeg is, en het huidige totaal niet al gelijk is aan de som van categorieën.
    // BELANGRIJK: bij category-edit rebuilds willen we dit NIET, anders “hangt” het oude totaal vast in Overig (dubbel tellen).
    if (
      !disableAutoSolidify &&
      !hasSolidifiedFlag &&
      otherOverride === null &&
      (otherDefault === 0) &&
      currentTotalAbs > 0 &&
      Math.abs(currentTotalAbs - Math.abs(sumCatsWithoutOverig || 0)) > 0.00001
    ) {
      const ov = ensureOverrides(entry, type);
      ov["Overig"] = currentTotalAbs;
      // Markeer zodat we dit niet nogmaals automatisch doen.
      if (!entry._catDisplay) entry._catDisplay = {};
      if (!entry._catDisplay[type] || typeof entry._catDisplay[type] !== "object") entry._catDisplay[type] = {};
      entry._catDisplay[type].solidified = true;
    }

    // 2) Optellen: maandtotaal = som van categorieën (incl. Overig)
    const total = computeMonthTotalFromCats({ cats, monthEntry: entry, year, type });
    if (type === "income") entry._simpleIncome = Number(total) || 0;
    if (type === "expense") entry._simpleExpense = Number(total) || 0;
  }
}

// === Export: rebuild totals from categories (only when real categories exist) ===
export function rebuildYearTotalsFromCats(year, type) {
  if (type !== "income" && type !== "expense") return false;

  const cats = Array.isArray(loadCats()) ? loadCats() : [];

  // Alleen rebuilden als er minstens 1 echte categorie bestaat (dus niet alleen Overig)
  const hasReal = cats.some((c) => String(c?.name || "") && String(c?.name || "") !== "Overig" && String(c?.type || "expense") === type);
  if (!hasReal) return false;

  const monthData = loadMonthData() || {};

  // Schrijf de jaar-totalen (_simpleIncome/_simpleExpense) opnieuw uit de categorie-defaults/overrides
  applyRebuiltTotalsForRange({
    monthData,
    cats,
    year,
    type,
    startMonth: 1,
    endMonth: 12,
  });

  saveMonthData(monthData);
  resetCaches();
  return true;
}
