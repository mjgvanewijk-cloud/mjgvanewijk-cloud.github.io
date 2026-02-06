// scripts/core/state/categories-list-sheet.js
import { createPopupOverlay, createPopupContainer } from "../../ui/popups.js";
import { getOverviewSheetHTML } from "./categories-list-html.js";
import { openNewCategorySheet } from "./categories.js";
import { resetCaches } from "../engine/index.js";
import { renderCategoriesList } from "./categories-list-render.js";

let onSheetCloseCallback = null;

export function openYearCategoriesSheet(onClose) {
  onSheetCloseCallback = onClose;

  const overlayId = "yearCategoriesOverlay";
  let overlay = document.getElementById(overlayId);

  if (!overlay) {
    // Centered sheet-engine overlay (same behavior as other sheets)
    overlay = createPopupOverlay("ff-overlay-center");
    overlay.id = overlayId;

    // Month-card styling with full rounded corners + premium blue header
    const sheet = createPopupContainer(
      "ff-month-category-sheet ff-month-category-card ff-month-category-sheet--saving ff-all-rounded ff-cats-manage-sheet"
    );

    sheet.innerHTML = getOverviewSheetHTML();
    overlay.appendChild(sheet);
    document.body.appendChild(overlay);

    const finalizeAndClose = () => {
      overlay.remove();
      if (typeof onSheetCloseCallback === "function") onSheetCloseCallback();
    };
    overlay.__ff_onCancel = finalizeAndClose;

    overlay.onclick = (e) => { if (e.target === overlay) finalizeAndClose(); };
    sheet.querySelector("#closeCategoriesSheet").onclick = (e) => { e?.preventDefault(); finalizeAndClose(); };

    sheet.querySelector("#addNewCategoryBtn").onclick = (e) => {
      e?.preventDefault();
      overlay.classList.remove("show");

      // Open "Nieuwe categorie" als month-category sheet (zelfde header/spacing als Inkomsten/Uitgaven)
      // met premium-blauwe header (saving theme) en type-toggle in footer.
      openNewCategorySheet(() => {
        resetCaches();
        overlay.classList.add("show");
        renderCategoriesList(overlay);
        requestAnimationFrame(() => sheet.classList.add("show"));
      }, null, { fromMonthCard: true, themeType: "saving" });
    };
  }

  overlay.classList.add("show");
  overlay.style.zIndex = "10001";
  renderCategoriesList(overlay);
}