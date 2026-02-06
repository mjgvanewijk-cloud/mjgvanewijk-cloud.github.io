// scripts/core/state/categories-ui/sheet-delete-logic.js
import { createPopupOverlay, createPopupContainer, openErrorPopup } from "../../../ui/popups.js";
import { t } from "../../../i18n.js";
import { setNextActionReason, buildUserReason } from "../../history/index.js";
import { deleteCategory, previewDeleteCategoryLimitViolation } from "../categories-data-delete.js";
import { prepareCategoryContext } from "./model.js";
import { openBankLimitNotPossibleSheet } from "./sheet-not-possible.js";

export function openDeleteConfirmSheet({ catName, displayName, themeType, onDeleted }) {
  const existingDel = document.getElementById("categoryDeleteOverlay");
  if (existingDel) existingDel.remove();
  const delOverlay = createPopupOverlay("ff-overlay-center");
  delOverlay.id = "categoryDeleteOverlay";

  // Delete confirmations must always use the premium/orange warning header (consistent with other
  // destructive / not-possible sheets). ThemeType is intentionally ignored here.
  const extra = [
    "ff-month-category-sheet",
    "ff-month-category-card",
    "ff-cat-delete-from-month",
    "ff-month-category-sheet--warning",
  ];

  const delRoot = createPopupContainer(extra.join(" "));
  delRoot.innerHTML = `
    <div class="ff-popup__header ff-month-category-header">
      <div class="ff-popup__title">${t("categories.delete_title_named", { name: displayName })}</div>
    </div>
    <div class="ff-popup__body ff-cat-delete-body">
      <div class="ff-cat-delete-message">${t("categories.delete_sheet_confirm", { name: displayName })}</div>
    </div>
    <div class="ff-popup__footer ff-cat-footer ff-cat-delete-footer">
      <button type="button" id="confirmDeleteCatBtn" class="ff-btn ff-btn--primary">${t("common.delete")}</button>
      <button type="button" id="cancelDeleteCatBtn" class="ff-btn ff-btn--secondary">${t("common.cancel")}</button>
    </div>
  `;

  const closeDelete = () => { delRoot.classList.remove("show"); setTimeout(() => delOverlay.remove(), 160); };
  delOverlay.onclick = (e) => { if (e.target === delOverlay) closeDelete(); };
  const cancelBtn = delRoot.querySelector("#cancelDeleteCatBtn");
  if (cancelBtn) cancelBtn.onclick = closeDelete;

  const confirmBtn = delRoot.querySelector("#confirmDeleteCatBtn");
  if (confirmBtn) {
    confirmBtn.onclick = async () => {
      try {
        setNextActionReason(buildUserReason("categories.delete", false));
        await deleteCategory(catName);
        closeDelete();
        if (onDeleted) onDeleted();
      } catch (err) {
        if (err && err.code === "FF_LIMIT_VIOLATION" && err.violation) {
          openBankLimitNotPossibleSheet(err.violation);
          return;
        }
        openErrorPopup({ title: t("common.error"), message: String(err?.message || err || "") });
      }
    };
  }
  delOverlay.appendChild(delRoot);
  document.body.appendChild(delOverlay);
  requestAnimationFrame(() => delRoot.classList.add("show"));
}

export function openDeleteSheet(name, onComplete = null, options = null) {
  const ctx = prepareCategoryContext({ name, initialType: null });
  const catName = String(ctx?.cat?.name || "").trim();
  const displayName = String(ctx?.cat?._displayName || ctx?.cat?.name || "").trim();
  if (!catName || ctx.isSystemOther) return false;

  try {
    const violation = previewDeleteCategoryLimitViolation(catName);
    if (violation) { openBankLimitNotPossibleSheet(violation); return true; }
  } catch (err) { console.error(err); }

  const themeType = (options && options.themeType) ? String(options.themeType) : String(ctx?.cat?.type || "");
  openDeleteConfirmSheet({ catName, displayName, themeType, onDeleted: onComplete });
  return true;
}