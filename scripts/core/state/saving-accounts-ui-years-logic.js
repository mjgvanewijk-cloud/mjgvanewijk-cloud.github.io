// scripts/core/state/saving-accounts-ui-years-logic.js
import { parseDecimalOrZero, parseRate } from "./saving-accounts-ui-years-utils.js";

/**
 * Verzamelt alle ingevoerde waarden uit de container voor verwerking.
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