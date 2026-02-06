// scripts/ui/popup/month-category-popup-dom.js

import { createPopupContainer } from "./overlay.js";

/**
 * Build the Month Category popup DOM.
 * Returns references used by the orchestrator.
 */
export function buildMonthCategoryPopupDOM({ type, title, addLabel, closeLabel }) {
  const popup = createPopupContainer(
    `ff-month-category-sheet ff-month-category-sheet--${type} ff-month-category-card`
  );

  popup.innerHTML = `
    <div class="ff-popup__header ff-month-category-header">
      <h2 class="ff-popup__title">${title}</h2>
    </div>

    <div class="ff-popup__body ff-month-category-body">
      <div id="ffMonthCatList" class="ff-month-cat-list"></div>
    </div>

    <div class="ff-popup__footer ff-month-category-footer">
      <button type="button" class="ff-btn ff-btn--primary" id="ffMonthCatAddBtn">${addLabel}</button>
      <button type="button" class="ff-btn ff-btn--secondary" id="ffMonthCatCloseBtn">${closeLabel}</button>
    </div>
  `;

  return {
    popup,
    listEl: popup.querySelector("#ffMonthCatList"),
    addBtn: popup.querySelector("#ffMonthCatAddBtn"),
    closeBtn: popup.querySelector("#ffMonthCatCloseBtn"),
  };
}

export function setAddButtonLabel(addBtn, label) {
  if (!addBtn) return;
  addBtn.textContent = label;
}
