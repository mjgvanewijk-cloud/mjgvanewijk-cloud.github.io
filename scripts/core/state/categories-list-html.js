// scripts/core/state/categories-list-html.js
import { t } from "../../i18n.js";
import { PENCIL_SVG, TRASH_SVG } from "../../ui/components/icons.js";

export function getOverviewSheetHTML() {
  // Month-card/sheet-engine layout (centered + rounded via container classes)
  return `
    <div class="ff-popup__header ff-month-category-header">
      <h2 class="ff-popup__title">${t("wizard.menu.manage_categories")}</h2>
    </div>

    <div id="yearCategoriesList" class="ff-popup__body ff-month-category-body ff-cats-manage-body" role="list"></div>

    <div class="ff-popup__footer ff-month-category-footer ff-cats-manage-footer">
      <button type="button" class="ff-btn ff-btn--primary" id="addNewCategoryBtn">${t("common.add_cat")}</button>
      <button type="button" class="ff-btn ff-btn--secondary" id="closeCategoriesSheet">${t("common.close")}</button>
    </div>
  `;
}

export function createCategoryRowHTML(cat, tFn) {
  // NOTE: Filtering / virtual rows are handled upstream.
  const name = String(cat.__displayName || cat.label || cat.name || "");
  const type = (cat.type === "income") ? "income" : "expense";
  const rowId = String(cat.__rowId || cat.id || "");
  const penClass = type === "income" ? "is-income" : "is-expense";
  // Force the icon color deterministically per row.
  const penColor = type === "income" ? "#34c759" : "#ff3b30";
    const allowDelete = true;

  return `
    <div class="ff-cats-manage-row" data-id="${rowId}" data-type="${type}" role="listitem">
      <button type="button" class="ff-cats-manage-edit" data-action="edit" aria-label="${tFn("common.edit")}">
        <span class="ff-cats-manage-name">${name}</span>
        <span class="ff-cats-manage-pen ${penClass}" style="color:${penColor};" aria-hidden="true">${PENCIL_SVG}</span>
      </button>

      ${allowDelete ? `
        <button type="button" class="ff-cats-manage-delete" data-action="delete" aria-label="${tFn("common.delete")}">
          <span class="ff-cats-manage-trash" aria-hidden="true">${TRASH_SVG}</span>
        </button>
      ` : `<span class="ff-cats-manage-delete-placeholder" aria-hidden="true"></span>`}
    </div>
  `;
}