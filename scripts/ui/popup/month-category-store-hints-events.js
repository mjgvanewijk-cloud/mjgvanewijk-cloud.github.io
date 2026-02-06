// scripts/ui/popup/month-category-store-hints-events.js
import { saveCats } from "../../core/storage/index.js";
import { __getDraftKeyForEvent } from "./month-category-store-drafts.js";

// --- Safe cats persistence helper (compat met oudere patches) ---
export async function saveCatsSafe(cats) {
  try {
    if (typeof saveCats === "function") {
      saveCats(cats);
      return true;
    }
  } catch (e) {
    console.error(e);
  }
  console.warn("[month-category-store] saveCats mislukt.");
  return false;
}

// --- Legacy UI hints API (wordt nog gebruikt door actions) ---
const __ffMonthCatUiHints = new Map();
const __hintKey = (year, month, type) => `${year}-${month}-${type}`;

export function getHint(year, month, type) {
  return __ffMonthCatUiHints.get(__hintKey(year, month, type)) || null;
}
export function setHint(year, month, type, hint) {
  __ffMonthCatUiHints.set(__hintKey(year, month, type), hint || null);
}
export function deleteHint(year, month, type) {
  __ffMonthCatUiHints.delete(__hintKey(year, month, type));
}

// Inline error event bus (optioneel; wordt gebruikt waar beschikbaar)
export function emitInlineError(year, month, type, catName, message) {
  try {
    document.dispatchEvent(
      new CustomEvent("ff-month-cat-inline-error", {
        detail: {
          key: __getDraftKeyForEvent(year, month, type),
          name: String(catName || ""),
          message: String(message || ""),
        },
      })
    );
  } catch (_) {}
}
