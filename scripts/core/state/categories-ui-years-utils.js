// scripts/core/state/categories-ui-years-utils.js
import { t } from "../../i18n.js";
import { parseMoneyInput } from "../../ui/popup/money-input.js";

export function updateRemoveButtonsState(container) {
  const blocks = [...container.querySelectorAll(".cat-year-block")];
  const disable = blocks.length <= 1;

  blocks.forEach((block) => {
    const btn = block.querySelector(".remove-year-btn");
    if (!btn) return;
    btn.disabled = disable;
    if (disable) btn.setAttribute("aria-disabled", "true");
    else btn.removeAttribute("aria-disabled");
  });
}

export function getYearValueFromBlock(block) {
  return String(block.querySelector(".cat-year-val")?.value ?? "").trim();
}

export function parseDecimalOrZero(raw) {
  const n = parseMoneyInput(raw);
  return (n == null ? 0 : n);
}