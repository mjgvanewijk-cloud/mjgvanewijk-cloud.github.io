// scripts/wizard/steps.js

import { currentYear, getStartingBankBalance, getStartingSavingBalance } from "../core/state/index.js";
import { getWizardStartValue } from "./services/start-values.js";

// Importeer de State en Router
import { ctx, wrapOnNext } from "./steps-state.js";
import { runWizardStartBalanceStep, runEditLimitOnlyStep } from "./steps-router.js";

/**
 * Public API: Start de volledige Wizard (of delen ervan)
 */
export function openYearSettingsWizard(year, onNext, opts = {}) {
  ctx.flowYear = year || currentYear;
  ctx.onNext = typeof onNext === "function" ? onNext : null;
  ctx.onCancel = typeof opts.onCancel === "function" ? opts.onCancel : null;
  ctx.cancelMode = opts.cancelMode || (ctx.onCancel ? "close" : "reload");
  
  // Vlaggen instellen
  ctx.skipLimit = !!opts.skipLimit;
  
  // BELANGRIJK: Steps doorgeven (voor limiet analyse fix)
  ctx.steps = opts.steps || [];

  // Standaard op TRUE zetten als het 'undefined' is.
  if (opts.skipSaving === undefined) {
    ctx.skipSaving = true;
  } else {
    ctx.skipSaving = !!opts.skipSaving;
  }

  // Start de flow bij de router
  runWizardStartBalanceStep(ctx.flowYear, ctx.onNext);
}

/**
 * EDIT FLOWS
 */
export function openEditBalancesOnlyWizard(year, onNext) {
  ctx.cancelMode = "close";
  ctx.flowYear = year || currentYear;
  
  // Forceer hier ook dat zowel Limiet als Sparen worden overgeslagen.
  ctx.skipLimit = true;
  ctx.skipSaving = true; // saving-stap bestaat niet meer; behoud legacy value 

  ctx.tempBank = getWizardStartValue(ctx, "yearBankStarting", ctx.flowYear, getStartingBankBalance);
  ctx.tempSaving = getWizardStartValue(ctx, "yearSavingStarting", ctx.flowYear, getStartingSavingBalance);
  
  // Zorg dat steps leeg/safe zijn
  ctx.steps = [];

  const wrappedNext = wrapOnNext(ctx.flowYear, onNext);
  runWizardStartBalanceStep(ctx.flowYear, wrappedNext);
}

export function openEditBalancesWizard(year, onNext) {
  ctx.cancelMode = "close";
  ctx.flowYear = year || currentYear;
  ctx.skipLimit = false;
  ctx.steps = [];

  ctx.tempBank = getWizardStartValue(ctx, "yearBankStarting", ctx.flowYear, getStartingBankBalance);
  ctx.tempSaving = getWizardStartValue(ctx, "yearSavingStarting", ctx.flowYear, getStartingSavingBalance);

  ctx.editFullBalancesMode = true;

  const wrappedNext = wrapOnNext(ctx.flowYear, (success) => {
    ctx.editFullBalancesMode = false;
    if (success && typeof onNext === "function") onNext(true);
  });

  runWizardStartBalanceStep(ctx.flowYear, wrappedNext);
}

export function openEditLimitWizard(year, onNext) {
  ctx.cancelMode = "close";
  ctx.flowYear = year || currentYear;
  ctx.skipLimit = true;
  ctx.steps = []; // Limiet edit heeft geen import steps nodig
  
  runEditLimitOnlyStep(ctx.flowYear, onNext);
}

// Re-exports voor backward compatibility (indien nodig)
export { runWizardStartBalanceStep };
export function runEditBankBalanceStep(year, onNext) {
  runWizardStartBalanceStep(year, onNext);
}
export function runEditSavingBalanceStep(year, onNext) {
  // Saving-balance edit bestaat niet meer; behoud backward compat door de bank-flow te openen.
  runWizardStartBalanceStep(year, onNext);
}
