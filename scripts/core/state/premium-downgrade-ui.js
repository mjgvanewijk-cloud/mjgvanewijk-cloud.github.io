// scripts/core/state/premium-downgrade-ui.js
import { loadSettings, saveSettings, loadCats, loadMonthData } from "../storage.js";
import { applyDowngradeTransform } from "./premium-downgrade-transform.js";

const UIFLAG_PROMPT_SHOWN = "trialExpiryDowngradePromptShown";

export function markPremiumKept() {
  const settings = loadSettings() || {};
  if (!settings.premium || typeof settings.premium !== "object") settings.premium = {};
  settings.premium.active = true;
  settings.premium.trialStart = null;
  settings.isPremium = true;

  if (!settings.uiFlags || typeof settings.uiFlags !== "object") settings.uiFlags = {};
  settings.uiFlags[UIFLAG_PROMPT_SHOWN] = true;
  saveSettings(settings);
}

export function handleDowngradeCancel() {
  const settings = loadSettings() || {};
  const cats = loadCats() || [];
  const monthData = loadMonthData() || {};
  applyDowngradeTransform(settings, cats, monthData);
}