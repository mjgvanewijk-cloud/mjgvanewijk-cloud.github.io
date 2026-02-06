// scripts/ui/popup/saving-month/actions.js
import { t } from "../../../i18n.js";
import { openPremiumTrialPopup } from "../../../core/state/premium.js";
import { deleteSavingAccount } from "../../../core/state/saving-accounts-data.js";
import { openBankLimitNotPossibleSheet } from "../../../core/state/categories-ui/sheet-not-possible.js";
import {
  precommitFindFirstSavingAccountLimitViolationAfterDelete,
  precommitFindFirstSavingAccountNegativeBalanceAfterDelete,
} from "../../../core/state/saving-accounts-precommit-limit.js";
import { openAddSavingPotSheet, openEditSavingPotSheet } from "./add-pot-sheet.js";
import { openDeleteSavingPotConfirmSheet, openSavingNegativeNotPossibleSheet } from "./delete-sheets.js";

function openSavingAddPremiumSheet({ year, onStartTrial } = {}) {
  // Eén centrale premium-gate: bij verlopen proefperiode altijd de oranje paywall (Doorgaan/Sluiten),
  // anders trial-start sheet. Geen helpcloud.
  openPremiumTrialPopup(() => {
    if (typeof onStartTrial === "function") {
      try { onStartTrial(); } catch (_) {}
    }
  }, {
    title: t("messages.premium_add_saving_title"),
    topText: t("messages.premium_add_saving_top"),
  });
}
export function createActions({ year, month, commitAndRefresh }) {
  const openEditRow = (row, refreshFn) => {
    openEditSavingPotSheet({ id: row.id, year, onComplete: () => commitAndRefresh(refreshFn) });
  };

  const openDeleteRow = (row, refreshFn) => {
    openDeleteSavingPotConfirmSheet({
      name: row.name,
      onConfirm: ({ close }) => {
        const violation = precommitFindFirstSavingAccountLimitViolationAfterDelete({ deleteId: row.id });
        if (violation) {
          close?.();
          openBankLimitNotPossibleSheet(violation);
          return;
        }
        const neg = precommitFindFirstSavingAccountNegativeBalanceAfterDelete({ deleteId: row.id });
        if (neg) {
          close?.();
          openSavingNegativeNotPossibleSheet(neg);
          return;
        }

        deleteSavingAccount(row.id);
        close?.();
        commitAndRefresh(refreshFn);
      },
    });
  };

  const openAddAccount = (refreshFn) => {
    openAddSavingPotSheet({ year, onComplete: () => commitAndRefresh(refreshFn) });
  };

  const openAddAccountWithPremium = (refreshFn) => {
    // Premium upsell sheet (oranje header). Na trial-start geen extra sheets tonen.
    openSavingAddPremiumSheet({
      year,
      onStartTrial: () => {
        // Premium status is gewijzigd; refresh huidige sheet.
        commitAndRefresh(refreshFn);
      },
    });
  };

  return {
    openEditRow,
    openDeleteRow,
    openAddAccount,
    openAddAccountWithPremium,
  };
}
