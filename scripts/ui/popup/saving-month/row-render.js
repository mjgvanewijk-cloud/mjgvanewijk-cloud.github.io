// scripts/ui/popup/saving-month/row-render.js
import { t, formatCurrency } from "../../../i18n.js";
import { buildInterestLabel } from "../saving-month-popup-helpers.js";

export function renderSavingRowHTML({ row, balanceClass, amountClass, displayAmount, pencilSvg, interestPencilSvg }) {
  const name = String(row?.name || "");
  const balanceEnd = Number(row?.balanceEnd || 0);

  return `
    <div class="ff-saving-lines">
      <div class="ff-saving-line ff-saving-line--account">
        <div class="ff-saving-line-left ff-saving-line-left--name">
          <span class="ff-saving-name">${name}</span>
          <span class="ff-saving-pencil" aria-hidden="true">${pencilSvg}</span>
        </div>
        <div class="ff-saving-line-right ${balanceClass}">${formatCurrency(balanceEnd)}</div>
      </div>

      <div class="ff-saving-line">
        <div class="ff-saving-line-left ff-saving-flow-label"></div>
        <div class="ff-saving-line-right ff-month-cat-amount-wrap">
          <input
            class="ff-month-cat-amount-input ff-saving-flow-input ${amountClass}"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            spellcheck="false"
            value="${displayAmount}"
            aria-label="${t("common.amount")}" />
        </div>
      </div>

      <div class="ff-saving-line">
        <div class="ff-saving-line-left">
          <span class="ff-saving-interest-click" role="button" tabindex="0" aria-label="${t("saving_month.interest_input_label")}">
            <span class="ff-saving-interest-label">${renderInterestLabel(row)}</span>
            <span class="ff-saving-pencil ff-saving-pencil--interest" aria-hidden="true">${interestPencilSvg || ""}</span>
          </span>
        </div>
        <div class="ff-saving-line-right ff-amount-interest">${renderInterestValue(row)}</div>
      </div>
    </div>
  `;
}

export function renderSavingRateEditorHTML({ radioName, displayRate }) {
  const val = String(displayRate ?? "");
  return `
    <div class="ff-saving-inline-editor-row">
      <div class="ff-month-cat-scope">
        <label class="ff-month-cat-radio">
          <input type="radio" name="${radioName}" value="only" />
          <span>${t("month_overview.scope_only_month")}</span>
        </label>

        <label class="ff-month-cat-radio">
          <input type="radio" name="${radioName}" value="from" />
          <span>${t("month_overview.scope_from_month")}</span>
        </label>

        <label class="ff-month-cat-radio">
          <input type="radio" name="${radioName}" value="year" />
          <span>${t("month_overview.scope_whole_year")}</span>
        </label>
      </div>

      <div class="ff-saving-inline-rate">
        <span class="ff-saving-rate-label">${t("saving_month.interest_input_label")}</span>
        <div class="ff-saving-rate-input-wrap">
          <input
            class="ff-month-cat-amount-input ff-saving-rate-input"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            spellcheck="false"
            value="${val}"
            aria-label="${t("saving_month.interest_input_label")}" />
          <span class="ff-saving-rate-suffix">%</span>
        </div>
      </div>
    </div>

    <div class="ff-inline-error ff-month-cat-inline-error" role="alert" aria-live="polite" style="display:none; margin-top:10px;">
      <span class="ff-inline-error__icon">▲</span>
      <span class="ff-month-cat-inline-error-text"></span>
    </div>
  `;
}

function renderInterestLabel(row) {
  const showRealInterest = !!row?.showRealInterest;
  const rate = showRealInterest ? Number(row?.rate || 0) : 0;
  return buildInterestLabel(rate);
}

function renderInterestValue(row) {
  const showRealInterest = !!row?.showRealInterest;
  if (!showRealInterest) return t("common.premium");
  return formatCurrency(Number(row?.interest || 0));
}

export function renderSavingEditorHTML({ radioName }) {
  return `
    <div class="ff-saving-inline-editor-row">
      <div class="ff-month-cat-scope">
        <label class="ff-month-cat-radio">
          <input type="radio" name="${radioName}" value="only" />
          <span>${t("month_overview.scope_only_month")}</span>
        </label>

        <label class="ff-month-cat-radio">
          <input type="radio" name="${radioName}" value="from" />
          <span>${t("month_overview.scope_from_month")}</span>
        </label>

        <label class="ff-month-cat-radio">
          <input type="radio" name="${radioName}" value="year" />
          <span>${t("month_overview.scope_whole_year")}</span>
        </label>
      </div>

      <div class="ff-saving-inline-toggles">
        <button type="button" class="ff-btn ff-btn--secondary ff-saving-toggle-btn" data-mode="pos">${t("popups.deposit")}</button>
        <button type="button" class="ff-btn ff-btn--secondary ff-saving-toggle-btn" data-mode="neg">${t("popups.withdrawal")}</button>
      </div>
    </div>

    <div class="ff-inline-error ff-month-cat-inline-error" role="alert" aria-live="polite" style="display:none; margin-top:10px;">
      <span class="ff-inline-error__icon">▲</span>
      <span class="ff-month-cat-inline-error-text"></span>
    </div>
  `;
}
