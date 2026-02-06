// scripts/ui/popup/action-sheet.js

import { t } from "../../i18n.js";
import { createPopupOverlay, createPopupContainer } from "./overlay.js";

/**
 * Uniforme Action Sheet.
 *
 * actions: Array<{ label: string, onClick: function, id?: string, class?: string }>
 *
 * Opties:
 * - overlayClass: extra class voor overlay (bv. "ff-overlay-center")
 * - popupClass: extra class voor container
 * - hideHandle: verbergt de sheet-handle (card-style)
 */
export function openActionSheet({
  title,
  subtitle,
  actions = [],
  closeLabel,
  overlayClass = "",
  popupClass = "",
  hideHandle = false,
} = {}) {
  const overlay = createPopupOverlay(overlayClass);
  const prev = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  const container = createPopupContainer(
    ["category-edit-sheet ff-action-sheet", popupClass].filter(Boolean).join(" ")
  );

  const actionsHtml = actions
    .map((action, idx) => {
      const idAttr = action.id ? `id="${action.id}"` : `id="ffAction_${idx}"`;
      const cls = action.class ? action.class : "ff-btn--secondary";
      return `
        <button type="button" class="ff-btn ${cls} ff-btn--full ff-action-btn" ${idAttr}>
          ${action.label}
        </button>
      `;
    })
    .join("");

  container.innerHTML = `
    ${hideHandle ? "" : `<div class="ff-sheet-handle"></div>`}

    <div class="ff-popup__header ff-cat-header">
      <h2 class="ff-popup__title">${title || ""}</h2>
    </div>

    <div class="ff-popup__body ff-cat-body">
      <div class="ff-section">
        ${subtitle ? `<p class="ff-popup__message" style="text-align:left; margin:0 0 12px;">${subtitle}</p>` : ""}
        <div class="ff-action-list" style="display:flex; flex-direction:column; gap:10px;">
          ${actionsHtml}
        </div>
      </div>
    </div>

    <div class="ff-popup__footer ff-cat-footer">
      <button type="button" class="ff-btn ff-btn--secondary ff-btn--full" id="sheetCloseBtn">${closeLabel || t("common.close")}</button>
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

  container.querySelector("#sheetCloseBtn").onclick = close;

  overlay.onclick = (e) => {
    if (e.target === overlay) close();
  };

  // bind actions
  const buttons = container.querySelectorAll(".ff-action-btn");
  buttons.forEach((btn, index) => {
    const action = actions[index];
    if (!action) return;
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      close();
      if (typeof action.onClick === "function") action.onClick(e);
    };
  });
}
