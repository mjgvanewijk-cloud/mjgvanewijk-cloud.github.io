// scripts/year/year-activation.js
import { t } from "../i18n.js";
import { openConfirmPopup } from "../ui/popups.js";
import { getConfiguredStartYear } from "./year-chain.js";
import { applyNewStartYear } from "./year-activation-logic.js";
import { showActivationOverlay } from "./year-activation-ui.js";

export { showActivationOverlay };

/**
 * De definitieve bevestiging en afhandeling (wizard) voor een nieuw startjaar.
 */
export function triggerFinalStartYearConfirmation(year, settings, refreshCallback) {
  // Resolve the currently configured start year (before changing it) so i18n placeholders
  // like {startYear} are always replaced with a real value.
  const currentStartYear = getConfiguredStartYear(settings);
  const startYear = (Number.isFinite(currentStartYear) ? currentStartYear : year);

  openConfirmPopup({
    title: t("popups.new_start_year_title"),
    message: t("messages.new_start_year_confirm", { year: year, startYear }),
    confirmLabel: t("common.yes"),
    cancelLabel: t("common.no"),
    variant: "warning",
    onConfirm: () => {
      applyNewStartYear(year, settings, refreshCallback);
    },
  });
}