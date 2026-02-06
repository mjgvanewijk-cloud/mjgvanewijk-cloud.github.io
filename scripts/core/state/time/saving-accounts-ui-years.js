// scripts/core/state/saving-accounts-ui-years.js
import { parseDecimalOrZero, parseRate, updateRemoveButtonsState } from "./saving-accounts-ui-years-utils.js";
import { clearSavingYearInlineErrors, showSavingYearInlineError } from "./saving-accounts-ui-years-errors.js";
import { renderSavingYearRow, addNewSavingYearRow } from "./saving-accounts-ui-years-render.js";

export { 
  clearSavingYearInlineErrors, 
  showSavingYearInlineError, 
  renderSavingYearRow, 
  addNewSavingYearRow, 
  parseDecimalOrZero 
};

/**
 * Verzamelt alle ingevoerde jaren en rentestanden uit de UI.
 */
export function collectSavingYearsAndRates(container) {
  const years = {};
  const rates = {};
  let rateOk = true;

  container.querySelectorAll(".sav-year-block").forEach((block) => {
    const y = String(block.querySelector(".cat-year-val")?.value ?? "").trim();
    if (!y) return;

    const rawAmt = String(block.querySelector(".cat-budget-val")?.value ?? "");
    const abs = Math.abs(parseDecimalOrZero(rawAmt));

    const mode = block.dataset.mode === "withdraw" ? "withdraw" : "save";
    years[y] = (mode === "withdraw") ? -abs : abs;

    const rawRate = String(block.querySelector(".sav-rate-input")?.value ?? "");
    const parsed = parseRate(rawRate);

    if (!parsed.ok) rateOk = false;
    if (parsed.ok && parsed.value !== null) rates[y] = parsed.value;
  });

  return { years, rates, rateOk };
}