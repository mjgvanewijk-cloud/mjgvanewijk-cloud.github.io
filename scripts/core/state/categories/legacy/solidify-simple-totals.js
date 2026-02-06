// scripts/core/state/categories/legacy/solidify-simple-totals.js

import { monthKey } from "../../time/month-key.js";
import { ensureCatDisplay } from "../cat-display.js";

// Zorgt dat bestaande (legacy) maandtotalen niet verdwijnen zodra er in een jaar voor het eerst
// een echte categorie (niet-Overig) met year-defaults wordt toegevoegd.
// We zetten dan per maand éénmalig een Overig override (per type), gebaseerd op het bestaande _simple* totaal,
// maar alleen als die maand nog geen overrides heeft.
export function solidifyLegacySimpleTotalsToOtherOverridesForYears({ monthData, years, type }) {
  const md = monthData && typeof monthData === "object" ? monthData : {};
  const yList = Array.isArray(years) ? years : Array.from(years || []);
  const t = String(type || "expense");
  if (t !== "expense" && t !== "income") return { monthData: md, changed: false };

  let changed = false;

  for (const yRaw of yList) {
    const year = Number(yRaw);
    if (!Number.isFinite(year)) continue;

    for (let m = 1; m <= 12; m++) {
      const k = monthKey(year, m);
      const entry = md[k];
      if (!entry || typeof entry !== "object") continue;

      const raw = t === "income" ? Number(entry._simpleIncome) : Number(entry._simpleExpense);
      const abs = Math.abs(Number.isFinite(raw) ? raw : 0);
      if (!abs) continue;

      const existingOverrides = entry?._catDisplay?.[t]?.overrides;
      if (existingOverrides && typeof existingOverrides === "object" && Object.keys(existingOverrides).length > 0) {
        // Al categorie-gestuurd: niets doen.
        continue;
      }

      const ov = ensureCatDisplay(entry, t);
      if (Object.prototype.hasOwnProperty.call(ov, "Overig")) continue;

      ov["Overig"] = abs;
      if (!entry._catDisplay || typeof entry._catDisplay !== "object") entry._catDisplay = {};
      if (!entry._catDisplay[t] || typeof entry._catDisplay[t] !== "object") entry._catDisplay[t] = { overrides: ov };
      entry._catDisplay[t].solidified = true;
      changed = true;
    }
  }

  return { monthData: md, changed };
}

