// scripts/core/state/saving-accounts-ui-helpers.js
import { t } from "../../i18n.js";
import { parseMoneyInput } from "../../ui/popup/money-input.js";

export function monthName(m) {
  return t(`months.${m}`) || "";
}

export function parseDecimalOrZero(raw) {
  const n = parseMoneyInput(raw);
  return (n == null ? 0 : n);
}