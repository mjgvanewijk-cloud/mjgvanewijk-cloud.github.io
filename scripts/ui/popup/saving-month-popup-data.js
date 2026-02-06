// scripts/ui/popup/saving-month-popup-data.js
import { t } from "../../i18n.js";
import { simulateYear } from "../../core/engine/index.js";
import { getSavingAccounts, getSavingAccountById } from "../../core/state/saving-accounts-data.js";

export function getSavingMonthRows({ year, month, premiumActive }) {
  const sim = simulateYear(year);
  const m = sim?.months?.[month - 1] || null;
  if (!m) return [];

  // Prefer per-account data when available (also in non-premium; interest remains premium-only).
  const accountsObj = (m.savingAccounts && typeof m.savingAccounts === "object") ? m.savingAccounts : null;
  if (accountsObj) {
    return Object.values(accountsObj).map((a) => ({
      id: String(a.id || ""),
      name: String(a.name || ""),
      flow: Number(a.flow || 0),
      rate: Number(a.rate || 0),
      interest: Number(a.interest || 0),
      balanceEnd: Number(a.balanceEnd || 0),
      showInterest: true,
    }));
  }

  // Legacy fallback (single savings flow)
  const accounts = getSavingAccounts();
  const primary = accounts && accounts.length ? accounts[0] : null;
  if (!primary) return [];

  const name = String(primary?.name || "").trim() || t("table.headers.savings");

  return [
    {
      id: String(primary.id || ""),
      name,
      flow: Number(m.savingFlow || 0),
      balanceEnd: Number(m.savingEnd || 0),
      showInterest: true,
    },
  ];
}
