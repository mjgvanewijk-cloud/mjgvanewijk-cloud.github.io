// scripts/ui/popup/calculating-sheet.js

import { t } from "../../i18n.js";
import { createPopupOverlay, createPopupContainer } from "./overlay.js";

/**
 * Blocking calculating sheet (sheet-engine) met Apple-oranje header.
 *
 * Gebruik:
 *   const close = openCalculatingSheet();
 *   // ...do work...
 *   close();
 */
export function openCalculatingSheet() {
  const overlay = createPopupOverlay("ff-overlay-center");
  const prev = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  const container = createPopupContainer(
    "ff-month-category-sheet ff-month-category-card ff-month-category-sheet--warning ff-calculating-sheet"
  );

  container.innerHTML = `
    <div class="ff-popup__header ff-month-category-header">
      <h2 class="ff-popup__title">${t("messages.calculating_title")}</h2>
    </div>

    <div class="ff-popup__body ff-month-category-body" style="padding:18px;">
      <div class="ff-calculating-wrap">
        <div class="ff-calculating-spinner" aria-label="${t("messages.calculating_title")}"></div>
      </div>
    </div>
  `;

  const close = () => {
    document.body.style.overflow = prev || "";
    if (overlay.__ff_cleanup_observer) overlay.__ff_cleanup_observer();
    try { overlay.remove(); } catch (_) {}
  };

  // Blocking: geen cancel via overlay click
  overlay.__ff_onCancel = () => {};
  overlay.onclick = (e) => {
    // voorkom sluitgedrag; wel click "opeten" voor onderliggende UI
    e?.stopPropagation?.();
    e?.preventDefault?.();
  };

  document.body.appendChild(overlay);
  overlay.appendChild(container);

  return close;
}
