// scripts/year/year-settings-helpers.js

import { resetCaches } from "../core/engine/index.js";
import { currentYear } from "../core/state/index.js";

let onDataChangedCallback = null;

export function setOnDataChangedCallback(cb) {
  onDataChangedCallback = (typeof cb === "function") ? cb : null;
}

/**
 * Helper: Bepaalt het absolute startjaar van de administratie
 */
export function getAbsoluteStartYear(settings) {
  const allConfiguredYears = [
    ...Object.keys(settings.yearStarting || {}),
    ...Object.keys(settings.yearBankStarting || {}),
    ...Object.keys(settings.yearSavingStarting || {}),
  ]
    .map(Number)
    .filter((n) => !isNaN(n));

  return allConfiguredYears.length ? Math.min(...allConfiguredYears) : currentYear;
}

export function showTable() {
  const tableContainer = document.querySelector(".table-container");
  if (tableContainer) tableContainer.style.setProperty("display", "block", "important");
}

export function restoreAfterWizardCancel() {
  document.body.classList.remove("wizard-active");
  document.body.style.overflow = "";
  showTable();
}

export function handleSettingsUpdate() {
  resetCaches();
  showTable();
  if (onDataChangedCallback) onDataChangedCallback();
}
