// scripts/wizard/services/limit-analysis.js
import { loadSettings } from "../../core/storage/index.js";
import { simulateYear } from "../../core/engine/index.js";

export function findMaxNegativeBalanceForYear(year, bankStart, savingStart) {
  const s = loadSettings() || {};
  const snapshot = JSON.parse(JSON.stringify(s));
  snapshot.pots = {};

  if (!snapshot.yearBankStarting) snapshot.yearBankStarting = {};
  if (!snapshot.yearSavingStarting) snapshot.yearSavingStarting = {};
  snapshot.yearBankStarting[year] = bankStart;
  snapshot.yearSavingStarting[year] = savingStart;

  const sim = simulateYear(year, false, null, snapshot);
  let result = { value: 0, month: 1 };

  const startVal = Number(bankStart ?? 0);
  if (Number.isFinite(startVal) && startVal < result.value) {
    result.value = startVal;
    result.month = 1;
  }

  if (sim && Array.isArray(sim.months)) {
    sim.months.forEach((m, i) => {
      [m.bankStart, m.bankEnd].forEach((val) => {
        const num = Number(val ?? NaN);
        if (Number.isFinite(num) && num < result.value) {
          result.value = num;
          result.month = i + 1;
        }
      });
    });
  }

  return result;
}

export function validateLimit({ limitValue, bankBalance, savingBalance, year, setInlineError, t, formatCurrency }) {
  if (limitValue === 0) {
    if (Number(bankBalance) < 0) {
      setInlineError?.(
        t("messages.limit_error_immediate", {
          balance: formatCurrency(bankBalance),
          limit: formatCurrency(0),
        })
      );
      return false;
    }
    return true;
  }

  if (bankBalance < limitValue) {
    setInlineError?.(
      t("messages.limit_error_immediate", {
        balance: formatCurrency(bankBalance),
        limit: formatCurrency(limitValue),
      })
    );
    return false;
  }

  const analysis = findMaxNegativeBalanceForYear(year, bankBalance, savingBalance);
  const minNeeded = Math.abs(analysis.value);

  if (limitValue > -minNeeded) {
    setInlineError?.(
      t("messages.limit_error", {
        month: t(`months.${analysis.month}`),
        amount: formatCurrency(analysis.value),
      })
    );
    return false;
  }

  return true;
}
