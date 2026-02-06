// scripts/core/state/categories/system-other.js
//
// FinFlow (compat):
// - In sommige builds bestaat "Overig" nog als systeem-bucket (id: sys_other / sys_other_income).
// - Andere builds hebben dit ooit uitgezet als "simplification".
//
// Voor de huidige codebase moet Overig weer detecteerbaar zijn, omdat year-defaults voor
// income/expense in free/downgrade mode type-gescheiden worden opgeslagen (yearsByType).

const OTHER_NAME = "Overig";

/**
 * Compat: voorheen werd hier automatisch "Overig" geïnjecteerd.
 * Nu: geen mutatie, alleen normaliseren naar array.
 */
export function ensureSystemOther(cats) {
  return Array.isArray(cats) ? cats : [];
}

/**
 * Compat: er is geen systeemcategorie meer.
 */
export function getOtherSystemCategory(cats) {
  const arr = Array.isArray(cats) ? cats : [];
  return arr.find((c) => c && String(c.name || "") === OTHER_NAME) || null;
}

/**
 * Compat: geen systeemcategorie, dus altijd false.
 */
export function isSystemOther(cat) {
  if (!cat || typeof cat !== "object") return false;
  const id = String(cat.id || "").trim();
  const name = String(cat.name || "").trim();
  if (name !== OTHER_NAME) return false;
  // Legacy/system ids that are used in downgrade/free flows.
  if (id === "sys_other" || id === "sys_other_income") return true;
  // Fallback: explicit system flag (seen in older persisted data).
  if (cat.system === true) return true;
  return false;
}

/**
 * Compat: voorheen werd Overig-year-defaults geforceerd.
 * Nu: geen actie.
 */
export function ensureOtherYearsByType(target) {
  // Accept either a single category object or an array of categories.
  const cat = Array.isArray(target) ? getOtherSystemCategory(target) : target;
  if (!cat || typeof cat !== "object") return target;

  if (!cat.yearsByType || typeof cat.yearsByType !== "object") {
    cat.yearsByType = { income: {}, expense: {} };
  }
  if (!cat.yearsByType.income || typeof cat.yearsByType.income !== "object") cat.yearsByType.income = {};
  if (!cat.yearsByType.expense || typeof cat.yearsByType.expense !== "object") cat.yearsByType.expense = {};

  // Migrate legacy `years` into the correct typed map if yearsByType is still empty.
  const hasLegacyYears = cat.years && typeof cat.years === "object" && !Array.isArray(cat.years);
  const hasAnyTyped =
    Object.keys(cat.yearsByType.income).length > 0 || Object.keys(cat.yearsByType.expense).length > 0;
  if (hasLegacyYears && !hasAnyTyped) {
    const map = (String(cat.type || "expense") === "income") ? cat.yearsByType.income : cat.yearsByType.expense;
    for (const [y, v] of Object.entries(cat.years)) {
      const n = Number(v);
      if (!Number.isFinite(n)) continue;
      map[String(y)] = n;
    }
  }

  // Keep `years` aligned for legacy readers (years == map for this category type).
  const want = (String(cat.type || "expense") === "income") ? cat.yearsByType.income : cat.yearsByType.expense;
  cat.years = want;

  return target;
}
/**
 * Compat: oudere code verwachtte een years-object helper uit system-other.js.
 * Nu: geen systeemcategorie; we normaliseren alleen naar een plain object.
 */
export function ensureYearsObj(years) {
  return years && typeof years === "object" && !Array.isArray(years) ? years : {};
}
