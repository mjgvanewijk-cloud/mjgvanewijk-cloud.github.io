import { t } from "../../i18n.js";

export function monthName(m) {
  return t(`months.${m}`) || "";
}

export function parseDecimalOrZero(raw) {
  const n = parseMoneyInput(raw);
  return (n == null ? 0 : n);
}