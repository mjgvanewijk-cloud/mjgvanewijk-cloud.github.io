// scripts/year/year-monthly-edit-categories.js
import { t } from "../i18n.js";
import { loadCats, loadMonthData, loadSettings } from "../core/storage/index.js";
import { ensureSystemOther } from "../ui/popup/month-category-logic.js";
import { monthKey } from "../ui/popup/month-category-store.js";
import { cloneMonthData, ensureOverrides, clearOverridesForYear } from "./year-edit-data.js";
import { applyRebuiltTotalsForRange } from "./year-edit-rebuild.js";
import { normalizeScope, getScopeRange, checkBankLimitOrSetInlineError } from "./year-monthly-edit-helpers.js";

export function applyCategoryChange(year, month, scope, signedInput, type, categoryName, setInlineError) {
  const absVal = Math.abs(Number(signedInput) || 0);

  const baseCatsRaw = Array.isArray(loadCats()) ? loadCats() : [];
  const baseCats = ensureSystemOther(baseCatsRaw);
  const baseMonthData = loadMonthData() || {};
  const settings = loadSettings() || {};

  const previewCats = JSON.parse(JSON.stringify(baseCats));
  const previewMonthData = cloneMonthData(baseMonthData);

  const cat = previewCats.find((c) => String(c?.name || "") === String(categoryName || ""));
  if (!cat) {
    setInlineError?.(t("errors.category_not_found"));
    return null;
  }

  const normScope = normalizeScope(scope);
  const { start, end } = getScopeRange(month, normScope);
  const isAllScope = normScope === "all";

  const scopeMarker = normScope === "fromNow" ? "from" : (normScope === "all" ? "year" : "only");

  const setOverride = (m, val) => {
    const key = monthKey(year, m);
    if (!previewMonthData[key]) previewMonthData[key] = {};
    ensureOverrides(previewMonthData[key], type);
    previewMonthData[key]._catDisplay[type].overrides[categoryName] = val;

    // Persist scope marker for UI selection (only / from / year)
    if (!previewMonthData[key]._catDisplay[type].scopes) previewMonthData[key]._catDisplay[type].scopes = {};
    previewMonthData[key]._catDisplay[type].scopes[categoryName] = scopeMarker;
  };

  const clearScopeInRange = (fromMonth, toMonth) => {
    for (let m = fromMonth; m <= toMonth; m++) {
      const key = monthKey(year, m);
      if (!previewMonthData[key]) previewMonthData[key] = {};
      ensureOverrides(previewMonthData[key], type);
      const scopes = previewMonthData[key]._catDisplay[type].scopes;
      if (scopes && Object.prototype.hasOwnProperty.call(scopes, categoryName)) delete scopes[categoryName];
    }
  };

  const clearOverrideInRange = (fromMonth, toMonth) => {
    for (let m = fromMonth; m <= toMonth; m++) {
      const key = monthKey(year, m);
      if (!previewMonthData[key]) previewMonthData[key] = {};
      ensureOverrides(previewMonthData[key], type);
      delete previewMonthData[key]._catDisplay[type].overrides[categoryName];
    }
  };

  if (isAllScope) {
    clearOverridesForYear(previewMonthData, year, type, categoryName);
    clearScopeInRange(1, 12);
    for (let m = 1; m <= 12; m++) setOverride(m, absVal);

    applyRebuiltTotalsForRange({
      monthData: previewMonthData,
      disableAutoSolidify: true,
      cats: previewCats,
      year,
      type,
      startMonth: 1,
      endMonth: 12,
    });
  } else {
    clearOverrideInRange(start, end);
    clearScopeInRange(start, end);
    for (let m = start; m <= end; m++) setOverride(m, absVal);

    applyRebuiltTotalsForRange({
      monthData: previewMonthData,
      disableAutoSolidify: true,
      cats: previewCats,
      year,
      type,
      startMonth: start,
      endMonth: end,
    });
  }

  if (!checkBankLimitOrSetInlineError({ previewCats, previewMonthData, settings, type, setInlineError })) {
    return null;
  }

  return { previewCats, previewMonthData };
}