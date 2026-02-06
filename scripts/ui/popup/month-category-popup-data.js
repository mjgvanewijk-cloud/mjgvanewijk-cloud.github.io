// scripts/ui/popup/month-category-popup-data.js
import { getYearViewModel } from "../../core/adapter.js";

export function mk(y, m) {
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function getVM(year) {
  try {
    return getYearViewModel(year);
  } catch {
    return null;
  }
}

export function getLiveTotalForMonth(year, month, type) {
  const vm = getVM(year);

  // Belangrijk: onderscheid "onbekend" van een geldige waarde 0.
  // Anders blijft de popup bij opslaan van 0 terugvallen op oude totalAmount.
  if (!vm || !vm.months || !vm.months[month]) return null;

  const mo = vm.months[month];
  const raw = type === "income" ? mo.income : mo.expense;
  const v = Number(raw);
  return Number.isFinite(v) ? v : 0;
}
