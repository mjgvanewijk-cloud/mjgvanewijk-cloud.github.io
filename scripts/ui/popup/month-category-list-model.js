// scripts/ui/popup/month-category-list-model.js

import { loadCats } from "../../core/storage/index.js";
import { getYearAmount } from "./month-category-logic.js";
import { getMonthCatDisplayState, saveCatsSafe, getPersistedScope } from "./month-category-store.js";

export function buildMonthCategoryListModel({ year, month, type, totalAmount, preview }) {
  const dotColor = type === "income" ? "var(--apple-green)" : "var(--apple-red)";
  const totalAbs = Math.abs(Number(totalAmount) || 0);
  const monthNum = Number(month) || 1;
  // Data ophalen (geen verplichte systeemcategorie meer)
  const catsRaw = loadCats();
  const cats = Array.isArray(catsRaw) ? catsRaw : [];

    const filtered = cats.filter((c) => (c?.type || "expense") === type);

  const realCats = filtered;
  const hasRealCats = realCats.length > 0;
  const isPreview = !!(preview && preview.enabled && preview.category);

  const monthDisplay = getMonthCatDisplayState(year, monthNum, type);
  const overrides =
    monthDisplay.overrides && typeof monthDisplay.overrides === "object"
      ? monthDisplay.overrides
      : null;

  // UX fallback (post-Overig):
  // Als er precies 1 categorie is en het maandtotaal != 0, maar er is geen override
  // en het jaar-default van die categorie is 0, dan toon het maandtotaal op die ene rij.
  // Dit voorkomt situaties waarin de maandkaart wel een bedrag toont maar de sheet 0 blijft tonen.
  const singleCat = realCats.length === 1 ? realCats[0] : null;
  const singleCatName = singleCat ? String(singleCat?.name || "") : "";
  const singleCatFallbackActive =
    !!singleCatName &&
    totalAbs !== 0 &&
    (!overrides || !Object.prototype.hasOwnProperty.call(overrides, singleCatName)) &&
    (Number(getYearAmount(singleCat, year, type)) || 0) === 0;

  const getDisplayAmount = (catObj, catName) => {
    const name = catName || catObj?.name || "";
    if (overrides && Object.prototype.hasOwnProperty.call(overrides, name)) {
      return Number(overrides[name]) || 0;
    }
    if (singleCatFallbackActive && name === singleCatName) {
      return totalAbs;
    }
    return getYearAmount(catObj, year, type);
  };

  const inferInitialScopeForCat = (catName, catObj, ov) => {
    const name = String(catName || "");
    if (!name) return "only";

    // 1) Persisted marker heeft voorrang
    const persisted = getPersistedScope(year, monthNum, type, name);
    if (persisted) return persisted;

    // Override in monthdata => "only"
    if (ov && Object.prototype.hasOwnProperty.call(ov, name)) return "only";

    // Jaar-default expliciet aanwezig => "year" (ook als 0)
    const yKey = String(year);
    const years = catObj && catObj.years && typeof catObj.years === "object" ? catObj.years : null;
    if (years && Object.prototype.hasOwnProperty.call(years, yKey)) return "year";

    return "only";
  };

  
  // Geen 'Overig' systeemcategorie meer.

  return {
    dotColor,
    totalAbs,
    monthNum,
    cats,
    realCats,
    hasRealCats,
    isPreview,
    overrides,
    getDisplayAmount,
    inferInitialScopeForCat,
  };
}