// scripts/ui/popup/saving-year/row.js
import { t, formatCurrency } from "../../../i18n.js";


function formatRateMax2(rate) {
  const n = Number(rate);
  if (!Number.isFinite(n)) return "0";
  const rounded = Math.round(n * 100) / 100;
  // max 2 decimals, trim trailing zeros
  let s = rounded.toFixed(2);
  s = s.replace(/\.00$/, "");
  s = s.replace(/(\.\d)0$/, "$1");
  return s.replace(".", ",");
}

function amountClassForNumber(n, { positiveClass, negativeClass } = {}) {
  const v = Number(n || 0);
  if (Math.abs(v) < 0.005) return "";
  if (v < 0) return negativeClass || "ff-amount-negative";
  return positiveClass || "ff-amount-positive";
}

export function buildSavingYearRow(row) {
  const item = document.createElement("div");
  // Extra class for CSS alignment + separators in the read-only year overview.
  item.className = "ff-month-cat-item ff-saving-year-item";

  const name = String(row?.name || "");
  const endBalance = Number(row?.endBalance || 0);

  // Year totals: we show both lines (Gespaard + Opgenomen).
  const totalSaved = Number(row?.totalSaved || 0);
  const totalWithdraw = Number(row?.totalWithdraw || 0);

  // Color rule requested:
  // - If 0 => white (no class)
  // - Saved => green
  // - Withdraw => red
  const savedClass = amountClassForNumber(totalSaved, { positiveClass: "ff-amount-positive" });
  const withdrawClass = amountClassForNumber(totalWithdraw, { positiveClass: "ff-amount-negative", negativeClass: "ff-amount-negative" });

  const balanceClass = amountClassForNumber(endBalance, { positiveClass: "ff-amount-positive", negativeClass: "ff-amount-negative" });

  const avgRate = Number(row?.avgRate || 0);
  const rateStr = formatRateMax2(avgRate);
  const interestLabel = t("saving_month.interest_label", { rate: rateStr });

  const interestTotal = Number(row?.interestTotal || 0);

  item.innerHTML = `
    <div class="ff-saving-lines">
      <div class="ff-saving-line ff-saving-line--account">
        <div class="ff-saving-line-left ff-saving-line-left--name">
          <span class="ff-saving-name">${name}</span>
        </div>
        <div class="ff-saving-line-right ${balanceClass}">${formatCurrency(endBalance)}</div>
      </div>

      <div class="ff-saving-line">
        <div class="ff-saving-line-left ff-saving-flow-label">${t("saving_month.flow_save")}</div>
        <div class="ff-saving-line-right ${savedClass}">${formatCurrency(totalSaved)}</div>
      </div>

      <div class="ff-saving-line">
        <div class="ff-saving-line-left ff-saving-flow-label">${t("saving_month.flow_withdraw")}</div>
        <div class="ff-saving-line-right ${withdrawClass}">${formatCurrency(totalWithdraw)}</div>
      </div>

      <div class="ff-saving-line">
        <div class="ff-saving-line-left">
          <span class="ff-saving-interest-label">${interestLabel}</span>
        </div>
        <div class="ff-saving-line-right ff-amount-interest ff-amount-blue">${formatCurrency(interestTotal)}</div>
      </div>
    </div>
  `;

  return item;
}
