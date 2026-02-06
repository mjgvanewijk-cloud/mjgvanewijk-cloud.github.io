// scripts/core/state/premium-downgrade-savings-ui.js

import { t } from "../../i18n.js";
import { loadSettings, saveSettings } from "../storage.js";
import { isTrialActive, isPremiumActiveForUI } from "./premium-data.js";
import { openConfirmPopup } from "../../ui/popup/confirm-popup.js";
import { openPremiumTrialPopup } from "./premium-ui.js";

function ensureFlags(settings) {
  if (!settings || typeof settings !== "object") settings = {};
  if (!settings.uiFlags || typeof settings.uiFlags !== "object") settings.uiFlags = {};
  return settings;
}

function hasExtraSavingAccounts(settings) {
  const accounts = Array.isArray(settings?.savingAccounts) ? settings.savingAccounts : [];
  return accounts.some((a) => String(a?.id || "") && String(a?.id || "") !== "__system__");
}

function isTrialExpiredWithoutPremium(settings) {
  const p = settings?.premium;
  if (!p || typeof p !== "object") return false;
  if (!p.trialUsed || !p.trialStart) return false;
  // In deze codebase blijft p.active vaak TRUE na trial-start; de "actieve" status wordt afgeleid.
  if (!p.active) return false;
  return !isTrialActive();
}

/**
 * Eénmalige melding na afloop proefperiode wanneer Premium niet geactiveerd is.
 * Focus: Sparen (extra spaarrekeningen worden niet meer getoond).
 */
export function maybeShowSavingsDowngradeNotice() {
  // Synchroniseer UI-premium status (settings.isPremium) met trial-status.
  // Dit voorkomt dat de premium titel blijft hangen nadat de trial verlopen is.
  try { isPremiumActiveForUI(); } catch (_) {}

  const settings = ensureFlags(loadSettings() || {});
  if (settings.uiFlags.savingsDowngradeNoticeShown) return;

  if (!isTrialExpiredWithoutPremium(settings)) return;
  if (!hasExtraSavingAccounts(settings)) return;

  settings.uiFlags.savingsDowngradeNoticeShown = true;
  saveSettings(settings);

  openConfirmPopup({
    title: t("messages.savings_downgrade_title"),
    message: t("messages.savings_downgrade_desc"),
    confirmLabel: t("common.activate_premium"),
    cancelLabel: t("common.ok"),
    onConfirm: () => {
      // Best beschikbare route in huidige codebase: Premium popup (toont plannen/status).
      openPremiumTrialPopup();
    },
    onCancel: () => {},
  });
}
