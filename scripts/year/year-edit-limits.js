// scripts/year/year-edit-limits.js
import { computeMonthTotalsFor, getStartingBankBalance } from "../core/engine/index.js";
import { ensureSettings } from "../core/engine/settings.js";

/**
 * We checken de limiet altijd als een KETTING vanaf currentYear.
 * Waarom: wijzigingen in 2027 kunnen pas in 2028/2029 tot een dip leiden.
 */
export function collectYearRangeForLimitCheck({ cats, monthData, currentYear }) {
  const start = Number(currentYear);
  const years = new Set([start]);

  // years from cats (alle defaults die bestaan)
  for (const c of cats || []) {
    const ys = c?.years && typeof c.years === "object" ? Object.keys(c.years) : [];
    ys.forEach((y) => {
      const n = Number(y);
      if (Number.isFinite(n)) years.add(n);
    });
  }

  // years from savingAccounts defaults (alle default jaren van spaarrekeningen)
  const settings = ensureSettings();
  const savingAccounts = Array.isArray(settings?.savingAccounts) ? settings.savingAccounts : [];
  for (const acc of savingAccounts) {
    const ys = acc?.years && typeof acc.years === "object" ? Object.keys(acc.years) : [];
    ys.forEach((y) => {
      const n = Number(y);
      if (Number.isFinite(n)) years.add(n);
    });

    // Optioneel: als rente per jaar is ingevuld, nemen we die jaren ook mee in de horizon
    const rs = acc?.rates && typeof acc.rates === "object" ? Object.keys(acc.rates) : [];
    rs.forEach((y) => {
      const n = Number(y);
      if (Number.isFinite(n)) years.add(n);
    });
  }

  // years from monthData keys (alle overrides die bestaan)
  for (const k of Object.keys(monthData || {})) {
    const y = Number(String(k).slice(0, 4));
    if (Number.isFinite(y)) years.add(y);
  }

  const arr = Array.from(years).filter(Number.isFinite);
  const maxYear = arr.length ? Math.max(...arr) : start;

  return {
    // CRUCIAAL: start altijd op currentYear (ketting vanaf bewerkte jaar)
    minYear: start,
    maxYear: Math.max(start, maxYear),
  };
}

/**
 * Limietcheck als ketting:
 * - Simuleer jaar voor jaar, maand voor maand
 * - bankEnd loopt door naar volgend jaar als bankStart
 * - Zo detecteren we dips in latere jaren (bijv. Sep 2028) door wijzigingen in 2027
 */
export function findLimitViolation({ settings, monthData, minYear, maxYear }) {
  const limit = Number(settings?.negativeLimit ?? 0);
  if (!Number.isFinite(limit)) return null;

  const startY = Number(minYear);
  const endY = Number(maxYear);
  if (!Number.isFinite(startY) || !Number.isFinite(endY)) return null;

  // Startsaldo van het eerste jaar halen we uit de engine (mag chainen vanuit echte historie)
  let bank = Number(getStartingBankBalance(startY, settings)) || 0;

  for (let y = startY; y <= endY; y++) {
    for (let m = 1; m <= 12; m++) {
      // CHECK 1: bankStart (vóór cashflows van deze maand)
      if (Number.isFinite(bank) && bank < limit) {
        return { year: y, month: m, bankEnd: bank, limit, at: "start" };
      }

      const tData = computeMonthTotalsFor(y, m, monthData || {});
      const income = Number(tData?.income || 0);
      const expense = Number(tData?.expense || 0);
      const deposits = Number(tData?.deposits || 0);
      const withdrawals = Number(tData?.withdrawals || 0);

      // Zelfde bankformule als in engine/year-sim.js
      bank = bank + income - expense - deposits + withdrawals;

      // CHECK 2: bankEnd (ná cashflows van deze maand)
      if (Number.isFinite(bank) && bank < limit) {
        return { year: y, month: m, bankEnd: bank, limit, at: "end" };
      }
    }
    // bank loopt automatisch door naar volgend jaar (ketting)
  }

  return null;
}
