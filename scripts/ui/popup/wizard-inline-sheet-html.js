// scripts/ui/popup/wizard-inline-sheet-html.js

import { createPopupOverlay, createPopupContainer } from "./overlay.js";

export function buildWizardInlineSheetDOM({
  title,
  rowLabel,
  displayInputValue,
  showToggle,
  togglePosLabel,
  toggleNegLabel,
  confirmLabel,
  cancelLabel,
}) {
  // Gebruik exact dezelfde overlay-variant als de inkomsten/uitgaven sheets,
  // maar met een wizard-specifieke marker zodat keyboard/landscape fixes
  // alleen op deze 3 sheets toegepast worden.
  const overlay = createPopupOverlay("ff-overlay-center ff-overlay-wizard-inline");
  overlay.style.zIndex = "20050";

  const container = createPopupContainer(
    "ff-month-category-sheet ff-month-category-sheet--wizard ff-month-category-card"
  );

  container.innerHTML = `
    <div class="ff-popup__header ff-month-category-header">
      <h2 class="ff-popup__title">${title || ""}</h2>
    </div>

    <div class="ff-popup__body ff-month-category-body">
      <div class="ff-month-cat-list" style="padding:0;">
        <div class="ff-month-cat-item" style="gap:0;">
          <div class="ff-month-cat-group" style="--ff-month-cat-accent:#fff;">
            <div class="ff-month-cat-row ff-wizard-inline-row ff-row-static">
              <span class="ff-month-cat-left">
                <span class="ff-month-cat-name">${rowLabel || ""}</span>
              </span>

              <div class="ff-wizard-inline-input-wrap">
                <input
                  id="ffWizardInlineAmount"
                  class="ff-wizard-inline-input"
                  type="text"
                  inputmode="decimal"
                  autocomplete="off"
                  autocorrect="off"
                  spellcheck="false"
                  placeholder=""
                  value="${String(displayInputValue)}" 
                />        
              </div>
            </div>

            <div id="ffWizardInlineError" class="ff-inline-error" role="alert" aria-live="polite" style="display:none; margin:12px 14px 0;">
              <span class="ff-inline-error__icon">▲</span>
              <span id="ffWizardInlineErrorText"></span>
            </div>

          </div>
        </div>
      </div>
    </div>

    <div class="ff-popup__footer ff-month-category-footer">
      ${
        showToggle
          ? `
        <div class="ff-field-group ff-wizard-toggle" style="display:flex; gap:10px; width:100%; margin-bottom:10px;">
          <button type="button" id="ffWizardBtnPos" class="ff-btn ff-btn--toggle-micro" style="flex:1; min-width:0;">${togglePosLabel}</button>
          <button type="button" id="ffWizardBtnNeg" class="ff-btn ff-btn--toggle-micro" style="flex:1; min-width:0;">${toggleNegLabel}</button>
        </div>
      `
          : ""
      }
      <div class="ff-wizard-footer-row" style="display:flex; gap:10px; width:100%;">
        <button type="button" class="ff-btn ff-btn--primary" id="ffWizardConfirmBtn" style="flex:1; min-width:0;">${confirmLabel}</button>
        <button type="button" class="ff-btn ff-btn--secondary" id="ffWizardCancelBtn" style="flex:1; min-width:0;">${cancelLabel}</button>
      </div>
    </div>
  `;

  const prevBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  document.body.appendChild(overlay);
  overlay.appendChild(container);

  const input = container.querySelector("#ffWizardInlineAmount");
  const errorBox = container.querySelector("#ffWizardInlineError");
  const errorText = container.querySelector("#ffWizardInlineErrorText");
  const btnPos = container.querySelector("#ffWizardBtnPos");
  const btnNeg = container.querySelector("#ffWizardBtnNeg");

  return {
    overlay,
    container,
    prevBodyOverflow,
    input,
    errorBox,
    errorText,
    btnPos,
    btnNeg,
  };
}
