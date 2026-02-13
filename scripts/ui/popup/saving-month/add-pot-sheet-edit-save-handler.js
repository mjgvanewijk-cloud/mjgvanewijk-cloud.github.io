// scripts/ui/popup/saving-month/add-pot-sheet-edit-save-handler.js
import { t, formatCurrency } from "../../../i18n.js";
import { loadMonthData, saveMonthData } from "../../../core/storage/index.js";
import { collectSavingYearsAndRates, clearSavingYearInlineErrors, showSavingYearInlineError } from "../../../core/state/saving-accounts-ui-years.js";
import { isPremiumActiveForUI } from "../../../core/state/premium-data.js";
import { setSystemSavingFlowForScope } from "../saving-month-store.js";
import { upsertSavingAccount, getSavingAccounts } from "../../../core/state/saving-accounts-data.js";
import {
  precommitFindFirstSavingAccountLimitViolation,
  precommitFindFirstSavingAccountNegativeBalance,
  precommitFindFirstSavingAccountBankNegative,
} from "../../../core/state/saving-accounts-precommit-limit.js";
import * as Helpers from "./saving-pot-helpers.js";
import { isNameDuplicateExcludingId } from "./add-pot-sheet-logic.js";
import { applyWipeYearsToMonthData, hasMonthOverridesForYear } from "./add-pot-sheet-edit-logic.js";
import { openSavingManualMonthOverridesConfirmSheet } from "./sheet-month-overrides-confirm.js";
import { openCalculatingSheet } from "../calculating-sheet.js";

export function bindSaveBtnLogic({ root, saveBtn, yearsContainer, rateErr, nameInp, startInp, accountId, existingAcc, y, handleClose, hideErrors }) {
  saveBtn.onclick = (e) => {
    e.preventDefault();
    clearSavingYearInlineErrors(yearsContainer);
    if (rateErr) rateErr.style.display = "none";

    const name = Helpers.normalizeName(nameInp.value);
    if (!name || isNameDuplicateExcludingId(name, getSavingAccounts(), accountId)) return;
    
    const startBalance = Helpers.parseDecimalOrZero(startInp.value);
    if (startBalance < 0) {
      try { Helpers.showStartInlineError(root, t("saving_accounts.start_balance_non_negative")); } catch (_) {}
      return;
    }

    const collected = collectSavingYearsAndRates(yearsContainer);
    if (!collected?.rateOk) {
      const rateErrLocal = root.querySelector("#savRateError");
      if (rateErrLocal) rateErrLocal.style.display = "flex";
      return;
    }
    const updated = { ...existingAcc, name, startBalance, years: collected.years, rates: collected.rates };
    const mdNow = loadMonthData() || {};

    const performCommit = ({ monthDataOverrideForChecks, wipeOverrideYears } = {}) => {
      const mdCheck = monthDataOverrideForChecks || {};
      const bankNeg = precommitFindFirstSavingAccountBankNegative({ monthDataOverride: mdCheck, updatedAccount: updated, replaceId: existingAcc.id });
      if (bankNeg) {
        showSavingYearInlineError(yearsContainer, String(bankNeg.year), t("messages.bank_negative_error", { month: t(`months.${bankNeg.month}`), year: bankNeg.year, amount: formatCurrency(bankNeg.bank) }));
        return;
      }
      const bankViolation = precommitFindFirstSavingAccountLimitViolation({ monthDataOverride: mdCheck, updatedAccount: updated, replaceId: existingAcc.id });
      if (bankViolation) {
        showSavingYearInlineError(yearsContainer, String(bankViolation.year), t("errors.bank_limit_reached", { month: `${t(`months.${bankViolation.month}`)} ${bankViolation.year}`, amount: formatCurrency(bankViolation.bank), limit: formatCurrency(bankViolation.limit) }));
        return;
      }
      const savingViolation = precommitFindFirstSavingAccountNegativeBalance({ monthDataOverride: mdCheck, updatedAccount: updated, replaceId: existingAcc.id });
      if (savingViolation) {
        showSavingYearInlineError(yearsContainer, String(savingViolation.year), t("errors.saving_limit_reached", { month: `${t(`months.${savingViolation.month}`)} ${savingViolation.year}`, amount: formatCurrency(savingViolation.saving) }));
        return;
      }
      const saved = upsertSavingAccount(updated, accountId);
      const wipeList = Array.isArray(wipeOverrideYears) ? wipeOverrideYears : [];
      if (wipeList.length) {
        try {
          const mdPersist = loadMonthData() || {}, mdClone = JSON.parse(JSON.stringify(mdPersist));
          const mdNext = applyWipeYearsToMonthData(mdClone, wipeList.map(String), accountId);
          saveMonthData(mdNext);
        } catch (_) {}
      }
      if (!isPremiumActiveForUI()) {
        const v = Number(saved?.years?.[String(y)] ?? 0);
        if (Number.isFinite(v)) { try { setSystemSavingFlowForScope(y, 1, "all", v); } catch (_) {} }
      }
      try { document.dispatchEvent(new CustomEvent("ff-saving-accounts-changed", { detail: { year: y } })); } catch (_) {}
      handleClose();
    };

    // Spinner alleen bij OPSLAAN als er één of meerdere jaren zijn TOEGEVOEGD via '+ Jaar toevoegen'.
    // (Niet bij normale edits van bestaande jaren.)
    const hadYears = new Set(Object.keys(existingAcc?.years || {}));
    const hasAddedYears = Object.keys(updated?.years || {}).some((ys) => !hadYears.has(String(ys)));

    const runCommitWithOptionalSpinner = (commitArgs) => {
      if (!hasAddedYears) {
        performCommit(commitArgs);
        return;
      }

      const closeCalc = openCalculatingSheet();
      try {
        setTimeout(() => {
          try { performCommit(commitArgs); }
          finally { try { closeCalc(); } catch (_) {} }
        }, 0);
      } catch (_) {
        try { performCommit(commitArgs); }
        finally { try { closeCalc(); } catch (_) {} }
      }
    };

    const changedYears = Object.keys(updated.years || {}).filter((ys) => Object.prototype.hasOwnProperty.call(existingAcc.years || {}, ys)).filter((ys) => Number(existingAcc.years?.[ys]) !== Number(updated.years?.[ys])).map((ys) => Number(ys)).filter(Number.isFinite).sort((a, b) => a - b);
    const yearWithOverrides = changedYears.find((yy) => hasMonthOverridesForYear(yy, mdNow, accountId));

    if (yearWithOverrides) {
      openSavingManualMonthOverridesConfirmSheet({
        year: yearWithOverrides,
        onNo: ({ close }) => { close(); runCommitWithOptionalSpinner({ monthDataOverrideForChecks: mdNow }); },
        onYes: ({ close }) => {
          close();
          let mdWiped = null;
          try {
            const mdClone = JSON.parse(JSON.stringify(mdNow));
            mdWiped = applyWipeYearsToMonthData(mdClone, [String(yearWithOverrides)], accountId);
          } catch (_) {
            mdWiped = mdNow;
          }
          runCommitWithOptionalSpinner({ monthDataOverrideForChecks: mdWiped, wipeOverrideYears: [String(yearWithOverrides)] });
        },
      });
      return;
    }
    runCommitWithOptionalSpinner({ monthDataOverrideForChecks: mdNow });
  };
}