// scripts/core/state/saving-accounts-list.js
import { createPopupOverlay, createPopupContainer } from "../../ui/popups.js";
import { getSavingAccountsOverviewHTML } from "./saving-accounts-list-html.js";
import { getSavingAccounts } from "./saving-accounts-data.js";
import { renderSavingAccountsList } from "./saving-accounts-renderer.js";

let onSheetCloseCallback = null;

export function openYearSavingAccountsSheet(onClose, opts = {}) {
  onSheetCloseCallback = onClose;

  const targetYear = Number(opts?.year) || new Date().getFullYear();
  const currentAccounts = Array.isArray(getSavingAccounts()) ? getSavingAccounts() : [];
  
  if (currentAccounts.length === 0) {
    import("../../ui/popup/saving-month/add-pot-sheet.js")
      .then((m) => {
        const fn = m?.openAddSavingPotSheet;
        if (typeof fn === "function") {
          fn({ year: targetYear, onComplete: () => { if (typeof onSheetCloseCallback === "function") onSheetCloseCallback(); } });
        } else {
          if (typeof onSheetCloseCallback === "function") onSheetCloseCallback();
        }
      })
      .catch(() => { if (typeof onSheetCloseCallback === "function") onSheetCloseCallback(); });
    return;
  }

  const overlayId = "yearSavingAccountsOverlay";
  let overlay = document.getElementById(overlayId);

  if (!overlay) {
    overlay = createPopupOverlay("ff-overlay-center");
    overlay.id = overlayId;

    const sheet = createPopupContainer(
      "ff-month-category-sheet ff-month-category-card ff-month-category-sheet--saving ff-all-rounded ff-cats-manage-sheet ff-savings-manage-sheet"
    );

    sheet.innerHTML = getSavingAccountsOverviewHTML();
    overlay.appendChild(sheet);
    document.body.appendChild(overlay);

    const finalizeAndClose = () => {
      overlay.remove();
      if (typeof onSheetCloseCallback === "function") onSheetCloseCallback();
    };
    overlay.__ff_onCancel = finalizeAndClose;

    overlay.onclick = (e) => {
      if (e.target === overlay) finalizeAndClose();
    };
    sheet.querySelector("#closeSavingAccountsSheet").onclick = (e) => {
      e?.preventDefault();
      finalizeAndClose();
    };

    sheet.querySelector("#addNewSavingAccountBtn").onclick = async (e) => {
      e?.preventDefault();
      overlay.classList.remove("show");

      try {
        const m = await import("../../ui/popup/saving-month/add-pot-sheet.js");
        const fn = m?.openAddSavingPotSheet;
        if (typeof fn === "function") {
          fn({
            year: targetYear,
            onComplete: () => {
              overlay.classList.add("show");
              renderSavingAccountsList(overlay, { year: targetYear });
            },
          });
          return;
        }
      } catch (err) {
        console.error(err);
      }

      overlay.classList.add("show");
      renderSavingAccountsList(overlay, { year: targetYear });
    };
  }

  overlay.classList.add("show");
  overlay.style.zIndex = "10001";
  renderSavingAccountsList(overlay, { year: targetYear });
}