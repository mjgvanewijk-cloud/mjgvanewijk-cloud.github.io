// scripts/ui/popup/saving-month/sheet.js
import { resetCaches } from "../../../core/engine/index.js";
import { isPremiumActiveForUI } from "../../../core/state/premium.js";

import { attachEscapeToClose } from "../overlay.js";
import { getSavingMonthRows } from "../saving-month-popup-data.js";
import { renderSavingMonthFooter, renderSavingMonthList } from "../saving-month-popup-render.js";
import { createActions } from "./actions.js";

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
    resetCaches();
    if (typeof onDataChanged === "function") onDataChanged();
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
  onSavingAccountsChanged = (e) => {
    const d = e?.detail || {};
    if (d.year != null && Number(d.year) !== Number(year)) return;
    resetCaches();
    if (typeof onDataChanged === "function") onDataChanged();
    try { refresh(); } catch (_) {}
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

