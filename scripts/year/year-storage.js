// scripts/year/year-storage.js
import { loadSettings } from "../core/storage/index.js";
import { simulateYear } from "../core/engine/index.js";
import { formatNumberInput } from "./year-utils.js";

// Importeer de data-acties
import { 
  findLaterStartYear, 
  resolveFutureConflicts, 
  updateSavingsStartBalance, 
  updateBankStartBalance, 
  updateMonthlyAndLimit 
} from "./year-storage-data.js";

/**
 * Helper: Bepaalt of input verschilt van opgeslagen waarde
 */
function hasValueChanged(year, inputNum, storageKey, subKey = null) {
  const settings = loadSettings();
  let explicitRaw;
  
  if (subKey) {
    explicitRaw = settings[storageKey] && settings[storageKey][year];
  } else {
    explicitRaw = settings[storageKey];
  }

  const explicitNum = typeof explicitRaw === "number" 
    ? explicitRaw 
    : Number(String(explicitRaw || 0).replace(",", "."));

  if (isNaN(inputNum) && explicitRaw) return true;
  if (!isNaN(inputNum) && inputNum !== explicitNum) return true;
  
  return false;
}

/**
 * Handler voor Blur op Spaarrekening Beginsaldo
 */
export function handleSavingsBlur(currentYear, onDataChanged) {
  const sInput = document.getElementById("startingSavingsInput");
  if (!sInput) return;

  const sim = simulateYear(currentYear);
  const prev = sim.savingStart;
  const prevIsZero = prev === 0;

  let v = sInput.value.trim();
  let num = Number(v.replace(",", "."));

  // Check of er iets gewijzigd is t.o.v. settings
  if (!hasValueChanged(currentYear, num, "yearStarting", true)) {
    sInput.value = prevIsZero ? "" : formatNumberInput(prev);
    return;
  }
  
  if (!confirm("Weet je zeker dat je het beginsaldo spaarrekening wilt aanpassen?")) {
    sInput.value = prevIsZero ? "" : formatNumberInput(prev);
    return;
  }

  // Update Data
  updateSavingsStartBalance(currentYear, (v === "" || isNaN(num)) ? null : num);
  
  if (typeof onDataChanged === "function") onDataChanged();
}

/**
 * Handler voor Blur op Bankrekening Beginsaldo
 */
export function handleBankBlur(currentYear, onDataChanged) {
  const bInput = document.getElementById("startingBankInput");
  if (!bInput) return;

  const settings = loadSettings();
  const sim = simulateYear(currentYear);
  const prev = sim.bankStart;
  const prevIsZero = prev === 0;

  let v = bInput.value.trim();
  let num = Number(v.replace(",", "."));

  if (!hasValueChanged(currentYear, num, "yearBankStarting", true)) {
    bInput.value = prevIsZero ? "" : formatNumberInput(prev);
    return;
  }

  // Validatie: Negatieve Limiet
  const negLimit = typeof settings.negativeLimit === "number" ? settings.negativeLimit : 0;
  if (!isNaN(num) && num < -Math.abs(negLimit)) {
    const limText = negLimit !== 0 ? formatNumberInput(negLimit) : "0,00";
    alert(`Dit beginsaldo is lager dan je ingestelde limiet voor negatief banksaldo (\u20ac ${limText}).`);
    bInput.value = prevIsZero ? "" : formatNumberInput(prev);
    return;
  }

  if (!confirm("Weet je zeker dat je het beginsaldo bankrekening wilt aanpassen?")) {
    bInput.value = prevIsZero ? "" : formatNumberInput(prev);
    return;
  }

  // Conflictoplossing: Bestaan er latere startjaren?
  const existingLaterYear = findLaterStartYear(settings, currentYear);
  if (!isNaN(num) && v !== "" && existingLaterYear && currentYear < existingLaterYear) {
    const msg = `Beginsaldo is al ingesteld voor ${existingLaterYear}.\nWil je ${currentYear} als het nieuwe startjaar markeren en de latere instellingen resetten?`;
    if (!confirm(msg)) {
      bInput.value = prevIsZero ? "" : formatNumberInput(prev);
      return;
    }
    // Roep complexe logica aan in data-module
    resolveFutureConflicts(currentYear);
  }

  // Update Data
  updateBankStartBalance(currentYear, (v === "" || isNaN(num)) ? null : num);

  if (typeof onDataChanged === "function") onDataChanged();
}

/**
 * Slaat inputs op (Maandelijks Sparen & Limieten)
 */
export function saveYearInputs(currentYear, yearMonthlyType, onDataChanged) {
  // 1. Lees Maandelijks Sparen
  const msInput = document.getElementById("monthlySavingAmount");
  let monthlyVal = null;
  if (msInput) {
    const raw = msInput.value.trim();
    const parsed = Number(raw.replace(",", "."));
    if (raw !== "" && !isNaN(parsed)) monthlyVal = parsed;
  }

  // 2. Lees Limiet
  const negInput = document.getElementById("negativeLimitInput");
  let limitVal = null;
  if (negInput) {
    const raw = negInput.value.trim();
    const parsed = Number(raw.replace(",", "."));
    if (raw !== "" && !isNaN(parsed)) limitVal = parsed;
  }

  // 3. Update Data
  const changed = updateMonthlyAndLimit(currentYear, monthlyVal, yearMonthlyType, limitVal);
  
  if (changed && typeof onDataChanged === "function") {
    onDataChanged();
  }
}