// scripts/ui/popup/month-category-logic.js
import { t } from "../../i18n.js";

export function tFallback(key, fallback, vars) {
  try {
    const v = t(key, vars);
    if (typeof v === "string" && v && v !== key) return v;
  } catch (_) {}
  return fallback;
}

/**
 * Compat: vroeger injecteerde de UI hier de systeemcategorie "Overig".
 * Nieuwe structuur: geen auto-injectie meer. We laten de array ongemoeid.
 */
export function ensureSystemOther(cats) {
  return Array.isArray(cats) ? cats.slice() : [];
}

export function getYearAmount(cat, year) {
  const y = String(year);
  return Number(cat?.years?.[y]) || 0;
}

export function setYearAmount(cat, year, value) {
  const y = String(year);
  const years = { ...(cat?.years || {}) };
  years[y] = Number(value) || 0;
  return { ...cat, years };
}

/**
 * Bepaalt de primaire categorie voor preview.
 * (Geen "Overig" speciale case meer.)
 */
export function inferPrimaryCategory({ cats, type, year, hintCategory }) {
  const filtered = (Array.isArray(cats) ? cats : []).filter(
    (c) => (c?.type || "expense") === type
  );

  if (hintCategory && filtered.some((c) => c?.name === hintCategory)) return hintCategory;

  const nonZero = filtered.filter((c) => getYearAmount(c, year) !== 0);
  if (nonZero.length === 1) return nonZero[0].name;

  let best = null;
  let bestAbs = 0;
  for (const c of filtered) {
    const abs = Math.abs(getYearAmount(c, year));
    if (abs > bestAbs) {
      bestAbs = abs;
      best = c.name;
    }
  }
  return best;
}

// Helpers voor dynamische imports van popups (om circulaire dependencies te vermijden)
export async function openConfirmPopupSafe(opts) {
  try {
    const m = await import("./confirm-popup.js");
    const fn = m.openConfirmPopup || m.openConfirm;
    if (typeof fn === "function") {
      fn(opts);
      return;
    }
  } catch (_) {}
  // Fallback
  if (window.confirm(`${opts.title}\n\n${opts.message}`) && typeof opts.onConfirm === "function") {
    opts.onConfirm();
  }
}

export async function openErrorPopupSafe(title, message) {
  try {
    const m = await import("./error-popup.js");
    const fn = m.openErrorPopup;
    if (typeof fn === "function") {
      fn(title, message);
      return;
    }
  } catch (_) {}

  // Fallback
  alert(`${title || ""}\n\n${message || ""}`);
}

export async function openEditCategorySheetSafe(name, onClose, contextType = null, extraOptions = null) {
  try {
    const m = await import("../../core/state/categories.js");

    const mergedOpts = {
      fromMonthCard: true,
      overlayClass: "ff-overlay-center",
      themeType: contextType,
      ...(extraOptions && typeof extraOptions === "object" ? extraOptions : {}),
    };

    const fn = m.openEditCategorySheet || m.openCategoryEditSheet;
    if (typeof fn === "function") {
      fn(name, onClose, contextType, mergedOpts);
      return true;
    }
  } catch (e) {
    console.error(e);
  }
  return false;
}
