// scripts/year/year-template.js

import { formatCurrency, t } from "../i18n.js";
import { getSavingAccounts } from "../core/state/saving-accounts-data.js";
import { PENCIL_SVG, TRAY_FULL_SVG } from "../ui/components/icons.js";

function ffTextPlain(text) {
  return `<span class="ff-cell-text">${text}</span>`;
}

function ffTextWithTray(text, trayClass = "") {
  const cls = trayClass ? ` ${trayClass}` : "";
  return `<span class="ff-cell-text">${text}</span><span class="ff-tray-wrap${cls}">${TRAY_FULL_SVG}</span>`;
}

function ffTextWithPencil(text) {
  return `<span class="ff-cell-text">${text}</span>${PENCIL_SVG}`;
}

function amountClassBySign(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return "";
  if (n > 0.01) return "ff-amount-positive";
  if (n < -0.01) return "ff-amount-negative";
  return "";
}

function getSavingLabel(count) {
  // i18n keys (no fallback text):
  // - year.cards.current_saving_balance -> "Spaarrekening"
  // - year.cards.current_saving_balances -> "Spaarrekeningen"
  if (Number(count) > 1) return t("year.cards.current_saving_balances");
  return t("year.cards.current_saving_balance");
}

/**
 * Maand “kaart” (Apple style) binnen de bestaande year table.
 * We houden de click-mechaniek intact via .clickable-cell + data-type/data-month/data-value.
 */
export function createMonthRow(year, month, data, active, yearTotals) {
  const d = data || { income: 0, expense: 0, bank: 0, saving: 0 };

  const monthTitle = `${t(`months.${month}`)} ${year}`;

  const incVal = active ? formatCurrency(d.income) : "-";
  const expVal = active ? formatCurrency(Number(d.expense) > 0 ? -Math.abs(d.expense) : d.expense) : "-";
  const bankVal = active ? formatCurrency(d.bank) : "-";
  const savVal = active ? formatCurrency(d.saving) : "-";

  const incClass = amountClassBySign(d.income);
  // Uitgaven: positief bedrag tonen als "negatief" (rood), zoals je huidige tabel
  const expClass = Number(d.expense) > 0.01 ? "ff-amount-negative" : amountClassBySign(d.expense);

  const bankClass = amountClassBySign(d.bank);

  // Spaar: altijd blauw (behalve 0 => standaard tekstkleur)
  const savNum = Number(d.saving) || 0;
  let savingAmountClass = "ff-amount-blue";
  if (Math.abs(savNum) < 0.005) savingAmountClass = "";

  let savingAccountsCount = 0;
  try {
    const accounts = getSavingAccounts() || [];
    savingAccountsCount = accounts.length;
  } catch {}

  const savingLabel = getSavingLabel(savingAccountsCount);
  const bankLabel = t("year.cards.current_bank_balance");

  const row = document.createElement("tr");
  if (!active) row.classList.add("ff-row-inactive");
  row.classList.add("ff-month-card-row");
  const showTotals = false;

  // colSpan moet matchen met het aantal kolommen in de bestaande tabel (6)
  row.innerHTML = `
    <td class="ff-month-card-cell" colspan="6">
      <div class="ff-month-card">
        <div class="ff-month-card__title">${monthTitle}</div>

        <div class="ff-month-card__row ff-month-card__row--income clickable-cell" data-type="income" data-month="${month}" data-value="${Number(d.income) || 0}">
          <div class="ff-month-card__label">${ffTextWithPencil(t("table.headers.income"))}</div>
          <div class="ff-month-card__amount ${incClass}">${incVal}</div>
        </div>

        <div class="ff-month-card__row ff-month-card__row--expense clickable-cell" data-type="expense" data-month="${month}" data-value="${Number(d.expense) || 0}">
          <div class="ff-month-card__label">${ffTextWithPencil(t("table.headers.expense"))}</div>
          <div class="ff-month-card__amount ${expClass}">${expVal}</div>
        </div>

        <div class="ff-month-card__saldo">
          <div class="ff-month-card__row ff-month-card__row--plain">
            <div class="ff-month-card__label">${bankLabel}</div>
            <div class="ff-month-card__amount ${bankClass}">${bankVal}</div>
          </div>

          <div class="ff-month-card__row ff-month-card__row--saving clickable-cell" data-type="saving" data-month="${month}" data-value="${Number(d.saving) || 0}">
            <div class="ff-month-card__label">${ffTextWithPencil(savingLabel)}</div>
            <div class="ff-month-card__amount ${savingAmountClass}">${savVal}</div>
          </div>
        </div>
      </div>
    </td>
  `;

  return row;
}

/**
 * Jaaroverzicht-card (boven Januari).
 * Toont totalen en eindsaldi voor het gekozen jaar.
 */
