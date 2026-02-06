// scripts/ui/popup/saving-month/sheet-commit-commit.js
import { parseMoneyInput } from "../money-input.js";

import {
  setSavingAccountFlowForScope,
  setSavingAccountRateForScope,
  setSystemSavingFlowForScope,
  setSavingAccountFlowScopeForScope,
  setSavingAccountRateScopeForScope,
  clearSavingAccountRateOverridesForYear,
} from "../saving-month-store.js";

import { setSavingAccountRateForYear } from "../../../core/state/saving-accounts-data.js";
import { SCOPE_MAP, isRateDraftId, getAccountIdFromRowId, getPrimaryAccountId } from "./sheet-commit-shared.js";

function parseRate(raw) {
  const n = Number(String(raw || "").trim().replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function commitAllDrafts({ year, month, drafts, premiumActiveNow }) {
  const primaryId = getPrimaryAccountId();
  const ids = Object.keys(drafts || {});
  for (const rowId of ids) {
    const d = drafts[rowId];
    if (!d || typeof d !== "object") continue;

    const isRateDraft = isRateDraftId(rowId);
    const accountId = String(getAccountIdFromRowId(rowId) || "").trim();

    if (!premiumActiveNow) {
      if (isRateDraft) continue;
      if (String(rowId) !== getPrimaryAccountId()) continue;
    }

    const uiScope = String(d.scope || "only");
    const scope = SCOPE_MAP[uiScope] || "month";

    if (isRateDraft) {
      const rate = parseRate(d.valueRaw);
      if (rate == null) continue;

      if (scope === "all") {
        clearSavingAccountRateOverridesForYear(year, accountId);
        setSavingAccountRateForYear(accountId, year, rate);
        setSavingAccountRateScopeForScope(year, month, scope, accountId, "year");
      } else {
        setSavingAccountRateForScope(year, month, scope, accountId, rate);
        setSavingAccountRateScopeForScope(year, month, scope, accountId, uiScope);
      }
      continue;
    }

    const num = parseMoneyInput(String(d.valueRaw || "").trim());
    if (num == null) continue;

    const abs = Math.abs(num);
    const signed = d.isNeg ? -abs : abs;

    if (!premiumActiveNow) {
      // Free-mode: de eerste spaarpot is gratis, maar de engine kan per-account flows gebruiken.
      // Schrijf daarom zowel legacy system-flow (manualSaving) als de primary-account override.
      setSystemSavingFlowForScope(year, month, scope, signed);
      if (primaryId) setSavingAccountFlowForScope(year, month, scope, primaryId, signed);
      if (primaryId) setSavingAccountFlowScopeForScope(year, month, scope, primaryId, uiScope);
    } else {
      setSavingAccountFlowForScope(year, month, scope, accountId, signed);
      setSavingAccountFlowScopeForScope(year, month, scope, accountId, uiScope);
    }
  }
}

