// scripts/wizard/steps-state.js
import { loadSettings, saveSettings } from "../core/storage/index.js";
import { createWizardContext } from "./context.js";
import { updateSavingChain } from "../year/year-events.js";
import { resetCaches } from "../core/engine/index.js";
import { resetAdapterCache } from "../core/adapter.js";

// Singleton Context
export const ctx = createWizardContext();

/**
 * Zorgt ervoor dat het jaar officieel geactiveerd wordt in de instellingen.
 */
export function finalizeYearActivation(year) {
  const settings = loadSettings() || {};

  // 1) Markeer dit jaar als geconfigureerd startpunt
  if (!settings.yearStarting) settings.yearStarting = {};
  settings.yearStarting[year.toString()] = 1;

  saveSettings(settings);

  // 2) Forceer keten-update naar de toekomst
  updateSavingChain(year);

  // 3) Reset caches zodat adapter nieuwe markers ziet
  resetCaches();
  if (typeof resetAdapterCache === "function") resetAdapterCache();
}

/**
 * Centrale cancel handler
 */
export function handleWizardCancel() {
  if (typeof ctx.onCancel === "function") {
    try { ctx.onCancel(); } catch (_) {}
  }
  if (typeof ctx.onNext === "function") {
    try { ctx.onNext(false); } catch (_) {}
  }

  if (ctx.cancelMode !== "close" && typeof ctx.onCancel !== "function") {
    window.location.reload();
  }
}

/**
 * Wrapt de onNext callback om activatie te garanderen bij succes
 */
export function wrapOnNext(year, originalOnNext) {
  return (success) => {
    if (success) finalizeYearActivation(year);
    if (typeof originalOnNext === "function") originalOnNext(success);
  };
}