// scripts/ui/popup/saving-month/add-pot-sheet-edit-ui.js
import { t, formatCurrency } from "../../../i18n.js";
import { clearSavingYearInlineErrors, showSavingYearInlineError } from "../../../core/state/saving-accounts-ui-years.js";
import * as Helpers from "./saving-pot-helpers.js";

export const showInlineNotPossibleForPreview = ({ previewRes, targetYearInt, yearsContainer }) => {
  if (!previewRes || previewRes.ok) return;
  const yi = Number(targetYearInt);
  const y = Number.isFinite(yi) ? yi : Number(previewRes?.violation?.year);

  try { clearSavingYearInlineErrors(yearsContainer); } catch (_) {}

  if (previewRes.kind === "bank") {
    const v = previewRes.violation;
    showSavingYearInlineError(yearsContainer, y, t("errors.bank_limit_reached", {
      month: `${Helpers.monthName(v.month)} ${v.year}`,
      amount: formatCurrency(v.bank),
      limit: formatCurrency(v.limit),
    }));
    return;
  }

  if (previewRes.kind === "bankNegative") {
    const v = previewRes.violation;
    showSavingYearInlineError(yearsContainer, y, t("messages.bank_negative_error", {
      month: `${Helpers.monthName(v.month)}`,
      year: v.year,
      amount: formatCurrency(v.bank),
    }));
    return;
  }

  if (previewRes.kind === "saving") {
    const v = previewRes.violation;
    showSavingYearInlineError(yearsContainer, y, t("errors.saving_limit_reached", {
      month: `${Helpers.monthName(v.month)} ${v.year}`,
      amount: formatCurrency(v.saving),
    }));
  }
};