// scripts/core/state/categories-ui-html.js
import { t } from "../../i18n.js";
import { PENCIL_SVG, TRASH_SVG } from "../../ui/components/icons.js";

export function getCategorySheetHTML(isEdit, cat, opts = null) {
  const isFromMonth = !!(opts && opts.fromMonthCard);
  const theme = (opts && opts.themeType) ? String(opts.themeType) : null;
  const allowDelete = !!(opts && opts.allowDelete);

  const displayName = (cat && (cat._displayName || cat.displayName || cat.name)) ? String(cat._displayName || cat.displayName || cat.name) : "";

  // Titles
  // Requirement: edit sheets must always show "<naam> bewerken" (lowercase b) when a name is available.
  // Add sheets keep the generic "Categorie Toevoegen" title.
  let title = isEdit
    ? (displayName ? t("categories.edit_title_named_lower", { name: displayName }) : t("categories.edit_title"))
    : t("common.add_cat");

  const headerClass = isFromMonth ? "ff-popup__header ff-month-category-header" : "ff-popup__header ff-cat-header";
  const bodyClass = isFromMonth ? "ff-popup__body ff-month-category-body ff-cat-body" : "ff-popup__body ff-cat-body";
  const footerClass = isFromMonth ? "ff-popup__footer ff-month-category-footer ff-cat-footer" : "ff-popup__footer ff-cat-footer";

  // Name row (month-card style)
  const nameRow = isFromMonth ? `
    <div id="catNameStatic" class="ff-cat-name-row" style="--ff-month-cat-accent:${theme === "expense" ? "var(--apple-red)" : "var(--apple-green)"};">
      <div class="ff-cat-name-row__left">
        <span id="catNameStaticText" class="ff-cat-name-row__text">${displayName || t("common.name")}</span>
        <button type="button" class="ff-cat-name-row__pen" id="catNameEditBtn" aria-label="${t("common.edit")}">
          ${PENCIL_SVG}
        </button>
      </div>

      ${allowDelete ? `
        <button type="button" class="ff-cat-name-row__trash" id="catDeleteBtn" aria-label="${t("common.delete")}">
          ${TRASH_SVG}
        </button>
      ` : ``}
    </div>

    <div id="catNameInputWrap">
      <input id="catName" class="ff-input" type="text" placeholder="${t("categories.label_placeholder")}" value="${displayName}">
      <div class="ff-inline-error" id="catNameError" style="display:none; margin-top:10px;" role="alert" aria-live="polite">
        <span class="ff-inline-error__icon">${t("popups.error_icon")}</span>
        <span class="ff-inline-error__text"></span>
      </div>
    </div>
  ` : `
    <div class="ff-section">
      <label class="ff-field-label" for="catName">${t("common.name")}</label>
      <input id="catName" class="ff-input" type="text" placeholder="${t("categories.label_placeholder")}" value="${displayName}">
      <div class="ff-inline-error" id="catNameError" style="display:none; margin-top:10px;" role="alert" aria-live="polite">
        <span class="ff-inline-error__icon">${t("popups.error_icon")}</span>
        <span class="ff-inline-error__text"></span>
      </div>
    </div>
  `;

  // Type toggle
  const typeToggle = isFromMonth ? "" : `
    <div class="ff-section">
      <div class="ff-field-label">${t("categories.type_label")}</div>
      <div class="ff-segment ff-cat-segment" role="tablist" aria-label="${t("categories.type_label")}">
        <button type="button" id="typeExpense" class="ff-btn--toggle-micro ff-cat-type">${t("common.expense")}</button>
        <button type="button" id="typeIncome" class="ff-btn--toggle-micro ff-cat-type">${t("common.income")}</button>
      </div>
    </div>
  `;

  // Years section
  const yearsHeader = isFromMonth ? "" : `
    <div class="cat-years-columns">
      <div class="col-year"><span class="ff-field-label">${t("common.year")}</span></div>
      <div class="col-amount"><span class="ff-field-label">${t("categories.maand_bedrag")}</span></div>
    </div>
  `;

  // Build HTML
  return `
    <div class="${headerClass}">
      <h2 class="ff-popup__title">${title}</h2>
    </div>

    <div class="${bodyClass}">
      ${nameRow}

      ${typeToggle}

      ${isFromMonth ? "" : '<div class="ff-divider"></div>'}

      <div class="${isFromMonth ? "ff-cat-years" : "ff-section ff-cat-years"}">
        ${yearsHeader}
        <div id="catYearsContainer" class="cat-years-container"></div>

        ${isFromMonth ? "" : `
          <div class="add-year-row" style="margin-top:10px;">
            <button type="button" id="addYearBtn" class="ff-btn ff-btn--primary">+ ${t("common.add_year")}</button>
          </div>
        `}
      </div>
    </div>

    <div class="${footerClass}">
      ${isFromMonth ? `
        ${(!isEdit && theme === "saving") ? `
          <div class="ff-cat-type-row" role="tablist" aria-label="${t("categories.type_label")}">
            <button type="button" id="typeIncome" class="ff-btn ff-btn--secondary ff-cat-type">${t("common.income")}</button>
            <button type="button" id="typeExpense" class="ff-btn ff-btn--secondary ff-cat-type">${t("common.expense")}</button>
          </div>
        ` : ``}

        <div class="ff-cat-footer-row">
          <button type="button" id="addYearBtn" class="ff-btn ff-btn--primary ff-cat-add-year">+ ${t("common.add_year")}</button>
          <button type="button" id="saveCatBtn" class="ff-btn ff-btn--primary ff-cat-save">${t("common.save")}</button>
          <button type="button" id="closeCatSheet" class="ff-btn ff-btn--secondary ff-cat-cancel">${t("common.cancel")}</button>
        </div>
      ` : `
        <button type="button" id="saveCatBtn" class="ff-btn ff-btn--primary">${t("common.save")}</button>
        <button type="button" id="closeCatSheet" class="ff-btn ff-btn--secondary" style="margin-top:10px;">${t("common.cancel")}</button>
        <button type="button" id="removeOtherBtn" class="ff-btn ff-btn--secondary ff-cat-remove-btn" style="display:none;">${t("common.delete")}</button>
      `}
    </div>
  `;
}