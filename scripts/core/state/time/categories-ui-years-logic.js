// scripts/core/state/categories-ui-years-logic.js
import { loadCats, loadMonthData } from "../storage/index.js";
import { getYearValueFromBlock, parseDecimalOrZero } from "./categories-ui-years-utils.js";

export function collectYearsData(container) {
  const yearsData = {};
  container.querySelectorAll(".cat-year-block").forEach((block) => {
    const y = String(block.querySelector(".cat-year-val")?.value ?? "").trim();
    const b = parseDecimalOrZero(block.querySelector(".cat-budget-val")?.value);
    if (y) yearsData[y] = b;
  });
  return yearsData;
}

export function hasMonthOverridesForYear({ yearInt, type, name }) {
  const yi = Number(yearInt);
  if (!Number.isFinite(yi) || !name) return false;
  const md = loadMonthData() || {};
  const tKey = (type === "income") ? "income" : "expense";
  for (let m = 1; m <= 12; m++) {
    const key = `${yi}-${String(m).padStart(2, "0")}`;
    const entry = md?.[key];
    const overrides = entry?._catDisplay?.[tKey]?.overrides;
    if (overrides && typeof overrides === "object" && Object.prototype.hasOwnProperty.call(overrides, name)) {
      return true;
    }
  }
  return false;
}

export function buildCandidateCatsForLivePreview({ yearsContainer, ctx, selectedType, yearsAfterDeletion }) {
  const prevCats = Array.isArray(loadCats()) ? loadCats() : [];
  const sheetRoot = yearsContainer?.closest?.(".category-edit-sheet, .ff-month-category-sheet, .ff-popup") || yearsContainer?.closest?.("[id='categoryEditOverlay']") || null;
  const nameInput = sheetRoot ? sheetRoot.querySelector("#catName") : null;

  const originalName = String(ctx?.cat?.name || "").trim();
  const draftNameRaw = String(nameInput?.value ?? originalName ?? "").trim();
  const draftName = (ctx && ctx.isSystemOther) ? "Overig" : (draftNameRaw || "__draft__");

  const tSel = (selectedType === "income") ? "income" : "expense";

  const deepClone = (obj) => {
    try { if (typeof structuredClone === "function") return structuredClone(obj); } catch (_) {}
    try { return JSON.parse(JSON.stringify(obj)); } catch (_) {}
    return { ...(obj || {}) };
  };

  const base = (ctx && ctx.cat && typeof ctx.cat === "object") ? ctx.cat : { name: "", type: tSel, years: {}, labels: {} };
  const draftCat = deepClone(base);
  draftCat.name = draftName;

  if (ctx && ctx.isSystemOther) {
    if (!draftCat.yearsByType || typeof draftCat.yearsByType !== "object") draftCat.yearsByType = { income: {}, expense: {} };
    if (!draftCat.yearsByType.income || typeof draftCat.yearsByType.income !== "object") draftCat.yearsByType.income = {};
    if (!draftCat.yearsByType.expense || typeof draftCat.yearsByType.expense !== "object") draftCat.yearsByType.expense = {};
    draftCat.yearsByType[tSel] = yearsAfterDeletion || {};
    draftCat.years = draftCat.yearsByType.expense;
  } else {
    draftCat.type = tSel;
    draftCat.years = yearsAfterDeletion || {};
  }

  const out = [];
  for (const c of prevCats) {
    if (!c || typeof c !== "object") { out.push(c); continue; }
    const nm = String(c.name || "").trim();
    if (originalName && nm === originalName) continue;
    if (!originalName && nm === draftName) continue;
    out.push(c);
  }
  out.push(draftCat);
  return out;
}