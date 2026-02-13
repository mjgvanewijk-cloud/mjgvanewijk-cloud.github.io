// scripts/ui/popup/saving-month/add-pot-sheet-edit-ui-events.js
import { clearSavingYearInlineErrors, addNewSavingYearRow } from "../../../core/state/saving-accounts-ui-years.js";
import * as Helpers from "./saving-pot-helpers.js";

export function bindEditSheetEvents({ root, handleClose, yearsContainer, yearRowOpts, nameInp, startInp, rateErr }) {
  const cancelBtn = root.querySelector("#cancelSavBtn");
  const addYearBtn = root.querySelector("#addSavYearBtn");

  if (cancelBtn) cancelBtn.onclick = (e) => { e?.preventDefault(); handleClose(); };
  if (addYearBtn) addYearBtn.onclick = (e) => {
    e?.preventDefault?.();

    // GEEN spinner bij '+ Jaar toevoegen' (alleen een rij toevoegen + focussen)
    clearSavingYearInlineErrors(yearsContainer);
    if (rateErr) rateErr.style.display = "none";
    const block = addNewSavingYearRow(yearsContainer, yearRowOpts);
    if (!block) return;

    const focusEl = block.querySelector(".cat-budget-input") || block.querySelector(".cat-year-input") || block.querySelector("input");
    const scrollIntoView = () => {
      try { block.scrollIntoView({ block: "end", inline: "nearest" }); } catch (_) {}
    };
    const focus = () => {
      try { focusEl?.focus?.({ preventScroll: true }); }
      catch (_) { try { focusEl?.focus?.(); } catch (_) {} }
    };

    try { requestAnimationFrame(() => { scrollIntoView(); focus(); }); } catch (_) { scrollIntoView(); focus(); }
    try { setTimeout(() => { scrollIntoView(); focus(); }, 0); } catch (_) {}
  };

  const hideErrors = () => {
    try { Helpers.hideNameInlineError(root); } catch (_) {}
    try { Helpers.hideStartInlineError(root); } catch (_) {}
    clearSavingYearInlineErrors(yearsContainer);
    if (rateErr) rateErr.style.display = "none";
  };
  
  if (nameInp) nameInp.addEventListener("input", hideErrors);
  if (startInp) {
    startInp.addEventListener("input", hideErrors);
    startInp.addEventListener("click", (e) => e.stopPropagation());
    startInp.addEventListener("pointerdown", (e) => e.stopPropagation());
  }
  if (yearsContainer) {
    yearsContainer.addEventListener("input", hideErrors);
    yearsContainer.addEventListener("click", hideErrors);
  }
  
  return { hideErrors };
}