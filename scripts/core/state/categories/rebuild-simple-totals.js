// scripts/core/state/categories/rebuild-simple-totals.js

import { ensureYearsObj } from "../categories-data-helpers.js";
import { getYearAmountByType } from "./year-defaults.js";
import { monthKey, parseMonthKey } from "../time/month-key.js";

export function rebuildSimpleTotalsFromCats({ cats, monthData, forceRebuild }) {
  const arr = Array.isArray(cats) ? cats : [];
  const md = monthData && typeof monthData === "object" ? monthData : {};

  const force = (forceRebuild && typeof forceRebuild === "object") ? forceRebuild : null;

  // Verzamel jaren uit cats + monthData keys
  const years = new Set();
  arr.forEach((c) => {
    ensureYearsObj(c);
    Object.keys(c.years).forEach((y) => years.add(Number(y)));
  });
  Object.keys(md).forEach((k) => years.add(parseMonthKey(k).y));
  const yearsList = Array.from(years).filter(Number.isFinite).sort((a, b) => a - b);

  const types = ["expense", "income"];

  // Per (year,type) bepalen of we daadwerkelijk moeten rebuilden.
  // Als er geen year-defaults en geen overrides zijn, dan laten we bestaande _simpleIncome/_simpleExpense intact
  // (belangrijk voor Free-mode: categorie-acties in de ene kolom mogen de andere kolom niet resetten).
  const hasYearDefaults = {};
  for (const year of yearsList) {
    hasYearDefaults[year] = { expense: false, income: false };
    for (const c of arr) {
      if (!c || !c.name) continue;

      const cType = String(c.type || "expense");
      if (cType !== "expense" && cType !== "income") continue;
      if (c.years && typeof c.years === "object" && Object.prototype.hasOwnProperty.call(c.years, String(year))) {
        hasYearDefaults[year][cType] = true;
      }
    }
  }

  for (const year of yearsList) {
    for (let month = 1; month <= 12; month++) {
      const k = monthKey(year, month);
      if (!md[k] || typeof md[k] !== "object") md[k] = {};
      const entry = md[k];

      for (const type of types) {
        const ov = entry?._catDisplay?.[type]?.overrides;
        const overrides = ov && typeof ov === "object" ? ov : null;
        const hasOverrides = !!overrides && Object.keys(overrides).length > 0;

        const isForced = !!force?.[year]?.[type];
        const shouldRebuild = isForced || hasOverrides || !!hasYearDefaults?.[year]?.[type];
        if (!shouldRebuild) continue;
        let total = 0;

        // Alleen categorieën van dit type meenemen (geen cross-type pool-effect).
        for (const c of arr) {
          if (!c || !c.name) continue;
          const name = c.name;
          const cType = String(c.type || "expense");
          if (cType !== type) continue;

          let amt = 0;
          if (overrides && Object.prototype.hasOwnProperty.call(overrides, name)) {
            amt = Number(overrides[name]) || 0;
          } else {
            amt = getYearAmountByType(c, year, type);
          }

          total += Number.isFinite(amt) ? amt : 0;
        }

        if (type === "expense") entry._simpleExpense = Number(total) || 0;
        else entry._simpleIncome = Number(total) || 0;
      }
    }
  }

  return { cats: arr, monthData: md };
};
