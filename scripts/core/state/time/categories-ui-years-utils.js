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