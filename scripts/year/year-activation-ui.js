// scripts/year/year-activation-ui.js
import { t } from "../i18n.js";
import { loadSettings } from "../core/storage/index.js";
import { openPremiumTrialPopup } from "../core/state/premium.js";
import { getConfiguredStartYear } from "./year-chain.js";

/**
 * Toont de overlay om een ouder jaar te activeren (Premium feature).
 *
 * Gedrag:
 * - Premium actief → direct door naar confirm flow.
 * - Niet premium:
 *   - Trial beschikbaar → trial sheet
 *   - Trial verlopen (trialUsed) → oranje paywall sheet (Doorgaan/Sluiten)
 *   - Na succesvolle activatie (trial-start) direct door naar confirm flow.
 *
 * Geen helpcloud bij deze oranje sheets.
 */
export function showActivationOverlay(year, isPremium, onConfirm, opts = {}) {
  const refreshCallback = opts && opts.refreshCallback;

  if (isPremium) {
    if (typeof onConfirm === "function") onConfirm();
    return;
  }

  const settingsNow = loadSettings() || {};
  const currentStartYear = getConfiguredStartYear(settingsNow);
  const startYear = (Number.isFinite(currentStartYear) ? currentStartYear : year);

  openPremiumTrialPopup(() => {
    if (typeof onConfirm === "function") onConfirm();
    if (typeof refreshCallback === "function") {
      try { refreshCallback(); } catch (_) {}
    }
  }, {
    title: t("messages.activate_year_title"),
    topText: `
      <div>${t("messages.startyear_premium_top")}</div>
      <div style="margin-top:10px;">
        ${t("messages.new_start_year_confirm", { year: year, startYear })}
      </div>
    `,
  });
}
