// scripts/ui/popup/app-settings/menu-render.js

import { t } from "../../../i18n.js";

export function renderMenu(container, { onAction, onClose }) {
  container.innerHTML = `
      <div class="ff-popup__header ff-cat-header">
        <h2 class="ff-popup__title">${t("settings.title")}</h2>
      </div>

      <div class="ff-popup__body ff-cat-body">
        <div class="ff-settings-list" role="menu">
          <button type="button" class="ff-settings-row" data-action="backup_save" role="menuitem">
            <span class="ff-settings-row__label">${t("settings.menu.icloud")}</span>
            <span class="ff-settings-row__chev" aria-hidden="true">›</span>
          </button>

          <button type="button" class="ff-settings-row" data-action="backup_restore" role="menuitem">
            <span class="ff-settings-row__label">${t("settings.menu.backup_restore")}</span>
            <span class="ff-settings-row__chev" aria-hidden="true">›</span>
          </button>

          <button type="button" class="ff-settings-row" data-action="rate" role="menuitem">
            <span class="ff-settings-row__label"><span aria-hidden="true">❤</span>${t("settings.menu.rate_app")}</span>
            <span class="ff-settings-row__chev" aria-hidden="true">›</span>
          </button>

          <button type="button" class="ff-settings-row" data-action="terms" role="menuitem">
            <span class="ff-settings-row__label">${t("settings.menu.terms")}</span>
            <span class="ff-settings-row__chev" aria-hidden="true">›</span>
          </button>

          <button type="button" class="ff-settings-row" data-action="privacy" role="menuitem">
            <span class="ff-settings-row__label">${t("settings.menu.privacy")}</span>
            <span class="ff-settings-row__chev" aria-hidden="true">›</span>
          </button>

          <button type="button" class="ff-settings-row" data-action="feedback" role="menuitem">
            <span class="ff-settings-row__label-col">
              <span class="ff-settings-row__label-main">${t("settings.menu.features")}</span>
              <span class="ff-settings-row__label-sub">${t("settings.menu.features_sub")}</span>
            </span>
            <span class="ff-settings-row__chev" aria-hidden="true">›</span>
          </button>
        </div>
      </div>

      <div class="ff-popup__footer ff-cat-footer">
        <button type="button" class="ff-btn ff-btn--primary ff-btn--full" id="appSettingsCloseBtn">${t("common.close")}</button>
      </div>
    `;

  const closeBtn = container.querySelector("#appSettingsCloseBtn");
  if (closeBtn) closeBtn.onclick = (e) => {
    e.preventDefault();
    onClose();
  };

  const rows = container.querySelectorAll(".ff-settings-row");
  rows.forEach((btn) => {
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const act = btn.getAttribute("data-action");
      if (act) onAction(act);
    };
  });
}
