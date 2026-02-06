// scripts/ui/popup/saving-month/row-helpers.js
import { t } from "../../../i18n.js";
import { parseMoneyInput } from "../money-input.js";

export function safeRadioName({ year, month, rowId }) {
  const safe = String(rowId || "")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_\-]/g, "");
  return `ff_scope_saving_${year}_${month}_${safe}`;
}

export function balanceAmountClass(balanceEnd) {
  const n = Number(balanceEnd || 0);
  if (Math.abs(n) < 0.005) return "";
  return "ff-amount-positive";
}

export function amountClassBySign(isNeg, abs) {
  const a = Number(abs || 0);
  if (Math.abs(a) < 0.005) return "";
  return isNeg ? "ff-amount-negative" : "ff-amount-positive";
}

export function flowLabelBySign(isNeg) {
  return isNeg ? t("saving_month.flow_withdraw") : t("saving_month.flow_save");
}

export function clearInlineError(editorEl) {
  const box = editorEl?.querySelector?.(".ff-month-cat-inline-error");
  const txt = editorEl?.querySelector?.(".ff-month-cat-inline-error-text");
  if (!box || !txt) return;
  box.style.display = "none";
  txt.textContent = "";
}

export function setInlineError(editorEl, message) {
  const box = editorEl?.querySelector?.(".ff-month-cat-inline-error");
  const txt = editorEl?.querySelector?.(".ff-month-cat-inline-error-text");
  if (!box || !txt) return;
  txt.textContent = String(message || "");
  box.style.display = message ? "flex" : "none";
}

export function getAbsFromInputValue(value, fallbackAbs) {
  const n = parseMoneyInput(String(value || ""));
  if (n == null) return Math.abs(Number(fallbackAbs) || 0);
  return Math.abs(n);
}
