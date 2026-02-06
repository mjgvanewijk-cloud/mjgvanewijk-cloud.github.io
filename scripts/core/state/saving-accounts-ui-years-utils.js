// scripts/core/state/saving-accounts-ui-years-utils.js
import { t } from "../../i18n.js";

/**
 * Parse helper voor numerieke geldbedragen.
 * Accepteert "1000,00" en geformatteerde valuta zoals "€ 1.000,00".
 */
export function parseDecimalOrZero(raw) {
  const cfg = {
    symbol: String(t("currency.symbol") || "€"),
    decimal: String(t("currency.decimalSeparator") || ","),
    thousand: String(t("currency.thousandSeparator") || "."),
  };

  let s = String(raw ?? "").trim();
  if (!s) return 0;

  if (cfg.symbol) s = s.split(cfg.symbol).join("");
  s = s.replace(/\u00A0/g, " ").trim();

  if (cfg.thousand) {
    const th = cfg.thousand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    s = s.replace(new RegExp(th, "g"), "");
  }
  if (cfg.decimal && cfg.decimal !== ".") {
    const ds = cfg.decimal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    s = s.replace(new RegExp(ds, "g"), ".");
  }

  s = s.replace(/[^0-9.\-]/g, "");
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : 0;
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