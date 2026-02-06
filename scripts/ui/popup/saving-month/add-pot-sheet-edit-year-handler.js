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

export const getYearRowOpts = (baseMd, accountId, existingAcc, y, pendingWipeYears, pendingRemoveYears, pendingNoDefaultYears) => ({
  onRequestRemove: ({ year, rawYear, remove, block } = {}) => {
    const raw = String(rawYear || "").trim();
    const yearsContainer = block?.closest?.("#savYearsContainer") || document.getElementById("savYearsContainer");

    const count = yearsContainer?.querySelectorAll?.('.sav-year-block')?.length || 0;
    if (count <= 1) {
      clearSavingYearInlineErrors(yearsContainer);
      showSavingYearInlineError(yearsContainer, raw || year || '', t('errors.cannot_delete_last_year'));
      return;
    }

    if (!year || !Number.isFinite(Number(year))) {
      if (raw) { pendingWipeYears.delete(raw); pendingRemoveYears.add(raw); pendingNoDefaultYears.delete(raw); }
      remove?.();
      return;
    }

    const yInt = Number(year);
    const yStr = String(yInt);
    const collected = collectSavingYearsAndRates(yearsContainer);
    
    if (!collected?.rateOk) {
      const rateErr = document.getElementById("savRateError");
      if (rateErr) rateErr.style.display = "flex";
      return;
    }

    const years = { ...(collected?.years || {}) };
    const rates = { ...(collected?.rates || {}) };
    delete years[yStr]; delete rates[yStr];

    const updatedAccount = { ...existingAcc, years, rates };

    const bankNeg = precommitFindFirstSavingAccountBankNegative({ monthDataOverride: baseMd, updatedAccount, replaceId: existingAcc.id });
    if (bankNeg) { showInlineNotPossibleForPreview({ previewRes: { ok: false, kind: "bankNegative", violation: bankNeg }, targetYearInt: yInt, yearsContainer }); return; }

    const bankViolation = precommitFindFirstSavingAccountLimitViolation({ monthDataOverride: baseMd, updatedAccount, replaceId: existingAcc.id });
    if (bankViolation) { showInlineNotPossibleForPreview({ previewRes: { ok: false, kind: "bank", violation: bankViolation }, targetYearInt: yInt, yearsContainer }); return; }

    const savingViolation = precommitFindFirstSavingAccountNegativeBalance({ monthDataOverride: baseMd, updatedAccount, replaceId: existingAcc.id });
    if (savingViolation) { showInlineNotPossibleForPreview({ previewRes: { ok: false, kind: "saving", violation: savingViolation }, targetYearInt: yInt, yearsContainer }); return; }

    // Persist change
    upsertSavingAccount(updatedAccount, existingAcc.id);
    // Notify UI + recalc listeners
    try { document.dispatchEvent(new CustomEvent("ff-saving-accounts-changed", { detail: { year: yInt } })); } catch (_) {}
    remove?.();

    if (hasMonthOverridesForYear(yInt, baseMd, accountId)) openSavingYearDeletedKeepManualInfoSheet({ year: yInt });
  }
});