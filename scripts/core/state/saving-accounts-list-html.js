// scripts/core/state/saving-accounts-list-html.js
import { t } from "../../i18n.js";
import { PENCIL_SVG, TRASH_SVG } from "../../ui/components/icons.js";

export function getSavingAccountsOverviewHTML() {
  // Gebruik dezelfde sheet-engine layout als "Categorieën beheren"
  return `
    <div class="ff-popup__header ff-month-category-header">
      <h2 class="ff-popup__title">${t("saving_accounts.manage_title")}</h2>
    </div>

    <div id="savingAccountsList" class="ff-popup__body ff-month-category-body ff-cats-manage-body" role="list"></div>

    <div class="ff-popup__footer ff-month-category-footer ff-cats-manage-footer">
      <button id="addNewSavingAccountBtn" class="ff-btn ff-btn--primary">${t("saving_accounts.manage_add")}</button>
      <button id="closeSavingAccountsSheet" class="ff-btn ff-btn--secondary">${t("common.close")}</button>
    </div>
  `;
}

export function createSavingAccountRowHTML(acc, tFn = t) {
  const name = String(acc?.name || "");
  const rowId = String(acc?.id || acc?.name || "");
  const penColor = "var(--apple-blue)";

  return `
    <div class="ff-cats-manage-row ff-savings-manage-row" data-id="${rowId}" role="listitem">
      <button type="button" class="ff-cats-manage-edit" data-action="edit" aria-label="${tFn("common.edit")}">
        <span class="ff-cats-manage-name">${name}</span>
        <span class="ff-cats-manage-pen" style="color:${penColor};" aria-hidden="true">${PENCIL_SVG}</span>
      </button>

      <button type="button" class="ff-cats-manage-delete" data-action="delete" aria-label="${tFn("common.delete")}">
        <span class="ff-cats-manage-trash" aria-hidden="true">${TRASH_SVG}</span>
      </button>
    </div>
  `;
}
