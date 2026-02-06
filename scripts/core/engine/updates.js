// scripts/core/engine/updates.js
// Opslag-mutaties voor maandwaarden + scope-distributie. [i18n geadapteerd 2025-12-22]
// Alles wat hier staat schrijft naar storage en reset daarna cache via resetCaches().
// [Update 2025-12-30] - Integratie van 'fromNow'/'all' scopes & geneutraliseerde pots.

import { loadMonthData, saveMonthData } from "../storage.js";
import { resetCaches } from "./cache.js";
import { simulateYear } from "./year.js";
import { ensureSettings } from "./settings.js";

/**
 * Past een "simple" waarde toe op een monthData map (IN MEMORY).
 * Neutraliseert 'savings' pots naar 0 volgens instructie 2025-12-21.
 */
function applySingleMonthValueToData(monthData, year, month, type, amount) {
  // Zorg voor juiste key format: YYYY-MM (maand 1-12)
  const mKey = month < 10 ? `0${month}` : month;
  const key = `${year}-${mKey}`;
  
  if (!monthData[key]) monthData[key] = {};
  const entry = monthData[key];

  if (type === "income") {
    entry._simpleIncome = Number(amount || 0);
  } else if (type === "expense") {
    entry._simpleExpense = Number(amount || 0);
  } else if (type === "saving") {
    const val = Number(amount || 0);

    // [INSTRUCTIE 2025-12-21]: Pots neutraliseren (0) om interferentie te voorkomen.
    // We gebruiken manualSaving als primair veld voor de jaaroverzicht-tabel.
    entry.savings = []; 
    entry.manualSaving = val;

    // Toekomstige uitbreiding: als pots weer actief worden, hier logica toevoegen.
    // Voor nu blijven ze 0 om berekeningen zuiver te houden.
  }
}

/**
 * Clone helper (structuredClone als beschikbaar).
 */
function cloneMonthData(obj) {
  try {
    return structuredClone(obj);
  } catch {
    return JSON.parse(JSON.stringify(obj || {}));
  }
}

/**
 * Hulpmiddel om start en eind maand te bepalen op basis van scope.
 * Ondersteunt: month, fromNow (future), all (year).
 */
function getScopeRange(month, scope) {
  let start = month;
  let end = month;

  if (scope === "all" || scope === "year") {
    start = 1;
    end = 12;
  } else if (scope === "fromNow" || scope === "future") {
    start = month;
    end = 12;
  } else if (scope === "month") {
    start = month;
    end = month;
  }

  return { start, end };
}

/**
 * Bouwt een preview monthData map met de scope toegepast (zonder storage te muteren).
 */
function buildPreviewMonthDataWithScope(year, month, type, amount, scope) {
  const base = loadMonthData() || {};
  const preview = cloneMonthData(base);
  const { start, end } = getScopeRange(month, scope);

  for (let m = start; m <= end; m++) {
    applySingleMonthValueToData(preview, year, m, type, amount);
  }

  return preview;
}

/**
 * Valideert: spaarsaldo mag nooit onder 0 komen na toepassen van een saving-edit.
 */
export function validateSavingNonNegative(year, month, amount, scope) {
  const preview = buildPreviewMonthDataWithScope(year, month, "saving", amount, scope);

  // Preview simulatie voert de berekening uit over het hele jaar
  const sim = simulateYear(year, true, preview);

  for (let i = 0; i < 12; i++) {
    const mo = sim.months[i];
    // Gebruik savingEnd (cumulatief saldo) voor de check
    const savingEnd = typeof mo.savingEnd === "number" ? mo.savingEnd : 0;

    if (savingEnd < -0.00001) {
      return { ok: false, month: i + 1, savingEnd };
    }
  }

  return { ok: true };
}

/**
 * Valideert: banksaldo mag nooit onder de limiet komen.
 */
export function validateBankLimitNotViolated(year, month, type, amount, scope) {
  const settings = ensureSettings();
  const limit = typeof settings?.negativeLimit === "number" ? settings.negativeLimit : 0;

  const preview = buildPreviewMonthDataWithScope(year, month, type, amount, scope);
  const sim = simulateYear(year, true, preview);

  for (let i = 0; i < 12; i++) {
    const mo = sim.months[i];
    const bankEnd = typeof mo.bankEnd === "number" ? mo.bankEnd : 0;

    if (bankEnd < limit - 0.00001) {
      return { ok: false, month: i + 1, bankEnd, limit };
    }
  }

  return { ok: true };
}

/**
 * Past de waarde toe over de gekozen scope en slaat op in storage.
 */
export function applyValueWithScope(year, month, type, amount, scope) { 
  const monthData = loadMonthData() || {};
  const { start, end } = getScopeRange(month, scope);

  for (let m = start; m <= end; m++) {
    applySingleMonthValueToData(monthData, year, m, type, amount);
  }

  saveMonthData(monthData);
  resetCaches();
}

/**
 * EXPORT ALIAS: Herstelt compatibiliteit met state-engine.js.
 */
export const updateSingleMonthValue = (year, month, type, amount) => {
  applyValueWithScope(year, month, type, amount, 'month');
};