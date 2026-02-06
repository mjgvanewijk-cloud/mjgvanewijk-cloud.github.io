// scripts/year/year-monthly-edit.js
import { saveMonthData, saveCats } from "../core/storage/index.js";
import { openInputPopup } from "../ui/popups.js";
import { t } from "../i18n.js";
import { resetCaches } from "../core/engine/index.js";
import { applyValueWithScope } from "../core/engine/updates.js";
import { getCurrentAmount, normalizeScope } from "./year-edit-data.js";
import { validateSavingUpdate, validateStandardUpdate } from "./year-edit-validation.js";

import { setNextActionReason, buildUserReason } from "../core/history/index.js";

import { applySavingChange, applyCategoryChange } from "./year-monthly-edit-logic.js";
import { rebuildYearTotalsFromCats } from "./year-edit-rebuild.js";

export { rebuildYearTotalsFromCats };

export function openMonthEditPopup(year, month, type, onDataChanged, initialAmountOverride = null, context = null) {
  const currentAmount = getCurrentAmount(year, month, type, initialAmountOverride);

  const isCategoryEditForTitle =
    context &&
    context.mode === "category" &&
    context.categoryName &&
    (type === "income" || type === "expense");

  const monthLabel = t(`months.${month}`);
  const baseTitle = `${t(`popups.${type === "saving" ? "savings" : type}_title`)} ${monthLabel} ${year}`;
  
  // GEWIJZIGD: Gebruik nu de volledige sleutel "popups.category_adjust_title"
  const title = isCategoryEditForTitle
    ? t("popups.category_adjust_title", {
        category: String(context.categoryName),
        month: monthLabel,
        year: String(year),
      })
    : baseTitle;

  openInputPopup({
    title,
    defaultValue: currentAmount !== 0 ? Math.abs(currentAmount) : 0,
    showToggle: type === "saving",
    toggleLabels: type === "saving"
      ? { pos: t("popups.deposit"), neg: t("popups.withdrawal") }
      : { pos: "+", neg: "-" },
    showScope: true,
    defaultNegative: currentAmount < 0,

    onConfirm: (val, isNeg, rawScope, options = {}) => {
      const { setInlineError } = options;
      const scope = normalizeScope(rawScope);
      const numericVal = Number(val) || 0;
      const signedInput = isNeg ? -Math.abs(numericVal) : Math.abs(numericVal);

      if (type === "saving") {
        const preview = applySavingChange(year, month, scope, numericVal, signedInput, setInlineError);
        if (!validateSavingUpdate(year, preview, setInlineError)) return false;
        setNextActionReason(buildUserReason("month-saving", false));
        saveMonthData(preview);
        resetCaches();
        if (typeof onDataChanged === "function") onDataChanged();
        return true;
      }

      const isCategoryEdit =
        context && context.mode === "category" && context.categoryName && (type === "income" || type === "expense");

      if (isCategoryEdit) {
        const result = applyCategoryChange(year, month, scope, signedInput, type, String(context.categoryName), setInlineError);
        if (!result) return false;
        setNextActionReason(buildUserReason("month-category", false));
        saveCats(result.previewCats);
        saveMonthData(result.previewMonthData);
        resetCaches();
        if (typeof onDataChanged === "function") onDataChanged();
        return true;
      }

      if (!validateStandardUpdate(year, month, type, signedInput, scope, setInlineError)) {
        return false;
      }
      setNextActionReason(buildUserReason(`month-${type}`, false));
      applyValueWithScope(year, month, type, signedInput, scope);
      if (typeof onDataChanged === "function") onDataChanged();
      return true;
    },
  });
}