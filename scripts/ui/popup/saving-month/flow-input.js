// scripts/ui/popup/saving-month/flow-input.js
import { t } from "../../../i18n.js";
import { isPremiumActiveForUI } from "../../../core/state/premium.js";
import { loadMonthData } from "../../../core/storage/index.js";

import { openInputPopup } from "../input-popup.js";
import { parseSignedAmount } from "../saving-month-popup-helpers.js";

import { validateSavingUpdate } from "../../../year/year-edit-validation.js";
import { cloneMonthData, getScopeRange, monthKey, normalizeScope } from "../../../year/year-edit-data.js";

import { setSavingAccountFlowForScope, setSystemSavingFlowForScope } from "../saving-month-store.js";

export function createFlowInputOpener({ year, month, monthLabelLower, commitAndRefresh }) {
  return (row, refreshFn) => {
    const currentFlow = Number(row.flow || 0);

    openInputPopup({
      title: t("saving_month.input_title", { name: row.name, month: monthLabelLower, year }),
      label: t("common.amount"),
      defaultValue: Math.abs(currentFlow),
      type: "number",

      showToggle: true,
      toggleLabels: { pos: t("popups.deposit"), neg: t("popups.withdrawal") },
      defaultNegative: currentFlow < 0,

      showScope: true,
      scopeLabels: {},

      onConfirm: (val, isNeg, rawScope, helpers = {}) => {
        const { setInlineError } = helpers;

        const scope = normalizeScope(rawScope || "month");
        const signed = parseSignedAmount(val, isNeg);

        const premiumActiveNow = isPremiumActiveForUI();

        // Preview bouwen voor inline-validatie
        const base = loadMonthData() || {};
        const preview = cloneMonthData(base);
        const { start, end } = getScopeRange(month, scope);

        for (let m = start; m <= end; m++) {
          const key = monthKey(year, m);
          if (!preview[key] || typeof preview[key] !== "object") preview[key] = {};
          const entry = preview[key];

          if (!premiumActiveNow) {
            // FREE: systeem sparen via manualSaving
            // LEEG/0 moet als echte 0 worden behandeld (dus niet als "unset").
            const v = Number(signed);
            if (!Number.isFinite(v)) delete entry.manualSaving;
            else entry.manualSaving = v;
          } else {
            // PREMIUM: ALLE rekeningen (incl. __system__) via savingAccounts[id]
            const id = String(row.id || "").trim();
            if (id) {
              if (!entry.savingAccounts || typeof entry.savingAccounts !== "object") entry.savingAccounts = {};
              // LEEG/0 moet als echte 0 worden behandeld (dus niet als "unset").
              const v = Number(signed);
              if (!Number.isFinite(v)) delete entry.savingAccounts[id];
              else entry.savingAccounts[id] = v;

              if (entry.savingAccounts && Object.keys(entry.savingAccounts).length === 0) {
                delete entry.savingAccounts;
              }
            }
          }

          if (entry && typeof entry === "object" && Object.keys(entry).length === 0) {
            delete preview[key];
          }
        }

        // Inline validatie (incl. banklimiet ketting-check) gebeurt hier
        if (!validateSavingUpdate(year, preview, setInlineError)) return false;

        // Commit
        if (!premiumActiveNow) {
          setSystemSavingFlowForScope(year, month, scope, signed);
        } else {
          setSavingAccountFlowForScope(year, month, scope, row.id, signed);
        }

        commitAndRefresh(refreshFn);
        return true;
      },
    });
  };
}
