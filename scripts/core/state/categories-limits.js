// scripts/core/state/categories-limits.js
import { t, formatCurrency } from "../../i18n.js";
import { openErrorPopup } from "../../ui/popups.js";
import { simulateYear } from "../engine/index.js";

export function findFirstLimitViolation({ settings, yearFrom, yearTo }) {
  const limit = Number(settings?.negativeLimit ?? 0);
  if (!Number.isFinite(limit)) return null;

  for (let y = yearFrom; y <= yearTo; y++) {
    const sim = simulateYear(y, true, null, settings);

    const months = Array.isArray(sim?.months) ? sim.months : [];
    for (const m of months) {
      const bankStart = Number(m?.bankStart);
      const bankEnd = Number(m?.bankEnd);

      if (Number.isFinite(bankStart) && bankStart < limit) {
        return { year: y, month: m?.month || 1, bank: bankStart, limit };
      }
      if (Number.isFinite(bankEnd) && bankEnd < limit) {
        return { year: y, month: m?.month || 1, bank: bankEnd, limit };
      }
    }
  }

  return null;
}

export function showLimitViolationPopup({ violation }) {
  if (!violation) return;

  openErrorPopup({
    title: t("errors.title"),
    message: t("errors.bank_limit_reached", {
      month: `${t(`months.${violation.month}`)} ${violation.year}`,
      amount: formatCurrency(violation.bank),
      limit: formatCurrency(violation.limit),
    }),
  });
}
