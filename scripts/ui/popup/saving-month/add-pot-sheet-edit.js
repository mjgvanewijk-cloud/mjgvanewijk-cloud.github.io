// scripts/ui/popup/saving-month/add-pot-sheet-edit.js
import { createPopupOverlay, createPopupContainer } from "../../popups.js";
import { getSavingAccountById } from "../../../core/state/saving-accounts-data.js";
import { loadMonthData } from "../../../core/storage/index.js";
import { clearSavingYearInlineErrors } from "../../../core/state/saving-accounts-ui-years.js";
import { getSavingPotSheetHTML } from "./saving-pot-ui-html.js";
import { getYearRowOpts } from "./add-pot-sheet-edit-year-handler.js";
import { moveFocusOutsideTable } from "../overlay.js";

// Module Imports
import { initializeEditSheetUI } from "./add-pot-sheet-edit-init.js";
import { bindEditSheetEvents } from "./add-pot-sheet-edit-ui-events.js";
import { bindSaveBtnLogic } from "./add-pot-sheet-edit-save-handler.js";

export function openEditSavingPotSheet({ id, year, mode, onComplete } = {}) {
  const y = Number(year) || new Date().getFullYear(), accountId = String(id || "").trim(), existingAcc = getSavingAccountById(accountId);
  if (!accountId || !existingAcc) return;

  const pendingWipeYears = new Set(), pendingRemoveYears = new Set(), pendingNoDefaultYears = new Set(), baseMd = loadMonthData() || {};
  const yearRowOpts = getYearRowOpts(baseMd, accountId, existingAcc, y, pendingWipeYears, pendingRemoveYears, pendingNoDefaultYears);

  const overlay = createPopupOverlay("ff-overlay-center");
  overlay.id = "savingPotAddOverlay";
  const root = createPopupContainer("ff-month-category-sheet ff-month-category-card ff-cat-edit-from-month ff-month-category-sheet--saving");

  // Helpcloud: force the correct help context for this sheet (used from Month cards AND Settings).
  // Avoid relying on localized titles to prevent wrong help (e.g. "Spaarpotjes: bedragen wijzigen").
  try {
    root.classList.add("saving-account-edit-sheet");
    root.dataset.ffHelpContext = "savingpot_edit";
  } catch (_) {}
  try { root.dataset.ffNoAutofocusName = "1"; } catch (_) {}

  const handleClose = () => { root.classList.remove("show"); setTimeout(() => overlay.remove(), 160); if (onComplete) onComplete(); };
  overlay.__ff_onCancel = handleClose; overlay.onclick = (e) => { if (e.target === overlay) handleClose(); };
  root.innerHTML = getSavingPotSheetHTML();

  const yearsContainer = root.querySelector("#savYearsContainer"), rateErr = root.querySelector("#savRateError");
  const { nameInp, startInp } = initializeEditSheetUI({ root, existingAcc, accountId, y, handleClose, mode, yearRowOpts, yearsContainer });
  const { hideErrors } = bindEditSheetEvents({ root, handleClose, yearsContainer, yearRowOpts, nameInp, startInp, rateErr });

  document.body.appendChild(overlay); overlay.appendChild(root);
  requestAnimationFrame(() => {
    root.classList.add("show"); try { moveFocusOutsideTable(); } catch (_) {}
    try {
      const visible = Array.from(yearsContainer.querySelectorAll(".sav-year-inline-error")).find((el) => {
        const d = (el?.style?.display || "").toLowerCase();
        return d && d !== "none";
      });
      if (visible) requestAnimationFrame(() => { try { visible.scrollIntoView({ block: "center", inline: "nearest" }); } catch (_) {} });
    } catch (_) {}
    requestAnimationFrame(() => { try { moveFocusOutsideTable(); } catch (_) {} });
  });

  bindSaveBtnLogic({ root, saveBtn: root.querySelector("#saveSavBtn"), yearsContainer, rateErr, nameInp, startInp, accountId, existingAcc, y, handleClose, hideErrors });
}