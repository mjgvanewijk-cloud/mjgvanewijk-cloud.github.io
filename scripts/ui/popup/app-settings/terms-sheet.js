// scripts/ui/popup/app-settings/terms-sheet.js

import { t } from "../../../i18n.js";
import { setHelpMuted } from "./state.js";

const APPLE_STANDARD_EULA_URL = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

export function renderTerms(container, { onBack }) {
  // Ensure HelpCloud stays muted in this sub-sheet too.
  setHelpMuted(container);

  container.innerHTML = `
      <div class="ff-popup__header ff-cat-header">
        <h2 class="ff-popup__title">${t("legal.terms.title")}</h2>
      </div>

      <div class="ff-popup__body ff-cat-body">
        <div class="ff-section" style="text-align:left;">
          <p class="ff-popup__message" style="margin:0 0 12px;">${t("legal.terms.apple_eula_note")}</p>

          <p style="margin:0 0 6px;"><strong>${t("legal.terms.p_use")}</strong></p>
          <p style="margin:0 0 12px;">${t("legal.terms.p_use_body")}</p>

          <p style="margin:0 0 6px;"><strong>${t("legal.terms.p_icloud")}</strong></p>
          <p style="margin:0 0 12px;">${t("legal.terms.p_icloud_body")}</p>

          <p style="margin:0 0 6px;"><strong>${t("legal.terms.p_no_advice")}</strong></p>
          <p style="margin:0 0 12px;">${t("legal.terms.p_no_advice_body")}</p>

          <p style="margin:0 0 6px;"><strong>${t("legal.terms.p_liability")}</strong></p>
          <p style="margin:0 0 12px;">${t("legal.terms.p_liability_body")}</p>

          <p style="margin:0 0 6px;"><strong>${t("legal.terms.p_contact")}</strong></p>
          <p style="margin:0;">${t("legal.terms.p_contact_body", { email: t("legal.contact_email") })}</p>
        </div>
      </div>

      <div class="ff-popup__footer ff-cat-footer">
        <div class="ff-popup__footer-row">
          <button type="button" class="ff-btn ff-btn--primary" id="ffTermsOpenAppleBtn">${t("legal.terms.btn_open_apple_eula")}</button>
          <button type="button" class="ff-btn ff-btn--secondary" id="ffTermsCloseBtn">${t("common.close")}</button>
        </div>
      </div>
    `;

  const closeBtn = container.querySelector("#ffTermsCloseBtn");
  if (closeBtn) closeBtn.onclick = (e) => {
    e.preventDefault();
    onBack();
  };

  const openBtn = container.querySelector("#ffTermsOpenAppleBtn");
  if (openBtn) openBtn.onclick = (e) => {
    e.preventDefault();
    try {
      window.open(APPLE_STANDARD_EULA_URL, "_blank", "noopener,noreferrer");
    } catch (_) {
      window.location.href = APPLE_STANDARD_EULA_URL;
    }
  };
}
