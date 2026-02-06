// scripts/ui/popup/saving-month-popup-helpers.js
import { t } from "../../i18n.js";

export function formatRateForUI(rate) {
  const n = Number(rate);
  if (!Number.isFinite(n)) return "0";
  return String(n).replace(".", ",");
}

export function flowLabelKey(flow) {
  return flow < 0 ? "saving_month.flow_withdraw" : "saving_month.flow_save";
}

export function amountClassForFlow(flow) {
  return flow < 0 ? "ff-amount-negative" : "ff-amount-positive";
}

export function buildInterestLabel(rate) {
  return t("saving_month.interest_label", { rate: formatRateForUI(rate ?? 0) });
}

export function parseSignedAmount(val, isNeg) {
  const numeric = Number(String(val).replace(",", ".")) || 0;
  const abs = Math.abs(numeric);
  return isNeg ? -abs : abs;
}
