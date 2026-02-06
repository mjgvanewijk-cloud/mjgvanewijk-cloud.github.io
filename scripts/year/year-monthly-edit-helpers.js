// scripts/year/year-monthly-edit-helpers.js
import { t, formatCurrency } from "../i18n.js";
import { precommitFindFirstCategoryLimitViolation } from "../core/state/categories-precommit-limit.js";

export function normalizeScope(scope) {
  const map = { month: "month", fromNow: "fromNow", future: "fromNow", all: "all", year: "all" };
  return map[scope] || "month";
}

export function getScopeRange(month, scope) {
  if (scope === "all") return { start: 1, end: 12 };
  if (scope === "fromNow") return { start: month, end: 12 };
  return { start: month, end: month };
}

export function checkBankLimitOrSetInlineError({ previewCats, previewMonthData, settings, type, setInlineError }) {
  // Banklimiet zit in settings.negativeLimit (0 is geldig; null/undefined = geen limiet)
  const raw = settings?.negativeLimit;
  if (raw === null || raw === undefined || raw === "") return true;
  const limit = Number(raw);
  if (!Number.isFinite(limit)) return true;

  const violation = precommitFindFirstCategoryLimitViolation({
    candidateCats: previewCats,
    previewMonthData,
  });

  if (!violation) return true;

  // precommit returns: { year, month, bank, limit }
  setInlineError?.(
    t("errors.bank_limit_reached", {
      month: `${t(`months.${violation.month}`)} ${violation.year}`,
      amount: formatCurrency(violation.bank),
      limit: formatCurrency(violation.limit),
    })
  );
  return false;
}