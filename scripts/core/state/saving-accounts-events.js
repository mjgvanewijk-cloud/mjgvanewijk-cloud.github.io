// scripts/core/state/saving-accounts-events.js
import { getSavingAccounts, deleteSavingAccount } from "./saving-accounts-data.js";
import { t } from "../../i18n.js";
import { setNextActionReason, buildUserReason } from "../history/index.js";
import {
  precommitFindFirstSavingAccountLimitViolationAfterDelete,
  precommitFindFirstSavingAccountNegativeBalanceAfterDelete,
} from "./saving-accounts-precommit-limit.js";
import { openBankLimitNotPossibleSheet } from "./categories-ui/sheet-not-possible.js";
import {
  openDeleteSavingPotConfirmSheet,
  openSavingNegativeNotPossibleSheet,
} from "../../ui/popup/saving-month/delete-sheets.js";
import { renderSavingAccountsList } from "./saving-accounts-renderer.js";

export function attachSavingAccountRowListeners(listContainer, overlay, targetYear) {
  const accounts = Array.isArray(getSavingAccounts()) ? getSavingAccounts() : [];
  const rows = Array.from(listContainer.querySelectorAll(".ff-cats-manage-row"));
  
  rows.forEach((row) => {
    const id = row.getAttribute("data-id");
    const acc = accounts.find((a) => String(a?.id || a?.name || "") === String(id));
    const name = String(acc?.name || "");

    const editBtn = row.querySelector('[data-action="edit"]');
    if (editBtn) {
      editBtn.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          const m = await import("../../ui/popup/saving-month/add-pot-sheet.js");
          const fn = m?.openEditSavingPotSheet;
          if (typeof fn === "function") {
            overlay.classList.remove("show");
            fn({
              id,
              year: targetYear,
              onComplete: () => {
                overlay.classList.add("show");
                renderSavingAccountsList(overlay, { year: targetYear });
              },
            });
          }
        } catch (err) {
          console.error(err);
        }
      };
    }

    const delBtn = row.querySelector('[data-action="delete"]');
    if (delBtn) {
      delBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const violation = precommitFindFirstSavingAccountLimitViolationAfterDelete({ deleteId: id });
        if (violation) {
          openBankLimitNotPossibleSheet(violation);
          return;
        }

        const neg = precommitFindFirstSavingAccountNegativeBalanceAfterDelete({ deleteId: id });
        if (neg) {
          openSavingNegativeNotPossibleSheet(neg);
          return;
        }

        openDeleteSavingPotConfirmSheet({
          name,
          onConfirm: ({ close }) => {
            const violation2 = precommitFindFirstSavingAccountLimitViolationAfterDelete({ deleteId: id });
            if (violation2) {
              close?.();
              openBankLimitNotPossibleSheet(violation2);
              return;
            }

            const neg2 = precommitFindFirstSavingAccountNegativeBalanceAfterDelete({ deleteId: id });
            if (neg2) {
              close?.();
              openSavingNegativeNotPossibleSheet(neg2);
              return;
            }

            try {
              setNextActionReason(buildUserReason("savingpot.delete", false));
              deleteSavingAccount(id);
              document.dispatchEvent(
                new CustomEvent("ff-saving-accounts-changed", { detail: {} })
              );
            } catch (_) {}

            close?.();
            renderSavingAccountsList(overlay, { year: targetYear });
          },
        });
      };
    }
  });
}