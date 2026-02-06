// scripts/wizard/ui.js
import { t } from "../i18n.js";
import { currentYear } from "../core/state.js";

/**
 * Sluit alle wizard-gerelateerde overlays.
 */
export function closeAllWizardOverlays() {
  const overlays = [
    document.getElementById("welcomeOverlay"),
    document.getElementById("wizardInfoOverlay"),
    document.getElementById("beginsaldoOverlay"),
    document.getElementById("limitOverlay"),
    document.getElementById("setupVoltooidOverlay"),
  ];
  overlays.forEach((overlay) => {
    if (overlay) {
      overlay.style.display = "none";
      overlay.classList.remove("hidden");
      overlay.classList.remove("show");
    }
  });
}

/**
 * Welkomscherm – toont logo, tagline en 'Aan de slag'-knop.
 */
export function openWelcomeOverlay() {
  closeAllWizardOverlays();
  
  // Voeg de klasse toe aan de body zodat de CSS de navpil verbergt
  document.body.classList.add('wizard-active');

  const overlay = document.getElementById("welcomeOverlay");
  if (!overlay) return;

  overlay.style.display = "flex";
  
  // iPhone fix: Forceer een frame-update voor soepele weergave
  window.requestAnimationFrame(() => {
    overlay.classList.add("show");
  });
}

/**
 * Eenvoudige info-popup die uitlegt wat de wizard doet.
 */
export function openWizardInfoPopup(onClose) {
  closeAllWizardOverlays();
  
  let overlay = document.getElementById("wizardInfoOverlay");
  let sheet = document.getElementById("wizardInfoSheet");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "wizardInfoOverlay";
    overlay.className = "ff-popup-overlay ff-popup-overlay--wizard ff-overlay-center";

    sheet = document.createElement("div");
    sheet.id = "wizardInfoSheet";
    // Centered + all corners rounded (without changing padding/layout)
    sheet.className = "ff-popup ff-popup--wizard ff-popup--info ff-all-rounded";

    sheet.innerHTML = `
        <div class="ff-popup__header">
          <h2 class="ff-popup__title">${t('wizard.steps.info_title')}</h2>
        </div>
        <div class="ff-popup__body">
          <p class="ff-popup__hint">${t('wizard.steps.info_body')}</p>
        </div>
        <div class="ff-popup__footer">
          <button type="button" id="wizardInfoOkBtn" class="ff-btn ff-btn--primary">
            ${t('common.understand')}
          </button>
        </div>
      `;

    overlay.appendChild(sheet);
    document.body.appendChild(overlay);
  }

  overlay.style.display = "flex";

  // Make ESC behave like the 'Ok' button.
  overlay.__ff_onCancel = () => {
    overlay.style.display = "none";
    sheet.classList.remove("show");
    if (typeof onClose === "function") onClose();
  };
  
  // iPhone fix: Zorg dat de animatie start na display flex
  window.requestAnimationFrame(() => {
    sheet.classList.add("show");
  });

  const okBtn = document.getElementById("wizardInfoOkBtn");
  okBtn.onclick = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    overlay.style.display = "none";
    sheet.classList.remove("show");
    if (typeof onClose === "function") onClose();
  };
}

/**
 * Toont de "Setup voltooid" popup.
 * Verwijdert aan het einde de blokkade-klasse zodat alles weer zichtbaar wordt.
 */
export function showWizardCompletePopup(onComplete) {
  closeAllWizardOverlays();

  let overlay = document.getElementById("setupVoltooidOverlay");
  let sheet = document.getElementById("setupVoltooidSheet");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "setupVoltooidOverlay";
    overlay.className = "ff-popup-overlay ff-popup-overlay--wizard ff-overlay-center";

    sheet = document.createElement("div");
    sheet.id = "setupVoltooidSheet";
    // Centered + all corners rounded (without changing padding/layout)
    sheet.className = "ff-popup ff-popup--wizard ff-popup--complete ff-all-rounded";

    sheet.innerHTML = `
        <div class="ff-popup__header">
          <h2 class="ff-popup__title">${t('wizard.steps.complete_title')}</h2>
        </div>
        <div class="ff-popup__body">
          <p class="ff-popup__hint">${t('wizard.steps.complete_desc', { year: currentYear })}</p>
        </div>
        <div class="ff-popup__footer">
          <button type="button" id="setupVoltooidOkBtn" class="ff-btn ff-btn--primary">
            ${t('common.close')}
          </button>
        </div>
    `;

    overlay.appendChild(sheet);
    document.body.appendChild(overlay);
  }

  overlay.style.display = "flex";

  // Make ESC behave like clicking 'Sluiten'.
  overlay.__ff_onCancel = () => {
    document.body.classList.remove('wizard-active');
    closeAllWizardOverlays();
    if (typeof onComplete === "function") onComplete();
  };
  
  window.requestAnimationFrame(() => {
    sheet.classList.add("show");
  });

  const okBtn = document.getElementById("setupVoltooidOkBtn");
  if (okBtn) {
    okBtn.onclick = (e) => {
      // iPhone fix
      if (e && e.preventDefault) e.preventDefault();
      
      // VERWIJDER DE BLOKKADE: De navpil mag nu weer getoond worden
      document.body.classList.remove('wizard-active');
      
      closeAllWizardOverlays();

      // Expliciet herstel van display voor extra veiligheid
      const navPil = document.querySelector('.nav-pill') || document.querySelector('.navpil');
      const tableContainer = document.querySelector('.table-container');

      if (navPil) {
        navPil.style.setProperty('display', 'flex', 'important');
      }
      if (tableContainer) {
        tableContainer.style.setProperty('display', 'block', 'important');
      }

      if (typeof onComplete === "function") {
        onComplete();
      }
    };
  }
}