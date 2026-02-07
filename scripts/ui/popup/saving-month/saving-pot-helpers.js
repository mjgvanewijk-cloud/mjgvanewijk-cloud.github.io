// scripts/ui/popup/saving-month/saving-pot-helpers.js
import { t } from "../../../i18n.js";
import { parseMoneyInput } from "../money-input.js";

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
  const n = parseMoneyInput(raw);
  return (n == null ? 0 : n);
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