// scripts/wizard/steps-router.js
import { loadSettings } from "../core/storage/index.js";
import { currentYear } from "../core/state/index.js"; // Nodig voor commit

// Imports uit State
import { ctx, handleWizardCancel, wrapOnNext } from "./steps-state.js";

// UI Steps
import { runBankStep } from "./steps/bank-step.js";
import { runLimitStep } from "./steps/limit-step.js";

// Services
import { commitWizardResults } from "./services/persistence.js";

/**
 * Interne navigatie: Naar Limiet stap
 */
export function goToLimitStep(year, onNext, options = { persistStarts: true }) {
  const wrappedNext = wrapOnNext(year, onNext);
  runLimitStep(ctx, year, handleWizardCancel, wrappedNext, options);
}

/**
 * Start de wizard flow bij de Bank stap.
 *
 * NOTE:
 * - De "Beginsaldo spaar" stap is verwijderd uit de wizard.
 * - We behouden wél de bestaande (legacy) yearSavingStarting waarde in ctx.tempSaving,
 *   zodat commits deze waarde niet onbedoeld overschrijven.
 */
export function runWizardStartBalanceStep(year, onNext) {
  ctx.flowYear = year;

  runBankStep(ctx, year, handleWizardCancel, () => {
    const settings = loadSettings() || {};
    const yearKey = year.toString();

    // Legacy: behoud bestaande spaar-startwaarde (indien aanwezig), anders 0.
    let savingStart = 0;
    if (settings.yearSavingStarting && Object.prototype.hasOwnProperty.call(settings.yearSavingStarting, yearKey)) {
      const v = Number(settings.yearSavingStarting[yearKey]);
      savingStart = Number.isFinite(v) ? v : 0;
    }
    ctx.tempSaving = savingStart;

    // Balances-only (skipLimit): commit direct
    if (ctx.skipLimit) {
      const neg = typeof settings.negativeLimit === "number" ? settings.negativeLimit : 0;

      commitWizardResults({
        ctx,
        year: ctx.flowYear,
        bankStart: ctx.tempBank,
        savingStart: ctx.tempSaving,
        negLimit: neg,
        persistStarts: true,
        currentYear,
      });

      const wrappedNext = wrapOnNext(year, onNext);
      if (typeof wrappedNext === "function") wrappedNext(true);
      return;
    }

    // Normale flow: bank -> limiet
    return goToLimitStep(year, onNext);
  });
}

/**
 * Specifieke route voor alleen Limiet editen
 */
export function runEditLimitOnlyStep(year, onNext) {
  runLimitStep(ctx, year, handleWizardCancel, wrapOnNext(year, onNext), { persistStarts: false });
}
