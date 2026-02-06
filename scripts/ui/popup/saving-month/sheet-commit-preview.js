// scripts/ui/popup/saving-month/sheet-commit-preview.js
import { getScopeRange, monthKey } from "../../../year/year-edit-data.js";
import { isRateDraftId, getAccountIdFromRowId } from "./sheet-commit-shared.js";

export function applyDraftToPreview({ preview, year, month, premiumActiveNow, rowId, scope, signed }) {
  const isRateDraft = isRateDraftId(rowId);
  const effectiveId = String(getAccountIdFromRowId(rowId) || "").trim();
  const { start, end } = getScopeRange(month, scope);

  for (let m = start; m <= end; m++) {
    const key = monthKey(year, m);
    if (!preview[key] || typeof preview[key] !== "object") preview[key] = {};
    const entry = preview[key];

    if (!premiumActiveNow) {
      // In non-premium hebben we nog legacy 'manualSaving', maar de engine kan ook
      // per-account flows gebruiken (savingAccounts). Voor consistente preview+validatie
      // zetten we beide.
      if (isRateDraft) continue;

      // LEEG/0 moet als echte 0 worden behandeld (dus niet als "unset").
      const v = Number(signed);

      if (!Number.isFinite(v)) {
        delete entry.manualSaving;
        if (effectiveId && entry.savingAccounts && typeof entry.savingAccounts === "object") {
          delete entry.savingAccounts[effectiveId];
          if (Object.keys(entry.savingAccounts).length === 0) delete entry.savingAccounts;
        }
      } else {
        entry.manualSaving = v;
        if (effectiveId) {
          if (!entry.savingAccounts || typeof entry.savingAccounts !== "object") entry.savingAccounts = {};
          entry.savingAccounts[effectiveId] = v;
        }
      }
    } else {
      if (effectiveId) {
        if (isRateDraft) {
          if (!entry.savingRates || typeof entry.savingRates !== "object") entry.savingRates = {};
          const rate = Number(signed);
          if (Number.isFinite(rate) && rate >= 0) entry.savingRates[effectiveId] = rate;
          if (entry.savingRates && Object.keys(entry.savingRates).length === 0) delete entry.savingRates;
        } else {
          if (!entry.savingAccounts || typeof entry.savingAccounts !== "object") entry.savingAccounts = {};
          // LEEG/0 moet als echte 0 worden behandeld (dus niet als "unset").
          const v = Number(signed);
          if (!Number.isFinite(v)) delete entry.savingAccounts[effectiveId];
          else entry.savingAccounts[effectiveId] = v;
          if (entry.savingAccounts && Object.keys(entry.savingAccounts).length === 0) delete entry.savingAccounts;
        }
      }
    }

    if (entry && typeof entry === "object" && Object.keys(entry).length === 0) delete preview[key];
  }
}

