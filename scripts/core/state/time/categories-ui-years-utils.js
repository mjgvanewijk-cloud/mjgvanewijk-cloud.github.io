// scripts/core/state/categories-ui-years-utils.js
import { t } from "../../i18n.js";

/**
 * Zorgt dat de verwijder-knop disabled is als er maar 1 rij over is.
 */
export function updateRemoveButtonsState(container) {
  const blocks = container.querySelectorAll(".cat-year-block");
  blocks.forEach((block) => {
    const btn = block.querySelector(".remove-year-btn");
    if (btn) btn.disabled = false;
  });
}

export function getYearValueFromBlock(block) {
  return String(block.querySelector(".cat-year-val")?.value ?? "").trim();
}

// Parse helper (plain "1000,00" or formatted "€ 1.000,00").
export function parseDecimalOrZero(raw) {
  const n = parseMoneyInput(raw);
  return (n == null ? 0 : n);
}