// scripts/core/state/categories-ui/sheet.js
import { createPopupOverlay, createPopupContainer } from "../../../ui/popups.js";
import { renderSheetContent } from "../categories-ui-render.js";
import { bindYearDeleteLogic } from "../categories-ui-years.js";
import { prepareCategoryContext } from "./model.js";
import { bindTypeToggle } from "./type-toggle.js";
import { bindSaveHandler } from "./save-handler.js";
import { undo } from "../../history/index.js";
import { bindRenameLogic } from "./sheet-rename-logic.js";
import { openDeleteSheet } from "./sheet-delete-logic.js";

// Module Imports
import { getSheetOverlayClass, getSheetPopupClasses, scrollExistingYearInlineError } from "./sheet-ui-logic.js";
import { bindCategoryDelete, bindRemoveOther } from "./sheet-actions-logic.js";
import { getYearDeletePlan } from "./sheet-year-helpers.js";

export { openDeleteSheet };

export function openSheet(name = null, onComplete = null, initialType = null, options = null) {
  const ctx = prepareCategoryContext({ name, initialType });
  const existing = document.getElementById("categoryEditOverlay");
  if (existing) existing.remove();

  const overlay = createPopupOverlay(getSheetOverlayClass(options));
  overlay.id = "categoryEditOverlay";
  const theme = (options && options.themeType) ? String(options.themeType) : null;

  const root = createPopupContainer(getSheetPopupClasses(options));
  const renderOpts = options ? { ...options } : null;
  if (renderOpts && renderOpts.fromMonthCard) {
    renderOpts.allowDelete = !!(ctx.isEdit && !ctx.isSystemOther);
  }

  renderSheetContent(root, ctx.isEdit, ctx.cat, renderOpts);

  if (options && options.fromMonthCard) {
    bindRenameLogic(root, theme, root.querySelector("#catNameStaticText"), root.querySelector("#catNameStatic"), root.querySelector("#catName"), root.querySelector("#catNameInputWrap"), root.querySelector("#catNameEditBtn"));
  }

  overlay.appendChild(root); document.body.appendChild(overlay);
  requestAnimationFrame(() => root.classList.add("show"));

  try { requestAnimationFrame(() => scrollExistingYearInlineError(root)); setTimeout(() => scrollExistingYearInlineError(root), 0); } catch (_) {}

  const handleClose = (meta = {}) => {
    const accepted = !!meta.accepted;
    if (ctx && ctx.__ffAutoCommitted && !accepted) { try { undo(); } catch (e) { console.error(e); } }
    document.removeEventListener("keydown", onKeyDown);
    root.classList.remove("show");
    setTimeout(() => overlay.remove(), 160);
    if (typeof onComplete === "function") onComplete();
  };

  const onKeyDown = (e) => { if (e.key === "Escape") { e.preventDefault(); handleClose({ accepted: false, source: "esc" }); } };
  document.addEventListener("keydown", onKeyDown);

  if (options && options.fromMonthCard) { bindCategoryDelete(root, ctx, name, theme, handleClose); }

  const toggleApi = bindTypeToggle({ root, lockType: ctx.lockType, initialSelectedType: ctx.initialSelectedType, onChange: (v) => {} });
  const pendingWipeYears = new Set(), pendingNoDefaultYears = new Set();
  const yearsContainer = root.querySelector("#catYearsContainer");

  if (yearsContainer) {
    bindYearDeleteLogic({ container: yearsContainer, ctx, getSelectedType: () => toggleApi.getSelectedType(), pendingWipeYears, pendingNoDefaultYears });
  }

  bindSaveHandler({ 
    root, ctx, getSelectedType: () => toggleApi.getSelectedType(), onClose: handleClose, 
    getYearDeletePlan: ({ updatedCat, ctx: _ctx, selectedType }) => getYearDeletePlan({ pendingWipeYears, updatedCat, ctx: _ctx, selectedType, toggleApi }) 
  });

  if (root.querySelector("#closeCatSheet")) root.querySelector("#closeCatSheet").onclick = () => handleClose({ accepted: false, source: "close" });
  overlay.onclick = (e) => { if (e.target === overlay) handleClose({ accepted: false, source: "overlay" }); };

  if (!(options && options.fromMonthCard)) { bindRemoveOther(root, ctx, handleClose); }
}