// scripts/core/state/categories-ui.js
// Public wrappers used by settings + category management list.
// Keep these exports stable to avoid ESM import errors.
export { openSheet, openDeleteSheet } from "./categories-ui/sheet.js";

import {
  openSheet as _openSheet,
  openDeleteSheet as _openDeleteSheet,
} from "./categories-ui/sheet.js";

export function openNewCategorySheet(onComplete, initialType = null, options = null) {
  _openSheet(null, onComplete, initialType, options);
}

export function openEditCategorySheet(name, onComplete, initialType = null, options = null) {
  _openSheet(name, onComplete, initialType, options);
}

// Compatibility export: some modules import this specific name.
// Routes to the new delete-sheet flow (NOT confirm-popup).
export function openDeleteCategorySheet(name, onComplete = null, options = null) {
  _openDeleteSheet(name, onComplete, options);
}
