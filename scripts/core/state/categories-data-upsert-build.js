// scripts/core/state/categories-data-upsert-build.js

import {
  ensureYearsObj,
} from "./categories-data-helpers.js";

export function buildNextCategory({ catClean, prevCat, newName }) {
  const next = ensureYearsObj({
    ...catClean,
    name: newName,
    type: String(catClean.type || prevCat?.type || "expense"),
    years: catClean.years || prevCat?.years || {},
  });

  // Historisch bestond er speciale 'Overig'-logica (yearsByType). Deze wordt niet meer
  // gebruikt voor nieuwe of geüpdatete categorieën. Eventuele legacy data blijft ongemoeid
  // in bestaande records, maar we bouwen hier geen speciale structuur meer op.

  return next;
}
