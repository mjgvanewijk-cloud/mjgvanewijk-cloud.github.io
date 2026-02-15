// scripts/ui/popup/saving-month/add-pot-sheet-add.js
import { t, formatCurrency } from "../../../i18n.js";
import { createPopupOverlay, createPopupContainer } from "../../popups.js";
import { bindRenameLogic } from "../../../core/state/categories-ui/sheet-rename-logic.js";
import {
  getSavingAccounts,
  upsertSavingAccount,
} from "../../../core/state/saving-accounts-data.js";
import { setNextActionReason, buildUserReason } from "../../../core/history/index.js";
import {
  precommitFindFirstSavingAccountLimitViolation,
  precommitFindFirstSavingAccountNegativeBalance,
} from "../../../core/state/saving-accounts-precommit-limit.js";
import {
  renderSavingYearRow,
  addNewSavingYearRow,
  collectSavingYearsAndRates,
  clearSavingYearInlineErrors,
  showSavingYearInlineError,
} from "../../../core/state/saving-accounts-ui-years.js";
import { isPremiumActiveForUI } from "../../../core/state/premium-data.js";
import { setSystemSavingFlowForScope } from "../saving-month-store.js";
import * as Helpers from "./saving-pot-helpers.js";
import { getSavingPotSheetHTML } from "./saving-pot-ui-html.js";
import { openPremiumProgressOverlay, FF_SAVING_ACCOUNTS_CHANGED_DONE_EVENT } from "../premium-progress-overlay.js";

