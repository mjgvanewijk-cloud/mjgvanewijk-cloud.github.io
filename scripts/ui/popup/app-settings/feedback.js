// scripts/ui/popup/app-settings/feedback.js

import { t } from "../../../i18n.js";

export function openFeedbackEmail() {
  const to = String(t("legal.contact_email") || "").trim();
  const subject = String(t("settings.feedback.subject") || "").trim();
  if (!to) return;
  const qs = [];
  if (subject) qs.push(`subject=${encodeURIComponent(subject)}`);
  const href = `mailto:${encodeURIComponent(to)}${qs.length ? `?${qs.join("&")}` : ""}`;
  try {
    window.location.href = href;
  } catch (_) {
    // no-op
  }
}
