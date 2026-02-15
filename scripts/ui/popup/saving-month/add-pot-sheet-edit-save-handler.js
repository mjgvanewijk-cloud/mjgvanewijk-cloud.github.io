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
import { openPremiumProgressOverlay, FF_SAVING_ACCOUNTS_CHANGED_DONE_EVENT } from "../premium-progress-overlay.js";

export function bindSaveBtnLogic({ root, saveBtn, yearsContainer, rateErr, nameInp, startInp, accountId, existingAcc, y, handleClose, hideErrors }) {
  saveBtn.onclick = async (e) => {
    e.preventDefault();
    clearSavingYearInlineErrors(yearsContainer);
    if (rateErr) rateErr.style.display = "none";

    const forceOverlayFromPrevInline = String(root?.dataset?.ffSavPotInlineFail || "") === "1";

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
    // Baseline must be the CURRENT saved account (sheet may stay open while edits happen).
    const baselineAcc = (getSavingAccounts() || []).find((a) => String(a.id) === String(existingAcc?.id)) || existingAcc;
    const mdNow = loadMonthData() || {};

    const performCommit = ({ monthDataOverrideForChecks, wipeOverrideYears, busyToken, validateOnly } = {}) => {
      const mdCheck = monthDataOverrideForChecks || {};
      const bankNeg = precommitFindFirstSavingAccountBankNegative({ monthDataOverride: mdCheck, updatedAccount: updated, replaceId: existingAcc.id });
      if (bankNeg) {
        showSavingYearInlineError(yearsContainer, String(bankNeg.year), t("messages.bank_negative_error", { month: t(`months.${bankNeg.month}`), year: bankNeg.year, amount: formatCurrency(bankNeg.bank) }));
        return false;
      }
      const bankViolation = precommitFindFirstSavingAccountLimitViolation({ monthDataOverride: mdCheck, updatedAccount: updated, replaceId: existingAcc.id });
      if (bankViolation) {
        showSavingYearInlineError(yearsContainer, String(bankViolation.year), t("errors.bank_limit_reached", { month: `${t(`months.${bankViolation.month}`)} ${bankViolation.year}`, amount: formatCurrency(bankViolation.bank), limit: formatCurrency(bankViolation.limit) }));
        return false;
      }
      const savingViolation = precommitFindFirstSavingAccountNegativeBalance({ monthDataOverride: mdCheck, updatedAccount: updated, replaceId: existingAcc.id });
      if (savingViolation) {
        showSavingYearInlineError(yearsContainer, String(savingViolation.year), t("errors.saving_limit_reached", { month: `${t(`months.${savingViolation.month}`)} ${savingViolation.year}`, amount: formatCurrency(savingViolation.saving) }));
        return false;
      }

      // Inline errors must have priority over any follow-up sheets.
      if (validateOnly) return true;

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
      try { 
      // Compute minimal start year for downstream recalcs. Changes to future years should not trigger expensive refresh for current sheet year.
      const _touchedYears = new Set();
      try {
        Object.keys(baselineAcc?.years || {}).forEach((s) => { const n = Number(s); if (Number.isFinite(n)) _touchedYears.add(n); });
        Object.keys(updated?.years || {}).forEach((s) => { const n = Number(s); if (Number.isFinite(n)) _touchedYears.add(n); });
        Object.keys(baselineAcc?.rates || {}).forEach((s) => { const n = Number(s); if (Number.isFinite(n)) _touchedYears.add(n); });
        Object.keys(updated?.rates || {}).forEach((s) => { const n = Number(s); if (Number.isFinite(n)) _touchedYears.add(n); });
      } catch (_) {}
      // Determine which years actually changed/added/removed.
      const _changedYears = [];
      try {
        const had = baselineAcc?.years || {};
        const now = updated?.years || {};
        // added/removed/changed amounts
        const keys = new Set([...Object.keys(had), ...Object.keys(now)]);
        keys.forEach((ys) => {
          const yv = Number(ys);
          if (!Number.isFinite(yv)) return;
          const inHad = Object.prototype.hasOwnProperty.call(had, ys);
          const inNow = Object.prototype.hasOwnProperty.call(now, ys);
          if (!inHad || !inNow) { _changedYears.push(yv); return; }
          if (Number(had?.[ys]) !== Number(now?.[ys])) _changedYears.push(yv);
        });
        // changed rates
        const rHad = baselineAcc?.rates || {};
        const rNow = updated?.rates || {};
        const rKeys = new Set([...Object.keys(rHad), ...Object.keys(rNow)]);
        rKeys.forEach((ys) => {
          const yv = Number(ys);
          if (!Number.isFinite(yv)) return;
          const inHad = Object.prototype.hasOwnProperty.call(rHad, ys);
          const inNow = Object.prototype.hasOwnProperty.call(rNow, ys);
          if (!inHad || !inNow) { _changedYears.push(yv); return; }
          if (Number(rHad?.[ys]) !== Number(rNow?.[ys])) _changedYears.push(yv);
        });
      } catch (_) {}
      const fromYear = _changedYears.length ? Math.min(..._changedYears) : y;
      document.dispatchEvent(new CustomEvent("ff-saving-accounts-changed", { detail: { year: y, fromYear, busyToken } })); } catch (_) {}
      handleClose();
      return true;
    };
    // Overlay tonen bij zware refresh (jaren add/remove, bedrag/rente gewijzigd).
    const hadYears = new Set(Object.keys(baselineAcc?.years || {}));
    const hasAddedYears = Object.keys(updated?.years || {}).some((ys) => !hadYears.has(String(ys)));
    const hasRemovedYears = Object.keys(baselineAcc?.years || {}).some((ys) => !Object.prototype.hasOwnProperty.call(updated?.years || {}, ys));

    const changedYearsForPerf = Object.keys(updated?.years || {})
      .filter((ys) => Object.prototype.hasOwnProperty.call(baselineAcc?.years || {}, ys))
      .filter((ys) => Number(baselineAcc?.years?.[ys]) !== Number(updated?.years?.[ys]))
      .map((ys) => Number(ys))
      .filter(Number.isFinite);

    const changedRatesForPerf = Object.keys(updated?.rates || {})
      .filter((ys) => Object.prototype.hasOwnProperty.call(baselineAcc?.rates || {}, ys))
      .filter((ys) => Number(baselineAcc?.rates?.[ys]) !== Number(updated?.rates?.[ys]))
      .map((ys) => Number(ys))
      .filter(Number.isFinite);

    const nameChangedForPerf = String(baselineAcc?.name || "") !== String(updated?.name || "");
    const startChangedForPerf = Number(baselineAcc?.startBalance ?? 0) !== Number(updated?.startBalance ?? 0);
    const shouldShowOverlay = forceOverlayFromPrevInline || hasAddedYears || hasRemovedYears || changedYearsForPerf.length > 0 || changedRatesForPerf.length > 0 || nameChangedForPerf || startChangedForPerf;

    const startOverlay = () => {
      const busyToken = `savpot-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const { finishAndClose, hardClose } = openPremiumProgressOverlay();

      const onDone = (ev) => {
        const d = ev?.detail || {};
        if (d.busyToken !== busyToken) return;
        document.removeEventListener(FF_SAVING_ACCOUNTS_CHANGED_DONE_EVENT, onDone);
        finishAndClose();
      };
      document.addEventListener(FF_SAVING_ACCOUNTS_CHANGED_DONE_EVENT, onDone);

      // Safety: never leave a stuck overlay.
      try { setTimeout(() => { try { hardClose(); } catch (_) {} }, 60000); } catch (_) {}

      const stop = () => {
        document.removeEventListener(FF_SAVING_ACCOUNTS_CHANGED_DONE_EVENT, onDone);
        try { finishAndClose(); } catch (_) {}
      };

      return { busyToken, stop };
    };

    const yieldForPaint = async () => {
      try { await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0))); }
      catch (_) { try { await new Promise((r) => setTimeout(r, 0)); } catch (_) {} }
    };

    // First priority: inline validation.
    // If invalid, do NOT show the 'aangepaste maandbedragen' sheet.
    let overlay = null;
    if (shouldShowOverlay) {
      overlay = startOverlay();
      await yieldForPaint();
    }

    const okInline = performCommit({ monthDataOverrideForChecks: mdNow, validateOnly: true });
    if (okInline === false) {
      try { root.dataset.ffSavPotInlineFail = "1"; } catch (_) {}
      overlay?.stop?.();
      return;
    }
    try { delete root.dataset.ffSavPotInlineFail; } catch (_) { try { root.dataset.ffSavPotInlineFail = ""; } catch (_) {} }

    const commitNow = (args) => {
      const ok = performCommit({ ...(args || {}), ...(overlay?.busyToken ? { busyToken: overlay.busyToken } : {}) });
      if (ok === false) overlay?.stop?.();
      return ok;
    };


    // Priority: inline validation (bank/saving limit) must run BEFORE any "manual month overrides" confirm sheet.
    // Otherwise we would block the user with an irrelevant confirm while they still must fix the inline error.
    const okInlinePriority = performCommit({ monthDataOverrideForChecks: mdNow, validateOnly: true });
    if (okInlinePriority === false) {
      try { root.dataset.ffSavPotInlineFail = "1"; } catch (_) {}
      overlay?.stop?.();
      return;
    }

    const changedYears = Object.keys(updated.years || {}).filter((ys) => Object.prototype.hasOwnProperty.call(baselineAcc?.years || {}, ys)).filter((ys) => Number(baselineAcc?.years?.[ys]) !== Number(updated.years?.[ys])).map((ys) => Number(ys)).filter(Number.isFinite).sort((a, b) => a - b);
    const yearWithOverrides = changedYears.find((yy) => hasMonthOverridesForYear(yy, mdNow, accountId));

    if (yearWithOverrides) {
      // Cannot proceed while asking confirmation.
      overlay?.stop?.();
      overlay = null;
      openSavingManualMonthOverridesConfirmSheet({
        year: yearWithOverrides,
        onNo: ({ close }) => { close(); commitNow({ monthDataOverrideForChecks: mdNow }); },
        onYes: async ({ close }) => {
          close();
          let mdWiped = null;
          try {
            const mdClone = JSON.parse(JSON.stringify(mdNow));
            mdWiped = applyWipeYearsToMonthData(mdClone, [String(yearWithOverrides)], accountId);
          } catch (_) {
            mdWiped = mdNow;
          }
          overlay = startOverlay();
          await yieldForPaint();
          commitNow({ monthDataOverrideForChecks: mdWiped, wipeOverrideYears: [String(yearWithOverrides)] });
        },
      });
      return;
    }
    commitNow({ monthDataOverrideForChecks: mdNow });
  };
}