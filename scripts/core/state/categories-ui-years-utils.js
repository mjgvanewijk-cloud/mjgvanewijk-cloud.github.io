// scripts/core/state/categories-ui-years-utils.js
import { t } from "../../i18n.js";

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
  const cfg = {
    symbol: String(t("currency.symbol") || "€"),
    decimal: String(t("currency.decimalSeparator") || ","),
    thousand: String(t("currency.thousandSeparator") || "."),
  };
  let s = String(raw ?? "").trim();
  if (!s) return 0;
  s = s.replace(cfg.symbol, "").replace(/\s/g, "");
  if (cfg.thousand) s = s.split(cfg.thousand).join("");
  if (cfg.decimal && cfg.decimal !== ".") s = s.replace(cfg.decimal, ".");
  s = s.replace(/[^0-9.\-]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}