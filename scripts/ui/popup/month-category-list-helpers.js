// scripts/ui/popup/month-category-list-helpers.js
import { t, formatCurrency } from "../../i18n.js";
import { ensureSystemOther, openErrorPopupSafe } from "./month-category-logic.js";
import { loadCats } from "../../core/storage/index.js";

export const monthLabel = (monthNr, yearNr) => {
  const mKey = `months.${String(monthNr ?? "").trim()}`;
  const mName = t(mKey);
  return `${mName} ${yearNr}`;
};

export const showLimitViolation = async (violation) => {
  if (!violation) return;
  const label = monthLabel(violation.month, violation.year);
  await openErrorPopupSafe(
    t("errors.base_item_protected_title"),
    t("errors.bank_limit_reached", {
      month: label,
      amount: formatCurrency(violation.bank),
      limit: formatCurrency(violation.limit),
    })
  );
};

export const getOtherDisplayName = (catsForLookup, type) => {
  const defaultKey =
    type === "income"
      ? "popups.other_system_label_income"
      : "popups.other_system_label_expense";

  try {
    const base = Array.isArray(catsForLookup)
      ? catsForLookup
      : ensureSystemOther(loadCats());

    const other = base.find((c) => (c?.name || "") === "Overig");
    const labels = other?.labels;

    const lbl =
      labels && typeof labels === "object"
        ? String(labels[type] || "").trim()
        : "";

    return lbl ? lbl : t(defaultKey);
  } catch (_) {
    return t(defaultKey);
  }
};