// scripts/core/state/categories-ui/save-handler-helpers.js

/**
 * Controleert of er handmatige aanpassingen zijn voor een categorie in een specifiek jaar.
 */
export function hasMonthOverridesForYear({ monthData, year, type, names } = {}) {
  const md = monthData && typeof monthData === "object" ? monthData : null;
  const y = Number(year);
  if (!md || !Number.isFinite(y)) return false;
  
  const typeKey = (String(type) === "income") ? "income" : "expense";
  const nameList = Array.isArray(names)
    ? names.map((n) => String(n || "").trim()).filter(Boolean)
    : [];
  if (!nameList.length) return false;

  for (let m = 1; m <= 12; m++) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    const o = md?.[key]?._catDisplay?.[typeKey]?.overrides;
    if (!o || typeof o !== "object") continue;
    for (const nm of nameList) {
      if (Object.prototype.hasOwnProperty.call(o, nm)) return true;
    }
  }
  return false;
}