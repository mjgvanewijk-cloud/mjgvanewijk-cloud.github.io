// scripts/core/state/categories-ui-years-popups.js
import { t } from "../../i18n.js";
import { openConfirmPopup } from "../../ui/popups.js";

/**
 * Info-sheet na verwijderen van een jaar waarbij handmatige maandbedragen bestaan.
 */
export function openCategoryYearDeletedKeepManualInfoSheet({ year } = {}) {
  openConfirmPopup({
    variant: "warning",
    title: t("categories.delete_year_done_title"),
    message: t("categories.delete_year_done_message", { year }),
    confirmLabel: t("common.close"),
    cancelLabel: null,
    onConfirm: () => {},
  });
}