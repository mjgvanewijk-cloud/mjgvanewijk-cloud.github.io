// scripts/core/state/categories-ui/save-handler-preview-limit.js
import { loadMonthData } from "../../storage/index.js";
import { precommitFindFirstCategoryLimitViolation } from "../categories-precommit-limit.js";
import { rebuildSimpleTotalsFromCats } from "../categories-data-helpers.js";
import { applyUpsertPreview } from "../categories-ui-helpers.js";

function applyWipeYearOverridesToMonthData(md, { years = [], type = "expense", names = [] } = {}) {
  const yearList = Array.isArray(years) ? years.map((y) => Number(y)).filter(Number.isFinite) : [];
  if (!md || typeof md !== "object" || yearList.length === 0) return md;

  const typeKey = (type === "income") ? "income" : "expense";
  const nameList = Array.isArray(names) ? names.map((n) => String(n || "").trim()).filter(Boolean) : [];
  if (nameList.length === 0) return md;

  yearList.forEach((y) => {
    for (let m = 1; m <= 12; m++) {
      const key = `${y}-${String(m).padStart(2, "0")}`;
      const entry = md?.[key];
      const o = entry?._catDisplay?.[typeKey]?.overrides;
      if (!o || typeof o !== "object") continue;
      nameList.forEach((n) => {
        if (Object.prototype.hasOwnProperty.call(o, n)) {
          delete o[n];
        }
      });
    }
  });

  return md;
}

export function buildPreviewAndFindLimitViolation({ prevCats, updatedCat, ctx, selectedType , yearDeletePlan }) {
  const candidateCats = applyUpsertPreview(prevCats, updatedCat, ctx.isEdit ? ctx.cat.name : null);

  const baseMd = loadMonthData() || {};
  const mdClone = (typeof structuredClone === "function")
    ? structuredClone(baseMd)
    : JSON.parse(JSON.stringify(baseMd));

  // Optional: apply wipe-year action to preview monthData (so limit checks match actual commit)
  try {
    const plan = yearDeletePlan && typeof yearDeletePlan === "object" ? yearDeletePlan : null;
    const wipeYears = plan && Array.isArray(plan.wipeYears) ? plan.wipeYears : [];
    const wipeType = plan ? String(plan.type || selectedType || "expense") : String(selectedType || "expense");
    const wipeNames = plan && Array.isArray(plan.names) ? plan.names : [];
    if (wipeYears.length && wipeNames.length) {
      applyWipeYearOverridesToMonthData(mdClone, { years: wipeYears, type: wipeType, names: wipeNames });
    }
  } catch (_) {}

  const prevCat = ctx.isEdit
    ? (prevCats.find((c) => String(c?.name || "") === String(ctx.cat?.name || "")) || null)
    : null;

  const collectYears = (obj) =>
    Object.keys(obj || {}).map(Number).filter(Number.isFinite);

  const getYearsObjForType = (cat, t) => {
    if (!cat || typeof cat !== "object") return {};
    if (String(cat?.name || "") === "Overig") {
      const ybt = cat.yearsByType && typeof cat.yearsByType === "object" ? cat.yearsByType[t] : null;
      if (ybt && typeof ybt === "object") return ybt;
    }
    return (cat.years && typeof cat.years === "object") ? cat.years : {};
  };

  const affected = new Set([
    ...collectYears(getYearsObjForType(prevCat, selectedType)),
    ...collectYears(getYearsObjForType(updatedCat, selectedType)),
  ]);

  const prevType = ctx.isSystemOther ? String(selectedType || "expense") : String(prevCat?.type || updatedCat?.type || "expense");
  const nextType = ctx.isSystemOther ? String(selectedType || "expense") : String(updatedCat?.type || "expense");

  // Force rebuild voor betrokken jaren.
  // We rebuilden in principe alléén het geselecteerde type (income/expense),
  // omdat een preview-check voor uitgaven anders onbedoeld de inkomen-kolom kan
  // herberekenen/"terugzetten" in Free/Trial flows.
  //
  // Banklimiet-simulatie gebruikt uiteindelijk previewMd (met _simpleIncome/_simpleExpense).
  // Voor het niet-geselecteerde type laten we daarom de bestaande waarden intact,
  // tenzij ze sowieso al via overrides/year-defaults worden opgebouwd.
  const yearsList = Array.from(affected).filter(Number.isFinite).sort((a, b) => a - b);

  const forceRebuild = {};
  const tSel = (selectedType === "income") ? "income" : "expense";
  yearsList.forEach((y) => {
    forceRebuild[y] = { [tSel]: true };
  });

  const rebuiltPreview = rebuildSimpleTotalsFromCats({
    cats: candidateCats,
    monthData: mdClone,
    forceRebuild,
  });
  const previewMd = rebuiltPreview?.monthData || mdClone;

  const violation = precommitFindFirstCategoryLimitViolation({
    candidateCats,
    previewMonthData: previewMd,
  });

  return { violation, previewMd, candidateCats };
}
