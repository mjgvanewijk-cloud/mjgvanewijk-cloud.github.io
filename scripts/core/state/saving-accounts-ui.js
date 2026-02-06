// scripts/core/state/saving-accounts-ui.js
import { t, formatCurrency } from "../../i18n.js";
import { createPopupOverlay, createPopupContainer } from "../../ui/popups.js";
import { getSavingAccountById, upsertSavingAccount } from "./saving-accounts-data.js";
import { renderSavingAccountSheetContent, collectSavingYearsAndRates } from "./saving-accounts-ui-render.js";
import { clearSavingYearInlineErrors, showSavingYearInlineError } from "./saving-accounts-ui-years.js";
import { precommitFindFirstSavingAccountLimitViolation, precommitFindFirstSavingAccountNegativeBalance } from "./saving-accounts-precommit-limit.js";

// Module Imports
import { monthName, parseDecimalOrZero } from "./saving-accounts-ui-helpers.js";
import { getYearRowOpts } from "./saving-accounts-ui-year-handler.js";

export function openSavingAccountSheet(id = null, onComplete = null) {
  const isEdit = id !== null;
  let acc = isEdit ? getSavingAccountById(id) : null;
  if (!acc) acc = { id: null, name: "", startBalance: 0, years: {} };

  const overlay = createPopupOverlay();
  const root = createPopupContainer("category-edit-sheet saving-account-edit-sheet savings-edit-sheet");
  root.style.maxHeight = "min(92vh, 820px)"; root.style.display = "flex"; root.style.flexDirection = "column";

  const handleClose = () => { root.classList.remove("show"); setTimeout(() => overlay.remove(), 160); if (onComplete) onComplete(); };
  overlay.onclick = (e) => { if (e.target === overlay) handleClose(); };

  renderSavingAccountSheetContent(root, isEdit, acc, { yearRowOpts: getYearRowOpts(root, acc, isEdit, id) });

  overlay.appendChild(root); document.body.appendChild(overlay);
  requestAnimationFrame(() => root.classList.add("show"));

  const nameInp = root.querySelector("#savName"), startInp = root.querySelector("#savStartBalance"), yearsContainer = root.querySelector("#savYearsContainer"), saveBtn = root.querySelector("#saveSavBtn");

  const hideErrors = () => {
    ["#savNameError", "#savStartError"].forEach(sel => { if (root.querySelector(sel)) root.querySelector(sel).style.display = "none"; });
    if (yearsContainer) clearSavingYearInlineErrors(yearsContainer);
    if (saveBtn) saveBtn.disabled = false;
  };

  if (nameInp) nameInp.oninput = hideErrors; if (startInp) startInp.oninput = hideErrors;
  if (yearsContainer) { yearsContainer.addEventListener("input", hideErrors); yearsContainer.addEventListener("click", hideErrors); }

  root.querySelector("#cancelSavBtn").onclick = (e) => { e?.preventDefault(); handleClose(); };

  if (saveBtn) saveBtn.onclick = (e) => {
    e.preventDefault(); hideErrors();
    const name = String(nameInp?.value || "").trim(), startBalance = parseDecimalOrZero(startInp?.value);
    if (!name) { if (root.querySelector("#savNameError")) root.querySelector("#savNameError").style.display = "flex"; return; }
    if (startBalance < 0) { if (root.querySelector("#savStartError")) root.querySelector("#savStartError").style.display = "flex"; return; }

    const collected = collectSavingYearsAndRates(yearsContainer);
    if (!collected.rateOk) { if (root.querySelector("#savRateError")) root.querySelector("#savRateError").style.display = "flex"; return; }

    const updated = { id: acc?.id, name, startBalance, years: collected.years, rates: collected.rates };
    const violation = precommitFindFirstSavingAccountLimitViolation({ updatedAccount: updated, replaceId: isEdit ? acc.id : null });
    if (violation) { if (yearsContainer) showSavingYearInlineError(yearsContainer, violation.year, t("errors.bank_limit_reached", { month: `${monthName(violation.month)} ${violation.year}`, amount: formatCurrency(violation.bank), limit: formatCurrency(violation.limit) })); saveBtn.disabled = true; return; }

    const neg = precommitFindFirstSavingAccountNegativeBalance({ updatedAccount: updated, replaceId: isEdit ? acc.id : null });
    if (neg) { if (yearsContainer) showSavingYearInlineError(yearsContainer, neg.year, t("errors.saving_limit_reached", { month: `${monthName(neg.month)} ${neg.year}`, amount: formatCurrency(neg.saving) })); saveBtn.disabled = true; return; }

    try { upsertSavingAccount(updated, isEdit ? acc.id : null); handleClose(); } catch (err) { console.error(err); }
  };
}

export function openNewSavingAccountSheet(onComplete = null) { openSavingAccountSheet(null, onComplete); }
export function openEditSavingAccountSheet(id, onComplete = null) { openSavingAccountSheet(id, onComplete); }