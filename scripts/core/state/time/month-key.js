// scripts/core/state/time/month-key.js

export function monthKey(year, month) {
  const mm = month < 10 ? `0${month}` : `${month}`;
  return `${year}-${mm}`;
}

export function parseMonthKey(key) {
  // "YYYY-MM"
  const y = Number(String(key).slice(0, 4));
  const m = Number(String(key).slice(5, 7));
  return { y, m };
}

