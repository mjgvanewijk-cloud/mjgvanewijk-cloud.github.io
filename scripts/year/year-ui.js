// scripts/year/year-ui.js
// Bevat UI-functies die door year.js en year-render.js worden aangeroepen.

import { monthName } from "../core/state.js";
import { createPopupContainer } from "../ui/popups.js";

/**
 * Opent de overlay om een cel (inkomen/uitgave/sparen) te bewerken.
 * De volledige logica bevindt zich in year-monthly-edit.js
 */
export async function openCellEditOverlay(
  year,
  month,
  type,
  onDataChanged,
  initialAmount = null,
  context = null
) {
  try {
    const { openMonthEditPopup } = await import("./year-monthly-edit.js");
    openMonthEditPopup(year, month, type, onDataChanged, initialAmount, context);
  } catch (err) {
    console.error("Fout bij laden van edit-popup module:", err);
  }
}

export function updateYearButtons(type) {
  const depositBtn = document.getElementById("btnDeposit");
  const withdrawBtn = document.getElementById("btnWithdrawal");

  if (depositBtn) {
    depositBtn.classList.toggle("is-active-green", type === "deposit");
    depositBtn.classList.toggle("is-inactive-grey", type !== "deposit");
  }
  if (withdrawBtn) {
    withdrawBtn.classList.toggle("is-active-red", type === "withdrawal");
    withdrawBtn.classList.toggle("is-inactive-grey", type !== "withdrawal");
  }
}

export function handleYearSavingTypeClick(type, event) {
  if (event) {
    if (typeof event.preventDefault === "function") event.preventDefault();
    if (typeof event.stopPropagation === "function") event.stopPropagation();
  }

  import("./year-monthly-edit.js")
    .then((module) => {
      if (module.editContext) {
        module.editContext.savingMode = type;
        updateYearButtons(type);
      }
    })
    .catch((err) => console.error("Context update mislukt:", err));
}
