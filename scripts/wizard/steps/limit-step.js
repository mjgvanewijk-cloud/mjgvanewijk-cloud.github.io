// scripts/wizard/steps/limit-step.js

import { currentYear } from "../../core/state/index.js";
import { loadSettings } from "../../core/storage/index.js";
import { t, formatCurrency } from "../../i18n.js";
import { openWizardInlineSheet } from "../../ui/popups.js";

import { findMaxNegativeBalanceForYear, validateLimit } from "../services/limit-analysis.js";
import { commitWizardResults } from "../services/persistence.js";

/**
 * Stap 3: Limiet (UI)
 * @param {object} ctx Wizard context
 * @param {number} year Flow year
 * @param {function} onCancel Central cancel handler
 * @param {function|null} onNext External callback
 * @param {object} options { persistStarts: boolean }
 */
export function runLimitStep(ctx, year, onCancel, onNext, options = { persistStarts: true }) {
  const analysis = findMaxNegativeBalanceForYear(year, ctx.tempBank, ctx.tempSaving);
  const settings = loadSettings() || {};
  const currentLimit = Number(settings.negativeLimit ?? 0);

  const minNeeded = Math.abs(analysis.value);

  // Niet automatisch invullen op basis van negatief banksaldo.
  // Alleen als de user al eerder een limiet had ingesteld, tonen we die als default.
  const prefillValue = currentLimit !== 0 && !isNaN(currentLimit) ? Math.abs(currentLimit) : "";

  openWizardInlineSheet({
    title: t("wizard.steps.limit_title"),
    rowLabel: t("common.limit"),
    inputValue: prefillValue,
    inputPlaceholder: "",
    showToggle: false,
    confirmLabel: t("common.save"),
    cancelLabel: t("common.cancel"),
    onCancel,
    onConfirm: (value, _isNeg, popupHelpers = {}) => {
      popupHelpers?.event?.preventDefault?.();

      const raw = String(value ?? "").trim();
      const limitValue = raw === "" ? 0 : -Math.abs(parseFloat(raw) || 0);

      const ok = validateLimit({
        limitValue,
        bankBalance: ctx.tempBank,
        savingBalance: ctx.tempSaving,
        year,
        setInlineError: popupHelpers?.setInlineError,
        t,
        formatCurrency,
      });

      if (!ok) return false;

      commitWizardResults({
        ctx,
        year: ctx.flowYear,
        bankStart: ctx.tempBank,
        savingStart: ctx.tempSaving,
        negLimit: limitValue,
        persistStarts: options?.persistStarts !== false,
        currentYear,
      });

      if (typeof onNext === "function") onNext(true);
    },
  });
}
