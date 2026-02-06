// scripts/core/state/categories-ui/save-handler-events.js
import { clearCategoryYearInlineErrors } from "../categories-ui-years-errors.js";

export function bindSaveHandlerEvents({ yearsContainer, saveBtn, nameInput, hideNameError }) {
  const clearInlineLimit = (e) => {
    // Belangrijk: wis geen delete-validatiefouten bij het klikken op de verwijderknop.
    if (e && e.type === "click") {
      const btn = e.target && e.target.closest ? e.target.closest(".remove-year-btn") : null;
      if (btn) return;
    }
    if (yearsContainer) clearCategoryYearInlineErrors(yearsContainer);
    if (saveBtn) saveBtn.disabled = false;
  };

  if (yearsContainer) {
    yearsContainer.addEventListener("input", clearInlineLimit);
    yearsContainer.addEventListener("click", clearInlineLimit);
  }
  if (nameInput) {
    nameInput.addEventListener("input", hideNameError);
    nameInput.addEventListener("input", clearInlineLimit);
  }
  
  return { clearInlineLimit };
}