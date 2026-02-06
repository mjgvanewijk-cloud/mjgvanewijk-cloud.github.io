// scripts/core/state/categories-data-transfers.js
import { 
  ensureSystemOther, 
  ensureYearsObj, 
  getYearAmount,
  setYearAmount,
  getYearAmountByType,
  setYearAmountByType,
  ensureOtherYearsByType,
  ensureCatDisplay 
} from "./categories-data-helpers.js";

export function moveOverridesName(monthData, oldName, newName) {
  if (!oldName || !newName || oldName === newName) return;
  const md = monthData && typeof monthData === "object" ? monthData : {};
  const types = ["expense", "income"];

  for (const k of Object.keys(md)) {
    const entry = md[k];
    if (!entry || typeof entry !== "object") continue;

    for (const type of types) {
      const ov = entry?._catDisplay?.[type]?.overrides;
      if (!ov || typeof ov !== "object") continue;
      if (!Object.prototype.hasOwnProperty.call(ov, oldName)) continue;

      const v = Number(ov[oldName]) || 0;
      const ov2 = ensureCatDisplay(entry, type);
      const cur = Number(ov2[newName]) || 0;
      ov2[newName] = cur + v;
      delete ov2[oldName];
    }
  }
}

export function transferDeletedToOther({ cats, monthData, deletedCatName }) {
  const arr = ensureSystemOther(cats);
  const other = arr.find((c) => (c?.name || "") === "Overig");
  ensureYearsObj(other);
  ensureOtherYearsByType(other);

  const removed = arr.find((c) => (c?.name || "") === deletedCatName);
  if (!removed) return { cats: arr, monthData };

  // 1) Transfer year defaults -> Overig
  ensureYearsObj(removed);
  const removedType = String(removed?.type || "expense");
  for (const y of Object.keys(removed.years)) {
    const v = Number(removed.years[y]) || 0;
    if (!v) continue;
    const cur = getYearAmountByType(other, y, removedType);
    setYearAmountByType(other, y, removedType, cur + v);
  }

  // 2) Transfer month overrides -> Overig overrides
  const md = monthData && typeof monthData === "object" ? monthData : {};
  const types = ["expense", "income"];

  for (const k of Object.keys(md)) {
    const entry = md[k];
    if (!entry || typeof entry !== "object") continue;

    for (const type of types) {
      const ov = entry?._catDisplay?.[type]?.overrides;
      if (!ov || typeof ov !== "object") continue;
      if (!Object.prototype.hasOwnProperty.call(ov, deletedCatName)) continue;

      const v = Number(ov[deletedCatName]) || 0;
      const ov2 = ensureCatDisplay(entry, type);
      ov2["Overig"] = (Number(ov2["Overig"]) || 0) + v;
      delete ov2[deletedCatName];
    }
  }

  return { cats: arr, monthData: md };
}

export function applyOtherPoolDelta({ cats, prevCat, nextCat }) {
  // Optie A (alleen binnen hetzelfde type):
  // - bij +delta: eerst uit Overig halen (tot 0)
  // - bij -delta: terugboeken naar Overig
  const arr = ensureSystemOther(cats);

  // Belangrijk: Overig-pool mag NOOIT een andere kolom/type beïnvloeden.
  // Daarom passen we de pool alleen toe wanneer de gewijzigde categorie hetzelfde type heeft
  // als de Overig-categorie die we kunnen vinden (nu: expense).
  const changeType = String(nextCat?.type || prevCat?.type || "expense");
  const other = arr.find((c) => (c?.name || "") === "Overig");
  if (!other) return arr;

  ensureYearsObj(other);
  ensureOtherYearsByType(other);

  const years = new Set();
  if (prevCat?.years && typeof prevCat.years === "object") Object.keys(prevCat.years).forEach((y) => years.add(String(y)));
  if (nextCat?.years && typeof nextCat.years === "object") Object.keys(nextCat.years).forEach((y) => years.add(String(y)));

  for (const yStr of years) {
    const y = Number(yStr);
    if (!Number.isFinite(y)) continue;

    const prev = getYearAmount(prevCat, y);
    const next = getYearAmount(nextCat, y);
    const delta = next - prev;
    if (!delta) continue;

    const curOther = getYearAmountByType(other, y, changeType);

    if (delta > 0) {
      const used = Math.min(delta, curOther);
      const newOther = curOther - used;
      setYearAmountByType(other, y, changeType, newOther);
      // remainder (delta-used) verhoogt totaal (Overig is op)
    } else {
      // delta < 0: vrijgekomen bedrag terug naar Overig
      setYearAmountByType(other, y, changeType, curOther + Math.abs(delta));
    }
  }

  return arr;
}