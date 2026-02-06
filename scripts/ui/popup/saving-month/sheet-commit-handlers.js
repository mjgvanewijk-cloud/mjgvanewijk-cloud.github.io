// scripts/ui/popup/saving-month/sheet-commit-handlers.js
import { isPremiumActiveForUI } from "../../../core/state/premium.js";
import { loadMonthData } from "../../../core/storage/index.js";
import { cloneMonthData, monthKey } from "../../../year/year-edit-data.js";
import { t, formatCurrency } from "../../../i18n.js";
import { setNextActionReason, buildUserReason } from "../../../core/history/index.js";
import { getSavingAccountById } from "../../../core/state/saving-accounts-data.js";

import { getAllInlineDrafts, clearAllInlineDrafts } from "../month-category-store.js";
import { DRAFT_TYPE, isRateDraftId, getAccountIdFromRowId, getPrimaryAccountId } from "./sheet-commit-shared.js";
import { validateAllDraftsOrEmit } from "./sheet-commit-validate.js";
import { commitAllDrafts } from "./sheet-commit-commit.js";

export function createSavingMonthCloseHandlers({ year, month, commitAndRefresh, finalizeClose } = {}) {
  const closeDiscard = () => {
    clearAllInlineDrafts(year, month, DRAFT_TYPE);
    finalizeClose();
  };

  const closeCommit = () => {
    const drafts = getAllInlineDrafts(year, month, DRAFT_TYPE);
    const ids = Object.keys(drafts || {});
    if (!ids.length) {
      finalizeClose();
      return;
    }

    const premiumActiveNow = isPremiumActiveForUI();
    const base = loadMonthData() || {};
    const preview = cloneMonthData(base);

    const ok = validateAllDraftsOrEmit({ year, month, drafts, premiumActiveNow, preview });
    if (!ok) return;

    // History detail (Option C): maak Undo/Redo-melding specifiek voor spaarpot flow changes.
    try {
      const committedRowIds = premiumActiveNow
        ? ids.slice()
        : ids.filter((rid) => !isRateDraftId(rid) && String(rid) === getPrimaryAccountId());

      if (committedRowIds.length === 1) {
        const rowId = committedRowIds[0];
        const accountId = String(getAccountIdFromRowId(rowId) || "").trim();
        const d = drafts[rowId] || {};
        const uiScope = String(d.scope || "only");

        const key = monthKey(year, month);
        const baseEntry = base && base[key] && typeof base[key] === "object" ? base[key] : {};
        const nextEntry = preview && preview[key] && typeof preview[key] === "object" ? preview[key] : {};

        const getFlow = (entry) => {
          if (!entry || typeof entry !== "object") return 0;
          const sa = entry.savingAccounts;
          if (sa && typeof sa === "object" && accountId && Object.prototype.hasOwnProperty.call(sa, accountId)) {
            const v = Number(sa[accountId]);
            return Number.isFinite(v) ? v : 0;
          }
          const ms = Number(entry.manualSaving);
          return Number.isFinite(ms) ? ms : 0;
        };

        const prevVal = getFlow(baseEntry);
        const nextVal = getFlow(nextEntry);

        const acc = accountId ? getSavingAccountById(accountId) : null;
        const name = String(acc?.name || accountId || "").trim();
        const monthLabel = t(`months.${Number(month) || 1}`);

        const detailKey = uiScope === "year" ? "history.detail.saving_flow_changed_year" : "history.detail.saving_flow_changed";
        setNextActionReason(buildUserReason("saving.flow", true));
      } else if (committedRowIds.length > 1) {
        const monthLabel = t(`months.${Number(month) || 1}`);
        setNextActionReason(buildUserReason("saving.flow", true));
      }
    } catch (_) {
      // Geen hard-fail: history blijft gewoon werken.
    }

    // User action => allow snapshots / enable Undo-Redo even if the user clicks very fast after boot.
    // (Booting blocks recordSnapshot + canUndo/canRedo.)
    try { window.__finflowBooting = false; } catch (_) {}

    commitAllDrafts({ year, month, drafts, premiumActiveNow });

    clearAllInlineDrafts(year, month, DRAFT_TYPE);
    commitAndRefresh(() => {});
    finalizeClose();
  };

  return { closeDiscard, closeCommit };
}

