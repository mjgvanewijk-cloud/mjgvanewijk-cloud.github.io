// scripts/year/year-edit-validation.js
import { simulateYear } from "../core/engine/index.js";
import { ensureSettings } from "../core/engine/settings.js";
import { t, formatCurrency } from "../i18n.js";
import { loadCats, loadMonthData } from "../core/storage/index.js";
import { collectYearRangeForLimitCheck, findLimitViolation } from "./year-edit-limits.js";
import { cloneMonthData, getScopeRange, monthKey } from "./year-edit-data.js";
import { getSavingAccountById } from "../core/state/saving-accounts-data.js";

/**
 * Valideert een bulk-update voor sparen via simulatie.
 * Belangrijk: alleen INLINE errors (zoals bij Uitgaven), geen extra popup.
 */
export function validateSavingUpdate(year, previewData, setInlineError, opts = {}) {
  const sim = simulateYear(year, true, previewData);
  const settings = ensureSettings();
  const sys = getSavingAccountById("__system__");
  const sysName = String(sys?.name || "").trim();

  for (let i = 0; i < 12; i++) {
    const mo = sim.months[i];

    // Check 0: Banksaldo mag niet onder 0 komen
    const bankEnd = typeof mo.bankEnd === "number" ? mo.bankEnd : 0;
    if (bankEnd < -0.00001) {
      setInlineError?.(
        t("messages.bank_negative_error", {
          month: t(`months.${i + 1}`),
          year,
          amount: formatCurrency(bankEnd),
        })
      );
      return false;
    }

    // Check 1: Spaarsaldo (totaal) mag niet negatief worden (binnen dit jaar)
    // Toon hierbij óók de rekeningnaam van de standaardrekening als die beschikbaar is (dynamisch uit data).
    const savingEnd = typeof mo.savingEnd === "number" ? mo.savingEnd : 0;
    if (savingEnd < -0.00001) {
      if (sysName) {
        setInlineError?.(
          t("messages.saving_account_negative_error", {
            account: sysName,
            month: t(`months.${i + 1}`),
            year,
            amount: formatCurrency(savingEnd),
          })
        );
      } else {
        setInlineError?.(
          t("messages.saving_negative_error", {
            month: t(`months.${i + 1}`),
            year,
            amount: formatCurrency(savingEnd),
          })
        );
      }
      return false;
    }

    // Check 2: Geen enkele individuele spaarrekening mag negatief worden (Premium)
    const accounts =
      mo.savingAccounts && typeof mo.savingAccounts === "object" ? mo.savingAccounts : null;

    if (accounts) {
      for (const acc of Object.values(accounts)) {
        const end = typeof acc?.balanceEnd === "number" ? acc.balanceEnd : 0;
        if (end < -0.00001) {
          setInlineError?.(
            t("messages.saving_account_negative_error", {
              account: String(getSavingAccountById(String(acc?.id || ""))?.name || acc?.name || "").trim(),
              month: t(`months.${i + 1}`),
              year,
              amount: formatCurrency(end),
            })
          );
          return false;
        }
      }
    }
  }

  // Banklimiet: multi-year ketting-check (zelfde UX/patroon als bij Uitgaven)
  const cats = loadCats();
  const range = collectYearRangeForLimitCheck({
    cats,
    monthData: previewData,
    currentYear: year,
  });

  const violation = findLimitViolation({
    settings,
    monthData: previewData,
    minYear: range.minYear,
    maxYear: range.maxYear,
  });

  if (violation) {
    setInlineError?.(
      t("errors.bank_limit_reached", {
        month: `${t(`months.${violation.month}`)} ${violation.year}`,
        amount: formatCurrency(violation.bankEnd),
        limit: formatCurrency(violation.limit),
      })
    );
    return false;
  }

  return true;
}

/**
 * Wrapper voor bestaande bank-limit check (voor inkomen/uitgaven).
 */
export function validateStandardUpdate(year, month, type, amount, scope, setInlineError) {
  const settings = ensureSettings();

  // Preview monthData maken (pre-commit): pas scope toe, maar commit nog niet.
  const base = loadMonthData() || {};
  const preview = cloneMonthData(base);
  const { start, end } = getScopeRange(month, scope);

  for (let m = start; m <= end; m++) {
    const key = monthKey(year, m);
    if (!preview[key]) preview[key] = {};

    if (type === "income") preview[key].manualIncome = amount;
    if (type === "expense") preview[key].manualExpense = amount;
  }

  // Banklimiet: multi-year ketting-check
  const cats = loadCats();
  const range = collectYearRangeForLimitCheck({
    cats,
    monthData: preview,
    currentYear: year,
  });

  const violation = findLimitViolation({
    settings,
    monthData: preview,
    minYear: range.minYear,
    maxYear: range.maxYear,
  });

  if (violation) {
    setInlineError?.(
      t("errors.bank_limit_reached", {
        month: `${t(`months.${violation.month}`)} ${violation.year}`,
        amount: formatCurrency(violation.bankEnd),
        limit: formatCurrency(violation.limit),
      })
    );
    return false;
  }

  return true;
}
