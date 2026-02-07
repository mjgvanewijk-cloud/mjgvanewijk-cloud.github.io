// scripts/core/state/saving-accounts-ui-years-utils.js
import { t } from "../../i18n.js";
import { parseMoneyInput } from "../../ui/popup/money-input.js";

/**
 * Parse helper voor numerieke geldbedragen.
 * Accepteert "1000,00" en geformatteerde valuta zoals "€ 1.000,00".
 */
export function parseDecimalOrZero(raw) {
  const n = parseMoneyInput(raw);
  return (n == null ? 0 : n);
}

/**
 * Parsed de rentevoet (max 2 decimalen).
 */
export function parseRate(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return { ok: true, value: null };

  const normalized = s.replace(".", ",");
  const reRate = /^\d{1,2}(,\d{1,2})?$/;
  if (!reRate.test(normalized)) return { ok: false, value: null };

  const val = parseFloat(normalized.replace(",", "."));
  if (!Number.isFinite(val)) return { ok: false, value: null };
  if (val < 0) return { ok: false, value: null };
  if (val > 99.99) return { ok: false, value: null };

  return { ok: true, value: val };
}

/**
 * Formatteert de rentevoet voor weergave met 2 decimalen.
 */
export function rateToDisplay(val) {
  if (val === null || val === undefined) return "";
  const n = Number(val);
  if (!Number.isFinite(n)) return "";
  return n.toFixed(2).replace(".", ",");
}