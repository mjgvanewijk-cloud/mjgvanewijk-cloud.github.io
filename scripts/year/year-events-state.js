// scripts/year/year-events-state.js
import { resetCaches } from "../core/engine/index.js";
import { currentYear, setCurrentYear } from "../core/state/index.js";
import { resetAdapterCache } from "../core/adapter.js";
import { renderYear } from "./year-render.js";

let onDataChangedCallback = null;

export function initYearEvents(onChange) {
  onDataChangedCallback = onChange;
}

export function triggerDataChanged() {
  if (typeof onDataChangedCallback === "function") {
    onDataChangedCallback();
  } else {
    renderYear();
  }
}

export function changeYear(delta) {
  const newYear = currentYear + delta;
  setCurrentYear(newYear);

  resetCaches();
  if (typeof resetAdapterCache === "function") resetAdapterCache();

  triggerDataChanged();
}