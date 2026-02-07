// scripts/wizard/context.js

export function createWizardContext() {
  return {
    onCancel: null,
    onNext: null,

    flowYear: null,
    tempBank: 0,
    tempSaving: 0,

    cancelMode: "reload", // "reload" | "close"
    editFullBalancesMode: false,
    skipLimit: false,
  };
}

export function resetWizardContext(ctx) {
  ctx.onCancel = null;
  ctx.onNext = null;
  ctx.cancelMode = "reload";
  ctx.editFullBalancesMode = false;
  ctx.skipLimit = false;
}

