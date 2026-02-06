// scripts/ui/popup/error-popup.js

import { t } from "../../i18n.js";
import { createPopupOverlay, createPopupContainer } from "./overlay.js";

/**
 * Uniforme error sheet (zelfde layout als "Nieuwe categorie toevoegen").
 *
 * Ondersteunt:
 *  - openErrorPopup(title, message)
 *  - openErrorPopup({ title, message })
 */
export function openErrorPopup(title, message) {
  // ✅ Backward compatible: als er per ongeluk een object wordt doorgegeven
  if (title && typeof title === "object") {
    const obj = title;
    title = obj.title;
    message = obj.message;

    // Optioneel: varianten ondersteunen zonder bestaande callers te breken.
    // - variant: "error" (default) | "warning"
    // - theme: alias voor variant
    if (obj && (obj.variant || obj.theme)) {
      const v = String(obj.variant || obj.theme || "").toLowerCase();
      if (v === "warning") {
        return openWarningSheet({ title, message });
      }
    }
  }

  const overlay = createPopupOverlay();
  const prev = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  const container = createPopupContainer("category-edit-sheet ff-popup--error");

  container.innerHTML = `
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
      <button class="ff-btn ff-btn--primary ff-btn--full" id="errorCloseBtn" type="button">${t(
        "common.understand"
      )}</button>
    </div>
  `;

  const close = () => {
    document.body.style.overflow = prev || "";
    if (overlay.__ff_cleanup_observer) overlay.__ff_cleanup_observer();
    overlay.remove();
  };

  overlay.__ff_onCancel = close;

  document.body.appendChild(overlay);
  overlay.appendChild(container);

  container.querySelector("#errorCloseBtn").onclick = close;

  overlay.onclick = (e) => {
    if (e.target === overlay) close();
  };
}

/**
 * Warning sheet (sheet-engine, centered card) met Apple-orange header.
 * Gebruikt de month-category sheet shell (rounded, midden scherm, stabiel).
 */
function openWarningSheet({ title, message }) {
  const overlay = createPopupOverlay("ff-overlay-center");
  const prev = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  const container = createPopupContainer(
    "ff-month-category-sheet ff-month-category-card ff-month-category-sheet--warning"
  );

  container.innerHTML = `
    <div class="ff-popup__header ff-month-category-header">
      <h2 class="ff-popup__title">${title || ""}</h2>
    </div>

    <div class="ff-popup__body ff-month-category-body" style="padding:14px;">
      <div class="ff-section">
        <div class="ff-cat-delete-message ff-warning-message">
          ${message || ""}
        </div>
      </div>
    </div>

    <div class="ff-popup__footer ff-month-category-footer">
      <button type="button" class="ff-btn ff-btn--primary ff-btn--full" id="ffWarnCloseBtn">
        ${t("common.understand")}
      </button>
    </div>
  `;

  const close = () => {
    document.body.style.overflow = prev || "";
    if (overlay.__ff_cleanup_observer) overlay.__ff_cleanup_observer();
    overlay.remove();
  };

  overlay.__ff_onCancel = close;

  document.body.appendChild(overlay);
  overlay.appendChild(container);

  const btn = container.querySelector("#ffWarnCloseBtn");
  if (btn) btn.onclick = close;

  overlay.onclick = (e) => {
    if (e.target === overlay) close();
  };
}
