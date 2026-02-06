// scripts/ui/popup/month-category-list-inline-save-handler.js

import { t, formatCurrency } from "../../i18n.js";
import { loadCats, saveCats, loadMonthData, saveMonthData, loadSettings } from "../../core/storage/index.js";
import { resetCaches } from "../../core/engine/index.js";
import { setYearAmount, getYearAmount } from "./month-category-logic.js";
import { setYearAmountByType, getYearAmountByType } from "../../core/state/categories/year-defaults.js";
import { isSystemOther } from "../../core/state/categories/system-other.js";
import { getMonthCatDisplayState } from "./month-category-store.js";
import { applyCategoryChange } from "../../year/year-monthly-edit-categories.js";
import { cloneMonthData, clearOverridesForYear } from "../../year/year-edit-data.js";
import { applyRebuiltTotalsForRange } from "../../year/year-edit-rebuild.js";
import { checkBankLimitOrSetInlineError } from "../../year/year-monthly-edit-helpers.js";
import { setNextActionReason, buildUserReason } from "../../core/history/index.js";

export async function handleInlineSave({ 
  catName, val, scope, setInlineError, year, monthNum, type, onDataChanged, refreshSelf, opts = null 
}) {
  const suppressRefresh = !!(opts && opts.suppressRefresh);
  const num = Math.abs(Number(val) || 0);

  const settings = loadSettings() || {};
  const baseCats = Array.isArray(loadCats()) ? loadCats() : [];
  const baseMonthData = loadMonthData() || {};

  let previewCats = null;
  let previewMonthData = null;

  const mappedScope = scope === "from" ? "fromNow" : (scope === "year" ? "year" : "month");

  if (scope === "only" || scope === "from") {
    const res = applyCategoryChange(year, monthNum, mappedScope, num, type, catName, setInlineError);
    if (!res) return false;
    previewCats = res.previewCats;
    previewMonthData = res.previewMonthData;
  } else if (scope === "year") {
    previewCats = JSON.parse(JSON.stringify(baseCats));
    previewMonthData = cloneMonthData(baseMonthData);

    clearOverridesForYear(previewMonthData, year, type, catName);

    // Year-defaults:
    // - For normal categories: only write into the matching column-type.
    // - For the system bucket "Overig": always write type-separated (yearsByType),
    //   otherwise income/expense will overwrite each other in free/downgrade mode.
    previewCats = previewCats.map((c) => {
      if (String(c?.name || "") !== String(catName || "")) return c;

      const cType = String(c?.type || "expense");
      const other = isSystemOther(c);

      // Skip mismatched category types except for the special Overig system bucket.
      if (!other && cType !== String(type || "expense")) return c;

      // Keep immutability for preview; year-default helpers can mutate.
      const next = JSON.parse(JSON.stringify(c));
      if (other) {
        setYearAmountByType(next, year, type, num);
        return next;
      }
      return setYearAmount(next, year, num);
    });

    for (let m = 1; m <= 12; m++) {
      const key = `${year}-${String(m).padStart(2, "0")}`;
      if (!previewMonthData[key] || typeof previewMonthData[key] !== "object") previewMonthData[key] = {};
      if (!previewMonthData[key]._catDisplay) previewMonthData[key]._catDisplay = {};
      if (!previewMonthData[key]._catDisplay[type]) previewMonthData[key]._catDisplay[type] = {};
      if (!previewMonthData[key]._catDisplay[type].scopes) previewMonthData[key]._catDisplay[type].scopes = {};
      previewMonthData[key]._catDisplay[type].scopes[catName] = "year";
    }

    applyRebuiltTotalsForRange({
      monthData: previewMonthData,
      disableAutoSolidify: true,
      cats: previewCats,
      year,
      type,
      startMonth: 1,
      endMonth: 12,
    });

    if (!checkBankLimitOrSetInlineError({ previewCats, previewMonthData, settings, type, setInlineError })) {
      return false;
    }
  } else {
    setInlineError?.(t("errors.generic_desc"));
    return false;
  }

  // History detail (Option C): maak Undo/Redo-melding specifiek voor deze maand/categorie.
  // Dit voorkomt "vage" generieke meldingen en voorkomt oningevulde placeholders.
  try {
    const catObj = Array.isArray(baseCats) ? baseCats.find((c) => String(c?.name || "") === String(catName || "")) : null;
    const display = getMonthCatDisplayState(year, monthNum, type) || {};
    const overrides = display.overrides && typeof display.overrides === "object" ? display.overrides : null;
    const prev = scope === "year"
      ? (catObj
          ? (isSystemOther(catObj)
              ? getYearAmountByType(catObj, year, type)
              : getYearAmount(catObj, year))
          : 0)
      : (overrides && Object.prototype.hasOwnProperty.call(overrides, catName)
          ? (Number(overrides[catName]) || 0)
          : (catObj
              ? (isSystemOther(catObj)
                  ? getYearAmountByType(catObj, year, type)
                  : getYearAmount(catObj, year))
              : 0));

    const typeLabel = t(`monthpopup.${type === "income" ? "income_for" : "expense_for"}`);
    const monthLabel = t(`months.${Number(monthNum) || 1}`);
    const fromStr = formatCurrency(prev);
    const toStr = formatCurrency(num);

    const detailKey = scope === "year" ? "history.detail.month_cat_amount_changed_year" : "history.detail.month_cat_amount_changed";
    setNextActionReason(buildUserReason(`monthcat.${type}`, true));
  } catch (_) {
    // Geen hard-fail: history blijft gewoon werken.
  }

  try {
    // User action => allow snapshots / enable Undo-Redo even if the user clicks very fast after boot.
    // (Booting blocks recordSnapshot + canUndo/canRedo.)
    try { window.__finflowBooting = false; } catch (_) {}

    saveCats(Array.isArray(previewCats) ? previewCats : baseCats);
    saveMonthData(previewMonthData || baseMonthData);
    resetCaches();
  } catch (e) {
    console.error(e);
    setInlineError?.(t("errors.generic_desc"));
    return false;
  }

  if (!suppressRefresh) {
    if (typeof onDataChanged === "function") onDataChanged();
    if (typeof refreshSelf === "function") refreshSelf();
  }
  return true;
}