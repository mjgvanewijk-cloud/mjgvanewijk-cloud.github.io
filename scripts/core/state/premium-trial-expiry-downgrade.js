// scripts/core/state/premium-trial-expiry-downgrade.js
import { t } from "../../i18n.js";
import { loadSettings } from "../storage.js";
import { openConfirmPopup } from "../../ui/popup/confirm-popup.js";
import { resetCaches } from "../engine/index.js";
import { renderYear } from "../../year/year-render.js";
import { getPremium, isTrialActive } from "./premium-data.js";
import { markPremiumKept, handleDowngradeCancel } from "./premium-downgrade-ui.js";

const UIFLAG_PROMPT_SHOWN = "trialExpiryDowngradePromptShown";
const UIFLAG_DOWNGRADE_APPLIED = "trialExpiryDowngradeApplied";

export function maybeHandleTrialExpiryDowngrade() {
  const settings = loadSettings() || {};
  const flags = settings.uiFlags || {};

  const p = getPremium();
  const trialExpired = !!(p?.active && p?.trialStart && !isTrialActive());

  if (!trialExpired || flags[UIFLAG_DOWNGRADE_APPLIED] || flags[UIFLAG_PROMPT_SHOWN]) return;

  openConfirmPopup({
    title: t("messages.trial_downgrade_title"),
    message: t("messages.trial_downgrade_desc"),
    confirmLabel: t("messages.trial_downgrade_keep_premium"),
    cancelLabel: t("messages.trial_downgrade_continue_free"),
    variant: "warning",
    buttonsSideBySide: true,
    onConfirm: () => {
      markPremiumKept();
      resetCaches();
      renderYear();
    },
    onCancel: () => {
      handleDowngradeCancel();
      resetCaches();
      renderYear();
    },
  });
}