// scripts/core/storage/reasoning-monthdata.js
import { t, formatCurrency } from "../../i18n.js";
import { safeJsonParse, buildFFHReason } from "./storage-helpers-reasoning.js";

export function inferMonthDataReason(prevStr, nextObj) {
  const prev = prevStr ? safeJsonParse(prevStr) : null;
  const next = (nextObj && typeof nextObj === "object") ? nextObj : {};
  const p = (prev && typeof prev === "object") ? prev : {};

  const keys = new Set([...Object.keys(p), ...Object.keys(next)]);
  const changed = [];
  for (const k of keys) {
    if (JSON.stringify(p[k] ?? null) !== JSON.stringify(next[k] ?? null)) {
      changed.push(k);
      if (changed.length > 6) break;
    }
  }

  if (changed.length === 1) {
    const mk = changed[0];
    const m = /^([0-9]{4})-([0-9]{2})$/.exec(mk);
    const year = m ? m[1] : "";
    const monthName = m ? t(`months.${String(parseInt(m[2], 10))}`) : "";
    const a = (p[mk] && typeof p[mk] === "object") ? p[mk] : {};
    const b = (next[mk] && typeof next[mk] === "object") ? next[mk] : {};

    if (Number(a._simpleIncome ?? 0) !== Number(b._simpleIncome ?? 0)) {
      return buildFFHReason("history.detail.month_income", { month: monthName, year, amount: formatCurrency(Number(b._simpleIncome ?? 0)) }, `monthdata.${mk}.income`, true);
    }
    if (Number(a._simpleExpense ?? 0) !== Number(b._simpleExpense ?? 0)) {
      return buildFFHReason("history.detail.month_expense", { month: monthName, year, amount: formatCurrency(Number(b._simpleExpense ?? 0)) }, `monthdata.${mk}.expense`, true);
    }
    if (Number(a.manualSaving ?? 0) !== Number(b.manualSaving ?? 0)) {
      return buildFFHReason("history.detail.month_saving", { month: monthName, year, amount: formatCurrency(Number(b.manualSaving ?? 0)) }, `monthdata.${mk}.saving`, true);
    }
    if (JSON.stringify(a.savingAccounts) !== JSON.stringify(b.savingAccounts)) {
      return buildFFHReason("history.detail.month_savings_accounts", { month: monthName, year }, `monthdata.${mk}.savingsAccounts`, true);
    }
    // Categoriebedragen (month _catDisplay overrides)
    if (JSON.stringify(a._catDisplay ?? null) !== JSON.stringify(b._catDisplay ?? null)) {
      return buildFFHReason("history.detail.month_categories", { month: monthName, year }, `monthdata.${mk}.catDisplay`, true);
    }
    return buildFFHReason("history.detail.month_changed", { month: monthName, year }, `monthdata.${mk}.generic`, true);
  }

  // Meerdere maanden aangepast. Probeer alsnog een bruikbare reden te geven.
  // Als alle changes uitsluitend _catDisplay betreffen, geef een categorie-specifieke melding.
  const allMonths = changed.filter((k) => /^([0-9]{4})-([0-9]{2})$/.test(String(k)));
  if (allMonths.length === changed.length && allMonths.length > 0) {
    let onlyCatDisplay = true;
    let commonYear = null;
    for (const mk of allMonths) {
      const m = /^([0-9]{4})-([0-9]{2})$/.exec(mk);
      const y = m ? m[1] : null;
      if (!commonYear) commonYear = y;
      if (commonYear !== y) commonYear = ""; // meerdere jaren

      const a = (p[mk] && typeof p[mk] === "object") ? p[mk] : {};
      const b = (next[mk] && typeof next[mk] === "object") ? next[mk] : {};
      const a2 = { ...a }; const b2 = { ...b };
      delete a2._catDisplay; delete b2._catDisplay;
      // als buiten _catDisplay ook iets verandert, dan is het niet uitsluitend catDisplay
      if (JSON.stringify(a2) !== JSON.stringify(b2)) {
        onlyCatDisplay = false;
        break;
      }
      if (JSON.stringify(a._catDisplay ?? null) === JSON.stringify(b._catDisplay ?? null)) {
        // geen catDisplay verschil, dan was dit mk eigenlijk geen relevante wijziging
        // maar laat de detector dan falen naar generic
        onlyCatDisplay = false;
        break;
      }
    }

    if (onlyCatDisplay) {
      if (commonYear) {
        return buildFFHReason("history.detail.year_categories", { year: commonYear }, `monthdata.${commonYear}.catDisplay`, true);
      }
      return buildFFHReason("history.detail.month_categories_multi", {}, "monthdata.catDisplay.multi", true);
    }
  }

  return buildFFHReason("history.detail.monthdata", {}, "monthdata.generic", true);
}