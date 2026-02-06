// scripts/core/engine/start.js
// ---------------------------------------------------------
// Start-helpers die GEEN afhankelijkheid hebben naar year-simulatie.
// Doel: circular imports voorkomen. [i18n geadapteerd 2025-12-22]
// ---------------------------------------------------------

import { loadSettings } from "../storage.js";
import { ensureSettings } from "./settings.js";

/**
 * Leest alleen een expliciet door de gebruiker ingesteld banksaldo-beginsaldo uit settings.
 * Retourneert null als er geen expliciete waarde is.
 *
 * @param {number} year
 * @returns {number|null}
 */
export function getUserBankStarting(year) {
  const settings = loadSettings() || {};
  const map = settings.yearBankStarting;

  if (map && typeof map === "object" && typeof map[year] === "number") {
    return map[year];
  }
  return null;
}

/**
 * Negatieve limiet (roodstaanlimiet) zoals opgeslagen in settings.
 */
export function getNegativeLimit() {
  const settings = ensureSettings();
  return settings.negativeLimit || 0;
}
