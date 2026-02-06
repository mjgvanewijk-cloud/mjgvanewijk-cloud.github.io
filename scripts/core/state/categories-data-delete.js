// scripts/core/state/categories-data-delete.js
import {
  saveCats,
  loadMonthData,
  saveMonthData,
} from "../storage/index.js";
import { resetCaches } from "../engine/index.js";
import { precommitFindFirstCategoryLimitViolation } from "./categories-precommit-limit.js";
import { 
  getAllCategories, 
  emitCategoriesChanged, 
  syncSettingsCategoriesFromCats,
  triggerDataChanged 
} from "./categories-data-store.js";
import { 
  ensureSystemOther, 
  rebuildSimpleTotalsFromCats 
} from "./categories-data-helpers.js";

export function deleteCategory(name) {
  const catName = String(name || "");
  if (!catName) return;

  let cats = getAllCategories();
  cats = ensureSystemOther(cats);

  const removed = cats.find((c) => (c?.name || "") === catName) || null;
  if (!removed) return;

  // 1) monthData laden
  let md = loadMonthData() || {};

  // 2) Affected years bepalen:
  const affectedYears = new Set();

  if (removed.years && typeof removed.years === "object") {
    Object.keys(removed.years).forEach((y) => {
      const n = Number(y);
      if (Number.isFinite(n)) affectedYears.add(n);
    });
  }

  for (const k of Object.keys(md)) {
    const entry = md[k];
    const ov = entry?._catDisplay?.[removed.type]?.overrides;
    if (!ov || typeof ov !== "object") continue;

    if (Object.prototype.hasOwnProperty.call(ov, catName)) {
      const year = Number(String(k).slice(0, 4));
      if (Number.isFinite(year)) affectedYears.add(year);
    }
  }

  // 3) Verwijderen uit cats
  cats = cats.filter((c) => (c?.name || "") !== catName);

  // 4) Verwijder month overrides voor deze categorie
  for (const k of Object.keys(md)) {
    const entry = md[k];
    const cd = entry?._catDisplay?.[removed.type];
    const ov = cd?.overrides;
    if (ov && typeof ov === "object" && Object.prototype.hasOwnProperty.call(ov, catName)) {
      delete ov[catName];
    }
  }

  // 5) Totals rebuilden (force for affectedYears to prevent stale _simple totals)
  const forceRebuild = {};
  affectedYears.forEach((y) => {
    if (!forceRebuild[y]) forceRebuild[y] = {};
    // Bank limit validation is based on net cashflow, so keep both types consistent.
    // This prevents stale simple totals when only one side is mutated.
    forceRebuild[y].income = true;
    forceRebuild[y].expense = true;
  });

  const rebuilt = rebuildSimpleTotalsFromCats({ cats, monthData: md, forceRebuild });
  cats = rebuilt.cats;
  md = rebuilt.monthData;

  // 6) Precommit banklimiet check
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

  // 7) Persist
  const displayName = String(removed?._displayName || removed?.name || catName || "").trim();
  const actionReason = `cat_delete:${String(removed?.type || "expense")}:${displayName}`;

  // IMPORTANT (boot-safe): pass explicit actionReason into the first storage write.
  // This guarantees the undo/redo feedback can show the category name even right after startup,
  // without relying on one-shot UI overrides.
  saveCats(cats, actionReason);
  saveMonthData(md, actionReason);
  syncSettingsCategoriesFromCats();
  resetCaches();

  triggerDataChanged();
  emitCategoriesChanged({ action: "delete", name: catName });
}

/**
 * Preview-only: returns the first bank limit violation that would occur
 * if the category were deleted. Returns null if deletion would not violate
 * the bank limit.
 *
 * IMPORTANT: This function does NOT persist any changes.
 */
export function previewDeleteCategoryLimitViolation(name) {
  const catName = String(name || "");
  if (!catName) return null;

  let cats = getAllCategories();
  cats = ensureSystemOther(cats);

  const removed = cats.find((c) => (c?.name || "") === catName) || null;
  if (!removed) return null;

  const md0 = loadMonthData() || {};

  // Determine affected years (same logic as deleteCategory)
  const affectedYears = new Set();
  if (removed.years && typeof removed.years === "object") {
    Object.keys(removed.years).forEach((y) => {
      const n = Number(y);
      if (Number.isFinite(n)) affectedYears.add(n);
    });
  }
  for (const k of Object.keys(md0)) {
    const entry = md0[k];
    const ov = entry?._catDisplay?.[removed.type]?.overrides;
    if (!ov || typeof ov !== "object") continue;
    if (Object.prototype.hasOwnProperty.call(ov, catName)) {
      const year = Number(String(k).slice(0, 4));
      if (Number.isFinite(year)) affectedYears.add(year);
    }
  }

  // Remove the category from cats (preview)
  let nextCats = cats.filter((c) => (c?.name || "") !== catName);

  // Remove month overrides for this category (preview, immutable)
  const nextMd = { ...md0 };
  for (const k of Object.keys(nextMd)) {
    const entry = nextMd[k];
    const cd = entry?._catDisplay?.[removed.type];
    const ov = cd?.overrides;
    if (!ov || typeof ov !== "object") continue;
    if (!Object.prototype.hasOwnProperty.call(ov, catName)) continue;

    // clone the nested structure minimally before deletion
    const entry2 = { ...(entry || {}) };
    const cdAll = { ...(entry2._catDisplay || {}) };
    const cdType = { ...((cdAll[removed.type] || {}) ) };
    const ov2 = { ...ov };
    delete ov2[catName];
    cdType.overrides = ov2;
    cdAll[removed.type] = cdType;
    entry2._catDisplay = cdAll;
    nextMd[k] = entry2;
  }

  // Rebuild totals and run bank limit precommit check
  const forceRebuild = {};
  affectedYears.forEach((y) => {
    if (!forceRebuild[y]) forceRebuild[y] = {};
    // Keep both sides consistent for bank limit validation
    forceRebuild[y].income = true;
    forceRebuild[y].expense = true;
  });

  const rebuilt = rebuildSimpleTotalsFromCats({ cats: nextCats, monthData: nextMd, forceRebuild });
  nextCats = rebuilt.cats;
  const rebuiltMd = rebuilt.monthData;

  return (
    precommitFindFirstCategoryLimitViolation({
      candidateCats: nextCats,
      previewMonthData: rebuiltMd,
    }) || null
  );
}