// scripts/core/engine/settings.js
// Settings-shape veilig maken (defaults/guards). [i18n geadapteerd 2025-12-22]
// Belangrijk: deze functie wijzigt alleen het object in-memory.

import { loadSettings, saveSettings } from "../storage.js";

/**
 * Zorgt dat settings altijd een voorspelbare shape heeft.
 * Deze defaults zijn nodig zodat simulatie en UI niet breken op ontbrekende velden.
 *
 * @returns {object} settings (altijd met correcte substructuren)
 */
export function ensureSettings() {
  const settings = loadSettings() || {};

  // 1. Garandeer dat de benodigde objecten voor saldi bestaan
  // yearStarting wordt gebruikt als marker voor het startjaar [cite: 2025-12-21]
  if (!settings.yearStarting || typeof settings.yearStarting !== "object") {
    settings.yearStarting = {};
  }

  // yearSavingStarting bevat het werkelijke beginsaldo van de spaarrekening
  if (!settings.yearSavingStarting || typeof settings.yearSavingStarting !== "object") {
    settings.yearSavingStarting = {};
  }

  // yearBankStarting bevat het werkelijke beginsaldo van de bankrekening
  if (!settings.yearBankStarting || typeof settings.yearBankStarting !== "object") {
    settings.yearBankStarting = {};
  }

  // 2. Overige financiële structuren
  if (!settings.yearMonthlySaving || typeof settings.yearMonthlySaving !== "object") {
    settings.yearMonthlySaving = {};
  }

  // Wizard-inkomen/uitgaven per jaar (alleen voor simulatie)
  if (!settings.yearWizardIncome || typeof settings.yearWizardIncome !== "object") {
    settings.yearWizardIncome = {};
  }
  if (!settings.yearWizardExpense || typeof settings.yearWizardExpense !== "object") {
    settings.yearWizardExpense = {};
  }

  // 3. Potjes (doorlopend model)
  // De 'pots' zijn momenteel geneutraliseerd op 0 om berekeningen niet te verstoren [cite: 2025-12-21]
  if (!settings.pots || typeof settings.pots !== "object") {
    settings.pots = {};
  }

  // 4. Systeem-instellingen
  if (!settings.startMonth || typeof settings.startMonth !== "object") {
    settings.startMonth = {};
  }

  if (typeof settings.negativeLimit !== "number") {
    settings.negativeLimit = 0;
  }

  if (typeof settings.minBankBalance !== "number") {
    settings.minBankBalance = 0;
  }

  // 5. Premium-status bewaken
  if (!settings.premium || typeof settings.premium !== "object") {
    settings.premium = { active: false, trialStart: null, trialUsed: false };
  } else {
    if (typeof settings.premium.active !== "boolean") {
      settings.premium.active = !!settings.premium.active;
    }
    if (typeof settings.premium.trialStart !== "string") {
      settings.premium.trialStart = settings.premium.trialStart || null;
    }
    if (typeof settings.premium.trialUsed !== "boolean") {
      settings.premium.trialUsed = !!settings.premium.trialUsed;
    }
  }

  // 6. Categorie-configuratie
  if (!settings.categories || typeof settings.categories !== "object") {
    settings.categories = {};
  }

  return settings;
}