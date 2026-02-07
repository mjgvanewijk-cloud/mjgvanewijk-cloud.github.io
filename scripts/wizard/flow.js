// scripts/wizard/flow.js

// 1. Core Engine & State
import { resetCaches } from "../core/engine/index.js";
import { currentYear } from "../core/state/index.js";

// 2. Storage & Render
import { loadSettings } from "../core/storage/index.js";
import { renderYear } from "../year/year-render.js";
import { t } from "../i18n.js"; 

// 3. UI Components
import {
  closeAllWizardOverlays,
  openWelcomeOverlay as openWelcomeOverlayUI, 
  openWizardInfoPopup,
  showWizardCompletePopup,
} from "./ui.js";

// 4. Wizard Logica uit steps.js (Eén bron van waarheid)
import {
  openYearSettingsWizard as openWizardLogica,
  openEditBalancesWizard as openEditBalancesWizardLogic,
  openEditLimitWizard as openEditLimitWizardLogic,
  openEditBalancesOnlyWizard as openEditBalancesOnlyWizardLogic // Gecentraliseerde logica
} from "./steps.js";



/**
 * Zorgt dat de UI niet in "wizard-active" blijft hangen.
 * Dit is essentieel omdat CSS de nav-pill verbergt wanneer body.wizard-active actief is.
 */
function exitWizardMode() {
  try { document.body.classList.remove("wizard-active"); } catch {}
  // Sluit eventuele wizard overlays zodat de normale UI weer zichtbaar is.
  try { closeAllWizardOverlays(); } catch {}
}

/**
 * Controleert of de essentiële startwaarden al aanwezig zijn.
 */
function isYearConfigured(year) {
  const s = loadSettings() || {};
  const hasBank = s.yearBankStarting && Object.prototype.hasOwnProperty.call(s.yearBankStarting, year);
  const hasSaving = s.yearSavingStarting && Object.prototype.hasOwnProperty.call(s.yearSavingStarting, year);
  const hasLimit = Object.prototype.hasOwnProperty.call(s, 'negativeLimit');

  return hasBank && hasSaving && hasLimit;
}


/**
 * Bepaalt of de gebruiker al een keer de wizard heeft afgerond (globaal),
 * dus los van het momenteel geselecteerde jaar.
 * Dit voorkomt dat de welcome/wizard opnieuw verschijnt als je op een ander jaar staat.
 */
function hasAnyConfiguredYear(mapObj) {
  if (!mapObj || typeof mapObj !== "object") return false;
  return Object.keys(mapObj).some((k) => Number.isFinite(Number(k)));
}

function isUserConfigured() {
  const s = loadSettings() || {};
  const hasLimit = Object.prototype.hasOwnProperty.call(s, "negativeLimit");
  const hasAnyBank = hasAnyConfiguredYear(s.yearBankStarting);
  const hasAnySaving = hasAnyConfiguredYear(s.yearSavingStarting);
  return hasLimit && hasAnyBank && hasAnySaving;
}

/**
 * Exporteert de standaard edit wizards.
 * Deze functies delegeren nu direct aan de logica in steps.js.
 */
export function openEditBalancesWizard(year, onComplete) {
  return openEditBalancesWizardLogic(year, onComplete);
}

export function openEditLimitWizard(year, onComplete) {
  return openEditLimitWizardLogic(year, onComplete);
}

/**
 * Nieuwe export voor jaarinstellingen: Opent popup bank.
 * Nu veilig aangeroepen via de gecentraliseerde logica in steps.js.
 */
export function openEditBalancesOnlyWizard(year, onComplete, opts = {}) {
  // Wordt o.a. gebruikt voor "startjaar wijzigen".
  // We willen daar géén beginsaldo-sparen scherm.
  const safeOpts = { ...opts };

  if (safeOpts.skipSaving === undefined) safeOpts.skipSaving = true;
  safeOpts.skipLimit = true;                 // balances-only flow
  if (!safeOpts.cancelMode) safeOpts.cancelMode = "close";

  return openWizardLogica(year, onComplete, safeOpts);
}

export function openYearSettingsWizard(year, onComplete, opts = {}) {
  // Default: sparen stap overslaan, tenzij expliciet anders gevraagd
  const safeOpts = { ...opts };
  if (safeOpts.skipSaving === undefined) safeOpts.skipSaving = true;

  return openWizardLogica(year, onComplete, safeOpts);
}


export function openWelcomeOverlay() {
  // Als de gebruiker al geconfigureerd is, nooit opnieuw de welcome/wizard tonen.
  if (isUserConfigured()) {
    exitWizardMode();
    renderYear();
    return;
  }

  // Backwards: als huidig jaar toevallig wel compleet is, ook gewoon renderen.
  if (isYearConfigured(currentYear)) {
    exitWizardMode();
    renderYear();
    return;
  }

  return openWelcomeOverlayUI();
}


/**
 * Afhandeling van de 'Aan de slag' knop bij eerste gebruik.
 */
export function setupWelcomeStartHandler() {
  const welcomeOverlay = document.getElementById("welcomeOverlay");
  const btn = document.getElementById("welcomeStartBtn");
  
  if (!welcomeOverlay || !btn) return;

  btn.onclick = (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }


// Bestaande gebruiker: direct door naar maandkaarten/jaaroverzicht.
if (isUserConfigured()) {
  welcomeOverlay.classList.add("hidden");
  exitWizardMode();
  try { resetCaches(); } catch {}
  try { renderYear(); } catch {}
  // Zorg dat andere UI (zoals undo/redo) weet dat we niet in wizard-modus zitten.
  try { window.dispatchEvent(new CustomEvent("finflow-wizard-finalized")); } catch {}
  return;
}

    const finalizeWizard = () => {
      welcomeOverlay.classList.add("hidden");
      exitWizardMode();
      resetCaches();
      setTimeout(() => {
          try {
            renderYear();
          } catch (renderError) {
            // Fout geruisloos afhandelen
          }

          // Wizard is definitief afgerond: undo/redo mag vanaf nu starten.
          try {
            window.dispatchEvent(new CustomEvent('finflow-wizard-finalized'));
          } catch {
            // ignore
          }
      }, 50); 
    };

    openWizardInfoPopup(() => {
        // AANGEPAST: { skipSaving: false } toegevoegd als derde argument.
        // Dit zorgt ervoor dat bij de initiële setup de spaarstap wordt overgeslagen (en op 0 gezet).
        openWizardLogica(currentYear, (success) => {
            if (success) {
                showWizardCompletePopup(finalizeWizard);
            } else {
                welcomeOverlay.classList.remove("hidden");
                welcomeOverlay.style.display = "flex";
            }
        }, { skipSaving: false });
    });
  };
}