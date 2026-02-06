// scripts/core/state/categories-ui/sheet-actions-logic.js
import { TRASH_SVG } from "../../../ui/components/icons.js";
import { t } from "../../../i18n.js";
import { openConfirmPopup, openErrorPopup } from "../../../ui/popups.js";
import { previewDeleteCategoryLimitViolation } from "../categories-data-delete.js";
import { resetOtherForType } from "../categories-data-reset-other.js";
import { openBankLimitNotPossibleSheet } from "./sheet-not-possible.js";
import { openDeleteConfirmSheet } from "./sheet-delete-logic.js";

export function bindCategoryDelete(root, ctx, name, theme, handleClose) {
  const delBtn = root.querySelector("#catDeleteBtn");
  if (!delBtn) return;

  delBtn.innerHTML = TRASH_SVG;
  if (!delBtn.getAttribute("aria-label")) {
    try { delBtn.setAttribute("aria-label", t("common.delete")); } catch(_) {}
  }
  delBtn.onclick = (e) => {
    e.preventDefault(); e.stopPropagation();
    try {
      const violation = previewDeleteCategoryLimitViolation(ctx?.cat?.name || name);
      if (violation) { openBankLimitNotPossibleSheet(violation); return; }
    } catch (err) { console.error(err); }
    openDeleteConfirmSheet({ 
      catName: ctx?.cat?.name, 
      displayName: ctx?.cat?._displayName || ctx?.cat?.name, 
      themeType: theme, 
      onDeleted: handleClose 
    });
  };
}

export function bindRemoveOther(root, ctx, handleClose) {
  const removeOtherBtn = root.querySelector("#removeOtherBtn");
  if (!removeOtherBtn || !ctx || !ctx.isSystemOther) return;

  removeOtherBtn.onclick = async (e) => {
    e.preventDefault(); e.stopPropagation();
    const tSel = (ctx.initialSelectedType === "income") ? "income" : "expense";
    openConfirmPopup({
      title: t("categories.other_remove_title"),
      message: t("categories.other_remove_desc", { type: tSel === "income" ? t("common.income") : t("common.expense") }),
      confirmLabel: t("common.delete"), cancelLabel: t("common.cancel"),
      onConfirm: async () => {
        try { resetOtherForType(tSel); handleClose(); } catch (err) {
          if (err?.code === "FF_LIMIT_VIOLATION") { openErrorPopup(t("errors.generic_title"), t("errors.generic_desc")); return; }
          openErrorPopup({ title: t("common.error"), message: String(err?.message || err || "") });
        }
      },
    });
  };
}