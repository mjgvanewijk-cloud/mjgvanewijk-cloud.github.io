// scripts/core/state/saving-accounts-ui-year-handler.js
import { t, formatCurrency } from "../../i18n.js";
import { collectSavingYearsAndRates } from "./saving-accounts-ui-render.js";
import { clearSavingYearInlineErrors, showSavingYearInlineError } from "./saving-accounts-ui-years.js";
import { precommitFindFirstSavingAccountLimitViolation, precommitFindFirstSavingAccountNegativeBalance } from "./saving-accounts-precommit-limit.js";
import { monthName, parseDecimalOrZero } from "./saving-accounts-ui-helpers.js";
import { hasMonthOverridesForYear } from "./saving-accounts-ui-guards.js";
import { openSavingYearDeletedKeepManualInfoSheet } from "./saving-accounts-ui-popups.js";

export const getYearRowOpts = (root, acc, isEdit, id) => ({
  onRequestRemove: ({ year, rawYear, remove, container } = {}) => {
    const yearsContainer = container;
    try { if (yearsContainer) clearSavingYearInlineErrors(yearsContainer); } catch (_) {}

    const yInt = Number(year);
    if (!Number.isFinite(yInt)) { remove?.(); return true; }

    const totalBlocks = yearsContainer ? yearsContainer.querySelectorAll(".sav-year-block").length : 0;
    if (totalBlocks <= 1) {
      if (yearsContainer) showSavingYearInlineError(yearsContainer, yInt, t("errors.cannot_delete_last_year"));
      return false;
    }

    const collected = collectSavingYearsAndRates(yearsContainer);
    const nextYears = { ...(collected?.years || {}) };
    const nextRates = { ...(collected?.rates || {}) };
    delete nextYears[String(yInt)]; delete nextRates[String(yInt)];

    const candidate = {
      id: acc?.id,
      name: String(root.querySelector("#savName")?.value || acc?.name || "").trim(),
      startBalance: parseDecimalOrZero(root.querySelector("#savStartBalance")?.value ?? acc?.startBalance ?? 0),
      years: nextYears,
      rates: nextRates,
    };

    const violation = precommitFindFirstSavingAccountLimitViolation({ updatedAccount: candidate, replaceId: isEdit ? acc.id : null });
    if (violation) {
      if (yearsContainer) showSavingYearInlineError(yearsContainer, violation.year, t("errors.bank_limit_reached", { month: `${monthName(violation.month)} ${violation.year}`, amount: formatCurrency(violation.bank), limit: formatCurrency(violation.limit) }));
      return false;
    }

    const neg = precommitFindFirstSavingAccountNegativeBalance({ updatedAccount: candidate, replaceId: isEdit ? acc.id : null });
    if (neg) {
      if (yearsContainer) showSavingYearInlineError(yearsContainer, neg.year, t("errors.saving_limit_reached", { month: `${monthName(neg.month)} ${neg.year}`, amount: formatCurrency(neg.saving) }));
      return false;
    }

    remove?.();
    if (hasMonthOverridesForYear(yInt, acc?.id || id)) openSavingYearDeletedKeepManualInfoSheet({ year: yInt });
    return true;
  },
});