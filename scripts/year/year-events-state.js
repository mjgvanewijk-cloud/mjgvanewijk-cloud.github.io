// scripts/year/year-events-state.js
import { currentYear, setCurrentYear } from "../core/state/index.js";
import { renderYear } from "./year-render.js";

let onDataChangedCallback = null;

// Guard to prevent stacking multiple year changes while a heavy render is running.
let isChangingYear = false;

function perfEnabled() {
  try { return localStorage.getItem("ff_perf") === "1"; } catch (_) { return false; }
}

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

/**
 * Change year by delta.
 * IMPORTANT: Navigating between years must NOT wipe engine caches.
 * Caches are invalidated on actual data mutations (income/expense/pots/categories/settings changes),
 * not on navigation. Otherwise performance degrades as you browse to higher years.
 */
export function changeYear(delta) {
  if (isChangingYear) return;
  isChangingYear = true;

  const t0 = perfEnabled() ? performance.now() : 0;

  const newYear = currentYear + delta;
  setCurrentYear(newYear);

  // Do NOT call resetCaches/resetAdapterCache here.
  // Navigation should reuse cached simulations to keep year browsing fast on iPhone.
  triggerDataChanged();

  if (t0) {
    const dt = performance.now() - t0;
    // eslint-disable-next-line no-console
    console.log(`[ff_perf] changeYear(${delta}) -> ${newYear} in ${Math.round(dt)}ms`);
  }

  isChangingYear = false;
}
