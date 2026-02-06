// scripts/core/state/premium-data.js
import { loadMonthData, loadSettings, saveMonthData, saveSettings, saveCats } from "../storage.js";
import { t } from "../../i18n.js";
import { renderYear } from "../../year/year-render.js";
import { readBackup, clearBackup } from "./premium-downgrade-backup.js";

/**
 * Zorgt voor een correcte structuur en synchroniseert de root 'isPremium' vlag.
 */
function ensurePremiumStruct(settings) {
  if (!settings || typeof settings !== "object") settings = {};
  if (!settings.premium || typeof settings.premium !== "object") {
    settings.premium = { active: false, trialStart: null, trialUsed: false };
  }
  
  // Synchroniseer de root-vlag voor de UI (isPremium) op basis van de actieve status
  settings.isPremium = !!settings.premium.active;
  
  return settings;
}


function maybeRestorePremiumBackupOnActivate() {
  const backup = readBackup();
  if (!backup || typeof backup !== "object") return false;

  // Restore categories
  if (Array.isArray(backup.cats)) {
    try { saveCats(backup.cats); } catch (_) {}
  }

  // Restore month premium fields (_catDisplay / savingAccounts)
  const monthData = loadMonthData() || {};
  const monthPremium = backup.monthPremium && typeof backup.monthPremium === "object" ? backup.monthPremium : {};
  for (const [k, v] of Object.entries(monthPremium)) {
    if (!v || typeof v !== "object") continue;
    if (!monthData[k] || typeof monthData[k] !== "object") monthData[k] = {};
    if (v._catDisplay !== undefined) monthData[k]._catDisplay = v._catDisplay;
    if (v.savingAccounts !== undefined) monthData[k].savingAccounts = v.savingAccounts;
  }
  saveMonthData(monthData);

  // Keep backup for safety? Clear after successful restore to avoid re-applying.
  clearBackup();
  return true;
}

function migrateLegacySavingStartIntoFirstAccount(settings) {
  try {
    if (!settings || typeof settings !== "object") return settings;
    const yss = settings.yearSavingStarting;
    if (!yss || typeof yss !== "object") return settings;

    const years = Object.keys(yss).map(Number).filter(n => Number.isFinite(n)).sort((a,b)=>a-b);
    if (!years.length) return settings;

    const startYear = years[0];
    const legacy = Number(yss[startYear]);
    if (!Number.isFinite(legacy) || legacy === 0) return settings;

    if (!Array.isArray(settings.savingAccounts) || settings.savingAccounts.length === 0) {
      // Geen automatische systeemspaarpot meer aanmaken.
      return settings;
    }

    const first = settings.savingAccounts[0];
    if (!Number.isFinite(Number(first?.startBalance))) first.startBalance = 0;

    // One-time migratie: alleen als startBalance nog 0 is.
    if (Number(first.startBalance) === 0) first.startBalance = legacy;

    return settings;
  } catch (_e) {
    return settings;
  }
}


/**
 * Premium upgrade safety-net voor sparen:
 * - Verwijdert corrupte/legacy maand-overrides met waarde 0 (die manualSaving kunnen maskeren).
 * - Migreert legacy `manualSaving` naar `savingAccounts.__system__` ALLEEN wanneer er nog geen
 *   echte per-account overrides bestaan in die maand (om dubbel tellen te voorkomen).
 */
