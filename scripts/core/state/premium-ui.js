// scripts/core/state/premium-ui.js
import { t } from "../../i18n.js";
import { getPremium, isTrialActive, startPremiumTrial } from "./premium-data.js";
import { createPopupOverlay, createPopupContainer } from "../../ui/popup/overlay.js";

function showTable() {
  const tableContainer = document.querySelector(".table-container");
  if (tableContainer) tableContainer.style.setProperty("display", "block", "important");
}

// De sheet kan vanuit meerdere flows worden geopend. We bewaren de laatst
// aangevraagde onSuccess zodat een bestaande overlay nooit een 'oude' vervolgactie
// blijft uitvoeren wanneer de sheet opnieuw wordt geopend.
let pendingOnSuccess = null;

function runPendingOnSuccessOrDefault() {
  if (typeof pendingOnSuccess === "function") {
    try {
      pendingOnSuccess();
    } catch (_) {}
    return;
  }

  // Default fallback (bestaand gedrag): na trial start naar categorieën.
  import("./categories-list.js").then((m) => {
    m.openYearCategoriesSheet(() => {
      showTable();
    });
  });
}

function closeAndCleanup(overlay, prevOverflow) {
  try {
    document.body.style.overflow = prevOverflow || "";
  } catch (_) {}
  try {
    if (overlay && overlay.__ff_cleanup_observer) overlay.__ff_cleanup_observer();
  } catch (_) {}
  try {
    if (overlay) overlay.remove();
  } catch (_) {}
}

/**
 * Premium Trial Sheet (sheet-engine style).
 *
 * - Geen legacy #premiumTrialOverlay popup meer.
 * - Optioneel: custom title/topText voor context (bv. "Categorieën beheren").
 *
 * @param {Function|null} onSuccess
 * @param {Object} opts
 * @param {string=} opts.title   - header titel (al vertaald)
 * @param {string=} opts.topText - eerste regel in de message-box
 */
export function openPremiumTrialPopup(onSuccess = null, opts = {}) {
  pendingOnSuccess = typeof onSuccess === "function" ? onSuccess : null;

  const premium = getPremium();
  const trialExpired = premium.trialUsed && !isTrialActive();

  // Als de gebruiker al een actieve premium heeft (geen verlopen trial), voer dan
  // direct de onSuccess uit zonder sheet.
  if (premium.active && !trialExpired) {
    runPendingOnSuccessOrDefault();
    return;
  }

  // Sluit bestaande premium sheets zodat we nooit dubbele overlays krijgen.
  document.querySelectorAll(".ff-premium-activation-overlay").forEach((el) => {
    try { el.remove(); } catch (_) {}
  });

  const prev = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  const overlay = createPopupOverlay("ff-overlay-center");
  overlay.classList.add("ff-premium-activation-overlay");
  overlay.style.zIndex = "20050";

  const container = createPopupContainer(
    "ff-month-category-sheet ff-month-category-card ff-month-category-sheet--warning ff-premium-activation-sheet"
  );

  const title = (opts && typeof opts.title === "string" && opts.title.trim())
    ? opts.title
    : (trialExpired ? t("messages.premium_expired_title") : t("messages.premium_trial_title"));

  const topText = (opts && typeof opts.topText === "string" && opts.topText.trim())
    ? opts.topText
    : (trialExpired ? "" : t("messages.premium_trial_top_generic"));

  const bodyHtml = trialExpired
    ? `
      <div class="ff-warning-message" style="text-align:left;">
        ${t("messages.premium_expired_desc")}
      </div>
    `
    : `
      <div class="ff-warning-message" style="text-align:left;">
        ${topText}
        <div style="color: var(--apple-blue); font-size: 14px; margin-top: 10px;">
          ${t("messages.premium_trial_desc")}
        </div>
      </div>
    `;

  const primaryLabel = trialExpired ? t("common.view_plans") : t("messages.premium_start_trial");
  const secondaryLabel = trialExpired ? t("common.close") : t("common.close");

  container.innerHTML = `
    <div class="ff-popup__header ff-month-category-header">
      <h2 class="ff-popup__title">${title}</h2>
    </div>

    <div class="ff-popup__body ff-month-category-body" style="padding:14px;">
      <div class="ff-section">
        ${bodyHtml}
      </div>
    </div>

    <div class="ff-popup__footer ff-month-category-footer" style="display:flex; gap:10px; width:100%;">
      <button type="button" class="ff-btn ff-btn--primary" id="ffPremiumTrialPrimary" style="flex:1;">
        ${primaryLabel}
      </button>
      <button type="button" class="ff-btn ff-btn--secondary" id="ffPremiumTrialClose" style="flex:1;">
        ${secondaryLabel}
      </button>
    </div>
  `;

  overlay.appendChild(container);
  document.body.appendChild(overlay);

  const close = () => closeAndCleanup(overlay, prev);

  const closeBtn = container.querySelector("#ffPremiumTrialClose");
  if (closeBtn) closeBtn.onclick = (e) => {
    if (e) e.preventDefault();
    close();
  };

  const primaryBtn = container.querySelector("#ffPremiumTrialPrimary");
  if (primaryBtn) {
    primaryBtn.onclick = (e) => {
      if (e) e.preventDefault();

      if (trialExpired) {
        // Voor nu: sluit sheet. (Plans/upgrade flow kan later worden gekoppeld.)
        close();
        return;
      }

      startPremiumTrial();
      close();
      runPendingOnSuccessOrDefault();
    };
  }

  overlay.onclick = (e) => {
    if (e && e.target === overlay) close();
  };

  overlay.__ff_onCancel = close;
}
