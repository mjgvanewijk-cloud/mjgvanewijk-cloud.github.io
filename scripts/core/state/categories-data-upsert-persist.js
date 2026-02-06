// scripts/core/state/categories-data-upsert-persist.js

import {
  saveCats,
  saveMonthData,
} from "../storage/index.js";
import { resetCaches } from "../engine/index.js";
import { precommitFindFirstCategoryLimitViolation } from "./categories-precommit-limit.js";
import {
  emitCategoriesChanged,
  syncSettingsCategoriesFromCats,
  triggerDataChanged,
} from "./categories-data-store.js";

export function precommitAndPersist({ cats, md, next, originalName }) {
  const violation = precommitFindFirstCategoryLimitViolation({
    candidateCats: cats,
    previewMonthData: md,
  });
  if (violation) {
    const err = new Error("FF_LIMIT_VIOLATION");
    err.code = "FF_LIMIT_VIOLATION";
    err.violation = violation;
    throw err;
  }

  saveCats(cats);
  saveMonthData(md);
  syncSettingsCategoriesFromCats();
  resetCaches();

  triggerDataChanged();
  emitCategoriesChanged({
    action: originalName ? "update" : "add",
    name: next.name,
    originalName: originalName || null,
  });
}
