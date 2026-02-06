// scripts/core/state/saving-accounts-ui.js
import { t, formatCurrency } from "../../i18n.js";
import { createPopupOverlay, createPopupContainer } from "../../ui/popups.js";
import { getSavingAccountById, upsertSavingAccount } from "./saving-accounts-data.js";
import { renderSavingAccountSheetContent, collectSavingYearsAndRates } from "./saving-accounts-ui-render.js";
import { clearSavingYearInlineErrors, showSavingYearInlineError } from "./saving-accounts-ui-years.js";
import { precommitFindFirstSavingAccountLimitViolation, precommitFindFirstSavingAccountNegativeBalance } from "./saving-accounts-precommit-limit.js";

// Nieuwe imports uit modulen
import { monthName, parseDecimalOrZero } from "./saving-accounts-ui-helpers.js";
import { hasMonthOverridesForYear } from "./saving-accounts-ui-guards.js";
import { openSavingYearDeletedKeepManualInfoSheet } from "./saving-accounts-ui-popups.js";

export function openSavingAccountSheet(id = null, onComplete = null) {
  const isEdit = id !== null;
  let acc = isEdit ? getSavingAccountById(id) : null;
  if (!acc) acc = { id: null, name: "", startBalance: 0, years: {} };

  const overlay = createPopupOverlay();
  const root = createPopupContainer("category-edit-sheet saving-account-edit-sheet savings-edit-sheet");
  root.style.maxHeight = "min(92vh, 820px)";
  root.style.display = "flex";
  root.style.flexDirection = "column";

  const handleClose = () => {
    root.classList.remove("show");
    setTimeout(() => overlay.remove(), 160);
    if (typeof onComplete === "function") onComplete();
  };

  overlay.__ff_onCancel = handleClose;
  overlay.onclick = (e) => { if (e.target === overlay) handleClose(); };

  const yearRowOpts = {
    onRequestRemove: ({ year, rawYear, remove, container } = {}) => {
      const yearsContainer = container;
      try { if (yearsContainer) clearSavingYearInlineErrors(yearsContainer); } catch (_) {}

      const totalBlocks = yearsContainer ? yearsContainer.querySelectorAll(".sav-year-block").length : 0;
      if (totalBlocks <= 1) {
        if (yearsContainer) {
          showSavingYearInlineError(yearsContainer, String(rawYear ?? year ?? "0").trim() || "0", t("errors.cannot_delete_last_year"));
        }
        return;
      }

      const yInt = Number(year);
      if (!Number.isFinite(yInt)) {
        remove?.();
        return;
      }

      const collected = collectSavingYearsAndRates(yearsContainer);
      const nextYears = { ...(collected?.years || {}) };
      const nextRates = { ...(collected?.rates || {}) };
      delete nextYears[String(yInt)];
      delete nextRates[String(yInt)];

      const candidate = {
        id: acc?.id,
        name: String(root.querySelector("#savName")?.value || acc?.name || "").trim(),
        startBalance: parseDecimalOrZero(root.querySelector("#savStartBalance")?.value ?? acc?.startBalance ?? 0),
        years: nextYears,
        rates: nextRates,
      };

      const violation = precommitFindFirstSavingAccountLimitViolation({ updatedAccount: candidate, replaceId: isEdit ? acc.id : null });
      if (violation && yearsContainer) {
        showSavingYearInlineError(yearsContainer, violation.year, t("errors.bank_limit_reached", { month: `${monthName(violation.month)} ${violation.year}`, amount: formatCurrency(violation.bank), limit: formatCurrency(violation.limit) }));
        return;
      }

      const neg = precommitFindFirstSavingAccountNegativeBalance({ updatedAccount: candidate, replaceId: isEdit ? acc.id : null });
      if (neg && yearsContainer) {
        showSavingYearInlineError(yearsContainer, neg.year, t("errors.saving_limit_reached", { month: `${monthName(neg.month)} ${neg.year}`, amount: formatCurrency(neg.saving) }));
        return;
      }

      remove?.();
      if (hasMonthOverridesForYear(yInt, acc?.id || id)) {
        openSavingYearDeletedKeepManualInfoSheet({ year: yInt });
      }
    },
  };

  renderSavingAccountSheetContent(root, isEdit, acc, { yearRowOpts });
  overlay.appendChild(root);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => root.classList.add("show"));

  const nameInp = root.querySelector("#savName");
  const startInp = root.querySelector("#savStartBalance");
  const yearsContainer = root.querySelector("#savYearsContainer");
  const saveBtn = root.querySelector("#saveSavBtn");

  const clearInlineLimit = (e) => {
    if (e?.type === "click" && e.target.closest(".remove-year-btn")) return;
    if (yearsContainer) clearSavingYearInlineErrors(yearsContainer);
    if (saveBtn) saveBtn.disabled = false;
  };

  if (nameInp) nameInp.oninput = () => { if (root.querySelector("#savNameError")) root.querySelector("#savNameError").style.display = "none"; clearInlineLimit(); };
  if (startInp) startInp.oninput = () => { if (root.querySelector("#savStartError")) root.querySelector("#savStartError").style.display = "none"; clearInlineLimit(); };
  if (yearsContainer) {
    yearsContainer.addEventListener("input", clearInlineLimit);
    yearsContainer.addEventListener("click", clearInlineLimit);
  }

  root.querySelector("#cancelSavBtn").onclick = (e) => { e?.preventDefault(); handleClose(); };

  if (saveBtn) saveBtn.onclick = (e) => {
    e?.preventDefault();
    const updated = {
      id: acc?.id,
      name: String(nameInp?.value || "").trim(),
      startBalance: parseDecimalOrZero(startInp?.value),
      years: collectSavingYearsAndRates(yearsContainer).years,
      rates: collectSavingYearsAndRates(yearsContainer).rates,
    };

    if (!updated.name) { if (root.querySelector("#savNameError")) root.querySelector("#savNameError").style.display = "flex"; return; }
    if (updated.startBalance < 0) { if (root.querySelector("#savStartError")) root.querySelector("#savStartError").style.display = "flex"; return; }

    const violation = precommitFindFirstSavingAccountLimitViolation({ updatedAccount: updated, replaceId: isEdit ? acc.id : null });
    if (violation && yearsContainer) {
      showSavingYearInlineError(yearsContainer, violation.year, t("errors.bank_limit_reached", { month: `${monthName(violation.month)} ${violation.year}`, amount: formatCurrency(violation.bank), limit: formatCurrency(violation.limit) }));
      saveBtn.disabled = true;
      return;
    }

    const neg = precommitFindFirstSavingAccountNegativeBalance({ updatedAccount: updated, replaceId: isEdit ? acc.id : null });
    if (neg && yearsContainer) {
      showSavingYearInlineError(yearsContainer, neg.year, t("errors.saving_limit_reached", { month: `${monthName(neg.month)} ${neg.year}`, amount: formatCurrency(neg.saving) }));
      saveBtn.disabled = true;
      return;
    }

    try {
      upsertSavingAccount(updated, isEdit ? acc.id : null);
      handleClose();
    } catch (err) { console.error(err); }
  };
}

export function openNewSavingAccountSheet(onComplete = null) { openSavingAccountSheet(null, onComplete); }
export function openEditSavingAccountSheet(id, onComplete = null) { openSavingAccountSheet(id, onComplete); }