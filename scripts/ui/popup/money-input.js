// scripts/ui/popup/money-input.js
// Centrale helpers voor geld-invoer in popup/sheet inputs.

/**
 * Parse user input naar Number.
 *
 * Ondersteunt o.a.:
 * - "€ 2.000" / "2000€" / "2.000,50" / "2000.50" / " 2000 "
 *
 * @param {any} raw
 * @returns {number|null}
 */
export function parseMoneyInput(raw) {
  const s0 = String(raw == null ? "" : raw).trim();
  if (!s0) return null;

  // Keep digits, decimal separators and optional leading minus; strip currency symbols.
  let s = s0
    .replace(/\s+/g, "")
    .replace(/[€$£¥₽₺₩₹₫₴₦₱₲₡₵₸₭₮₠₢₣₤₥₧₨]/g, "");

  // Strip other stray characters, but keep digits, dot, comma and minus.
  s = s.replace(/[^0-9,\.\-]/g, "");

  if (!s || s === "-") return null;

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  // Heuristiek:
  // - Als comma én dot: dots zijn duizend-separators, comma is decimal.
  // - Als alleen comma: comma is decimal, dots (indien aanwezig) zijn duizend.
  // - Als alleen dot: dot is decimal, tenzij er meerdere dots zijn (dan duizend-sep).
  if (hasComma && hasDot) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    const dotCount = (s.match(/\./g) || []).length;
    if (dotCount > 1) s = s.replace(/\./g, "");
  }

  const num = Number(s);
  if (!Number.isFinite(num)) return null;
  return num;
}
