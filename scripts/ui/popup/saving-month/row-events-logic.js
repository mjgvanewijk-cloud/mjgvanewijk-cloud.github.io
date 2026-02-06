// scripts/ui/popup/saving-month/row-events-logic.js
export function normalizeRateForUI(v) {
  const n = Number(String(v || "").trim().replace(",", "."));
  if (!Number.isFinite(n)) return null;
  if (n < 0) return null;
  // Max cap is alleen defensief; UI blijft vrij.
  return n;
}