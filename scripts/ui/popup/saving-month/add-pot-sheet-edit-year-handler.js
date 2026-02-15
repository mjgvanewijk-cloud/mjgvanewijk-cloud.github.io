// scripts/ui/popup/saving-month/add-pot-sheet-edit-year-handler.js
import { t } from "../../../i18n.js";
import { upsertSavingAccount } from "../../../core/state/saving-accounts-data.js";
import { collectSavingYearsAndRates, clearSavingYearInlineErrors, showSavingYearInlineError } from "../../../core/state/saving-accounts-ui-years.js";
import {
  precommitFindFirstSavingAccountLimitViolation,
  precommitFindFirstSavingAccountNegativeBalance,
  precommitFindFirstSavingAccountBankNegative,
} from "../../../core/state/saving-accounts-precommit-limit.js";
import { openSavingYearDeletedKeepManualInfoSheet } from "./delete-sheets.js";
import { hasMonthOverridesForYear } from "./add-pot-sheet-edit-logic.js";
import { showInlineNotPossibleForPreview } from "./add-pot-sheet-edit-ui.js";
import { openPremiumProgressOverlay, FF_SAVING_ACCOUNTS_CHANGED_DONE_EVENT } from "../premium-progress-overlay.js";

export const getYearRowOpts = (baseMd, accountId, existingAcc, y, pendingWipeYears, pendingRemoveYears, pendingNoDefaultYears) => ({
  onRequestRemove: ({ year, rawYear, remove, block } = {}) => {
    // UX: premium progress overlay tonen bij 'Jaar verwijderen'
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
      const raw = String(rawYear || "").trim();
      const yearsContainer = block?.closest?.("#savYearsContainer") || document.getElementById("savYearsContainer");

      const count = yearsContainer?.querySelectorAll?.('.sav-year-block')?.length || 0;
      if (count <= 1) {
        clearSavingYearInlineErrors(yearsContainer);
        showSavingYearInlineError(yearsContainer, raw || year || '', t('errors.cannot_delete_last_year'));
        return false;
      }

      if (!year || !Number.isFinite(Number(year))) {
        if (raw) { pendingWipeYears.delete(raw); pendingRemoveYears.add(raw); pendingNoDefaultYears.delete(raw); }
        remove?.();
        return false;
      }

      const yInt = Number(year);
      const yStr = String(yInt);
      const collected = collectSavingYearsAndRates(yearsContainer);
      
      if (!collected?.rateOk) {
        const rateErr = document.getElementById("savRateError");
        if (rateErr) rateErr.style.display = "flex";
        return false;
      }

      const years = { ...(collected?.years || {}) };
      const rates = { ...(collected?.rates || {}) };
      delete years[yStr]; delete rates[yStr];

      const updatedAccount = { ...existingAcc, years, rates };

      const bankNeg = precommitFindFirstSavingAccountBankNegative({ monthDataOverride: baseMd, updatedAccount, replaceId: existingAcc.id });
      if (bankNeg) { showInlineNotPossibleForPreview({ previewRes: { ok: false, kind: "bankNegative", violation: bankNeg }, targetYearInt: yInt, yearsContainer }); return false; }

      const bankViolation = precommitFindFirstSavingAccountLimitViolation({ monthDataOverride: baseMd, updatedAccount, replaceId: existingAcc.id });
      if (bankViolation) { showInlineNotPossibleForPreview({ previewRes: { ok: false, kind: "bank", violation: bankViolation }, targetYearInt: yInt, yearsContainer }); return false; }

      const savingViolation = precommitFindFirstSavingAccountNegativeBalance({ monthDataOverride: baseMd, updatedAccount, replaceId: existingAcc.id });
      if (savingViolation) { showInlineNotPossibleForPreview({ previewRes: { ok: false, kind: "saving", violation: savingViolation }, targetYearInt: yInt, yearsContainer }); return false; }

      // Persist change
      upsertSavingAccount(updatedAccount, existingAcc.id);
      // Notify UI + recalc listeners
      // Use the current popup year context for refresh listeners.
      // Jaar verwijderen beïnvloedt carry-over vanaf het verwijderde jaar.
      const fromYear = yInt;
      try { document.dispatchEvent(new CustomEvent("ff-saving-accounts-changed", { detail: { year: y, fromYear, busyToken } })); } catch (_) {}
      remove?.();

      if (hasMonthOverridesForYear(yInt, baseMd, accountId)) openSavingYearDeletedKeepManualInfoSheet({ year: yInt });
      return true;
    };

    // Laat de overlay eerst renderen voordat we potentieel zwaardere berekeningen doen
    const exec = () => {
      const ok = run();
      if (ok === false) {
        document.removeEventListener(FF_SAVING_ACCOUNTS_CHANGED_DONE_EVENT, onDone);
        finishAndClose();
      }
    };

    try {
      requestAnimationFrame(() => {
        try { setTimeout(exec, 0); } catch (_) { exec(); }
      });
    } catch (_) {
      try { setTimeout(exec, 0); } catch (_) { exec(); }
    }

    // Safety net: never leave a stuck overlay.
    try { setTimeout(() => { try { hardClose(); } catch (_) {} }, 60000); } catch (_) {}
  }
});