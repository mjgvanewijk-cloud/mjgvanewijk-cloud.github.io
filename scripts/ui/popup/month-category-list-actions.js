// scripts/ui/popup/month-category-list-actions.js
import { t } from "../../i18n.js";
import { deleteCategory as deleteCategoryCore } from "../../core/state/categories-data.js";
import { 
  openConfirmPopupSafe, 
  openErrorPopupSafe, 
  openEditCategorySheetSafe 
} from "./month-category-logic.js";
import { deleteHint } from "./month-category-store.js";
import { showLimitViolation } from "./month-category-list-helpers.js";

export const createActions = ({ name, isSystem, year, month, type, onDataChanged, refreshSelf }) => ({
  onEdit: async () => {
    await openEditCategorySheetSafe(name, () => {
      if (typeof onDataChanged === "function") onDataChanged();
      if (typeof refreshSelf === "function") refreshSelf();
    }, type, { initialYear: year });
  },

  onDelete: async () => {
    if (isSystem) {
      await openErrorPopupSafe(
        t("categories.system_delete_block_title"),
        t("categories.system_delete_block_desc")
      );
      return;
    }

    await openConfirmPopupSafe({
      title: t("popups.delete_category_title"),
      message: t("popups.delete_category_confirm", { name }),
      confirmLabel: t("common.delete"),
      cancelLabel: t("common.cancel"),
      onConfirm: async () => {
        try {
          await deleteCategoryCore(name);
          deleteHint(year, month, type, name);

          if (typeof onDataChanged === "function") onDataChanged();
          if (typeof refreshSelf === "function") refreshSelf();
        } catch (err) {
          const code = String(err?.code || err?.message || "");
          if (code === "FF_LIMIT_VIOLATION") {
            await showLimitViolation(err?.violation);
            return;
          }
          console.error(err);
          await openErrorPopupSafe(
            t("errors.generic_title"),
            t("errors.generic_desc")
          );
        }
      },
    }, type);
}
});