export function openAddSavingPotSheet({ year, onComplete } = {}) {
  const y = Number(year) || new Date().getFullYear();

  const existing = document.getElementById("savingPotAddOverlay");
  if (existing) existing.remove();

  const overlay = createPopupOverlay("ff-overlay-center");
  overlay.id = "savingPotAddOverlay";

  const root = createPopupContainer(
    "ff-month-category-sheet ff-month-category-card ff-cat-edit-from-month ff-month-category-sheet--saving"
  );

  // Helpcloud: force the correct help context for this sheet (used from Month cards AND Settings).
  // We can't rely on localized titles here because Settings sub-sheets can reuse theme classes.
  try {
    root.classList.add("saving-account-edit-sheet");
    root.dataset.ffHelpContext = "savingpot_add";
  } catch (_) {}

  const handleClose = () => {
    root.classList.remove("show");
    setTimeout(() => overlay.remove(), 160);
    if (typeof onComplete === "function") onComplete();
  };

  overlay.__ff_onCancel = handleClose;
  overlay.onclick = (e) => { if (e.target === overlay) handleClose(); };

  root.innerHTML = getSavingPotSheetHTML();

  bindRenameLogic(
    root,
    "saving",
    root.querySelector("#catNameStaticText"),
    root.querySelector("#catNameStatic"),
    root.querySelector("#catName"),
    root.querySelector("#catNameInputWrap"),
    root.querySelector("#catNameEditBtn")
  );

  try { root.__ffCatSetNameEditing?.(true); } catch (_) {}

  overlay.appendChild(root);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => root.classList.add("show"));

  const nameInp = root.querySelector("#catName");
  const startInp = root.querySelector("#savStartBalance");
  const yearsContainer = root.querySelector("#savYearsContainer");
  const saveBtn = root.querySelector("#saveSavBtn");
  const cancelBtn = root.querySelector("#cancelSavBtn");
  const addYearBtn = root.querySelector("#addSavYearBtn");
  const rateErr = root.querySelector("#savRateError");

  if (yearsContainer) renderSavingYearRow(yearsContainer, y, 0, null);

  const clearLimitErrors = () => {
    if (yearsContainer) clearSavingYearInlineErrors(yearsContainer);
    if (rateErr) rateErr.style.display = "none";
    if (saveBtn) saveBtn.disabled = false;
  };

  const hideErrors = () => {
    Helpers.hideNameInlineError(root);
    Helpers.hideStartInlineError(root);
    clearLimitErrors();
  };

  if (nameInp) nameInp.addEventListener("input", hideErrors);
  if (startInp) {
    startInp.addEventListener("input", hideErrors);
    startInp.addEventListener("click", (e) => e.stopPropagation());
    startInp.addEventListener("pointerdown", (e) => e.stopPropagation());
  }
  if (yearsContainer) {
    yearsContainer.addEventListener("input", hideErrors);
    yearsContainer.addEventListener("click", hideErrors);
  }
  if (cancelBtn) cancelBtn.onclick = (e) => { e?.preventDefault(); handleClose(); };
  if (addYearBtn) addYearBtn.onclick = (e) => {
    e?.preventDefault?.();
    if (!yearsContainer) return;
    const block = addNewSavingYearRow(yearsContainer);
    if (!block) return;

    const focusEl = block.querySelector(".cat-budget-input") || block.querySelector(".cat-year-input") || block.querySelector("input");
    const scrollIntoView = () => {
      try { block.scrollIntoView({ block: "end", inline: "nearest" }); } catch (_) {}
    };
    const focus = () => {
      try { focusEl?.focus?.({ preventScroll: true }); }
      catch (_) { try { focusEl?.focus?.(); } catch (_) {} }
    };

    try { requestAnimationFrame(() => { scrollIntoView(); focus(); }); } catch (_) { scrollIntoView(); focus(); }
    try { setTimeout(() => { scrollIntoView(); focus(); }, 0); } catch (_) {}
  };

  if (saveBtn) saveBtn.onclick = (e) => {
    e?.preventDefault();
    hideErrors();

    const name = Helpers.normalizeName(nameInp?.value);
    if (!name) {
      Helpers.showNameInlineError(root, t("saving_accounts.name_required"));
      return;
    }

    if (Helpers.isNameDuplicate(name, getSavingAccounts())) {
      Helpers.showNameInlineError(root, t("saving_accounts.name_conflict"));
      return;
    }

    const startBalance = Helpers.parseDecimalOrZero(startInp?.value);
    if (startBalance < 0) {
      Helpers.showStartInlineError(root, t("saving_accounts.start_balance_non_negative"));
      return;
    }

    const collected = collectSavingYearsAndRates(yearsContainer);
    if (!collected.rateOk) {
      if (rateErr) rateErr.style.display = "flex";
      return;
    }

    const updated = { id: null, name, startBalance, years: collected.years || {}, rates: collected.rates || {} };

    // UX: toon de blocking spinner-sheet alleen bij 'Opslaan' wanneer de gebruiker één of meerdere jaren
    // extra heeft toegevoegd via '+ Jaar toevoegen' (dus meer dan de standaard start-jaarregel).
    const hasAddedYears = Object.keys(updated.years || {}).length > 1;

    const violation = precommitFindFirstSavingAccountLimitViolation({ updatedAccount: updated, replaceId: null });
    if (violation) {
      showSavingYearInlineError(yearsContainer, violation.year, t("errors.bank_limit_reached", { month: `${Helpers.monthName(violation.month)} ${violation.year}`, amount: formatCurrency(violation.bank), limit: formatCurrency(violation.limit) }));
      if (saveBtn) saveBtn.disabled = true;
      return;
    }

    const neg = precommitFindFirstSavingAccountNegativeBalance({ updatedAccount: updated, replaceId: null });
    if (neg) {
      showSavingYearInlineError(yearsContainer, neg.year, t("errors.saving_limit_reached", { month: `${Helpers.monthName(neg.month)} ${neg.year}`, amount: formatCurrency(neg.saving) }));
      if (saveBtn) saveBtn.disabled = true;
      return;
    }

    const doCommit = ({ busyToken } = {}) => {
      // User action => allow snapshots / enable Undo-Redo even if the user clicks very fast after boot.
      try { window.__finflowBooting = false; } catch (_) {}

      // Option C: explicit history message for adding a saving pot (avoid generic "settings" reason).
      try {
        setNextActionReason(buildUserReason("savingpot.add", false));
      } catch (_) {}

      const saved = upsertSavingAccount(updated, null);
      if (!isPremiumActiveForUI()) {
        const v = Number(saved?.years?.[String(y)] ?? 0);
        if (Number.isFinite(v)) {
          try { setSystemSavingFlowForScope(y, 1, "all", v); } catch (_) {}
        }
      }
      const yrs = Object.keys(updated?.years || {}).map((s) => Number(s)).filter(Number.isFinite);
      const fromYear = yrs.length ? Math.min(...yrs) : y;
      try { document.dispatchEvent(new CustomEvent("ff-saving-accounts-changed", { detail: { year: y, fromYear, busyToken } })); } catch (_) {}
      handleClose();
    };

    if (!hasAddedYears) {
      try { doCommit(); } catch (err) { console.error(err); }
      return;
    }

    const busyToken = `savpot-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const { finishAndClose, hardClose } = openPremiumProgressOverlay();

    const onDone = (ev) => {
      const d = ev?.detail || {};
      if (d.busyToken !== busyToken) return;
      document.removeEventListener(FF_SAVING_ACCOUNTS_CHANGED_DONE_EVENT, onDone);
      finishAndClose();
    };
    document.addEventListener(FF_SAVING_ACCOUNTS_CHANGED_DONE_EVENT, onDone);

    const run = () => {
      try { doCommit({ busyToken }); }
      catch (err) { console.error(err); }
    };

    try {
      requestAnimationFrame(() => {
        try { setTimeout(run, 0); } catch (_) { run(); }
      });
    } catch (_) {
      try { setTimeout(run, 0); } catch (_) { run(); }
    }

    try { setTimeout(() => { try { hardClose(); } catch (_) {} }, 60000); } catch (_) {}
  };
}