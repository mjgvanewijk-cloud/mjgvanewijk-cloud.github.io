// scripts/wizard/steps/bank-step.js

import { getStartingBankBalance } from "../../core/state/index.js";
import { t } from "../../i18n.js";
import { openWizardInlineSheet } from "../../ui/popups.js";

import { getWizardStartValue } from "../services/start-values.js";

/**
 * Stap 1: Bank (UI)
 * @param {object} ctx Wizard context
 * @param {number} year Flow year
 * @param {function} onCancel Central cancel handler
 * @param {function} goNext Route handler to next step
 */
export function runBankStep(ctx, year, onCancel, goNext) {
  ctx.flowYear = year;

  const currentBank = getWizardStartValue(ctx, "yearBankStarting", year, getStartingBankBalance);
  const startVal = currentBank ? Math.abs(currentBank) : 0;

  openWizardInlineSheet({
    title: t("wizard.steps.balance_title"),
    rowLabel: t("common.bank_account"),
    inputValue: startVal,
    showToggle: true,
    toggleLabels: {
      pos: t("common.positive"),
      neg: t("common.negative"),
    },
    defaultNegative: currentBank < 0,
    confirmLabel: t("common.save"),
    cancelLabel: t("common.cancel"),
    onCancel,
    onConfirm: (value, isNegative, helpers = {}) => {
      helpers?.event?.preventDefault?.();
      let amount = parseFloat(value) || 0;
      if (isNegative) amount = -Math.abs(amount);

      ctx.tempBank = amount;
      goNext();
    },
  });
}
