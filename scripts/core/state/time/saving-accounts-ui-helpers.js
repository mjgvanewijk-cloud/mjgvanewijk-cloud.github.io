import { t } from "../../i18n.js";

export function monthName(m) {
  return t(`months.${m}`) || "";
}

export function parseDecimalOrZero(raw) {
  const v = parseFloat(String(raw ?? "").replace(",", "."));
  return Number.isFinite(v) ? v : 0;
}