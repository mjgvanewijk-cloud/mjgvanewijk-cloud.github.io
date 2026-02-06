// scripts/ui/popup/saving-month/sheet-commit-validate.js
import { t } from "../../../i18n.js";
import { parseMoneyInput } from "../money-input.js";
import { validateSavingUpdate } from "../../../year/year-edit-validation.js";
import { emitInlineError } from "../month-category-store.js";

import { DRAFT_TYPE, SCOPE_MAP, isRateDraftId, getAccountIdFromRowId, getPrimaryAccountId } from "./sheet-commit-shared.js";
import { applyDraftToPreview } from "./sheet-commit-preview.js";

function parseRate(raw) {
  const n = Number(String(raw || "").trim().replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function parseAmountSigned(raw, isNeg) {
  const num = parseMoneyInput(String(raw || "").trim());
  if (num == null) return null;
  const abs = Math.abs(num);
  return isNeg ? -abs : abs;
}

export function validateAllDraftsOrEmit({ year, month, drafts, premiumActiveNow, preview }) {
  const ids = Object.keys(drafts || {});
  for (const rowId of ids) {
    const d = drafts[rowId];
    if (!d || typeof d !== "object") continue;

    const isRateDraft = isRateDraftId(rowId);
    const accountId = getAccountIdFromRowId(rowId);

    // FREE mode: rente premium-only; flow alleen voor primary account
    if (!premiumActiveNow) {
      if (isRateDraft) {
        emitInlineError(year, month, DRAFT_TYPE, rowId, t("messages.premium_only"));
        return false;
      }
      if (String(rowId) !== getPrimaryAccountId()) continue;
    }

    const uiScope = String(d.scope || "only");
    const scope = SCOPE_MAP[uiScope] || "month";

    let signed;
    if (isRateDraft) {
      const rate = parseRate(d.valueRaw);
      if (rate == null) {
        emitInlineError(year, month, DRAFT_TYPE, rowId, t("messages.invalid_rate_error"));
        return false;
      }
      signed = rate;
    } else {
      const s = parseAmountSigned(d.valueRaw, !!d.isNeg);
      if (s == null) {
        emitInlineError(year, month, DRAFT_TYPE, rowId, t("messages.invalid_amount_error"));
        return false;
      }
      signed = s;
    }

    applyDraftToPreview({ preview, year, month, premiumActiveNow, rowId: isRateDraft ? `rate:${accountId}` : accountId, scope, signed });

    const ok = validateSavingUpdate(year, preview, (msg) => {
      emitInlineError(year, month, DRAFT_TYPE, rowId, String(msg || ""));
    });
    if (!ok) return false;
  }

  return true;
}

