// scripts/core/state/saving-accounts-ui-years-render.js
import { t } from "../../i18n.js";
import { updateRemoveButtonsState, rateToDisplay } from "./saving-accounts-ui-years-utils.js";

/**
 * Beheert de visuele status van de Sparen/Opnemen toggle.
 */
export function applyToggleUI(block, mode) {
  const saveBtn = block.querySelector(".sav-toggle-save");
  const withBtn = block.querySelector(".sav-toggle-withdraw");
  if (!saveBtn || !withBtn) return;

  saveBtn.classList.remove("is-active-green");
  withBtn.classList.remove("is-active-red");

  if (mode === "withdraw") {
    withBtn.classList.add("is-active-red");
    block.dataset.mode = "withdraw";
  } else {
    saveBtn.classList.add("is-active-green");
    block.dataset.mode = "save";
  }
}

/**
 * Rendert een rij met jaar, bedrag, rente en de delete/toggle acties.
 */
export function renderSavingYearRow(container, year, signedAmount, rateValue = null, opts = null) {
  const options = (opts && typeof opts === "object") ? opts : {};
  const block = document.createElement("div");
  block.className = "sav-year-block";

  const amountNum = Number(signedAmount);
  const mode = (!Number.isNaN(amountNum) && amountNum < 0) ? "withdraw" : "save";
  const absVal = (!Number.isNaN(amountNum) ? Math.abs(amountNum) : 0);

  block.innerHTML = `
    <div class="cat-year-row sav-year-top">
      <input class="ff-input cat-year-val cat-year-input" inputmode="numeric" pattern="[0-9]*" maxlength="4" value="${year ?? ""}" aria-label="${t("common.year")}" />
      <input class="ff-input cat-budget-val cat-budget-input" inputmode="decimal" value="${String(absVal).replace(".", ",")}" aria-label="${t("common.amount")}" />
      <input class="ff-input sav-rate-input" inputmode="decimal" placeholder="%" value="${rateToDisplay(rateValue)}" aria-label="${t("saving_accounts.interest_label")}" />
      <button type="button" class="remove-year-btn ff-btn ff-cat-remove-btn">${t("common.delete")}</button>
    </div>
    <div class=\"sav-toggle-row\">
      <button type=\"button\" class=\"ff-btn ff-btn--toggle-micro sav-toggle-wide sav-toggle-save\">${t("saving_accounts.toggle_save")}</button>
      <button type=\"button\" class=\"ff-btn ff-btn--toggle-micro sav-toggle-wide sav-toggle-withdraw\">${t("saving_accounts.toggle_withdraw")}</button>
    </div>
    <div class=\"ff-inline-error sav-year-inline-error\" role=\"alert\" aria-live=\"polite\" style=\"display:none; margin-top:10px;\">
      <span class=\"ff-inline-error__icon\">${t("popups.error_icon")}</span>
      <span class=\"sav-year-inline-error-text\"></span>
    </div>
  `;

  container.appendChild(block);
  applyToggleUI(block, mode);

  const removeBtn = block.querySelector(".remove-year-btn");
  const yearInp = block.querySelector(".cat-year-val");

  const removeBlock = () => {
    block.remove();
    updateRemoveButtonsState(container);
  };

  if (removeBtn) {
    removeBtn.onclick = (e) => {
      e?.preventDefault?.(); e?.stopPropagation?.(); e?.stopImmediatePropagation?.();
      const rawYear = String(yearInp?.value ?? "").trim();
      const yearInt = parseInt(rawYear, 10);
      const ctx = { block, container, rawYear, year: Number.isFinite(yearInt) ? yearInt : null, remove: removeBlock };
      if (typeof options.onRequestRemove === "function") { options.onRequestRemove(ctx); } else { removeBlock(); }
    };
  }

  block.querySelector(".sav-toggle-save").onclick = () => applyToggleUI(block, "save");
  block.querySelector(".sav-toggle-withdraw").onclick = () => applyToggleUI(block, "withdraw");
  updateRemoveButtonsState(container);
}

/**
 * Voegt een nieuwe rij toe gebaseerd op het hoogst aanwezige jaar.
 */
export function addNewSavingYearRow(container, opts = null) {
  let maxYear = new Date().getFullYear();
  container.querySelectorAll(".sav-year-block .cat-year-val").forEach((inp) => {
    const y = parseInt(inp.value, 10);
    if (!Number.isNaN(y)) maxYear = Math.max(maxYear, y);
  });
  renderSavingYearRow(container, maxYear + 1, 0, null, opts);
}