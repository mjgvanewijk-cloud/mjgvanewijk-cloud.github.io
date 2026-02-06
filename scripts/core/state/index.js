// scripts/core/state/index.js
// Centrale hub voor de FinFlow state (Borging van het contract voorheen scripts/core/state.js)

import { t } from "../../i18n.js";

// --- CENTRALE VARIABELEN (Het geheugen van de app) ---
export let currentMonthKey = null;
export let currentYear = new Date().getFullYear();

/**
 * Initialiseert de maand sleutel op basis van de huidige datum.
 */
export function initCurrentMonthKey() {
  if (!currentMonthKey) {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    currentMonthKey = `${y}-${m}`;
  }
  return currentMonthKey;
}

export function setCurrentYear(y) {
  const n = Number(y);
  if (!Number.isFinite(n)) return;
  currentYear = n;
}

export function setCurrentMonthKey(key) {
  if (typeof key !== "string") return;
  currentMonthKey = key;
}

/**
 * Retourneert de afkorting van de maand via i18n.
 * @param {number} m - Maand nummer (1-12)
 */
export function monthName(m) {
  const months = t("common.months_short");
  if (Array.isArray(months) && months[m - 1]) {
    return months[m - 1];
  }
  return `m${m}`;
}

// --- EXPORT VAN SUB-MODULES (De Remap) ---
// Let op: We exporteren NIET de engine hier om circular loops te voorkomen.
// De rest van de app importeert de engine via scripts/core/engine/index.js
export * from "./categories.js";
export * from "./categories-list.js";
export * from "./saving-accounts.js";
export * from "./saving-accounts-list.js";
export * from "./premium.js";
export { 
  getStartingBankBalance, 
  getStartingSavingBalance 
} from "../engine/year.js";