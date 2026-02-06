// scripts/ui/popup/saving-year/sheet-shell.js
import { t } from "../../../i18n.js";
import { createPopupOverlay, createPopupContainer } from "../overlay.js";

export function createSavingYearShell({ year, onClose } = {}) {
  const overlay = createPopupOverlay("ff-overlay-center");
  // Modifier class for styling overrides specific to the read-only year overview.
  const popup = createPopupContainer("ff-month-category-sheet ff-month-category-sheet--saving ff-month-category-card ff-saving-year-sheet");

  popup.innerHTML = `
    <div class="ff-popup__header ff-month-category-header">
      <h2 class="ff-popup__title">${t("saving_year.title", { year: String(year) })}</h2>
    </div>

    <div class="ff-popup__body ff-month-category-body">
      <div class="ff-month-cat-list" id="ffSavingYearList"></div>
    </div>

    <div class="ff-popup__footer ff-month-category-footer" id="ffSavingYearFooter"></div>
  `;

  document.body.style.overflow = "hidden";

  const listEl = popup.querySelector("#ffSavingYearList");
  const footerEl = popup.querySelector("#ffSavingYearFooter");

  const finalizeClose = () => {
    document.body.style.overflow = "";
    overlay.remove();
    if (typeof onClose === "function") onClose();
  };

  return { overlay, popup, listEl, footerEl, finalizeClose };
}
