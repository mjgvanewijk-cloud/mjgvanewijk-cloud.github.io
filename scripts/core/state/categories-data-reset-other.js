// scripts/core/state/categories-data-reset-other.js
import {
  loadCats,
  saveCats,
  loadMonthData,
  saveMonthData,
} from "../storage/index.js";
import { resetCaches } from "../engine/index.js";
import { precommitFindFirstCategoryLimitViolation } from "./categories-precommit-limit.js";
import {
  emitCategoriesChanged,
  syncSettingsCategoriesFromCats,
  triggerDataChanged,
} from "./categories-data-store.js";
import { ensureSystemOther, ensureOtherYearsByType, rebuildSimpleTotalsFromCats } from "./categories-data-helpers.js";

/**
 * Reset/clear all "Overig" customizations for a single column (income/expense):
 * - clears year defaults for the selected column
 * - clears display label override for the selected column
 * - clears all month overrides ("_catDisplay.<type>.overrides.Overig") across stored monthdata
 *
 * This is a UX-only feature: it uses the existing storage + rebuild + limit-check pipeline.
 */
export function resetOtherForType(type) {
  const tSel = (type === "income") ? "income" : "expense";

  // 1) Categories: ensure Overig exists and clear per-column config
  let cats = Array.isArray(loadCats()) ? loadCats() : [];
  cats = ensureSystemOther(cats);

  const other = cats.find((c) => (c?.name || "") === "Overig") || null;
  if (other) {
    ensureOtherYearsByType(other);

    if (other.yearsByType && typeof other.yearsByType === "object") {
      other.yearsByType[tSel] = {};
    }

    if (other.labels && typeof other.labels === "object" && Object.prototype.hasOwnProperty.call(other.labels, tSel)) {
      delete other.labels[tSel];
    }
  }

  // 2) Monthdata: clear overrides for Overig in this column
  let md = loadMonthData();
  if (!md || typeof md !== "object") md = {};

  for (const k of Object.keys(md)) {
    const entry = md[k];
    const cd = entry?._catDisplay?.[tSel];
    const ov = cd?.overrides;
    if (ov && typeof ov === "object" && Object.prototype.hasOwnProperty.call(ov, "Overig")) {
      delete ov["Overig"];
    }
  }

  // 3) Rebuild simple totals
  const rebuilt = rebuildSimpleTotalsFromCats({ cats, monthData: md });
  cats = rebuilt.cats;
  md = rebuilt.monthData;

  // 4) Precommit banklimiet check (existing pipeline)
  const violation = precommitFindFirstCategoryLimitViolation({
    candidateCats: cats,
    previewMonthData: md,
  });
  if (violation) {
    const err = new Error("FF_LIMIT_VIOLATION");
    err.code = "FF_LIMIT_VIOLATION";
    err.violation = violation;
    throw err;
  }

  // 5) Persist
  saveCats(cats);
  saveMonthData(md);
  syncSettingsCategoriesFromCats();
  resetCaches();

  triggerDataChanged();
  emitCategoriesChanged({ action: "reset_other", type: tSel });
}
