// scripts/ui/popup/currency-input.js
// Option A: currency formatting with minimal UX risk (iPhone-friendly)
// - Keep currency symbol visible.
// - Format on blur and after a short pause while typing (debounce).
// - Parse using i18n currency separators.

import { t, formatCurrency } from "../../i18n.js";

function _getCurrencyConfig() {
  // No fallback strings: relies on lang JSON. If keys are missing, t() returns the key.
  const symbol = t("currency.symbol");
  const decimalSeparator = t("currency.decimalSeparator");
  const thousandSeparator = t("currency.thousandSeparator");
  const precisionRaw = t("currency.precision");
  const precision = Number(precisionRaw);
  return {
    symbol,
    decimalSeparator,
    thousandSeparator,
    precision: Number.isFinite(precision) ? precision : 2,
  };
}

function _stripToNumeric(raw, cfg) {
  let s = String(raw ?? "");

  // Remove whitespace
  s = s.replace(/\s+/g, "");

  // Remove currency symbol (all occurrences)
  if (cfg.symbol) {
    const esc = String(cfg.symbol).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    s = s.replace(new RegExp(esc, "g"), "");
  }

  // Keep only digits, separators, and minus
  const dec = cfg.decimalSeparator || ",";
  const grp = cfg.thousandSeparator || ".";
  const safeDec = dec.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const safeGrp = grp.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Put '-' at end of the character class to avoid range semantics.
  const keep = new RegExp(`[^0-9${safeDec}${safeGrp}-]`, "g");
  s = s.replace(keep, "");

  // Normalize group + decimal separators into JS-friendly decimal dot.
  if (grp) {
    // Remove all group separators
    const reGrp = new RegExp(safeGrp, "g");
    s = s.replace(reGrp, "");
  }
  if (dec && dec !== ".") {
    const reDec = new RegExp(safeDec, "g");
    s = s.replace(reDec, ".");
  }

  // Allow only one leading '-'
  s = s.replace(/(?!^)-/g, "");

  // If multiple dots exist, keep the first as decimal separator.
  const firstDot = s.indexOf(".");
  if (firstDot !== -1) {
    const before = s.slice(0, firstDot + 1);
    const after = s.slice(firstDot + 1).replace(/\./g, "");
    s = before + after;
  }

  return s;
}

function _ensurePrefix(input, cfg) {
  const prefix = `${cfg.symbol} `;
  const v = String(input.value ?? "");
  if (!v.startsWith(prefix)) {
    // Preserve anything the user typed; only ensure the prefix exists.
    const stripped = v.replace(/^\s+/, "");
    input.value = prefix + stripped.replace(prefix, "");
  }
}

function _formatNow(input, cfg, opts) {
  _ensurePrefix(input, cfg);

  const cleaned = _stripToNumeric(input.value, cfg);
  if (!cleaned || cleaned === "-" || cleaned === "." || cleaned === "-.") {
    // Keep symbol visible; default back to 0 in display.
    input.value = formatCurrency(0);
    opts?.onFormatted?.(input.value);
    return;
  }

  const n = Number(cleaned);
  if (!Number.isFinite(n)) {
    input.value = formatCurrency(0);
    opts?.onFormatted?.(input.value);
    return;
  }

  input.value = formatCurrency(n);
  opts?.onFormatted?.(input.value);
}

/**
 * Install Option A behavior on a currency text input.
 * - Formats on blur and after a short idle debounce.
 * - Keeps the currency symbol visible in the field.
 */
export function installCurrencyInputOptionA(input, options = {}) {
  if (!input) return () => {};

  const cfg = _getCurrencyConfig();
  const debounceMs = Number.isFinite(Number(options.debounceMs)) ? Number(options.debounceMs) : 220;
  let timer = null;
  let killed = false;

  const schedule = () => {
    if (killed) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      // Only format if still in DOM
      if (!document.body.contains(input)) return;
      _formatNow(input, cfg, options);
    }, debounceMs);
  };

  const onFocus = () => {
    // Ensure symbol is present immediately.
    _ensurePrefix(input, cfg);
  };

  const onInput = () => {
    // Minimal intervention while typing; format after idle.
    _ensurePrefix(input, cfg);
    schedule();
  };

  const onBlur = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    _formatNow(input, cfg, options);
  };

  input.addEventListener("focus", onFocus);
  input.addEventListener("input", onInput);
  input.addEventListener("blur", onBlur);

  // Initialize prefix if missing
  try { onFocus(); } catch (_) {}

  return () => {
    killed = true;
    if (timer) clearTimeout(timer);
    input.removeEventListener("focus", onFocus);
    input.removeEventListener("input", onInput);
    input.removeEventListener("blur", onBlur);
  };
}
