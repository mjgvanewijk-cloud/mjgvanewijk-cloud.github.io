// scripts/ui/popup/saving-month/add-pot-sheet-edit-init.js
import { t, formatCurrency } from "../../../i18n.js";
import { bindRenameLogic } from "../../../core/state/categories-ui/sheet-rename-logic.js";
import { renderSavingYearRow } from "../../../core/state/saving-accounts-ui-years.js";
import { bindTrashButton } from "./add-pot-sheet-edit-trash.js";

export function initializeEditSheetUI({ root, existingAcc, accountId, y, handleClose, mode, yearRowOpts, yearsContainer }) {
  // Titel: bij openen via naam/potlood moet dit de spaarpotnaam bevatten.
  try {
    const titleEl = root.querySelector(".ff-popup__title");
    if (titleEl) {
      const nm = String(existingAcc?.name || "").trim();
      titleEl.textContent = nm ? t("saving_accounts.edit_named_title", { name: nm }) : t("saving_accounts.edit_title");
    }
  } catch (_) {}

  bindTrashButton(root.querySelector("#catNameStatic"), existingAcc, accountId, y, handleClose);
  bindRenameLogic(root, "saving", root.querySelector("#catNameStaticText"), root.querySelector("#catNameStatic"), root.querySelector("#catName"), root.querySelector("#catNameInputWrap"), root.querySelector("#catNameEditBtn"));

  // Edit-sheet: toon echte spaarpotnaam in de bovenste naam-row.
  try {
    const staticText = root.querySelector("#catNameStaticText");
    const nm = String(existingAcc?.name || "").trim();
    if (staticText) staticText.textContent = nm || t("common.name");
  } catch (_) {}

  // Bij openen via naam/potlood: direct in naam-bewerken modus.
  if (String(mode || "").toLowerCase() === "rename") {
    try { root.__ffCatSetNameEditing?.(true); } catch (_) {}
  }

  // Initialisatie velden
  const nameInp = root.querySelector("#catName"), startInp = root.querySelector("#savStartBalance");
  nameInp.value = String(existingAcc.name);
  startInp.value = formatCurrency(Number(existingAcc.startBalance));

  // Render jaren
  yearsContainer.innerHTML = "";
  const list = Object.keys(existingAcc.years || {}).sort((a,b) => a-b);
  if (!list.length) list.push(String(y));
  list.forEach(yy => renderSavingYearRow(yearsContainer, yy, Number(existingAcc.years[yy]||0), existingAcc.rates[yy]??null, yearRowOpts));
  
  return { nameInp, startInp };
}