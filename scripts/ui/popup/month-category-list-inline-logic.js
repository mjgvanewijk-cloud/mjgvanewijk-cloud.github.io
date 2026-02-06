// scripts/ui/popup/month-category-list-inline-logic.js

/**
 * Parse user input into a number.
 * Accepts currency symbols (e.g. "€"), spaces, and thousand separators.
 * Supports Dutch-style decimals (comma).
 */
export function parseMoneyInput(raw) {
  const s0 = String(raw == null ? "" : raw).trim();
  if (!s0) return 0;

  let s = s0
    .replace(/\s+/g, "")
    .replace(/[€$£¥₽₺₩₹₫₴₦₱₲₡₵₸₭₮₠₢₣₤₥₧₨]/g, "");

  s = s.replace(/[^0-9,\.\-]/g, "");
  if (!s || s === "-") return null;

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
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