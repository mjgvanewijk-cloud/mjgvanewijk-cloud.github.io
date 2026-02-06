// scripts/core/state/categories-ui/save-handler-upsert-errors.js
import { t, formatCurrency } from "../../../i18n.js";
import { monthName } from "../categories-ui-helpers.js";
import { showCategoryYearInlineError } from "../categories-ui-years-errors.js";

export function handleUpsertCategoryError({ err, showNameError, yearsContainer, saveBtn }) {
  const msg = String(err?.message || "");
  const code = err?.code;

  if (msg.includes("FF_CAT_NAME_EXISTS") || code === "FF_CAT_NAME_EXISTS") {
    showNameError("categories.name_exists");
    return true;
  }
  if (msg.includes("FF_CAT_NAME_CONFLICT") || code === "FF_CAT_NAME_CONFLICT") {
    showNameError("categories.name_conflict");
    return true;
  }
  if (msg.includes("FF_CAT_NAME_RESERVED") || code === "FF_CAT_NAME_RESERVED") {
    showNameError("categories.name_reserved_system");
    return true;
  }
  if (msg.includes("FF_LIMIT_VIOLATION") || code === "FF_LIMIT_VIOLATION") {
    const v = err?.violation;
    if (v && yearsContainer) {
      showCategoryYearInlineError(
        yearsContainer,
        v.year,
        t("errors.bank_limit_reached", {
          month: `${monthName(v.month)} ${v.year}`,
          amount: formatCurrency(v.bank),
          limit: formatCurrency(v.limit),
        })
      );
    }
    if (saveBtn) saveBtn.disabled = true;
    return true;
  }

  return false;
}
