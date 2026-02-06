// scripts/ui/popup/confirm-popup.js

import { t } from "../../i18n.js";
import { createPopupOverlay, createPopupContainer } from "./overlay.js";

/**
 * Uniforme confirm sheet (zelfde layout als "Nieuwe categorie toevoegen").
 */
export function openConfirmPopup({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  // Optional: "warning" => Apple-orange header + month-category sheet shell
  // (used by startyear/beginsaldo confirmations)
  variant,
  // Optional: place confirm/cancel buttons next to each other (same row)
  buttonsSideBySide,
  // Optional: hide cancel button (single-action info sheets)
  hideCancel,
}) {
  const v = String(variant || "").toLowerCase();
  const useWarningShell = v === "warning";
  const sideBySide = buttonsSideBySide === true;

  const cancelHidden = hideCancel === true || cancelLabel === null;

  const overlay = useWarningShell ? createPopupOverlay("ff-overlay-center") : createPopupOverlay();
  const prev = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  const popup = useWarningShell
    ? createPopupContainer(
        "ff-month-category-sheet ff-month-category-card ff-month-category-sheet--warning ff-confirm-sheet"
      )
    : createPopupContainer("category-edit-sheet ff-confirm-sheet");

  popup.innerHTML = useWarningShell
    ? `
    <div class="ff-popup__header ff-month-category-header">
      <h2 class="ff-popup__title">${title || ""}</h2>
    </div>

    <div class="ff-popup__body ff-month-category-body" style="padding:14px;">
      <div class="ff-section">
        <div class="ff-warning-message">${message || ""}</div>
      </div>
    </div>

    <div class="ff-popup__footer ff-month-category-footer">
      ${cancelHidden || !sideBySide ? `
        <button type="button" class="ff-btn ff-btn--primary${cancelHidden ? " ff-btn--full" : ""}" id="ffConfirmOkBtn">${
          confirmLabel || t("common.ok")
        }</button>
        ${cancelHidden ? "" : `
        <button type="button" class="ff-btn ff-btn--secondary" id="ffConfirmCancelBtn">${
          cancelLabel || t("common.cancel")
        }</button>
        `}
      ` : `
        <div style="display:flex; gap:10px; width:100%;">
          <button type="button" class="ff-btn ff-btn--primary" id="ffConfirmOkBtn" style="flex:1;">${
            confirmLabel || t("common.ok")
          }</button>
          <button type="button" class="ff-btn ff-btn--secondary" id="ffConfirmCancelBtn" style="flex:1;">${
            cancelLabel || t("common.cancel")
          }</button>
        </div>
      `}
    </div>
  `
    : `
    <div class="ff-sheet-handle"></div>

    <div class="ff-popup__header ff-cat-header">
      <h2 class="ff-popup__title">${title || ""}</h2>
    </div>

    <div class="ff-popup__body ff-cat-body">
      <div class="ff-section">
        <p class="ff-popup__message" style="text-align:left; margin:0;">${message || ""}</p>
      </div>
    </div>

    <div class="ff-popup__footer ff-cat-footer">
      <button type="button" class="ff-btn ff-btn--primary ff-btn--full" id="ffConfirmOkBtn">${
        confirmLabel || t("common.ok")
      }</button>
      ${cancelHidden ? "" : `
      <button type="button" class="ff-btn ff-btn--secondary ff-btn--full" id="ffConfirmCancelBtn">${
        cancelLabel || t("common.cancel")
      }</button>
      `}
    </div>
  `;

  const close = () => {
    document.body.style.overflow = prev || "";
    if (overlay.__ff_cleanup_observer) overlay.__ff_cleanup_observer();
    overlay.remove();
  };

  const cancelHandler = () => {
    close();
    if (typeof onCancel === "function") onCancel();
  };

  overlay.__ff_onCancel = cancelHandler;

  document.body.appendChild(overlay);
  overlay.appendChild(popup);

  const cancelBtn = popup.querySelector("#ffConfirmCancelBtn");
  if (cancelBtn) cancelBtn.onclick = cancelHandler;
  popup.querySelector("#ffConfirmOkBtn").onclick = () => {
    close();
    if (typeof onConfirm === "function") onConfirm();
  };

  overlay.onclick = (e) => {
    if (e.target === overlay) cancelHandler();
  };
}
