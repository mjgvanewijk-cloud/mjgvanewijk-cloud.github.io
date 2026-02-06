// scripts/ui/popup/app-settings/backup-save-sheet.js

import { t } from "../../../i18n.js";
import { exportDataFromSettings } from "../../../backup.js";
import { createPopupOverlay, createPopupContainer } from "../overlay.js";
import { closeHelpCloudIfAny, setHelpMuted } from "./state.js";

/**
 * Legacy helper: an explicit orange sheet that confirms a backup save.
 * Currently not used by the settings menu (it calls exportDataFromSettings() directly),
 * but kept for compatibility and future use.
 */
export function openBackupSaveSheet() {
  closeHelpCloudIfAny();

  const overlay = createPopupOverlay("ff-overlay-center");
  const prev = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  const popup = createPopupContainer(
    "ff-month-category-sheet ff-month-category-card ff-month-category-sheet--warning ff-confirm-sheet"
  );
  // No help in this sheet.
  setHelpMuted(popup);

  const sheetTitle = t("settings.backup_save_sheet.title");
  const actionLabel = t("settings.menu.icloud");

  popup.innerHTML = `
    <div class="ff-popup__header ff-month-category-header">
      <h2 class="ff-popup__title">${sheetTitle || ""}</h2>
    </div>

    <div class="ff-popup__body ff-month-category-body" style="padding:14px;">
      <div class="ff-section">
        <div class="ff-warning-message"><strong>${actionLabel || ""}</strong></div>
      </div>
    </div>

    <div class="ff-popup__footer ff-month-category-footer">
      <button type="button" class="ff-btn ff-btn--primary" id="ffBackupSaveGoBtn">${actionLabel || t("common.ok")}</button>
      <button type="button" class="ff-btn ff-btn--secondary" id="ffBackupSaveCancelBtn">${t("common.cancel")}</button>
    </div>
  `;

  const close = () => {
    document.body.style.overflow = prev || "";
    if (overlay.__ff_cleanup_observer) overlay.__ff_cleanup_observer();
    overlay.remove();
  };

  const cancelHandler = () => {
    close();
  };

  overlay.__ff_onCancel = cancelHandler;

  document.body.appendChild(overlay);
  overlay.appendChild(popup);

  const cancelBtn = popup.querySelector("#ffBackupSaveCancelBtn");
  if (cancelBtn) cancelBtn.onclick = cancelHandler;

  const goBtn = popup.querySelector("#ffBackupSaveGoBtn");
  if (goBtn) goBtn.onclick = () => {
    close();
    exportDataFromSettings();
  };

  overlay.onclick = (e) => {
    if (e.target === overlay) cancelHandler();
  };
}
