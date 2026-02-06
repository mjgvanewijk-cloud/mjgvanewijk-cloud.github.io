// scripts/ui/popup/saving-month/saving-pot-helpers.js
import { t } from "../../../i18n.js";

export function monthName(m) {
  return t(`months.${m}`) || "";
}

export function normalizeName(v) {
  return String(v || "").trim();
}

export function isNameDuplicate(name, existingAccounts) {
  const n = normalizeName(name).toLowerCase();
  return (Array.isArray(existingAccounts) ? existingAccounts : []).some((a) => {
    const an = normalizeName(a?.name).toLowerCase();
    return !!an && an === n;
  });
}

export function parseDecimalOrZero(raw) {
  // Accept both plain "1000,00" and formatted currency like "€ 1.000,00".
  const cfg = {
    symbol: String(t("currency.symbol") || "€"),
    decimal: String(t("currency.decimalSeparator") || ","),
    thousand: String(t("currency.thousandSeparator") || "."),
  };

  let s = String(raw ?? "").trim();
  if (!s) return 0;

  // Remove currency symbol and non-breaking spaces.
  if (cfg.symbol) s = s.split(cfg.symbol).join("");
  s = s.replace(/\u00A0/g, " ").trim();

  // Remove thousand separators and normalize decimal separator to dot.
  if (cfg.thousand) {
    // Escape for regex.
    const th = cfg.thousand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    s = s.replace(new RegExp(th, "g"), "");
  }
  if (cfg.decimal && cfg.decimal !== ".") {
    const ds = cfg.decimal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    s = s.replace(new RegExp(ds, "g"), ".");
  }

  // Strip everything except digits, dot and minus.
  s = s.replace(/[^0-9.\-]/g, "");

  const v = parseFloat(s);
  return Number.isFinite(v) ? v : 0;
}

export function showInlineError(root, id, message) {
  const err = root.querySelector(id);
  if (!err) return;
  const txt =
    err.querySelector(".ff-inline-error__text") ||
    err.querySelector("span:last-child") ||
    null;
  if (txt) txt.textContent = String(message || "");
  err.style.display = "flex";
}

export function hideInlineError(root, id) {
  const err = root.querySelector(id);
  if (err) err.style.display = "none";
}

export function showNameInlineError(root, message) {
  showInlineError(root, "#catNameError", message);
  const inp = root.querySelector("#catName");
  if (inp) inp.setAttribute("aria-invalid", "true");
}

export function hideNameInlineError(root) {
  hideInlineError(root, "#catNameError");
  const inp = root.querySelector("#catName");
  if (inp) inp.removeAttribute("aria-invalid");
}

export function showStartInlineError(root, message) {
  showInlineError(root, "#savStartError", message);
  const inp = root.querySelector("#savStartBalance");
  if (inp) inp.setAttribute("aria-invalid", "true");
}

export function hideStartInlineError(root) {
  hideInlineError(root, "#savStartError");
  const inp = root.querySelector("#savStartBalance");
  if (inp) inp.removeAttribute("aria-invalid");
}