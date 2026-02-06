// scripts/core/state/saving-accounts-ui-html.js
import { t } from "../../i18n.js";
import { loadSettings } from "../storage/index.js";


function getLegacySystemStartBalanceFallback() {
  try {
    const settings = loadSettings() || {};
    const p = settings?.premium || {};
    const isPremium = (settings.isPremium === true) && (p.active === true || !!p.trialStart || p.active === true);
    if (!isPremium) return null;

    const yss = settings.yearSavingStarting;
    if (!yss || typeof yss !== "object") return null;
    const years = Object.keys(yss).map(Number).filter(n => Number.isFinite(n)).sort((a,b)=>a-b);
    if (!years.length) return null;
    const y = years[0];
    const v = Number(yss[y]);
    if (!Number.isFinite(v)) return null;
    return v;
  } catch (_e) {
    return null;
  }
}


export function getSavingAccountSheetHTML(isEdit, acc) {
  const nameVal = acc?.name ? String(acc.name) : "";
  const rawStart =
    (typeof acc?.startBalance === "number" && Number.isFinite(acc.startBalance))
      ? acc.startBalance
      : 0;

  // UX: bij Premium moet de systeemrekening niet als "0" overkomen
  // wanneer er een legacy non-premium spaarsaldo bestaat.
  const legacySystemFallback =
    (acc?.id === "__system__" && rawStart === 0)
      ? getLegacySystemStartBalanceFallback()
      : null;

  const startVal =
    (legacySystemFallback !== null && Number.isFinite(Number(legacySystemFallback)))
      ? Number(legacySystemFallback)
      : rawStart;

  return `
    <div class="ff-sheet-handle"></div>

    <div class="ff-popup__header ff-cat-header">
      <h2 class="ff-popup__title">${isEdit ? t("saving_accounts.edit_title") : t("saving_accounts.new_title")}</h2>
    </div>

    <div class="ff-popup__body ff-cat-body">
      <div class="ff-section ff-cat-section sav-top-section">
        <div class="sav-field">
          <label class="ff-field-label" for="savName">${t("common.name")}</label>
          <input
            type="text"
            id="savName"
            class="ff-input"
            placeholder="${t("saving_accounts.name_placeholder")}"
            value="${nameVal}"
          >
          <div id="savNameError" class="ff-inline-error" role="alert" aria-live="polite" style="display:none; margin-top:10px;">
            <span class="ff-inline-error__icon">${t("popups.error_icon")}</span>
            <span>${t("messages.error_name_required")}</span>
          </div>
        </div>

        <div class="sav-field" style="margin-top:14px;">
          <label class="ff-field-label" for="savStartBalance">${t("saving_accounts.start_balance_label")}</label>
          <input
            type="text"
            id="savStartBalance"
            class="ff-input"
            inputmode="decimal"
            placeholder="${t("common.amount_placeholder")}"
            value="${String(startVal).replace(".", ",")}"
          >
          <div id="savStartError" class="ff-inline-error" role="alert" aria-live="polite" style="display:none; margin-top:10px;">
            <span class="ff-inline-error__icon">${t("popups.error_icon")}</span>
            <span>${t("saving_accounts.start_balance_non_negative")}</span>
          </div>
        </div>
      </div>

      <div class="ff-section ff-cat-section sav-monthly-section">
        <div class="sav-years-columns">
          <div class="col-year"></div>

          <div class="col-amount">
            <span class="ff-field-label">${t("saving_accounts.standard_monthly_title")}</span>
          </div>

          <div class="col-rate">
            <span class="ff-field-label">${t("saving_accounts.interest_label")}</span>
          </div>

          <div class="col-actions"></div>
        </div>

        <div id="savYearsContainer" class="cat-years-container sav-years-container"></div>

        <div id="savRateError" class="ff-inline-error" role="alert" aria-live="polite" style="display:none; margin-top:10px;">
          <span class="ff-inline-error__icon">${t("popups.error_icon")}</span>
          <span>${t("saving_accounts.interest_invalid")}</span>
        </div>

        <div class="add-year-row">
          <button id="addSavYearBtn" class="ff-btn ff-btn--primary ff-btn--full" type="button">
            + ${t("common.add_year")}
          </button>
        </div>
      </div>

    </div>

    <div class="ff-popup__footer ff-cat-footer">
      <button id="saveSavBtn" class="ff-btn ff-btn--primary ff-btn--full" type="button">${t("common.save")}</button>
      <button id="cancelSavBtn" class="ff-btn ff-btn--secondary ff-btn--full" type="button">${t("common.cancel")}</button>
    </div>
  `;
}

