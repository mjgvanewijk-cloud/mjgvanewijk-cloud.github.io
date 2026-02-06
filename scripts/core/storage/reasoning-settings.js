// scripts/core/storage/reasoning-settings.js
import { formatCurrency } from "../../i18n.js";
import { safeJsonParse, buildFFHReason } from "./storage-helpers-reasoning.js";

export function inferSettingsReason(prevStr, nextObj) {
  const prev = prevStr ? safeJsonParse(prevStr) : null;
  const next = (nextObj && typeof nextObj === "object") ? nextObj : {};

  const prevLim = prev && typeof prev.negativeLimit === "number" ? prev.negativeLimit : 0;
  const nextLim = typeof next.negativeLimit === "number" ? next.negativeLimit : 0;
  if (prevLim !== nextLim) {
    return buildFFHReason("history.detail.negative_limit", { amount: formatCurrency(nextLim) }, "settings.negativeLimit", true);
  }

  const prevBank = (prev && prev.yearBankStarting && typeof prev.yearBankStarting === "object") ? prev.yearBankStarting : {};
  const nextBank = (next.yearBankStarting && typeof next.yearBankStarting === "object") ? next.yearBankStarting : {};
  const years = new Set([...Object.keys(prevBank), ...Object.keys(nextBank)]);
  const changed = [];
  for (const y of years) {
    const a = Number(prevBank[y] ?? 0);
    const b = Number(nextBank[y] ?? 0);
    if (a !== b) changed.push({ year: y, amount: b });
  }
  if (changed.length === 1) {
    const c = changed[0];
    return buildFFHReason("history.detail.bank_starting_year", { year: c.year, amount: formatCurrency(c.amount) }, `settings.bankStarting.${c.year}`, true);
  }

  const prevSav = (prev && prev.yearSavingStarting && typeof prev.yearSavingStarting === "object") ? prev.yearSavingStarting : {};
  const nextSav = (next.yearSavingStarting && typeof next.yearSavingStarting === "object") ? next.yearSavingStarting : {};
  const years2 = new Set([...Object.keys(prevSav), ...Object.keys(nextSav)]);
  const changed2 = [];
  for (const y of years2) {
    const a = Number(prevSav[y] ?? 0);
    const b = Number(nextSav[y] ?? 0);
    if (a !== b) changed2.push({ year: y, amount: b });
  }
  if (changed2.length === 1) {
    const c = changed2[0];
    return buildFFHReason("history.detail.saving_starting_year", { year: c.year, amount: formatCurrency(c.amount) }, `settings.savingStarting.${c.year}`, true);
  }

  const prevMS = (prev && prev.yearMonthlySaving && typeof prev.yearMonthlySaving === "object") ? prev.yearMonthlySaving : {};
  const nextMS = (next.yearMonthlySaving && typeof next.yearMonthlySaving === "object") ? next.yearMonthlySaving : {};
  const years3 = new Set([...Object.keys(prevMS), ...Object.keys(nextMS)]);
  const changed3 = [];
  for (const y of years3) {
    const a = Number(prevMS[y] ?? 0);
    const b = Number(nextMS[y] ?? 0);
    if (a !== b) changed3.push({ year: y, amount: b });
  }
  if (changed3.length === 1) {
    const c = changed3[0];
    return buildFFHReason("history.detail.monthly_saving_year", { year: c.year, amount: formatCurrency(c.amount) }, `settings.monthlySaving.${c.year}`, true);
  }

  return buildFFHReason("history.detail.settings", {}, "settings.generic", true);
}