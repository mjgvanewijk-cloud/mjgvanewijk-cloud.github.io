// scripts/core/state/categories-data-upsert-monthdata.js

import {
  solidifyLegacySimpleTotalsToOtherOverridesForYears,
} from "./categories-data-helpers.js";
import { moveOverridesName } from "./categories-data-transfers.js";

// Applies a category rename to all month overrides.
export function applyRenameToMonthData(md, fromName, toName) {
  const data = md && typeof md === "object" ? md : {};
  if (fromName && toName && fromName !== toName) {
    moveOverridesName(data, fromName, toName);
  }
  return data;
}

// IMPORTANT: legacy solidify must be based on the snapshot BEFORE this upsert,
// otherwise adding a 2nd category with 0 can cause Overig to suddenly become the full total.
export function maybeSolidifyLegacyTotals({ catsBeforeUpsert, prevCat, next, md }) {
  const data = md && typeof md === "object" ? md : {};
  const name = String(next?.name || "");
  if (!name || name === "Overig") return data;

  const catsBefore = Array.isArray(catsBeforeUpsert) ? catsBeforeUpsert : [];

  const hadAnyRealCatsForYearType = (year, type) => {
    const y = String(year);
    const t = String(type || "expense");
    return catsBefore.some((c) => {
      const n = String(c?.name || "");
      if (!n || n === "Overig") return false;
      if (String(c?.type || "expense") !== t) return false;
      const years = c?.years;
      return years && typeof years === "object" && Object.prototype.hasOwnProperty.call(years, y);
    });
  };

  const yearsToSolidify = new Set();
  if (prevCat?.years && typeof prevCat.years === "object") {
    Object.keys(prevCat.years).forEach((y) => yearsToSolidify.add(y));
  }
  if (next?.years && typeof next.years === "object") {
    Object.keys(next.years).forEach((y) => yearsToSolidify.add(y));
  }

  if (yearsToSolidify.size === 0) return data;

  const yearsFiltered = Array.from(yearsToSolidify.values()).filter((y) => {
    return !hadAnyRealCatsForYearType(y, next.type);
  });

  if (yearsFiltered.length > 0) {
    solidifyLegacySimpleTotalsToOtherOverridesForYears({
      monthData: data,
      years: yearsFiltered,
      type: next.type,
    });
  }

  return data;
}
