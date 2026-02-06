// scripts/wizard/services/persistence.js
import { loadSettings, saveSettings } from "../../core/storage/index.js";
import { resetWizardContext } from "../context.js";
import { rebuildYearsFrom } from "../../core/engine/index.js";

function getMaxConfiguredYear(settings) {
  var maxYear = -Infinity;

  function considerKeys(obj) {
    if (!obj || typeof obj !== "object") return;
    Object.keys(obj).forEach(function (k) {
      var n = Number(k);
      if (Number.isFinite(n)) maxYear = Math.max(maxYear, n);
    });
  }

  considerKeys(settings.yearStarting);
  considerKeys(settings.yearBankStarting);
  considerKeys(settings.yearSavingStarting);

  return Number.isFinite(maxYear) ? maxYear : null;
}

/**
 * Centrale commit: schrijft settings + rebuild ketting + reset wizard state/flags.
 * args: { ctx, year, bankStart, savingStart, negLimit, persistStarts, currentYear }
 */
export function commitWizardResults(args) {
  var ctx = args && args.ctx;
  var year = args && args.year;
  var bankStart = args && args.bankStart;
  var savingStart = args && args.savingStart;
  var negLimit = args && args.negLimit;
  var persistStarts = args && args.persistStarts !== undefined ? args.persistStarts : true;
  var uiCurrentYear = args && args.currentYear;

  var s = loadSettings() || {};
  s.negativeLimit = negLimit;

  if (persistStarts) {
    if (!s.yearBankStarting) s.yearBankStarting = {};
    if (!s.yearSavingStarting) s.yearSavingStarting = {};
    s.yearBankStarting[year] = bankStart;
    s.yearSavingStarting[year] = savingStart;
  }

  saveSettings(s);

  // Robuuste eindjaar bepaling: minimaal kalenderjaar en maximaal geconfigureerd jaar in settings
  var calendarYear = new Date().getFullYear();
  var maxCfg = getMaxConfiguredYear(s);

  var effectiveEndYear = year;
  if (Number.isFinite(calendarYear)) effectiveEndYear = Math.max(effectiveEndYear, calendarYear);

  var uiNum = Number(uiCurrentYear);
  if (Number.isFinite(uiNum)) effectiveEndYear = Math.max(effectiveEndYear, uiNum);

  if (maxCfg !== null) effectiveEndYear = Math.max(effectiveEndYear, maxCfg);

  // Gebruik rebuildYearsFrom om saldi te injecteren in tussenliggende jaren (bijv. 2024)
  rebuildYearsFrom(Number(year), Number(effectiveEndYear));

  // Reset flags / callbacks zodat niets “blijft hangen”
  resetWizardContext(ctx);
}