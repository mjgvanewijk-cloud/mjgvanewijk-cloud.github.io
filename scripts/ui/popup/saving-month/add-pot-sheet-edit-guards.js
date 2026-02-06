// scripts/ui/popup/saving-month/add-pot-sheet-edit-guards.js
import { precommitFindFirstSavingAccountLimitViolation, precommitFindFirstSavingAccountNegativeBalance } from "../../../core/state/saving-accounts-precommit-limit.js";
import { collectSavingYearsAndRates } from "../../../core/state/saving-accounts-ui-years.js";
import { applyWipeYearsToMonthData } from "./add-pot-sheet-edit-logic.js";

export const buildPreviewForYearAction = ({ action, targetYearInt, existingAcc, baseMd, accountId, pendingWipeYears, pendingRemoveYears, pendingNoDefaultYears }) => {
  const yInt = Number(targetYearInt);
  if (!Number.isFinite(yInt)) return { ok: true };

  const yearsContainer = document.getElementById("savYearsContainer");
  const nameInput = document.getElementById("catNameInput");
  const startBalanceInput = document.getElementById("savStartInput");

  const collected = collectSavingYearsAndRates(yearsContainer);
  const years = { ...(collected?.years || {}) };
  const rates = { ...(collected?.rates || {}) };

  const removeFromDefaults = (ys) => {
    const k = String(ys || "").trim();
    if (!k) return;
    delete years[k];
    delete rates[k];
  };

  [...pendingRemoveYears, ...pendingNoDefaultYears].forEach((ys) => removeFromDefaults(ys));

  const yStr = String(yInt);
  if (action === "remove" || action === "keep" || action === "wipe") removeFromDefaults(yStr);

  const updatedAccount = {
    ...existingAcc,
    name: String(nameInput?.value || existingAcc?.name || ""),
    startBalance: Number(startBalanceInput?.value) || 0,
    years,
    rates,
  };

  const mdClone = JSON.parse(JSON.stringify(baseMd));
  const wipeSet = new Set([...pendingWipeYears]);
  if (action === "wipe") wipeSet.add(yStr);

  const wipeList = [...wipeSet].filter((ys) => !Object.prototype.hasOwnProperty.call(updatedAccount.years || {}, String(ys)));
  const mdForPreview = applyWipeYearsToMonthData(mdClone, wipeList, accountId);

  const bankViolation = precommitFindFirstSavingAccountLimitViolation({ monthDataOverride: mdForPreview, updatedAccount });
  if (bankViolation) return { ok: false, kind: "bank", violation: bankViolation };

  const savingViolation = precommitFindFirstSavingAccountNegativeBalance({ monthDataOverride: mdForPreview, updatedAccount });
  if (savingViolation) return { ok: false, kind: "saving", violation: savingViolation };

  return { ok: true };
};