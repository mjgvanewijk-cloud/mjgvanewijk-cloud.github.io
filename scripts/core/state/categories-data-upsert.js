// scripts/core/state/categories-data-upsert.js

import {
  loadMonthData,
} from "../storage/index.js";
import {
  getAllCategories,
} from "./categories-data-store.js";
import {
  ensureSystemOther,
  rebuildSimpleTotalsFromCats,
} from "./categories-data-helpers.js";
import {
  applyOtherPoolDelta,
} from "./categories-data-transfers.js";
import { isPremiumActiveForUI } from "./premium.js";

import {
  assertNoDuplicateName,
  findPrevCat,
  assertNoTypeConflict,
} from "./categories-data-upsert-guards.js";
import { buildNextCategory } from "./categories-data-upsert-build.js";
import {
  applyRenameToMonthData,
  maybeSolidifyLegacyTotals,
} from "./categories-data-upsert-monthdata.js";
import { precommitAndPersist } from "./categories-data-upsert-persist.js";


function applyWipeYearOverridesToMonthData(md, { years = [], type = "expense", name = null, names = null } = {}) {
  const yearList = Array.isArray(years) ? years.map((y) => Number(y)).filter(Number.isFinite) : [];
  if (!md || typeof md !== "object" || yearList.length === 0) return md;

  const typeKey = (type === "income") ? "income" : "expense";
  const nameList = Array.isArray(names) ? names.map((n) => String(n || "").trim()).filter(Boolean) : [];
  if (name && !nameList.includes(String(name))) nameList.push(String(name));
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

export function upsertCategory(cat, originalName = null, options = null) {
  const catClean = cat && typeof cat === "object" ? { ...cat } : {};
  const newName = String(catClean.name || "").trim();
  if (!newName) return;

  // Optie A: "Overig" is een gereserveerde systeemnaam.
  // Alleen bewerken van de bestaande systeemcategorie is toegestaan.
  if (newName === "Overig" && String(originalName || "") !== "Overig") {
    const e = new Error("FF_CAT_NAME_RESERVED");
    e.code = "FF_CAT_NAME_RESERVED";
    throw e;
  }

  if (newName === "Overig") catClean.system = true;

  // 1) Load + normalize
  let cats = getAllCategories();
  cats = ensureSystemOther(cats);

  // 1b) HARD GUARD (name uniqueness)
  assertNoDuplicateName({ cats, newName, originalName });

  // Snapshot BEFORE upsert (used for legacy solidify decision).
  const catsBeforeUpsert = Array.isArray(cats) ? cats.slice() : [];

  // 2) Prev
  const prevCat = findPrevCat({ cats, newName, originalName });

  // 2a) Build next
  const next = buildNextCategory({ catClean, prevCat, newName });

  // 2b) Guard: prevent same-name but different-type overwrites (income vs expense)
  assertNoTypeConflict({ cats, prevCat, next, originalName });

  const original = originalName ? String(originalName) : null;
  const originalExists = !!original && !!prevCat;
  const originalNameToUse = originalExists ? original : null;
  const originalNameFinal = (next.name === "Overig") ? null : originalNameToUse;
  const originalNameResolved = originalNameFinal;

  // 3) Upsert in array
  if (originalName) {
    const idx = cats.findIndex((c) => (c?.name || "") === originalName);
    if (idx >= 0) cats[idx] = next;
    else cats.push(next);
  } else {
    const idx = cats.findIndex((c) => (c?.name || "") === next.name);
    if (idx >= 0) cats[idx] = next;
    else cats.push(next);
  }

  // 4) Overig pool apply (Free/Trial UX)
  if (!isPremiumActiveForUI()) {
    cats = applyOtherPoolDelta({ cats, prevCat, nextCat: next });
  }

  // 5) monthData adjustments
  let md = loadMonthData() || {};
  if (originalNameResolved && originalNameResolved !== next.name) {
    md = applyRenameToMonthData(md, originalNameResolved, next.name);
  }


  // 5a) Optional: wipe month-overrides for specific years (used by year-delete flows in UI)
  try {
    const wipe = options && typeof options === "object" ? options.wipeYearOverrides : null;
    if (wipe && typeof wipe === "object") {
      const years = Array.isArray(wipe.years) ? wipe.years : [];
      const wipeType = String(wipe.type || (next?.type || "expense"));
      // After rename-to-monthdata, overrides should be under next.name already.
      md = applyWipeYearOverridesToMonthData(md, {
        years,
        type: wipeType,
        name: next?.name,
        names: wipe.names, // optional extra names to wipe (best-effort)
      });
    }
  } catch (_) {
    // best-effort only
  }

  // 5b) legacy solidify if this is the first real category for year+type (based on snapshot)
  md = maybeSolidifyLegacyTotals({ catsBeforeUpsert, prevCat, next, md });

  
  // 6) Totals rebuild
  // Force a rebuild for years where a year-default was removed.
  // Without this, a transition from "has defaults" -> "no defaults" can leave stale _simpleIncome/_simpleExpense values in monthData.
  const forceRebuild = {};
  try {
    const prev = prevCat && typeof prevCat === "object" ? prevCat : null;
    const nextCat = next && typeof next === "object" ? next : null;

    if (prev && nextCat) {
      const t = String(nextCat.type || prev.type || "expense");
      const removedYears = [];

      // Overig supports yearsByType; normal categories use years.
      if ((nextCat.name || "") === "Overig" && prev.yearsByType && nextCat.yearsByType) {
        const a = (prev.yearsByType?.[t] && typeof prev.yearsByType[t] === "object") ? prev.yearsByType[t] : {};
        const b = (nextCat.yearsByType?.[t] && typeof nextCat.yearsByType[t] === "object") ? nextCat.yearsByType[t] : {};
        Object.keys(a).forEach((y) => {
          if (!Object.prototype.hasOwnProperty.call(b, y)) removedYears.push(Number(y));
        });
      } else {
        const a = (prev.years && typeof prev.years === "object") ? prev.years : {};
        const b = (nextCat.years && typeof nextCat.years === "object") ? nextCat.years : {};
        Object.keys(a).forEach((y) => {
          if (!Object.prototype.hasOwnProperty.call(b, y)) removedYears.push(Number(y));
        });
      }

      removedYears.filter(Number.isFinite).forEach((y) => {
        if (!forceRebuild[y]) forceRebuild[y] = {};
        forceRebuild[y][t] = true;
      });
    }
  } catch (_) {
    // best-effort only
  }

  const rebuilt = rebuildSimpleTotalsFromCats({ cats, monthData: md, forceRebuild });
  cats = rebuilt.cats;
  md = rebuilt.monthData;

  // 7) Precommit limit check + persist + notifications
// 7) Precommit limit check + persist + notifications
  precommitAndPersist({ cats, md, next, originalName });
}