function cleanupAndMigrateSavingMonthDataForPremium(settings) {
  try {
    const primaryId = (Array.isArray(settings?.savingAccounts) && settings.savingAccounts.length)
      ? settings.savingAccounts[0].id
      : null;

    const monthData = loadMonthData() || {};
    let changed = false;

    for (const key of Object.keys(monthData)) {
      const entry = monthData[key];
      if (!entry || typeof entry !== "object") continue;

      // 1) Cleanup: verwijder alleen corrupte (non-finite) overrides.
      // 0 is een geldige, expliciete override.
      if (entry.savingAccounts && typeof entry.savingAccounts === "object") {
        for (const id of Object.keys(entry.savingAccounts)) {
          const n = Number(entry.savingAccounts[id]);
          if (!Number.isFinite(n)) {
            delete entry.savingAccounts[id];
            changed = true;
          }
        }

        if (Object.keys(entry.savingAccounts).length === 0) {
          delete entry.savingAccounts;
          changed = true;
        }
      }

      // 2) Migratie: manualSaving -> savingAccounts.<eerste spaarpot>
      // (geen systeemspaarpot meer)
      const legacy = Number(entry.manualSaving);
      const legacyOk = Number.isFinite(legacy);

      const overrides = (entry.savingAccounts && typeof entry.savingAccounts === "object")
        ? entry.savingAccounts
        : null;

      const hasAnyEffectiveOverride = (() => {
        if (!overrides) return false;
        for (const v of Object.values(overrides)) {
          const n = Number(v);
          if (Number.isFinite(n)) return true;
        }
        return false;
      })();

      const hasPrimaryOverride = !!(primaryId && overrides && Object.prototype.hasOwnProperty.call(overrides, primaryId));

      // Alleen migreren als deze maand nog geen echte per-account overrides heeft.
      if (primaryId && legacyOk && !hasAnyEffectiveOverride && !hasPrimaryOverride) {
        if (!entry.savingAccounts || typeof entry.savingAccounts !== "object") entry.savingAccounts = {};
        entry.savingAccounts[primaryId] = legacy;
        changed = true;
      }
    }

    if (changed) {
      saveMonthData(monthData);
    }
  } catch (_e) {
    // hard fail vermijden; premium activatie mag nooit crashen.
  }
}

export function getPremium() {
  const settings = ensurePremiumStruct(loadSettings() || {});
  return settings.premium;
}

export function setPremiumActive(active) {
  const settings = ensurePremiumStruct(loadSettings() || {});
  const val = !!active;
  settings.premium.active = val;
  settings.isPremium = val; // Synchroniseer root vlag
  if (val) {
    // Premium re-activate: restore previous premium backup if available
    try { maybeRestorePremiumBackupOnActivate(); } catch (_) {}

    migrateLegacySavingStartIntoFirstAccount(settings);
    cleanupAndMigrateSavingMonthDataForPremium(settings);
  }
  saveSettings(settings);
}

export function startPremiumTrial() {
  const today = new Date().toISOString().slice(0, 10);
  const settings = ensurePremiumStruct(loadSettings() || {});
  const p = settings.premium;

  p.active = true;
  p.trialStart = today;
  p.trialUsed = true;
  settings.isPremium = true; // Synchroniseer root vlag
  // Start trial after downgrade: restore premium backup if present
  try { maybeRestorePremiumBackupOnActivate(); } catch (_) {}
  migrateLegacySavingStartIntoFirstAccount(settings);
  cleanupAndMigrateSavingMonthDataForPremium(settings);
  saveSettings(settings);
  
  // Forceer een refresh van de huidige weergave
  if (typeof renderYear === "function") renderYear();
}

/**
 * Controleert of de proefperiode van 7 dagen nog loopt.
 */
export function isTrialActive() {
  const p = getPremium();
  if (!p.active || !p.trialStart) return false;
  const start = new Date(p.trialStart);
  const now = new Date();
  const diffDays = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
}

/**
 * Bepaalt of Premium UI features getoond moeten worden en schoont 
 * de root-vlag op als de trial verlopen is.
 */
export function isPremiumActiveForUI() {
  const settings = loadSettings() || {};
  const p = ensurePremiumStruct(settings).premium;
  
  if (!p.active) return false;
  
  let active = true;
  if (p.trialStart) {
    active = isTrialActive();
  }

  // Als de berekende status verschilt van de opgeslagen vlag, werk deze bij
  if (settings.isPremium !== active) {
    settings.isPremium = active;
    saveSettings(settings);
  }

  return active;
}