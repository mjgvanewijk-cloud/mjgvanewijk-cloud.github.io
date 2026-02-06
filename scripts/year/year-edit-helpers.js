// scripts/year/year-edit-helpers.js
// Stable API voor year-edit-rebuild.js en aanverwante modules.
// Geen re-export ketens: exports staan hier direct, zodat import altijd werkt.

export function normalizeScope(scope) {
  const map = {
    month: "month",
    fromNow: "fromNow",
    future: "fromNow",
    all: "all",
    year: "all",
  };
  return map[scope] || "month";
}

export function getScopeRange(month, scope) {
  let start = month;
  let end = month;

  if (scope === "all") {
    start = 1;
    end = 12;
  } else if (scope === "fromNow") {
    start = month;
    end = 12;
  }

  return { start, end };
}

/**
 * Zorgt dat entry._catDisplay[type].overrides bestaat en geeft de overrides-map terug.
 * Belangrijk: year-edit-rebuild verwacht dat deze functie direct de overrides-objectmap retourneert.
 */
export function ensureOverrides(entry, type) {
  if (!entry || typeof entry !== "object") return {};

  const t = String(type || "expense");
  if (!entry._catDisplay || typeof entry._catDisplay !== "object") entry._catDisplay = {};
  if (!entry._catDisplay[t] || typeof entry._catDisplay[t] !== "object") entry._catDisplay[t] = {};
  if (!entry._catDisplay[t].overrides || typeof entry._catDisplay[t].overrides !== "object") {
    entry._catDisplay[t].overrides = {};
  }
  return entry._catDisplay[t].overrides;
}

/**
 * Haalt override op voor (type, catName) uit monthEntry.
 * Retourneert:
 * - number (ook 0) als er expliciet een override bestaat
 * - null als er geen override bestaat
 */
export function getOverrideAmount(monthEntry, type, catName) {
  if (!monthEntry || typeof monthEntry !== "object") return null;

  const t = String(type || "expense");
  const name = String(catName || "");
  if (!name) return null;

  const ov = monthEntry._catDisplay?.[t]?.overrides;
  if (!ov || typeof ov !== "object") return null;

  if (!Object.prototype.hasOwnProperty.call(ov, name)) return null;
  return Number(ov[name]) || 0;
}

/**
 * Haalt het jaar-default bedrag van een categorie op (cat.years[year]).
 */
export function getDefaultCatAmount(cat, year, type) {
  if (!cat || typeof cat !== "object") return 0;
  const y = String(year);

  // Overig: year-defaults kunnen per kolom verschillen
  if (String(cat?.name || "") === "Overig") {
    const t = String(type || "expense");
    const ybt = cat.yearsByType && typeof cat.yearsByType === "object" ? cat.yearsByType : null;
    const yrs = (ybt && ybt[t] && typeof ybt[t] === "object") ? ybt[t] : (cat.years && typeof cat.years === "object" ? cat.years : {});
    return Number(yrs[y] ?? 0) || 0;
  }

  const years = cat.years && typeof cat.years === "object" ? cat.years : {};
  return Number(years[y] ?? 0) || 0;
}

/**
 * Berekent maandtotaal als som van categoriebedragen (incl. Overig),
 * waarbij overrides voorrang hebben boven year-defaults.
 * Totale waarde is positief (abs), consistent met _simpleIncome/_simpleExpense gebruik.
 */
export function computeMonthTotalFromCats({ cats, monthEntry, year, type }) {
  const arr = Array.isArray(cats) ? cats : [];
  const t = String(type || "expense");
  let total = 0;

  // Defensive: "Overig" is a mandatory system bucket but can accidentally appear
  // multiple times in the categories list (e.g. duplicated by type or legacy data).
  // If we count it more than once, the month total can become exactly 2x (or more).
  // We therefore count "Overig" at most once per column.
  let overigCounted = false;

  for (const c of arr) {
    const name = String(c?.name || "");
    if (!name) continue;

    const isOverig = String(name).toLowerCase() === "overig";
    if (isOverig) {
      if (overigCounted) continue;
      overigCounted = true;
    }

    const cType = String(c?.type || "expense");
    // Overig (Systeem) telt altijd mee in de actieve kolom (income/expense),
    // ook al is het onderliggende categorie-object maar één keer opgeslagen.
    if (!isOverig && cType !== t) continue;

    // Use a stable key for Overig to avoid case-mismatch between stored overrides and cat names.
    const keyName = isOverig ? "Overig" : name;
    const ov = getOverrideAmount(monthEntry, t, keyName);

    let val;
    if (ov !== null) {
      const ovVal = Number(ov) || 0;
      if (isOverig && ovVal === 0) {
        // FIX: Overig override=0 mag een non-zero year-default niet blokkeren
        const defVal = Number(getDefaultCatAmount(c, year, t)) || 0;
        val = defVal !== 0 ? defVal : ovVal;
      } else {
        val = ovVal;
      }
    } else {
      val = getDefaultCatAmount(c, year, t) || 0;
    }
    total += Math.abs(Number(val) || 0);
  }

  return Number(total) || 0;
}
