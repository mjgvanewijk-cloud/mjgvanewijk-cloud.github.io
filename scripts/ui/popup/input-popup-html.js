// scripts/ui/popup/input-popup-html.js
import { t } from "../../i18n.js";

function getToggleHTML(showToggle, labels) {
  if (!showToggle) return "";
  return `
    <div class="ff-field-group" style="display:flex; gap:10px; width:100%; margin-top:10px;">
      <button type="button" id="btnPos" class="ff-btn ff-btn--toggle-micro" style="flex:1; min-width:0;">${labels.pos}</button>
      <button type="button" id="btnNeg" class="ff-btn ff-btn--toggle-micro" style="flex:1; min-width:0;">${labels.neg}</button>
    </div>
  `;
}

function getScopeHTML(showScope, labels) {
  if (!showScope) return "";
  return `
    <div class="ff-section" style="margin-top:14px;">
      <span class="ff-field-label">${t("popups.scope_hint")}</span>
      <div class="ff-scope-buttons" style="display:flex; flex-direction:column; gap:10px;">
        <button type="button" class="ff-btn ff-btn--scope active scope-btn" data-scope="month">${labels.month || t("popups.scope_month")}</button>
        <button type="button" class="ff-btn ff-btn--scope scope-btn" data-scope="fromNow">${labels.fromNow || t("popups.scope_from_now")}</button>
        <button type="button" class="ff-btn ff-btn--scope scope-btn" data-scope="all">${labels.all || t("popups.scope_all")}</button>
      </div>
    </div>
  `;
}

export function getInputPopupHTML(options) {
  const {
    displayTitle, displayMessage, displayLabel,
    type, safeValue,
    showToggle, toggleLabels,
    showScope, scopeLabels,
    okText, cancelText
  } = options;

  return `
    <div class="ff-sheet-handle"></div>

    <div class="ff-popup__header ff-cat-header">
      <h2 class="ff-popup__title">${displayTitle}</h2>
    </div>

    <div class="ff-popup__body ff-cat-body">
      <div class="ff-section">
        ${displayMessage ? `<p class="ff-popup__message" style="text-align:left; margin:0 0 12px;">${displayMessage}</p>` : ""}
        ${displayLabel ? `<label class="ff-field-label" for="popupGenericInput">${displayLabel}</label>` : ""}

        <input
          type="${type}"
          inputmode="${type === "number" ? "decimal" : "text"}"
          id="popupGenericInput"
          class="ff-input"
          value="${String(safeValue)}"
          step="any"
        />

        <div id="popupInlineError" class="ff-inline-error" role="alert" aria-live="polite" style="display:none; margin-top:10px;">
          <span class="ff-inline-error__icon">▲</span>
          <span id="popupInlineErrorText"></span>
        </div>

        ${getToggleHTML(showToggle, toggleLabels)}
      </div>

      ${getScopeHTML(showScope, scopeLabels)}
    </div>

    <div class="ff-popup__footer ff-cat-footer">
      <button class="ff-btn ff-btn--primary ff-btn--full" id="popupConfirmBtn" type="button">${okText}</button>
      <button class="ff-btn ff-btn--secondary ff-btn--full" id="popupCancelBtn" type="button">${cancelText}</button>
    </div>
  `;
}