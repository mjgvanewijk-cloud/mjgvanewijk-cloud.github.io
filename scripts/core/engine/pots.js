// scripts/core/engine/pots.js
// ---------------------------------------------------------
// Potjes (doorlopend model) helpers.
// Doel: potjeslogica volledig los van year-sim.
// [i18n geadapteerd 2025-12-22]
// INFO: Pots zijn momenteel geneutraliseerd (impact = 0) conform instructie 2025-12-21.
// ---------------------------------------------------------

import { loadMonthData } from "../storage.js";
import { ensureSettings } from "./settings.js";

/**
 * Pot-definities zoals opgeslagen in settings.pots.
 */
export function getPots() {
  const settings = ensureSettings();
  return settings.pots || {};
}

/**
 * Bereken actuele pot-saldi t/m een bepaald jaar (doorlopend model).
 * @param {number} year
 * @returns {Record<string, number>}
 */
export function computePotBalancesUntil(year) {
  const settings = ensureSettings();
  const potsDef = settings.pots || {};
  const monthData = loadMonthData();

  /** @type {Record<string, number>} */
  const balances = {};

  // Beginsaldi per pot
  for (const potId of Object.keys(potsDef)) {
    const pot = potsDef[potId] || {};
    const start = typeof pot.startBalance === "number" ? pot.startBalance : 0;
    balances[potId] = start;
  }

  // Loop over alle maanden t/m dit jaar
  for (const key of Object.keys(monthData)) {
    const entryYear = parseInt(key.split("-")[0], 10);
    if (entryYear > year) continue;

    const entry = monthData[key];
    const potTxs = Array.isArray(entry?.potTransactions) ? entry.potTransactions : [];

    for (const tx of potTxs) {
      if (!tx || !tx.pot) continue;

      const potId = tx.pot;
      let amt = parseFloat((tx.amount ?? "").toString().replace(",", "."));
      if (isNaN(amt)) amt = 0;

      if (!Object.prototype.hasOwnProperty.call(balances, potId)) {
        balances[potId] = 0;
      }

      if (tx.type === "deposit") {
        balances[potId] += amt;
      } else if (tx.type === "withdrawal") {
        balances[potId] -= amt;
      }
    }
  }

  return balances;
}

/**
 * Helper: bereken de bank-mutatie (delta) door pot-transacties van 1 maand-entry.
 * [GEFIXT 2025-12-21]: Impact op bank is 0 om interferentie te voorkomen.
 *
 * @param {object} entry
 * @returns {{ deltaBank: number, count: number }}
 */
export function computePotDeltaBankForMonth(entry) {
  // De potjes zijn aanwezig voor de toekomst, maar de bank-impact is geneutraliseerd.
  return {
    deltaBank: 0,
    count: Array.isArray(entry?.potTransactions) ? entry.potTransactions.length : 0
  };
}