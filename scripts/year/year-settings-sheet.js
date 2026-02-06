// scripts/year/year-settings-sheet.js

// 1. Core State
import { currentYear, openPremiumTrialPopup, isPremiumActiveForUI } from "../core/state/index.js";

// 2. I18n & Storage
import { t } from "../i18n.js";
import { loadSettings } from "../core/storage/index.js";

// 3. Wizard & Flow
// NOTE: we gebruiken nu openYearSettingsWizard zodat we skipSaving kunnen toepassen
import { openYearSettingsWizard } from "../wizard/steps.js";
import { openEditLimitWizard } from "../wizard/flow.js";

// 4. UI Components - Nu gebruiken we de nieuwe openActionSheet!
import { openConfirmPopup, openActionSheet, openErrorPopup } from "../ui/popups.js";

import {
  getAbsoluteStartYear,
  restoreAfterWizardCancel,
  handleSettingsUpdate,
} from "./year-settings-helpers.js";

// Year activation (for years before the configured start year)
import { showActivationOverlay, triggerFinalStartYearConfirmation } from "./year-activation.js";

/**
 * Open jaarinstellingen (tandwiel).
 * VOLLEDIG HERSCHREVEN: Maakt nu gebruik van de popup-engine (Action Sheet).
 */
export function openYearSettingsSheet(year) {
  // Oude overlays opruimen voor de zekerheid
  document.querySelectorAll(".ff-settings-overlay").forEach((el) => el.remove());

  const settings = loadSettings() || {};

  // Verbeterde Premium check
  const isPremium =
    (typeof isPremiumActiveForUI === "function")
      ? isPremiumActiveForUI()
      : (settings.isPremium === true || settings.premiumActive === true);

  const absoluteStartYear = getAbsoluteStartYear(settings);
  const isBeforeStart = (year < absoluteStartYear);
  const isStartYear = (year === absoluteStartYear);

  // SCENARIO 1: JAAR VOOR START (Alleen info, geen acties)
  if (isBeforeStart) {
    // Terug naar de bestaande flow: jaar-activatie sheet (premium-oranje header)
    // Hiermee kan de gebruiker (eventueel via trial) het startjaar verplaatsen.
    showActivationOverlay(year, isPremium, () => {
      const latest = loadSettings() || {};
      triggerFinalStartYearConfirmation(year, latest, () => handleSettingsUpdate());
    }, { refreshCallback: () => handleSettingsUpdate() });
    return;
  }

  // SCENARIO 2: STARTJAAR OF LATER (Actiemenu)
  const catBtnLabel = isPremium
    ? t("wizard.menu_main.manage_categories")
    : t("wizard.menu_main.manage_categories_premium");
  const savBtnLabel = isPremium
    ? t("wizard.menu_main.manage_saving_accounts")
    : t("wizard.menu_main.manage_saving_accounts_premium");

  const actions = [
    {
      label: isPremium ? t("wizard.menu_main.edit_balance_bank_only") : t("wizard.menu_main.edit_balance"),
      class: "ff-btn--scope active",
      onClick: () => {
        const runBankOnlyWizard = (targetYear) => {
          openYearSettingsWizard(
            targetYear,
            (success) => {
              if (success) handleSettingsUpdate();
              else restoreAfterWizardCancel();
            },
            {
              cancelMode: "close",
              onCancel: restoreAfterWizardCancel,
              skipSaving: isPremium, // Premium: geen sparen-stap in jaarinstellingen; Non-premium: wel sparen-stap
              skipLimit: true,       // <-- limiet stap niet in deze flow (zoals "BalancesOnly")
            }
          );
        };

        if (isStartYear) {
          runBankOnlyWizard(year);
        } else {
          openConfirmPopup({
            title: t("messages.edit_start_balance_title"),
            message: t("messages.edit_start_balance_info", { startYear: absoluteStartYear }),
            confirmLabel: t("common.edit"),
            cancelLabel: t("common.cancel"),
            variant: "warning",
            onConfirm: () => runBankOnlyWizard(absoluteStartYear),
          });
        }
      },
    },
    {
      label: t("wizard.menu_main.edit_limit"),
      class: "ff-btn--scope active",
      onClick: () => {
        openEditLimitWizard(year, (success) => {
          if (success) handleSettingsUpdate();
          else restoreAfterWizardCancel();
        });
      },
    },
    {
      label: catBtnLabel,
      class: "ff-btn--scope active",
      onClick: () => {
        if (isPremium) {
          // AANGEPAST: Importeert nu categories-list.js
          import("../core/state/categories-list.js").then((m) => {
            m.openYearCategoriesSheet(() => handleSettingsUpdate());
          });
        } else {
          openPremiumTrialPopup(() => {
            // AANGEPAST: Importeert nu categories-list.js
            import("../core/state/categories-list.js").then((m) => {
              m.openYearCategoriesSheet(() => handleSettingsUpdate());
            });
          }, {
            title: t("messages.premium_manage_categories_title"),
            topText: t("messages.premium_manage_categories_top"),
          });
        }
      },
    },
    {
      label: savBtnLabel,
      class: "ff-btn--scope active",
      onClick: () => {
        if (isPremium) {
          import("../core/state/saving-accounts-list.js").then((m) => {
            m.openYearSavingAccountsSheet(() => handleSettingsUpdate(), { year });
          });
        } else {
          openPremiumTrialPopup(() => {
            import("../core/state/saving-accounts-list.js").then((m) => {
              m.openYearSavingAccountsSheet(() => handleSettingsUpdate(), { year });
            });
          }, {
            title: t("messages.premium_manage_saving_accounts_title"),
            topText: t("messages.premium_manage_saving_accounts_top"),
          });
        }
      },
    }
  ];

  // Jaarinstellingen: card-style sheet (gecentreerd) met volledig afgeronde hoeken,
  // en "Annuleren" als sluitknop.
  openActionSheet({
    title: t("wizard.menu_main.title", { year }),
    actions,
    closeLabel: t("common.cancel"),
    overlayClass: "ff-overlay-center",
    hideHandle: true,
    popupClass: "ff-all-rounded ff-year-settings-sheet",
  });
}
