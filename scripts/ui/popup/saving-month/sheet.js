// scripts/ui/popup/saving-month/sheet.js
import { resetCachesFromYear } from "../../../core/engine/index.js";
import { isPremiumActiveForUI } from "../../../core/state/premium.js";

import { attachEscapeToClose } from "../overlay.js";
import { getSavingMonthRows } from "../saving-month-popup-data.js";
import { renderSavingMonthFooter, renderSavingMonthList } from "../saving-month-popup-render.js";
import { createActions } from "./actions.js";
import { FF_SAVING_ACCOUNTS_CHANGED_DONE_EVENT } from "../premium-progress-overlay.js";

import { createSavingMonthShell } from "./sheet-shell.js";
import { createSavingMonthCloseHandlers } from "./sheet-commit-handlers.js";

export function openSavingMonthPopup({ year, month, onDataChanged, onClose } = {}) {
  const { overlay, popup, listEl, footerEl, finalizeClose, setRefreshHandler } = createSavingMonthShell({
    year,
    month,
    onClose,
  });

  // Listener wordt later gezet (na initialisatie van close handlers) om TDZ issues te voorkomen.
  let onSavingAccountsChanged = null;

  const finalizeCloseWrapped = () => {
    if (onSavingAccountsChanged) {
      document.removeEventListener("ff-saving-accounts-changed", onSavingAccountsChanged);
    }
    finalizeClose();
  };

  const commitAndRefresh = (refreshFn) => {
    // IMPORTANT: do not trigger a heavy recalc/refresh here.
    // Saving-account edits already dispatch "ff-saving-accounts-changed" with fromYear,
    // and this sheet debounces those events into a single refresh.
    if (typeof refreshFn === "function") refreshFn();
  };

  const actions = createActions({ year, month, commitAndRefresh });

  const refresh = () => {
    if (!listEl || !footerEl) return;

    const premiumActive = isPremiumActiveForUI();
    const rows = getSavingMonthRows({ year, month, premiumActive });

    renderSavingMonthList({ listEl, rows, premiumActive, year, month });

    renderSavingMonthFooter({
      footerEl,
      premiumActive,
      rowsCount: Array.isArray(rows) ? rows.length : 0,
      onAddAccount: () => actions.openAddAccount(refresh),
      onAddAccountWithPremium: () => actions.openAddAccountWithPremium(refresh),
      onClose: closeCommit,
    });
  };

  setRefreshHandler(refresh);

  const { closeDiscard, closeCommit } = createSavingMonthCloseHandlers({
    year,
    month,
    commitAndRefresh,
    finalizeClose: finalizeCloseWrapped,
  });

  // Wanneer spaarpotjes worden toegevoegd/bewerkt/verwijderd via de (nieuwe) add/edit sheet,
  // moet deze maand-sheet zichzelf opnieuw renderen.
  
  let pendingScheduled = false;
  let pendingFromYear = Number.POSITIVE_INFINITY;
  let pendingBusyToken = null;
  let pendingTimer = null;

  onSavingAccountsChanged = (e) => {
    const d = e?.detail || {};

    // A change can start in an earlier year (fromYear) and still affect this sheet year via carry-over.
    const fy = Number.isFinite(Number(d.fromYear)) ? Number(d.fromYear) : (Number.isFinite(Number(d.year)) ? Number(d.year) : null);
    if (fy != null && fy > Number(year)) {
      // Change starts in a later year than this sheet; do not do expensive refresh here, but close any waiting overlay.
      if (d.busyToken) {
        try { document.dispatchEvent(new CustomEvent(FF_SAVING_ACCOUNTS_CHANGED_DONE_EVENT, { detail: { busyToken: d.busyToken } })); } catch (_) {}
      }
      return;
    }

    const from = fy != null ? fy : year;

    // Batch multiple rapid events into a single refresh (prevents N× recalc/render when adding/removing multiple years).
    pendingFromYear = Math.min(pendingFromYear, Number(from));
    if (d.busyToken) pendingBusyToken = d.busyToken;

    // Debounce: coalesce events even when they are dispatched across multiple ticks/awaits.
    // This prevents N× refresh when multiple years are added/removed before a single save completes.
    if (pendingTimer) { try { clearTimeout(pendingTimer); } catch (_) {} }
    pendingScheduled = true;
    pendingTimer = setTimeout(() => {
      pendingTimer = null;
      pendingScheduled = false;

      const runFromYear = Number.isFinite(pendingFromYear) ? pendingFromYear : year;
      const runBusyToken = pendingBusyToken;

      pendingFromYear = Number.POSITIVE_INFINITY;
      pendingBusyToken = null;

      resetCachesFromYear(runFromYear);
      if (typeof onDataChanged === "function") onDataChanged(runFromYear);
      try { refresh(); } catch (_) {}

      // Signal any waiting progress overlay that the heavy refresh is done.
      if (runBusyToken) {
        try {
          document.dispatchEvent(
            new CustomEvent(FF_SAVING_ACCOUNTS_CHANGED_DONE_EVENT, { detail: { busyToken: runBusyToken } })
          );
        } catch (_) {}
      }
    }, 50);
  };
  document.addEventListener("ff-saving-accounts-changed", onSavingAccountsChanged);

  attachEscapeToClose();
  overlay.__ff_onCancel = closeDiscard;
  overlay.onclick = (e) => {
    if (e.target === overlay) closeDiscard();
  };

  document.body.appendChild(overlay);
  overlay.appendChild(popup);
  requestAnimationFrame(() => popup.classList.add("show"));

  refresh();
}
