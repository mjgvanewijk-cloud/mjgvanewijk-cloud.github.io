// scripts/wizard/steps/saving-step.js

import { currentYear, getStartingSavingBalance } from "../../core/state/index.js";
import { loadSettings } from "../../core/storage/index.js";
import { t } from "../../i18n.js";
import { openWizardInlineSheet } from "../../ui/popups.js";

import { getWizardStartValue } from "../services/start-values.js";
import { commitWizardResults } from "../services/persistence.js";

/**
 * Stap 2: Sparen (UI)
 * @param {object} ctx Wizard context
 * @param {number} year Flow year
 * @param {function} onCancel Central cancel handler
 * @param {function} goNext Route handler to next step
 * @param {function|null} onNext External callback passed into wizard open call
 */
export function runSavingStep(ctx, year, onCancel, goNext, onNext) {
  const currentSaving = getWizardStartValue(ctx, "yearSavingStarting", year, getStartingSavingBalance);
  const val = currentSaving ? Math.abs(currentSaving) : 0;

  openWizardInlineSheet({
    title: t("wizard.steps.saving_balance_title"),
    rowLabel: t("table.headers.savings_balance"),
    inputValue: val,
    showToggle: false,
    confirmLabel: t("common.save"),
    cancelLabel: t("common.cancel"),
    onCancel,
    onConfirm: (value, _isNeg, helpers = {}) => {
      helpers?.event?.preventDefault?.();
      ctx.tempSaving = parseFloat(value) || 0;

      // Alleen balances-only edit flow mag zonder limiet afsluiten
      if (ctx.cancelMode === "close" && ctx.skipLimit && !ctx.editFullBalancesMode) {
        const neg = loadSettings()?.negativeLimit || 0;

        commitWizardResults({
          ctx,
          year: ctx.flowYear,
          bankStart: ctx.tempBank,
          savingStart: ctx.tempSaving,
          negLimit: neg,
          persistStarts: true,
          currentYear,
        });

        if (typeof onNext === "function") onNext(true);
        return;
      }

      goNext();
    }
  });
}
