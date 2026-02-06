// scripts/core/state/saving-accounts-precommit-helpers.js

export function ensureSettingsStruct(settings) {
  const s = (settings && typeof settings === "object") ? settings : {};
  if (!Array.isArray(s.savingAccounts)) s.savingAccounts = [];
  return s;
}

export function getLimitValue(settings) {
  const raw = settings?.negativeLimit;
  if (raw === null || raw === undefined || raw === "") return null; 
  const v = Number(raw);
  return Number.isFinite(v) ? v : null; 
}

export function toYearInt(v) {
  const n = parseInt(String(v ?? "").trim(), 10);
  return Number.isFinite(n) ? n : null;
}

export function collectYearsFromMonthData(monthData) {
  const set = new Set();
  for (const k of Object.keys(monthData || {})) {
    const y = toYearInt(String(k).slice(0, 4));
    if (y) set.add(y);
  }
  return set;
}

export function collectYearsFromCats(catsArr) {
  const set = new Set();
  (Array.isArray(catsArr) ? catsArr : []).forEach((c) => {
    const ys = c?.years && typeof c.years === "object" ? Object.keys(c.years) : [];
    ys.forEach((y) => {
      const yi = toYearInt(y);
      if (yi) set.add(yi);
    });
  });
  return set;
}

export function collectYearsFromSavingAccount(acc) {
  const set = new Set();
  const ys = acc?.years && typeof acc.years === "object" ? Object.keys(acc.years) : [];
  ys.forEach((y) => {
    const yi = toYearInt(y);
    if (yi) set.add(yi);
  });
  const rs = acc?.rates && typeof acc.rates === "object" ? Object.keys(acc.rates) : [];
  rs.forEach((y) => {
    const yi = toYearInt(y);
    if (yi) set.add(yi);
  });
  return set;
}

export function getAbsoluteStartYear(settings) {
  const ys = settings?.yearStarting;
  if (!ys || typeof ys !== "object") return null;
  const years = Object.keys(ys)
    .map((k) => parseInt(k, 10))
    .filter((n) => Number.isFinite(n));
  return years.length ? Math.min(...years) : null;
}