// scripts/wizard/services/start-values.js
import { loadSettings } from "../../core/storage/index.js";

/**
 * In close-modus (pre-startjaar / settings-edit) tonen we uitsluitend expliciet opgeslagen user-values.
 * Dit voorkomt dat je getters carry-over waarden tonen (zoals je “1” default bij sparen).
 */
export function getExplicitYearStartFromSettings(mapKey, year) {
  const s = loadSettings() || {};
  const map = s?.[mapKey];
  if (!map || typeof map !== "object") return null;
  if (!Object.prototype.hasOwnProperty.call(map, year)) return null;
  const n = Number(map[year]);
  return Number.isFinite(n) ? n : null;
}

export function getWizardStartValue(ctx, mapKey, year, fallbackGetter) {
  if (ctx.cancelMode === "close") {
    const explicit = getExplicitYearStartFromSettings(mapKey, year);
    return explicit !== null ? explicit : 0;
  }
  return typeof fallbackGetter === "function" ? fallbackGetter(year) : 0;
}
