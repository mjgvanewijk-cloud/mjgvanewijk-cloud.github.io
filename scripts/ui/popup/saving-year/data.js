// scripts/ui/popup/saving-year/data.js
import { simulateYear } from "../../../core/engine/index.js";
import { getSavingAccounts } from "../../../core/state/saving-accounts-data.js";

export function getSavingYearSummaryRows({ year } = {}) {
  const y = Number(year);
  const sim = simulateYear(y);
  const months = Array.isArray(sim?.months) ? sim.months : [];

  const accounts = getSavingAccounts() || [];
  const rows = [];

  accounts.forEach((acc) => {
    const id = String(acc?.id || "");
    if (!id) return;

    let name = String(acc?.name || "").trim();
    if (!name) name = "";

    let endBalance = 0;
    let foundEnd = false;

    let totalSaved = 0;
    let totalWithdraw = 0;

    let interestTotal = 0;

    let rateSum = 0;
    let rateCount = 0;

    for (let i = 0; i < months.length; i++) {
      const m = months[i];
      const obj = (m && m.savingAccounts && typeof m.savingAccounts === "object") ? m.savingAccounts : null;
      if (!obj) continue;
      const a = obj[id];
      if (!a) continue;

      // End balance: last month in year where data exists
      const b = Number(a.balanceEnd || 0);
      endBalance = b;
      foundEnd = true;

      const flow = Number(a.flow || 0);
      if (flow > 0.0005) totalSaved += flow;
      if (flow < -0.0005) totalWithdraw += Math.abs(flow);

      const interest = Number(a.interest || 0);
      if (Number.isFinite(interest)) interestTotal += interest;

      const rate = Number(a.rate || 0);
      if (Number.isFinite(rate)) {
        rateSum += rate;
        rateCount += 1;
      }
    }

    // Als er geen maanden met per-account data waren: default 0's.
    if (!foundEnd) endBalance = 0;

    const avgRate = rateCount > 0 ? (rateSum / rateCount) : 0;

    rows.push({
      id,
      name,
      endBalance,
      totalSaved,
      totalWithdraw,
      avgRate,
      interestTotal,
    });
  });

  return rows;
}