export function createYearOverviewRow(year, overview, active) {
  const row = document.createElement("tr");
  row.classList.add("ff-month-card-row");
  if (!active) row.classList.add("ff-row-inactive");

  const title = t("year.overview.title", { year });

  const totalIncome = overview ? Number(overview.totalIncome) || 0 : 0;
  const totalExpense = overview ? Number(overview.totalExpense) || 0 : 0;
  const bankEnd = overview ? Number(overview.bankEnd) || 0 : 0;
  const savingEnd = overview ? Number(overview.savingEnd) || 0 : 0;

  let savingAccountsCount = 0;
  try {
    const accounts = getSavingAccounts() || [];
    savingAccountsCount = accounts.length;
  } catch {}
  const savingEndLabel = savingAccountsCount > 1
    ? t("year.overview.saving_end_plural")
    : t("year.overview.saving_end_singular");

  const incVal = active ? formatCurrency(totalIncome) : "-";
  const expAbs = Math.abs(totalExpense);
  const expVal = active ? formatCurrency(expAbs) : "-";

  const bankVal = active ? formatCurrency(bankEnd) : "-";
  const savVal = active ? formatCurrency(savingEnd) : "-";

  const incClass = amountClassBySign(totalIncome);
  const expClass = expAbs < 0.005 ? "" : "ff-amount-negative";
  const bankClass = amountClassBySign(bankEnd);

  // Eindsaldo spaar: blauw bij >0, standaard bij 0, rood bij <0 (consistent met algemene sign logic)
  let savingEndClass = amountClassBySign(savingEnd);
  if (savingEnd > 0.01) savingEndClass = "ff-amount-blue";
  if (Math.abs(savingEnd) < 0.005) savingEndClass = "";

  const incRowClass = active ? "ff-month-card__row ff-month-card__row--plain clickable-cell" : "ff-month-card__row ff-month-card__row--plain";
  const expRowClass = active ? "ff-month-card__row ff-month-card__row--plain clickable-cell" : "ff-month-card__row ff-month-card__row--plain";
  // Voor jaren vóór startjaar (inactive) mag Eindsaldo Spaarpotjes niet klikbaar zijn.
  const savRowClass = active ? "ff-month-card__row ff-month-card__row--plain clickable-cell" : "ff-month-card__row ff-month-card__row--plain";
  const savRowData = active
    ? `data-type="year_saving_overview" data-month="0" data-value="${Number(savingEnd) || 0}"`
    : "";
  row.innerHTML = `
    <td class="ff-month-card-cell" colspan="6">
      <div class="ff-month-card">
        <div class="ff-month-card__title">${title}</div>

        <div class="${incRowClass}" data-type="year_income_totals" data-month="0" data-value="${Number(totalIncome) || 0}">
          <div class="ff-month-card__label ff-month-card__label--total">${ffTextWithTray(t("year.cards.total_income"), "ff-tray-color-positive")}</div>
          <div class="ff-month-card__amount ${incClass}">${incVal}</div>
        </div>

        <div class="${expRowClass}" data-type="year_expense_totals" data-month="0" data-value="${Number(expAbs) || 0}">
          <div class="ff-month-card__label ff-month-card__label--total">${ffTextWithTray(t("year.cards.total_expense"), "ff-tray-color-negative")}</div>
          <div class="ff-month-card__amount ${expClass}">${expVal}</div>
        </div>

        <div class="ff-month-card__row ff-month-card__row--plain">
          <div class="ff-month-card__label ff-month-card__label--total">${ffTextPlain(t("year.overview.bank_end"))}</div>
          <div class="ff-month-card__amount ${bankClass}">${bankVal}</div>
        </div>

        <div class="${savRowClass}" ${savRowData}>
          <div class="ff-month-card__label ff-month-card__label--total">${ffTextWithTray(savingEndLabel, "ff-tray-color-blue")}</div>
          <div class="ff-month-card__amount ${savingEndClass}">${savVal}</div>
        </div>
      </div>
    </td>
  `;

  return row;
}

/**
 * Legacy: totalenrij (wordt door CSS verborgen in cards-mode).
 * Deze export blijft bestaan zodat imports stabiel blijven.
 */
export function updateTotalsRow(totalRow, yearlyInc, yearlyExp, yearlyFlow, lastBank, lastSaving) {
  if (!totalRow) return;

  const incTotalClass = yearlyInc > 0.01 ? "ff-amount-positive" : (yearlyInc < -0.01 ? "ff-amount-negative" : "");
  const expTotalClass = yearlyExp > 0.01 ? "ff-amount-negative" : (yearlyExp < -0.01 ? "ff-amount-positive" : "");
  const bankTotalClass = lastBank > 0.01 ? "ff-amount-positive" : (lastBank < -0.01 ? "ff-amount-negative" : "");
  const savingTotalClass = lastSaving > 0.01 ? "ff-amount-positive" : (lastSaving < -0.01 ? "ff-amount-negative" : "");

  totalRow.innerHTML = `
    <td>${t("table.headers.total")}</td>
    <td class="${incTotalClass}">${formatCurrency(yearlyInc)}</td>
    <td class="${expTotalClass}">${formatCurrency(yearlyExp)}</td>
    <td>${formatCurrency(yearlyFlow)}</td>
    <td class="${bankTotalClass}">${formatCurrency(lastBank)}</td>
    <td class="${savingTotalClass}">${formatCurrency(lastSaving)}</td>
  `;
}