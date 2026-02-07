// scripts/core/state/categories-ui-years-render.js
import { t } from "../../i18n.js";
import { updateRemoveButtonsState } from "./categories-ui-years-utils.js";


function formatBudgetForInput(budget) {
  if (budget === "" || budget === null || budget === undefined) return "";
  // If we already have a comma, assume NL input and keep as-is.
  let s = (typeof budget === "number") ? budget.toFixed(2) : String(budget);
  s = s.trim();
  if (s.includes(",")) return s;
  // Convert decimal point to comma for NL input display
  return s.replace(".", ",");
}

/**
 * Rendert één rij met jaar en bedrag input (met inline foutmelding per jaar-blok).
 */
export function renderYearRow(container, year = "", budget = "") {
  const block = document.createElement("div");
  block.className = "cat-year-block";

  block.innerHTML = `
    <div class="cat-year-label-row" aria-hidden="true">
      <div class="cat-year-label-spacer cat-year-label-spacer--left"></div>
      <div class="cat-year-label">${t("categories.maand_bedrag")}</div>
      <div class="cat-year-label-spacer cat-year-label-spacer--right"></div>
    </div>

    <div class="cat-year-row">
      <input type="text" inputmode="numeric" pattern="[0-9]*"
             class="ff-input cat-year-val cat-year-input" placeholder="YYYY" value="${year}">
      <input type="text" inputmode="decimal" pattern="[0-9]*[.,]?[0-9]*"
             class="ff-input cat-budget-val cat-budget-input" placeholder="0,00" value="${formatBudgetForInput(budget)}">
      <button type="button" class="remove-year-btn ff-btn ff-cat-remove-btn"
              aria-label="${t("common.delete")}">${t("common.delete")}</button>
    </div>

    <div class="ff-inline-error cat-year-inline-error" role="alert" aria-live="polite" style="display:none; margin-top:10px;">
      <span class="ff-inline-error__icon">${t("popups.error_icon")}</span>
      <span class="cat-year-inline-error-text"></span>
    </div>
  `;

  container.appendChild(block);
  updateRemoveButtonsState(container);
}

/**
 * Voegt een nieuw jaar toe gebaseerd op het laatste jaar in de lijst.
 */
export function addNewYearRow(container) {
  const years = Array.from(container.querySelectorAll(".cat-year-block .cat-year-val"));
  let lastYear = new Date().getFullYear();
  if (years.length > 0) {
    const val = parseInt(String(years[years.length - 1].value ?? ""), 10);
    if (!Number.isNaN(val)) lastYear = val;
  }
  renderYearRow(container, lastYear + 1, "");
}