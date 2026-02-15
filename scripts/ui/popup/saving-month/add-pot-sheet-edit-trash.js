// scripts/ui/popup/saving-month/add-pot-sheet-edit-trash.js
import { t } from "../../../i18n.js";
import { TRASH_SVG } from "../../components/icons.js";
import { openDeleteSavingPotConfirmSheet, openSavingNegativeNotPossibleSheet } from "./delete-sheets.js";
import { openBankLimitNotPossibleSheet } from "../../../core/state/categories-ui/sheet-not-possible.js";
import { deleteSavingAccount } from "../../../core/state/saving-accounts-data.js";
import { setNextActionReason, buildUserReason } from "../../../core/history/index.js";
import { precommitFindFirstSavingAccountLimitViolationAfterDelete, precommitFindFirstSavingAccountNegativeBalanceAfterDelete } from "../../../core/state/saving-accounts-precommit-limit.js";

export const bindTrashButton = (nameRow, existingAcc, accountId, y, handleClose) => {
  if (nameRow && !nameRow.querySelector("#savDeleteBtn")) {
    const trashBtn = document.createElement("button");
    trashBtn.type = "button";
    trashBtn.id = "savDeleteBtn";
    trashBtn.className = "ff-cat-name-row__trash";
    trashBtn.setAttribute("aria-label", t("common.delete"));
    trashBtn.innerHTML = TRASH_SVG;

    trashBtn.onclick = (e) => {
      e?.preventDefault(); e?.stopPropagation();

      // Gate 1: show "Not possible" first (no confirm) if deleting would violate bank limit or make a saving account negative.
      const violation = precommitFindFirstSavingAccountLimitViolationAfterDelete({ deleteId: accountId });
      if (violation) { openBankLimitNotPossibleSheet(violation); return; }

      const neg = precommitFindFirstSavingAccountNegativeBalanceAfterDelete({ deleteId: accountId });
      if (neg) { openSavingNegativeNotPossibleSheet(neg); return; }

      // Gate 2: only show confirm when delete is possible.
      openDeleteSavingPotConfirmSheet({
        name: String(existingAcc?.name || ""),
        onConfirm: ({ close }) => {
          // Re-check defensively in case state changed between opening confirm and confirming.
          const violation2 = precommitFindFirstSavingAccountLimitViolationAfterDelete({ deleteId: accountId });
          if (violation2) { close?.(); openBankLimitNotPossibleSheet(violation2); return; }

          const neg2 = precommitFindFirstSavingAccountNegativeBalanceAfterDelete({ deleteId: accountId });
          if (neg2) { close?.(); openSavingNegativeNotPossibleSheet(neg2); return; }

          try {
            setNextActionReason(buildUserReason("savingpot.delete", false));
            deleteSavingAccount(accountId);
            const yrs = Object.keys(existingAcc?.years || {}).map((s) => Number(s)).filter(Number.isFinite);
            const fromYear = yrs.length ? Math.min(...yrs) : y;
            document.dispatchEvent(new CustomEvent("ff-saving-accounts-changed", { detail: { year: y, fromYear } }));
          } catch (_) {}
          close?.(); handleClose();
        },
      });
    };
    nameRow.appendChild(trashBtn);
  }
};