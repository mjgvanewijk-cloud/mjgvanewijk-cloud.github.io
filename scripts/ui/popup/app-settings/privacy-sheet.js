// scripts/ui/popup/app-settings/privacy-sheet.js

import { t } from "../../../i18n.js";
import { setHelpMuted } from "./state.js";

// Open privacy in the same view (iOS/PWA friendly) and mark origin.
function appendFromApp(rawUrl) {
  try {
    const u = new URL(rawUrl, window.location.href);
    // add marker so privacy page can show a "Back to FinFlow" button
    if (!u.searchParams.has("from")) u.searchParams.set("from", "finflow");
    return u.toString();
  } catch (_) {
    // Fallback: simple query append
    if (String(rawUrl).includes("?")) return rawUrl + "&from=finflow";
    return rawUrl + "?from=finflow";
  }
}

export function renderPrivacy(container, { onBack }) {
  // Ensure HelpCloud stays muted in this sub-sheet too.
  setHelpMuted(container);

  const url = String(t("legal.privacy_url") || "").trim();
  const canOpen = !!url;

  container.innerHTML = `
      <div class="ff-popup__header ff-cat-header">
        <h2 class="ff-popup__title">${t("legal.privacy.title")}</h2>
      </div>

      <div class="ff-popup__body ff-cat-body">
        <div class="ff-section" style="text-align:left;">
          <p style="margin:0 0 6px;"><strong>${t("legal.privacy.p_about")}</strong></p>
          <p style="margin:0 0 12px;">${t("legal.privacy.p_about_body")}</p>

          <p style="margin:0 0 6px;"><strong>${t("legal.privacy.p_data")}</strong></p>
          <p style="margin:0 0 12px;">${t("legal.privacy.p_data_body")}</p>

          <p style="margin:0 0 6px;"><strong>${t("legal.privacy.p_icloud")}</strong></p>
          <p style="margin:0 0 12px;">${t("legal.privacy.p_icloud_body")}</p>

          <p style="margin:0 0 6px;"><strong>${t("legal.privacy.p_no_tracking")}</strong></p>
          <p style="margin:0 0 12px;">${t("legal.privacy.p_no_tracking_body")}</p>

          <p style="margin:0 0 6px;"><strong>${t("legal.privacy.p_sharing")}</strong></p>
          <p style="margin:0 0 12px;">${t("legal.privacy.p_sharing_body")}</p>

          <p style="margin:0 0 6px;"><strong>${t("legal.privacy.p_retention")}</strong></p>
          <p style="margin:0 0 12px;">${t("legal.privacy.p_retention_body")}</p>

          <p style="margin:0 0 6px;"><strong>${t("legal.privacy.p_security")}</strong></p>
          <p style="margin:0 0 12px;">${t("legal.privacy.p_security_body")}</p>

          <p style="margin:0 0 6px;"><strong>${t("legal.privacy.p_rights")}</strong></p>
          <p style="margin:0 0 12px;">${t("legal.privacy.p_rights_body", { email: t("legal.contact_email") })}</p>

          <p style="margin:0 0 6px;"><strong>${t("legal.privacy.p_changes")}</strong></p>
          <p style="margin:0;">${t("legal.privacy.p_changes_body")}</p>
        </div>
      </div>

      <div class="ff-popup__footer ff-cat-footer">
        <div class="ff-popup__footer-row">
          <button type="button" class="ff-btn ff-btn--primary" id="ffPrivacyOpenBtn" ${canOpen ? "" : "disabled aria-disabled=\"true\""}>${t("legal.privacy.btn_open_privacy_online")}</button>
          <button type="button" class="ff-btn ff-btn--secondary" id="ffPrivacyCloseBtn">${t("common.close")}</button>
        </div>
      </div>
    `;

  const closeBtn = container.querySelector("#ffPrivacyCloseBtn");
  if (closeBtn) closeBtn.onclick = (e) => {
    e.preventDefault();
    onBack();
  };

  const openBtn = container.querySelector("#ffPrivacyOpenBtn");
  if (openBtn) openBtn.onclick = (e) => {
    e.preventDefault();
    if (!url) return;
    window.location.href = appendFromApp(url);
  };
}
